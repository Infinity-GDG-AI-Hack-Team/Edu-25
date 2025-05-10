import requests
import json
from datetime import datetime
from pymongo import MongoClient
import os
import sys

# MongoDB connection settings
MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017/")
DB_NAME = os.environ.get("DB_NAME", "edu25_db")

def test_ping():
    """
    Test the ping endpoint of the server to verify it's up and running.
    """
    print(f"\n=== Testing Ping Endpoint ===")
    print(f"Testing ping at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    try:
        # Send a request to the ping endpoint
        response = requests.get("http://localhost:8000/ping")

        # Check if the request was successful
        if response.status_code == 200:
            data = response.json()
            print("✅ Server ping successful!")
            print(f"Status: {data.get('status')}")
            print(f"Message: {data.get('message')}")
            print(f"Server timestamp: {data.get('timestamp')}")

            # Calculate response time
            server_time = datetime.strptime(data.get('timestamp'), "%Y-%m-%d %H:%M:%S")
            local_time = datetime.now()
            time_diff = local_time - server_time
            print(f"Time difference: {abs(time_diff.total_seconds()):.2f} seconds")
            return True
        else:
            print(f"❌ Error: Received status code {response.status_code}")
            print(response.text)
            return False

    except requests.exceptions.ConnectionError:
        print("❌ Error: Could not connect to the server. Is it running?")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        return False

def test_mongodb_connection():
    """
    Test the MongoDB connection.
    """
    print(f"\n=== Testing MongoDB Connection ===")
    print(f"Attempting to connect to MongoDB at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    try:
        # Connect to MongoDB
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)

        # Check if connection is successful by sending a ping
        client.admin.command('ping')

        print(f"✅ MongoDB connection successful!")
        print(f"MongoDB server info: {client.server_info()['version']}")

        # Check if database exists or can be created
        db = client[DB_NAME]
        collections = db.list_collection_names()
        print(f"Collections in {DB_NAME}: {collections if collections else 'No collections yet'}")

        # Check if users collection exists
        if "users" in collections:
            users_count = db.users.count_documents({})
            print(f"Users collection has {users_count} documents")
        else:
            print("Users collection does not exist yet")

        client.close()
        return True

    except Exception as e:
        print(f"❌ MongoDB connection error: {str(e)}")
        print("Make sure MongoDB is installed and running on your system.")
        print("On macOS, you can install MongoDB with Homebrew: brew tap mongodb/brew && brew install mongodb-community")
        print("Then start the MongoDB service: brew services start mongodb-community")
        return False

def create_test_user():
    """
    Create a test user via the API.
    """
    print(f"\n=== Creating Test User ===")
    user_data = {
        "name": "Test",
        "surname": "User",
        "email": f"testuser_{datetime.now().strftime('%Y%m%d%H%M%S')}@example.com"
    }

    try:
        response = requests.post("http://localhost:8000/users/", json=user_data)

        if response.status_code == 201:
            user = response.json()
            print(f"✅ Created test user:")
            print(f"ID: {user.get('id')}")
            print(f"Name: {user.get('name')} {user.get('surname')}")
            print(f"Email: {user.get('email')}")
            return True
        else:
            print(f"❌ Failed to create test user: {response.status_code}")
            print(response.text)
            return False

    except Exception as e:
        print(f"❌ Error creating test user: {str(e)}")
        return False

if __name__ == "__main__":
    print("=== Edu-25 Server Test ===")

    # Test ping endpoint
    ping_success = test_ping()

    # Test MongoDB connection
    mongo_success = test_mongodb_connection()

    # Create a test user if both tests pass
    if ping_success and mongo_success:
        user_success = create_test_user()

    # Summary
    print("\n=== Test Summary ===")
    print(f"Ping Endpoint: {'✅ Pass' if ping_success else '❌ Fail'}")
    print(f"MongoDB Connection: {'✅ Pass' if mongo_success else '❌ Fail'}")
    if ping_success and mongo_success:
        print(f"User Creation: {'✅ Pass' if user_success else '❌ Fail'}")

    if ping_success and mongo_success and user_success:
        print("\n🎉 All tests passed! Your server is running correctly with MongoDB integration.")
        sys.exit(0)
    else:
        print("\n❌ Some tests failed. Please check the error messages above.")
        sys.exit(1)
