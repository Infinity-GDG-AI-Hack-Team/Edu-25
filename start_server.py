#!/usr/bin/env python3
"""
Simple script to start the FastAPI server with the correct configuration.
"""
import os
import uvicorn
import logging
from dotenv import load_dotenv

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("start_server")

# Load environment variables
load_dotenv()

def main():
    """Run the FastAPI server directly pointing to the app in Server/main.py"""
    logger.info("Starting FastAPI server...")

    # Set the working directory to the Server directory
    os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), "Server"))

    # Print the current directory for debugging
    logger.info(f"Working directory: {os.getcwd()}")

    # Run the server directly referencing the app object in main.py
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )

if __name__ == "__main__":
    main()
