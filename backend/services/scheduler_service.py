from apscheduler.schedulers.asyncio import AsyncIOScheduler
from agents.email_monitor import email_monitor
from agents.vie_discovery import vie_discovery
from agents.linkedin_discovery import linkedin_discovery
from services.telegram_service import telegram_service
from services.job_service import job_service
from models.database import SessionLocal
from models.models import Application, AppStatus
import datetime
import asyncio # Added for async tasks

scheduler = AsyncIOScheduler()

async def check_emails_task():
    print("Running Email Check...")
    loop = asyncio.get_event_loop()
    events = loop.run_until_complete(email_monitor.check_inbox())
    
    db = SessionLocal()
    for event in events:
        if event.type == "assessment":
            telegram_service.notify_assessment(event.company, "Software Engineer") # Role ideally from app
        else:
            telegram_service.send_message(f"📧 <b>Email Detected</b>\nType: {event.type}\nCompany: {event.company}")

async def daily_followup_task():
    print("Running Daily Job Agent Report...")
    db = SessionLocal()
    
    # Mock data for demonstration, in real app query DB
    report = f"""🌍 <b>Daily Job Agent Report</b>

🇫🇷 <b>France (Primary)</b>
  New jobs found: 12  |  Queued: 5
  Applied this week: 8  |  Interviews: 2

🌐 <b>Other Countries</b>
  🌐 Remote: 5 new  |  🇬🇧 UK: 3 new
  🇩🇪 DE: 2 new  |  🇳🇱 NL: 1 new

📊 <b>Overall Pipeline</b>
  Total active: 45 applications
  Response rate: 18%
  Best performing: France 🏆"""
    
    telegram_service.send_message(report)
    db.close()

def check_vie_task():
    print("Running VIE Discovery check...")
    loop = asyncio.get_event_loop()
    jobs = loop.run_until_complete(vie_discovery.fetch_vie_jobs())
    
    db = SessionLocal()
    for job_data in jobs:
        # Check deadline for alert
        if job_data.get("deadline"):
            days_left = (job_data["deadline"] - datetime.now()).days
            if days_left <= 7:
                telegram_service.send_message(f"🚨 <b>VIE DEADLINE IN {days_left} DAYS!</b>\n\n🏢 <b>{job_data['company']}</b>\n💼 {job_data['title']}\n⏰ Deadline: {job_data['deadline'].strftime('%d/%m/%Y')}\n\nApply NOW at civiweb.com!")
    
    # Check for assessment emails etc. already handled in check_emails_task
    db.close()

def check_linkedin_task():
    print("Running LinkedIn Discovery check...")
    loop = asyncio.get_event_loop()
    loop.run_until_complete(linkedin_discovery.search_jobs())

def start_scheduler():
    scheduler.add_job(check_emails_task, "interval", minutes=15)
    scheduler.add_job(daily_followup_task, "cron", hour=9)
    scheduler.add_job(check_vie_task, 'interval', hours=12)
    scheduler.add_job(check_linkedin_task, 'interval', hours=6)
    scheduler.start()
