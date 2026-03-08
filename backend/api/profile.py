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
    filename = file.filename.lower()
    
    resume_text = ""
    if filename.endswith(".pdf"):
        try:
            import io
            import PyPDF2
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
            text_parts = []
            for page in pdf_reader.pages:
                text_parts.append(page.extract_text())
            resume_text = "\n".join(text_parts)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Could not parse PDF: {str(e)}")
    else:
        try:
            resume_text = content.decode("utf-8")
        except UnicodeDecodeError:
            raise HTTPException(status_code=400, detail="Unsupported file format. Please upload a PDF or a UTF-8 text file.")
    
    if not resume_text.strip():
        raise HTTPException(status_code=400, detail="Extracted resume text is empty.")

    profile = db.query(Profile).first()
    if not profile:
        profile = Profile(master_resume=resume_text)
        db.add(profile)
    else:
        profile.master_resume = resume_text
    
    db.commit()
    return {"message": "Master intelligence source synced successfully", "length": len(resume_text)}

@router.get("/")
async def get_profile(db: Session = Depends(get_db)):
    profile = db.query(Profile).first()
    if not profile:
        return {"message": "No profile found"}
    return profile
