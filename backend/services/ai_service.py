import os
import json
import asyncio
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
            try:
                genai.configure(api_key=self.gemini_api_key)
                # Use the newer 2.0 model for better speed and stability
                self.gemini_model = genai.GenerativeModel('gemini-2.0-flash-lite')
            except Exception as e:
                print(f"DEBUG: Gemini init failed: {e}")
                self.gemini_model = None

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
                if response.status_code != 200:
                    return {"error": f"Groq API returned {response.status_code}", "score": 0}
                
                data = response.json()
                if "choices" not in data or not data["choices"]:
                    return {"error": "Invalid Groq response: choices missing", "score": 0}
                
                content = data["choices"][0]["message"]["content"]
                return json.loads(content) if isinstance(content, str) else content
        except Exception as e:
            return {"error": str(e), "score": 0}

    async def tailor_resume(self, original_resume: str, job_description: str) -> str:
        """Uses Gemini 1.5 Flash with Groq fallback for high-quality resume tailoring."""
        print(f"DEBUG: Starting resume tailoring...")
        prompt = f"""
        Tailor the following resume to better match the job description. 
        Reorder sections and emphasize relevant experience, but NEVER fabricate information.
        
        Resume: {original_resume}
        Job Description: {job_description}
        """
        
        # Try Gemini First
        if self.gemini_api_key and hasattr(self, 'gemini_model') and self.gemini_model:
            try:
                print(f"DEBUG: Attempting Gemini tailoring...")
                response = await self.gemini_model.generate_content_async(prompt)
                if response and response.text:
                    print(f"DEBUG: Gemini tailoring success.")
                    return response.text
            except Exception as e:
                print(f"DEBUG: Gemini tailoring failed: {e}. Falling back to Groq...")

        # Fallback to Groq
        try:
            print(f"DEBUG: Attempting Groq tailoring fallback...")
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={"Authorization": f"Bearer {self.groq_api_key}"},
                    json={
                        "model": "llama-3.3-70b-versatile",
                        "messages": [{"role": "user", "content": prompt}]
                    },
                    timeout=30.0
                )
                data = response.json()
                if "choices" in data and data["choices"]:
                    print(f"DEBUG: Groq tailoring success.")
                    return data["choices"][0]["message"]["content"]
                return f"Error tailoring resume: No choices in fallback response"
        except Exception as e:
            return f"Error tailoring resume: {str(e)} (Both Gemini and Groq failed)"

    async def generate_cover_letter(self, resume: str, job_description: str) -> str:
        """Uses Gemini 1.5 Flash with Groq fallback for cover letter generation."""
        print(f"DEBUG: Starting cover letter generation...")
        prompt = f"""
        Write a professional, human-sounding cover letter (max 350 words).
        Avoid AI clichés like 'passionate about' or 'dynamic'.
        Resume context: {resume}
        Job Description: {job_description}
        """
        
        # Try Gemini First
        if self.gemini_api_key and hasattr(self, 'gemini_model') and self.gemini_model:
            try:
                print(f"DEBUG: Attempting Gemini cover letter...")
                response = await self.gemini_model.generate_content_async(prompt)
                if response and response.text:
                    print(f"DEBUG: Gemini cover letter success.")
                    return response.text
            except Exception as e:
                print(f"DEBUG: Gemini cover letter failed: {e}. Falling back to Groq...")

        # Fallback to Groq with Retries
        for attempt in range(3):
            try:
                print(f"DEBUG: Attempting Groq cover letter (Attempt {attempt+1})...")
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        "https://api.groq.com/openai/v1/chat/completions",
                        headers={"Authorization": f"Bearer {self.groq_api_key}"},
                        json={
                            "model": "llama-3.3-70b-versatile",
                            "messages": [{"role": "user", "content": prompt}]
                        },
                        timeout=30.0
                    )
                    
                    if response.status_code == 429:
                        wait_time = (attempt + 1) * 2
                        print(f"DEBUG: Groq Rate Limit (429). Waiting {wait_time}s...")
                        await asyncio.sleep(wait_time)
                        continue
                        
                    if response.status_code != 200:
                        return f"Error generating cover letter: Groq API returned {response.status_code}"
                    
                    data = response.json()
                    if "choices" not in data or not data["choices"]:
                        return f"Error generating cover letter: choices property missing. Data: {data}"
                    
                    print(f"DEBUG: Groq cover letter success.")
                    return data["choices"][0]["message"]["content"]
            except Exception as e:
                if attempt < 2:
                    await asyncio.sleep(1)
                    continue
                return f"Error generating cover letter: {str(e)} (Both Gemini and Groq failed)"
        
        return "Error: Rate limit exceeded for all AI services. Please wait a moment and try again."




ai_service = AIService()
