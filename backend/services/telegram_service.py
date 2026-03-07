import requests
import os
from typing import Optional

class TelegramService:
    def __init__(self):
        self.token = os.getenv("TELEGRAM_BOT_TOKEN")
        self.chat_id = os.getenv("TELEGRAM_CHAT_ID")
        self.api_url = f"https://api.telegram.org/bot{self.token}"

    def send_message(self, text: str):
        if not self.token or not self.chat_id:
            print("Telegram not configured.")
            return
            
        payload = {
            "chat_id": self.chat_id,
            "text": text,
            "parse_mode": "HTML"
        }
        try:
            requests.post(f"{self.api_url}/sendMessage", json=payload)
        except Exception as e:
            print(f"Telegram failed: {e}")

    def notify_submission(self, company, role, score, platform):
        msg = f"🚀 <b>Application Submitted!</b>\n\n🏢 <b>{company}</b>\n💼 {role}\n🎯 Match Score: <b>{score}/100</b>\n📋 Platform: {platform}\n\nGood luck! 🤞"
        self.send_message(msg)

    def notify_interview(self, company, role, from_addr, score):
        msg = f"🎉 <b>INTERVIEW REQUEST!</b>\n\n🏢 <b>{company}</b>\n💼 {role}\n📧 From: {from_addr}\n🎯 Your score was: <b>{score}/100</b>\n\n⚡ Reply within 24 hours — check your email now!"
        self.send_message(msg)

    def notify_rejection(self, company, role, days_ago):
        msg = f"❌ <b>Application Update</b>\n\n🏢 {company}\n💼 {role}\n📅 Applied {days_ago} days ago\n\nNot this time — on to the next one. 💪"
        self.send_message(msg)

    def notify_offer(self, company, role, score):
        msg = f"🏆 <b>JOB OFFER RECEIVED!</b>\n\n🏢 <b>{company}</b>\n💼 {role}\n🎯 Match Score: <b>{score}/100</b>\n\n🎊 Congratulations! Check your email immediately."
        self.send_message(msg)

    def notify_assessment(self, company, role, country_flag="🌐"):
        msg = f"📝 <b>Technical Assessment Received</b>\n\n🏢 <b>{company}</b> {country_flag}\n💼 {role}\n📧 Check your email for the challenge details.\n\n⚡ Most assessments have a 3-7 day deadline — act quickly!"
        self.send_message(msg)

telegram_service = TelegramService()
