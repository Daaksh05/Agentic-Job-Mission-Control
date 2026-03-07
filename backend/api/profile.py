from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from models.database import get_db
from models.models import Profile
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/profile", tags=["profile"])

class ProfileCreate(BaseModel):
    full_name: str
    email: str
    preferences: dict

@router.post("/setup")
async def setup_profile(data: ProfileCreate, db: Session = Depends(get_db)):
    profile = db.query(Profile).first()
    if profile:
        profile.full_name = data.full_name
        profile.email = data.email
        profile.preferences = data.preferences
    else:
        profile = Profile(**data.dict())
        db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile

@router.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...), db: Session = Depends(get_db)):
    content = await file.read()
    resume_text = content.decode("utf-8") # Simplified for Phase 2 (assuming text/markdown)
    
    profile = db.query(Profile).first()
    if not profile:
        profile = Profile(master_resume=resume_text)
        db.add(profile)
    else:
        profile.master_resume = resume_text
    
    db.commit()
    return {"message": "Resume uploaded successfully"}

@router.get("/")
async def get_profile(db: Session = Depends(get_db)):
    profile = db.query(Profile).first()
    if not profile:
        return {"message": "No profile found"}
    return profile
