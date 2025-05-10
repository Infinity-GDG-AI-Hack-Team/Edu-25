#!/bin/bash
# Setup and run script for Edu-25

set -e
echo "=== Edu-25 Server Setup and Run Script ==="

# Check if .env file exists
if [ -f .env ]; then
    echo "Found .env file with MongoDB configuration."
else
    echo "Warning: No .env file found. Creating a sample .env file..."
    echo "# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/
MONGODB_DB_NAME=edu25_db" > .env
    echo "Created sample .env file. Please edit it with your MongoDB credentials."
fi

# Check if MongoDB is installed locally - only relevant if using localhost MongoDB
if [[ $(grep -i "mongodb://localhost" .env) ]]; then
    echo "Using local MongoDB configuration."
    if command -v mongod &> /dev/null; then
        echo "MongoDB is installed."

        # Check if MongoDB is running
        if pgrep mongod > /dev/null; then
            echo "MongoDB is already running."
        else
            echo "MongoDB is not running. Starting MongoDB..."
            # Try to start MongoDB in the background
            mongod --fork --logpath /tmp/mongod.log
            if [ $? -eq 0 ]; then
                echo "MongoDB started successfully."
            else
                echo "WARNING: Failed to start MongoDB. The server will start, but database features may not work."
            fi
        fi
    else
        echo "WARNING: MongoDB is not installed locally, but your configuration uses localhost."
        echo "Database features may not work unless you're using a remote MongoDB instance."
    fi
else
    echo "Using remote MongoDB configuration from .env file."
fi

# Make the run_server.py script executable
chmod +x run_server.py

# Check if python-dotenv is installed
if ! pip3 show python-dotenv &> /dev/null; then
    echo "Installing python-dotenv package..."
    pip3 install python-dotenv
fi

echo "Starting Edu-25 server..."
# Run the server with improved error handling
./run_server.py --reload --debug

# Note: The script will not reach this point while the server is running
echo "Server stopped."
