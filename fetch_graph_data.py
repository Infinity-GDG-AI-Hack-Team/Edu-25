#!/usr/bin/env python3
import os
import pymongo
from pymongo import MongoClient
import json
from dotenv import load_dotenv
from termcolor import colored
from pprint import pprint
from typing import Dict, Any, List

# Load environment variables from .env file
load_dotenv()

# MongoDB connection using environment variables
MONGO_URI = os.environ.get("MONGODB_URI", "mongodb://localhost:27017/")
DB_NAME = "testdb"  # Use testdb specifically
COLLECTION_NAME = "test1"

def connect_to_mongo():
    """Connect to MongoDB and return the test1 collection"""
    try:
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        # Test the connection
        client.admin.command('ping')
        print(colored("Successfully connected to MongoDB", "green"))

        # Get the testdb database and test1 collection
        db = client[DB_NAME]
        collection = db[COLLECTION_NAME]

        return collection
    except Exception as e:
        print(colored(f"Failed to connect to MongoDB: {e}", "red"))
        return None

def fetch_documents(collection, limit=10):
    """Fetch documents from the collection"""
    try:
        # Find all documents in the collection with a limit
        documents = list(collection.find().limit(limit))
        print(colored(f"Found {len(documents)} documents in {DB_NAME}.{COLLECTION_NAME}", "green"))
        return documents
    except Exception as e:
        print(colored(f"Error fetching documents: {e}", "red"))
        return []

def display_graph_data(document):
    """Display the graph data in a formatted way"""
    try:
        # Extract the planning graph if it exists
        planning_graph = document.get("planning_graph")
        if not planning_graph:
            print(colored("No planning graph data found in this document", "yellow"))
            return

        # Document info
        print(colored(f"\n{'=' * 80}", "cyan"))
        print(colored(f"Document ID: {document['_id']}", "cyan"))
        print(colored(f"Project: {document.get('project_name', 'N/A')}", "cyan"))
        print(colored(f"Student ID: {document.get('student_id', 'N/A')}", "cyan"))
        print(colored(f"Current active file: {document.get('current_active_file', 'N/A')}", "cyan"))
        print(colored(f"{'=' * 80}\n", "cyan"))

        # Display nodes
        print(colored("NODES:", "green", attrs=["bold"]))
        if "nodes" in planning_graph and "nodes_id" in planning_graph:
            for node_id, node_name in zip(planning_graph["nodes_id"], planning_graph["nodes"]):
                print(colored(f"  • {node_name}", "green") +
                      colored(f" (ID: {node_id})", "grey"))
        else:
            print(colored("  No nodes found.", "yellow"))

        print("\n")

        # Display edges
        print(colored("EDGES:", "blue", attrs=["bold"]))
        if "edges" in planning_graph:
            for edge in planning_graph["edges"]:
                if len(edge) == 2:
                    source_id, target_id = edge
                    # Get node names if available
                    try:
                        source_idx = planning_graph["nodes_id"].index(source_id)
                        target_idx = planning_graph["nodes_id"].index(target_id)
                        source_name = planning_graph["nodes"][source_idx]
                        target_name = planning_graph["nodes"][target_idx]

                        print(colored(f"  • {source_name}", "blue") +
                              colored(" → ", "yellow") +
                              colored(f"{target_name}", "blue"))
                    except (ValueError, IndexError):
                        print(colored(f"  • {source_id} → {target_id}", "blue"))
        else:
            print(colored("  No edges found.", "yellow"))

        print("\n")

        # Display sequence if available
        if "sequence" in planning_graph:
            print(colored("SEQUENCE:", "magenta", attrs=["bold"]))
            for i, node_id in enumerate(planning_graph["sequence"], 1):
                try:
                    idx = planning_graph["nodes_id"].index(node_id)
                    node_name = planning_graph["nodes"][idx]
                    print(colored(f"  {i}. {node_name}", "magenta") +
                          colored(f" (ID: {node_id})", "grey"))
                except (ValueError, IndexError):
                    print(colored(f"  {i}. {node_id}", "magenta"))

        print("\n")

        # Display known topics
        if "known_topics" in document:
            print(colored("KNOWN TOPICS:", "yellow", attrs=["bold"]))
            for topic in document.get("known_topics", []):
                print(colored(f"  ✓ {topic}", "yellow"))

        print(colored(f"\n{'=' * 80}", "cyan"))

    except Exception as e:
        print(colored(f"Error displaying graph data: {e}", "red"))

def main():
    print(colored("\nFetching data from MongoDB collection", "blue", attrs=["bold"]))
    print(colored(f"Database: {DB_NAME}, Collection: {COLLECTION_NAME}\n", "blue"))

    # Connect to MongoDB
    collection = connect_to_mongo()
    if not collection:
        return

    # Fetch documents
    documents = fetch_documents(collection)

    # Display graph data for each document
    for i, doc in enumerate(documents, 1):
        print(colored(f"\nDocument {i}/{len(documents)}:", "cyan", attrs=["bold"]))
        display_graph_data(doc)

if __name__ == "__main__":
    main()
