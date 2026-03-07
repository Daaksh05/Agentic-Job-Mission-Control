import json
import os
from typing import Dict, Any
from services.ai_service import ai_service
from models.database import SessionLocal
from models.models import Application, Job
from services.telegram_service import telegram_service
from services.websocket_service import manager as websocket_manager

class InterviewPrepGenerator:
    async def generate_prep(self, application_id: int) -> Dict[str, Any]:
        """Generate full interview prep sheet for a specific application"""
        db = SessionLocal()
        try:
            app = db.query(Application).filter(Application.id == application_id).first()
            if not app:
                return {"error": "Application not found"}
            
            job = app.job
            
            # Tailored prep prompt
            prompt = f"""
            You are an expert interview coach preparing a candidate for a tech job interview. Generate a comprehensive prep sheet.

            CANDIDATE: Daakshayani Senthilkumar
            Skills: React, Next.js, Python, FastAPI, ML, NLP, TensorFlow, PyTorch, Scikit-learn, MongoDB, PostgreSQL, IBM Cloud
            Projects: EU AI Compliance Checker, Fairness Evaluation ML, DermCare, Smart ATS Builder, UniDecide
            Publications: 6 international research papers
            Special: IEEE Member, Guinness World Record, CGPA 8.3
            Country: {job.country}

            COMPANY: {job.company}
            ROLE: {job.title}
            JOB DESCRIPTION: {job.description}
            MATCH SCORE: {job.match_score}/100

            Generate a JSON prep sheet with these exact sections:
            {{
              "company_overview": {{ "what_they_do": "...", "tech_stack": [], "culture": "...", "recent_news": "...", "why_they_hired": "..." }},
              "likely_technical_questions": [ {{ "question": "...", "why_theyll_ask": "...", "suggested_answer": "...", "difficulty": "medium" }} ],
              "likely_behavioral_questions": [ {{ "question": "...", "star_answer": {{ "situation": "...", "task": "...", "action": "...", "result": "..." }} }} ],
              "projects_to_highlight": [ {{ "project": "...", "why_relevant": "...", "talking_points": [] }} ],
              "questions_to_ask_them": [ "..." ],
              "french_specific_tips": {{ "language_note": "...", "cultural_tips": [], "mention_choose_france": true, "eu_ai_act_relevance": "..." }},
              "salary_guidance": {{ "expected_range": "...", "vie_rate": "€2,747/month if VIE", "when_to_discuss": "..." }}
            }}
            
            Return ONLY valid JSON. Be specific — use her actual projects.
            """
            
            # Using ai_service (routes to Groq)
            # Assuming match_job-like method for high-quality JSON
            response_text = await ai_service.match_job(job.description, prompt) # Overloading match_job as it handles JSON
            
            prep_data = response_text
            if isinstance(response_text, str):
                try:
                    prep_data = json.loads(response_text)
                except:
                    prep_data = {"error": "AI response was not valid JSON"}

            # Save to separate column
            app.prep_sheet = prep_data
            db.commit()

            # Notify
            from services.websocket_service import manager
            await manager.send_status(application_id, {
                "type": "PREP_READY",
                "application_id": application_id,
                "company": job.company
            })
            
            # Telegram summary
            await self._send_telegram_prep(job, prep_data, application_id)

            return prep_data
        finally:
            db.close()

    async def _send_telegram_prep(self, job, prep, app_id):
        # Extract highlights
        highlights = prep.get("projects_to_highlight", [])[:2]
        h_str = "\n".join([f"- {h['project']}: {h['why_relevant']}" for h in highlights])
        
        first_q = prep.get("likely_technical_questions", [{}])[0].get("question", "Tell me about yourself")
        
        msg = f"""
🎯 <b>Interview Prep Ready!</b>

🏢 <b>{job.company}</b> 🇫🇷
💼 {job.title}
📊 Match: {job.match_score}/100

<b>Highlight these:</b>
{h_str}

<b>Be ready for:</b>
"{first_q}"

🔗 Full prep sheet: http://localhost:5173/interview-prep/{app_id}
"""
        await telegram_service.send_message(msg)

interview_prep_generator = InterviewPrepGenerator()
