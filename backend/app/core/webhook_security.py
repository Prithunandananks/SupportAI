import socket
import ipaddress
from urllib.parse import urlparse
from fastapi import HTTPException

def validate_webhook_url(url: str):
    """
    Validates a webhook URL to prevent SSRF attacks.
    - Requires HTTPS
    - Resolves DNS and checks all returned IPs
    - Blocks private, loopback, multicast, and reserved IPs
    """
    if not url:
        raise HTTPException(status_code=400, detail="Webhook URL is required")

    try:
        parsed = urlparse(url)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid URL format")

    if parsed.scheme != "https":
        raise HTTPException(status_code=400, detail="Webhook URL must use HTTPS")

    hostname = parsed.hostname
    if not hostname:
        raise HTTPException(status_code=400, detail="Invalid URL: Missing hostname")

    # Prevent basic DNS rebinding/SSRF by resolving to IP and validating ALL A/AAAA records
    try:
        # getaddrinfo returns a list of tuples: (family, type, proto, canonname, sockaddr)
        # sockaddr is (IP, port) for IPv4 or (IP, port, flowinfo, scopeid) for IPv6
        addr_infos = socket.getaddrinfo(hostname, None)
    except socket.gaierror:
        raise HTTPException(status_code=400, detail="Could not resolve hostname")

    # Extract unique IPs
    resolved_ips = set()
    for info in addr_infos:
        ip = info[4][0]
        resolved_ips.add(ip)

    if not resolved_ips:
        raise HTTPException(status_code=400, detail="Could not resolve hostname to any IP")

    for ip_str in resolved_ips:
        try:
            ip_obj = ipaddress.ip_address(ip_str)
        except ValueError:
            continue

        if ip_obj.is_private:
            raise HTTPException(status_code=400, detail=f"SSRF Protection: Private IP {ip_str} is not allowed")
        if ip_obj.is_loopback:
            raise HTTPException(status_code=400, detail=f"SSRF Protection: Loopback IP {ip_str} is not allowed")
        if ip_obj.is_link_local:
            raise HTTPException(status_code=400, detail=f"SSRF Protection: Link-local IP {ip_str} is not allowed")
        if ip_obj.is_multicast:
            raise HTTPException(status_code=400, detail=f"SSRF Protection: Multicast IP {ip_str} is not allowed")
        if ip_obj.is_reserved:
            raise HTTPException(status_code=400, detail=f"SSRF Protection: Reserved IP {ip_str} is not allowed")

    return True
