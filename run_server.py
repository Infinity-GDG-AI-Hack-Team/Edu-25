#!/usr/bin/env python3
"""
Script to run the FastAPI server with the correct Python path and enhanced error handling.
"""
import os
import sys
import logging
import argparse
from dotenv import load_dotenv

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("run_server")

def main():
    # Load environment variables from .env file
    load_dotenv()
    logger.info("Loaded environment variables from .env file")

    # Parse command line arguments
    parser = argparse.ArgumentParser(description="Run the Edu-25 FastAPI server")
    parser.add_argument("--host", default="0.0.0.0", help="Host to bind the server to")
    parser.add_argument("--port", type=int, default=8000, help="Port to bind the server to")
    parser.add_argument("--reload", action="store_true", help="Enable auto-reload on code changes")
    parser.add_argument("--debug", action="store_true", help="Enable debug mode")
    args = parser.parse_args()

    # Enable debug logging if requested
    if args.debug:
        logging.getLogger().setLevel(logging.DEBUG)
        logger.debug("Debug mode enabled")

    # Add the Server directory to the Python path
    server_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "Server")
    logger.info(f"Adding {server_dir} to Python path")
    sys.path.insert(0, server_dir)

    # Check if MongoDB environment variables are set from .env file
    mongo_uri = os.environ.get("MONGODB_URI")
    if mongo_uri:
        logger.info(f"Using MongoDB URI from environment: {mongo_uri[:20]}...")  # For security, show only beginning
    else:
        logger.warning("MONGODB_URI environment variable not set, will use default localhost")

    db_name = os.environ.get("MONGODB_DB_NAME")
    if db_name:
        logger.info(f"Using database name from environment: {db_name}")
    else:
        logger.warning("MONGODB_DB_NAME environment variable not set, will use default")

    # Start the server
    try:
        import uvicorn
        logger.info(f"Starting server at {args.host}:{args.port} (reload={'enabled' if args.reload else 'disabled'})")
        uvicorn.run(
            "main:app",
            host=args.host,
            port=args.port,
            reload=args.reload,
            log_level="debug" if args.debug else "info"
        )
    except ImportError as e:
        logger.error(f"Failed to import uvicorn: {e}")
        logger.error("Make sure uvicorn is installed: pip install uvicorn")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Failed to start server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
