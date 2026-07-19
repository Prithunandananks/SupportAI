import pytest
import ipaddress
from fastapi import HTTPException
from app.core.webhook_security import validate_webhook_url
import socket
from unittest.mock import patch

def test_webhook_url_invalid_format():
    with pytest.raises(HTTPException) as exc:
        validate_webhook_url("not a url")
    assert exc.value.status_code == 400

def test_webhook_url_not_https():
    with pytest.raises(HTTPException) as exc:
        validate_webhook_url("http://example.com")
    assert exc.value.status_code == 400

def test_webhook_url_no_hostname():
    with pytest.raises(HTTPException) as exc:
        validate_webhook_url("https://")
    assert exc.value.status_code == 400

def test_webhook_url_dns_resolution_failure(monkeypatch):
    def mock_getaddrinfo(*args, **kwargs):
        raise socket.gaierror("Name or service not known")
    
    monkeypatch.setattr(socket, "getaddrinfo", mock_getaddrinfo)
    
    with pytest.raises(HTTPException) as exc:
        validate_webhook_url("https://this-does-not-exist.com")
    assert exc.value.status_code == 400
    assert "Could not resolve hostname" in exc.value.detail

def test_webhook_url_no_ips(monkeypatch):
    def mock_getaddrinfo(*args, **kwargs):
        return []
    
    monkeypatch.setattr(socket, "getaddrinfo", mock_getaddrinfo)
    with pytest.raises(HTTPException) as exc:
        validate_webhook_url("https://example.com")
    assert "Could not resolve hostname to any IP" in exc.value.detail

def test_webhook_url_private_ip(monkeypatch):
    def mock_getaddrinfo(*args, **kwargs):
        return [(socket.AF_INET, socket.SOCK_STREAM, 6, '', ('10.0.0.1', 443))]
    
    monkeypatch.setattr(socket, "getaddrinfo", mock_getaddrinfo)
    with pytest.raises(HTTPException) as exc:
        validate_webhook_url("https://example.com")
    assert "Private IP" in exc.value.detail

def test_webhook_url_loopback_ip(monkeypatch):
    def mock_getaddrinfo(*args, **kwargs):
        return [(socket.AF_INET, socket.SOCK_STREAM, 6, '', ('127.0.0.1', 443))]
    
    monkeypatch.setattr(socket, "getaddrinfo", mock_getaddrinfo)
    with pytest.raises(HTTPException) as exc:
        validate_webhook_url("https://example.com")
    assert "Private IP" in exc.value.detail or "Loopback IP" in exc.value.detail

def test_webhook_url_link_local_ip(monkeypatch):
    def mock_getaddrinfo(*args, **kwargs):
        return [(socket.AF_INET, socket.SOCK_STREAM, 6, '', ('169.254.0.1', 443))]
    
    monkeypatch.setattr(socket, "getaddrinfo", mock_getaddrinfo)
    with pytest.raises(HTTPException) as exc:
        validate_webhook_url("https://example.com")
    assert "Private IP" in exc.value.detail or "Link-local IP" in exc.value.detail

def test_webhook_url_multicast_ip(monkeypatch):
    def mock_getaddrinfo(*args, **kwargs):
        return [(socket.AF_INET, socket.SOCK_STREAM, 6, '', ('224.0.0.1', 443))]
    
    monkeypatch.setattr(socket, "getaddrinfo", mock_getaddrinfo)
    with pytest.raises(HTTPException) as exc:
        validate_webhook_url("https://example.com")
    assert "Multicast IP" in exc.value.detail

def test_webhook_url_reserved_ip(monkeypatch):
    def mock_getaddrinfo(*args, **kwargs):
        return [(socket.AF_INET, socket.SOCK_STREAM, 6, '', ('240.0.0.1', 443))]
    
    monkeypatch.setattr(socket, "getaddrinfo", mock_getaddrinfo)
    with pytest.raises(HTTPException) as exc:
        validate_webhook_url("https://example.com")
    assert "Private IP" in exc.value.detail or "Reserved IP" in exc.value.detail

def test_webhook_url_valid_ip(monkeypatch):
    def mock_getaddrinfo(*args, **kwargs):
        return [(socket.AF_INET, socket.SOCK_STREAM, 6, '', ('93.184.216.34', 443))]
    
    monkeypatch.setattr(socket, "getaddrinfo", mock_getaddrinfo)
    assert validate_webhook_url("https://example.com") is True

@patch("app.core.webhook_security.socket.getaddrinfo")
@patch("app.core.webhook_security.ipaddress.ip_address")
def test_validate_webhook_url_coverage(mock_ip_address, mock_getaddrinfo):
    mock_getaddrinfo.return_value = [(2, 1, 6, '', ('1.1.1.1', 443))]
    
    class MockIP:
        def __init__(self, is_private=False, is_loopback=False, is_link_local=False, is_multicast=False, is_reserved=False):
            self.is_private = is_private
            self.is_loopback = is_loopback
            self.is_link_local = is_link_local
            self.is_multicast = is_multicast
            self.is_reserved = is_reserved
            
    # Test loopback
    mock_ip_address.return_value = MockIP(is_loopback=True)
    with pytest.raises(HTTPException) as exc:
        validate_webhook_url("https://example.com")
    assert "Loopback IP" in exc.value.detail
    
    # Test link_local
    mock_ip_address.return_value = MockIP(is_link_local=True)
    with pytest.raises(HTTPException) as exc:
        validate_webhook_url("https://example.com")
    assert "Link-local IP" in exc.value.detail
    
    # Test reserved
    mock_ip_address.return_value = MockIP(is_reserved=True)
    with pytest.raises(HTTPException) as exc:
        validate_webhook_url("https://example.com")
    assert "Reserved IP" in exc.value.detail

    # Test empty url
    with pytest.raises(HTTPException) as exc:
        validate_webhook_url("")
    assert "required" in exc.value.detail

def test_validate_webhook_url_invalid_format():
    with pytest.raises(HTTPException) as exc:
        validate_webhook_url("http://[invalid_url")
    assert "Invalid URL" in exc.value.detail

@patch("app.core.webhook_security.socket.getaddrinfo")
def test_validate_webhook_url_invalid_ip_format(mock_getaddrinfo):
    # Test IP that raises ValueError in ipaddress.ip_address
    mock_getaddrinfo.return_value = [(2, 1, 6, '', ('invalid_ip', 443))]
    assert validate_webhook_url("https://example.com") is True
