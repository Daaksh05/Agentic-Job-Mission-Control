import imaplib
import email
from email.header import decode_header
import os
import datetime
from datetime import timedelta
from typing import List, Optional, Dict
from sqlalchemy.orm import Session
from models.database import SessionLocal
from models.models import Application, AppStatus, Job
from agents.interview_prep import interview_prep_generator
import re
import asyncio

class EmailEvent:
    def __init__(self, type: str, company: str, app_id: Optional[int] = None):
        self.type = type
        self.company = company
        self.app_id = app_id

class EmailMonitor:
    def __init__(self):
        self.user = os.getenv("GMAIL_ADDRESS")
        self.password = os.getenv("GMAIL_APP_PASSWORD")
        self.mail = None

    def connect(self):
        try:
            self.mail = imaplib.IMAP4_SSL("imap.gmail.com")
            self.mail.login(self.user, self.password)
            return True
        except Exception as e:
            print(f"IMAP Login Failed: {e}")
            return False

    def _get_body(self, msg):
        if msg.is_multipart():
            for part in msg.walk():
                if part.get_content_type() == "text/plain":
                    return part.get_payload(decode=True).decode()
        else:
            return msg.get_payload(decode=True).decode()
        return ""

    def classify_email(self, subject: str, body: str) -> Optional[str]:
        text = (subject + " " + body).lower()
        
        # Interview
        if any(w in text for w in ["interview", "entretien", "schedule", "rendez-vous", "call", "meet", "disponibilités"]):
            return "interview_request"
        
        # Rejection
        if any(w in text for w in ["unfortunately", "malheureusement", "not moving forward", "other candidates", "ne correspond pas", "sans suite"]):
            return "rejection"
            
        # Offer
        if any(w in text for w in ["offer", "offre", "pleased to", "congratulations", "félicitations"]):
            return "offer"
            
        # Assessment
        if any(w in text for w in [
            "assessment", "coding challenge", "technical test", "take-home", "assignment", 
            "hackerrank", "codility", "leetcode", "technical exercise",
            "test technique", "cas pratique", "mise en situation", "exercice", "devoir", "évaluation technique"
        ]):
            return "assessment"
        
        return None

    async def check_inbox(self):
        if not self.connect(): return []
        
        self.mail.select("inbox")
        date = (datetime.datetime.now() - timedelta(days=1)).strftime("%d-%b-%Y")
        _, data = self.mail.search(None, f'(SINCE "{date}")')
        
        db = SessionLocal()
        events = []
        
        for num in data[0].split():
            _, msg_data = self.mail.fetch(num, "(RFC822)")
            msg = email.message_from_bytes(msg_data[0][1])
            
            subject, encoding = decode_header(msg["subject"])[0]
            if isinstance(subject, bytes): subject = subject.decode(encoding or "utf-8")
            
            from_ = msg.get("From")
            body = self._get_body(msg)
            
            event_type = self.classify_email(subject, body)
            if event_type:
                # Try to match company
                sender_domain = re.search(r"@([\w.-]+)", from_)
                if sender_domain:
                    domain = sender_domain.group(1).split('.')[-2] if '.' in sender_domain.group(1) else sender_domain.group(1)
                    app = db.query(Application).join(Job).filter(Job.company.ilike(f"%{domain}%")).first()
                    
                    if app:
                        await self.update_app_status(db, app, event_type)
                        events.append(EmailEvent(event_type, app.job.company, app.id))
        
        db.close()
        self.mail.logout()
        return events

    async def update_app_status(self, db: Session, app: Application, event_type: str):
        mapping = {
            "interview_request": AppStatus.INTERVIEW,
            "rejection": AppStatus.REJECTED,
            "offer": AppStatus.OFFER,
            "assessment": AppStatus.INTERVIEW
        }
        if event_type in mapping:
            app.status = mapping[event_type]
            if event_type == "assessment":
                app.sub_status = "Assessment in progress"
            
            # Trigger Interview Prep
            if event_type == "interview_request":
                # Run in background to not block inbox check
                asyncio.create_task(interview_prep_generator.generate_prep(app.id))
                
            db.commit()

email_monitor = EmailMonitor()
