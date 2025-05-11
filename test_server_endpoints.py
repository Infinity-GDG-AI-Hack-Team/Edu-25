#!/usr/bin/env python3
"""
Test script to verify if the FastAPI server endpoints are working correctly.
"""
import requests
import json
import sys
import logging
from typing import Dict, Any

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("test_endpoints")

# Server base URL
BASE_URL = "http://localhost:8000"

def test_endpoint(endpoint: str, expected_status_code: int = 200) -> Dict[str, Any]:
    """Test an endpoint and return the response data"""
    url = f"{BASE_URL}{endpoint}"
    logger.info(f"Testing endpoint: {url}")

    try:
        response = requests.get(url, timeout=10)
        status_code = response.status_code

        if status_code == expected_status_code:
            logger.info(f"✅ Success! Status code {status_code} matches expected {expected_status_code}")
            try:
                data = response.json()
                logger.info(f"Response data: {json.dumps(data, indent=2)}")
                return data
            except ValueError:
                logger.warning(f"Response not JSON format: {response.text[:100]}...")
                return {"text": response.text}
        else:
            logger.error(f"❌ Failed! Status code {status_code} doesn't match expected {expected_status_code}")
            logger.error(f"Response: {response.text[:200]}...")
            return {"error": response.text}

    except requests.exceptions.ConnectionError:
        logger.error(f"❌ Connection error! Is the server running at {BASE_URL}?")
        return {"error": "Connection error"}
    except requests.exceptions.Timeout:
        logger.error(f"❌ Timeout! The server took too long to respond.")
        return {"error": "Timeout"}
    except Exception as e:
        logger.error(f"❌ Unexpected error: {str(e)}")
        return {"error": str(e)}

def main():
    """Test multiple endpoints"""
    endpoints_to_test = [
        "/",                   # Root endpoint
        "/ping",               # Ping endpoint
        "/health",             # Health check endpoint
        "/testdb/data",        # Testdb data endpoint
        "/testdb/specific-graph",  # Specific graph endpoint
        "/api/graphs/specific"     # Alternative specific graph endpoint
    ]

    results = {}
    success_count = 0

    for endpoint in endpoints_to_test:
        result = test_endpoint(endpoint)
        results[endpoint] = result
        if "error" not in result:
            success_count += 1

    total_endpoints = len(endpoints_to_test)
    logger.info(f"\nSummary: {success_count}/{total_endpoints} endpoints working")

    if success_count < total_endpoints:
        logger.warning("Some endpoints failed! Check the logs above for details.")
        return 1
    else:
        logger.info("All endpoints are working correctly!")
        return 0

if __name__ == "__main__":
    sys.exit(main())
