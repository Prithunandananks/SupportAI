import pytest
import sys

if __name__ == "__main__":
    sys.exit(pytest.main(["tests/api/test_documents.py", "-v", "-s"]))
