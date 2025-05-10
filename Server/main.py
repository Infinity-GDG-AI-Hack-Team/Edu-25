from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from app.routers import users
from app.db.mongodb import get_mongo_client

app = FastAPI(title="Edu-25 API")

# Add CORS middleware to allow cross-origin requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(users.router)

@app.get("/")
async def read_root():
    return {"message": "Welcome to the Edu-25 API"}

@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.get("/ping")
async def ping():
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    return {
        "status": "success",
        "message": "pong",
        "timestamp": current_time
    }

@app.on_event("startup")
async def startup_db_client():
    # Initialize MongoDB connection on startup
    get_mongo_client()

@app.on_event("shutdown")
async def shutdown_db_client():
    # Close MongoDB connection on shutdown
    client = get_mongo_client()
    client.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
