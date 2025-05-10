from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
import os
from dotenv import load_dotenv


class MongoDBClient:
    def __init__(self):
        from dotenv import load_dotenv
        load_dotenv()
        self.client = MongoClient(
            os.getenv("MONGODB_URI"),
            server_api=ServerApi("1")
        )
        self.db = self.client[os.getenv("MONGODB_DB_NAME")]
        self.collection = self.db[os.getenv("MONGODB_COLLECTION_NAME")]

    def get_collection(self):
        return self.collection

    def close(self):
        self.client.close()

    def select_collection(self, collection_name):
        self.collection = self.db[collection_name]
        return self.collection

    def select_database(self, db_name):
        self.db = self.client[db_name]
        return self.db
