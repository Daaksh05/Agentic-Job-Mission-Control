from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session, joinedload
from models.database import get_db
from models.models import Application, Job, AppStatus, Profile, SubmissionLog
from agents.writer import writer_agent
from typing import List
import asyncio

router = APIRouter(prefix="/applications", tags=["applications"])

@router.get("/{app_id}/logs")
async def get_application_logs(app_id: int, db: Session = Depends(get_db)):
    log = db.query(SubmissionLog).filter(SubmissionLog.application_id == app_id).first()
    if not log:
        return {"screenshot_paths": [], "log_messages": []}
    return log

@router.get("/{app_id}/prep")
async def get_interview_prep(app_id: int, db: Session = Depends(get_db)):
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    return app.prep_sheet

@router.post("/{app_id}/prep")
async def generate_interview_prep(app_id: int, db: Session = Depends(get_db)):
    from agents.interview_prep import interview_prep_generator
    prep = await interview_prep_generator.generate_prep(app_id)
    return prep

@router.get("/")
async def list_applications(db: Session = Depends(get_db)):
    return db.query(Application).options(joinedload(Application.job)).all()

@router.post("/generate/{job_id}")
async def generate_application_docs(job_id: str, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    profile = db.query(Profile).first()
    
    if not job or not profile or not profile.master_resume:
        raise HTTPException(status_code=400, detail="Missing master resume. Please upload your resume in the Profile section first.")

    # Call Writer Agent
    docs = await writer_agent.generate_tailored_docs(
        profile.master_resume, 
        job.description, 
        job.country or "US"
    )

    # Create or update application in QUEUE
    app = db.query(Application).filter(Application.job_id == job_id).first()
    if not app:
        app = Application(
            job_id=job_id,
            status=AppStatus.QUEUE,
            tailored_resume=docs["cv"],
            cover_letter=docs["cover_letter"]
        )
        db.add(app)
        db.flush()
    else:
        app.tailored_resume = docs["cv"]
        app.cover_letter = docs["cover_letter"]
    
    db.commit()
    
    # Refresh to ensure job relationship is loaded for return
    app = db.query(Application).options(joinedload(Application.job)).filter(Application.id == app.id).first()
    return app

@router.patch("/{app_id}/status")
async def update_application_status(app_id: int, status: str, follow_up_sent: int = None, db: Session = Depends(get_db)):
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    app.status = AppStatus(status)
    if follow_up_sent is not None:
        app.follow_up_sent = follow_up_sent
    db.commit()
    return app

@router.post("/{app_id}/submit")
async def submit_application(app_id: int, db: Session = Depends(get_db)):
    from agents.submitter import submitter
    from services.websocket_service import manager
    
    async def run_submission():
        try:
            await manager.send_status(app_id, {"step": "Opening application page..."})
            result = await submitter.submit(app_id)
            await manager.send_status(app_id, {"step": "Finished", "result": result.status})
        except Exception as e:
            await manager.send_status(app_id, {"step": "Finished", "result": "failed", "message": f"Critical Error: {str(e)}"})

    asyncio.create_task(run_submission())
    return {"message": "Submission started"}

@router.websocket("/ws/{app_id}")
async def submission_websocket(websocket: WebSocket, app_id: int):
    from services.websocket_service import manager
    await manager.connect(app_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(app_id, websocket)

