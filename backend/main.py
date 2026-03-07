from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
from dotenv import load_dotenv

load_dotenv()

from api.jobs import router as jobs_router
from api.profile import router as profile_router
from api.applications import router as apps_router
from models.database import engine, Base
from services.scheduler_service import start_scheduler
from fastapi.staticfiles import StaticFiles

# Create screenshots directory if not exists
os.makedirs("screenshots", exist_ok=True)

# Create DB tables
Base.metadata.create_all(bind=engine)

# Start Background Tasks
app = FastAPI(title="Tech Job Application Agent API")

@app.on_event("startup")
async def startup_event():
    # Start Background Tasks
    start_scheduler()

app.include_router(jobs_router)
app.include_router(profile_router)
app.include_router(apps_router)

app.mount("/screenshots", StaticFiles(directory="screenshots"), name="screenshots")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"status": "online", "message": "Tech Job Application Agent API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
