import requests
import json
from datetime import datetime

def test_ping():
    """
    Test the ping endpoint of the server to verify it's up and running.
    """
    print(f"Testing ping at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    try:
        # Send a request to the ping endpoint
        response = requests.get("http://localhost:8000/ping")

        # Check if the request was successful
        if response.status_code == 200:
            data = response.json()
            print("Server ping successful!")
            print(f"Status: {data.get('status')}")
            print(f"Message: {data.get('message')}")
            print(f"Server timestamp: {data.get('timestamp')}")

            # Calculate response time
            server_time = datetime.strptime(data.get('timestamp'), "%Y-%m-%d %H:%M:%S")
            local_time = datetime.now()
            time_diff = local_time - server_time
            print(f"Time difference: {abs(time_diff.total_seconds()):.2f} seconds")
        else:
            print(f"Error: Received status code {response.status_code}")
            print(response.text)

    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to the server. Is it running?")
    except Exception as e:
        print(f"Unexpected error: {str(e)}")

if __name__ == "__main__":
    test_ping()
