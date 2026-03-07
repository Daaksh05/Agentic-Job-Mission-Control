import os
import json
import httpx
import google.generativeai as genai
from typing import Dict, Any, List
from dotenv import load_dotenv

load_dotenv()

class AIService:
    def __init__(self):
        self.groq_api_key = os.getenv("GROQ_API_KEY")
        self.gemini_api_key = os.getenv("GEMINI_API_KEY")
        
        if self.gemini_api_key:
            genai.configure(api_key=self.gemini_api_key)
            self.gemini_model = genai.GenerativeModel('gemini-1.5-flash')

    async def match_job(self, resume_text: str, job_description: str) -> Dict[str, Any]:
        """Uses Groq (Llama 3) for fast job matching/scoring."""
        prompt = f"""
        Analyze the following job description against the resume.
        Return a JSON object with:
        - score (0-100)
        - match_reasons (list of strings)
        - missing_skills (list of strings)
        
        SCORING WEIGHTS:
        - High priority roles (85-100): Computer Vision, Deep Learning (TensorFlow/PyTorch), MLOps, AI Research, Full Stack AI.
        - Positive factor: CGPA 8.3/10.
        - Positive factor: 6 Published papers + Zenodo DOIs.
        
        Job Description: {job_description}
        Resume: {resume_text}
        """
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={"Authorization": f"Bearer {self.groq_api_key}"},
                    json={
                        "model": "llama-3.3-70b-versatile",
                        "messages": [{"role": "user", "content": prompt}],
                        "response_format": {"type": "json_object"}
                    },
                    timeout=30.0
                )
                return response.json()["choices"][0]["message"]["content"]
        except Exception as e:
            return {"error": str(e), "score": 0}

    async def tailor_resume(self, original_resume: str, job_description: str) -> str:
        """Uses Gemini 1.5 Flash for high-quality resume tailoring."""
        prompt = f"""
        Tailor the following resume to better match the job description. 
        Reorder sections and emphasize relevant experience, but NEVER fabricate information.
        
        Resume: {original_resume}
        Job Description: {job_description}
        """
        try:
            response = self.gemini_model.generate_content(prompt)
            return response.text
        except Exception as e:
            return f"Error tailoring resume: {str(e)}"

    async def generate_cover_letter(self, resume: str, job_description: str) -> str:
        """Uses Groq for cover letter generation."""
        prompt = f"""
        Write a professional, human-sounding cover letter (max 350 words).
        Avoid AI clichés like 'passionate about' or 'dynamic'.
        Resume context: {resume}
        Job Description: {job_description}
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={"Authorization": f"Bearer {self.groq_api_key}"},
                    json={
                        "model": "llama-3.1-70b-versatile",
                        "messages": [{"role": "user", "content": prompt}]
                    }
                )
                return response.json()["choices"][0]["message"]["content"]
        except Exception as e:
            return f"Error generating cover letter: {str(e)}"

ai_service = AIService()
