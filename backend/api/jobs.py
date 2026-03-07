from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from models.database import get_db
from models.models import Job, Profile
from services.job_service import job_service
from services.ai_service import ai_service
from typing import List, Dict, Any

router = APIRouter(prefix="/jobs", tags=["jobs"])

@router.get("/discover")
async def discover_jobs(country: str = "FR", db: Session = Depends(get_db)):
    """Triggers job discovery and persists results to DB."""
    jobs_data = await job_service.get_all_jobs(country=country)
    
    new_jobs = []
    for j in jobs_data:
        existing = db.query(Job).filter(Job.id == str(j["id"])).first()
        if not existing:
            job = Job(**j)
            db.add(job)
            new_jobs.append(job)
    
    db.commit()
    return {"count": len(new_jobs), "total": len(jobs_data)}

@router.get("/")
async def list_jobs(score_gte: int = 0, db: Session = Depends(get_db)):
    """Returns list of discovered jobs from DB sorted by score."""
    return db.query(Job).filter(Job.match_score >= score_gte).order_by(Job.match_score.desc()).all()

@router.post("/{job_id}/score")
async def score_job(job_id: str, db: Session = Depends(get_db)):
    """Scores a specific job using AI matching against the stored profile."""
    job = db.query(Job).filter(Job.id == job_id).first()
    profile = db.query(Profile).first()
    
    if not job or not profile or not profile.master_resume:
        raise HTTPException(status_code=400, detail="Missing job or resume data")
    
    analysis = await ai_service.match_job(profile.master_resume, job.description)
    
    # Update job with AI results
    base_score = analysis.get("score", 0)
    
    # Apply Country Boost
    from config import COUNTRY_SCORE_BOOST
    boost = COUNTRY_SCORE_BOOST.get(job.country, 1.0)
    final_score = min(100, int(base_score * boost))
    
    job.match_score = final_score
    job.match_analysis = analysis
    
    db.commit()
    return {"job_id": job_id, "score": job.match_score, "base_score": base_score, "boost": boost}
@router.post("/vie/scan")
async def scan_vie_jobs(db: Session = Depends(get_db)):
    """Manually trigger VIE discovery for IT/Telecom."""
    from agents.vie_discovery import vie_discovery
    vie_jobs_data = await vie_discovery.fetch_vie_jobs()
    
    count = 0
    for j in vie_jobs_data:
        existing = db.query(Job).filter(Job.id == str(j["id"])).first()
        if not existing:
            job = Job(**j)
            db.add(job)
            count += 1
    db.commit()
    return {"count": count, "total": len(vie_jobs_data)}

@router.get("/vie/eligibility")
async def get_vie_eligibility():
    """Returns candidate eligibility for VIE missions."""
    from agents.vie_discovery import vie_discovery
    return vie_discovery.check_eligibility()
