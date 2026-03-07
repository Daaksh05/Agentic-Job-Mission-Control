import os
from typing import Dict, Any, List
from services.ai_service import ai_service

PROFILES = {
    "FR": {
        "tone": "intellectual_formal",
        "doc": "CV",
        "sign_off": "Veuillez agréer, Madame/Monsieur, l'expression de mes salutations distinguées",
        "formality": "very_high",
        "lang": "fr",
        "priority": "PRIMARY"
    },
    "US": {"tone":"direct","doc":"resume","sign_off":"Best regards","formality":"medium"},
    "GB": {"tone":"measured","doc":"CV","sign_off":"Yours sincerely","formality":"high"},
    "DE": {"tone":"formal","doc":"Lebenslauf","sign_off":"Mit freundlichen Grüßen","lang":"de"},
    "IN": {"tone":"respectful","doc":"Resume","sign_off":"Yours faithfully","formality":"high"},
    "AU": {"tone":"friendly","doc":"Resume","sign_off":"Kind regards","formality":"low"},
    "CA": {"tone":"collaborative","doc":"Resume","sign_off":"Best regards","formality":"medium"},
    "REMOTE": {"tone":"neutral","doc":"Resume","sign_off":"Best","formality":"medium"}
}

FRENCH_CV_RULES = """
CV FORMAT RULES FOR FRANCE:
• Called "CV" — max 2 pages for senior.
• Include: professional photo placeholder, full address, date of birth, nationality.
• Start with a "Titre du poste" (target job title) at the very top.
• Include a short "Profil" or "Accroche" section (3-4 line professional summary).
• Sections order: Profil → Expériences → Formation → Compétences → Langues → Centres d'intérêt.
• "Centres d'intérêt" (hobbies/interests) section is mandatory and taken seriously.
• Education (Formation) is highly valued — list engineering schools (grandes écoles) prominently if applicable.
• List languages with proficiency (e.g., Anglais: courant, Espagnol: notions).
"""

FRENCH_CL_RULES = """
LETTRE DE MOTIVATION (COVER LETTER) RULES FOR FRANCE:
• ALWAYS write in French.
• STRICT STRUCTURE: Vous / Moi / Nous.
• Paragraph 1 (VOUS): Talk about the company, their news, values, why THEM. Never start with yourself.
• Paragraph 2 (MOI): Your relevant experiences and specific achievements with numbers.
• Paragraph 3 (NOUS): Why you + them = perfect fit. Genuine motivation and long-term fit.
• Length: Exactly 3 paragraphs, 250-350 words.
• Tone: Formal, intellectual, elegant writing. Use "vous" form. 
• NO "je suis passionné(e)". No anglicisms.
"""

# New VIE Context
VIE_CONTEXT = """
This is a VIE application. VIE cover letters in France must:
  1. Explicitly state the candidate knows what VIE is and wants this specific format of international experience
  2. Mention why this country/location for the VIE mission
  3. Show genuine professional motivation beyond "wanting to visit France"
  4. Reference the candidate's international outlook and adaptability

Add this paragraph to all VIE Lettres de Motivation:
"Le dispositif VIE représente pour moi une opportunité exceptionnelle de mettre mes compétences en IA et développement web au service d'une entreprise française de premier plan, tout en m'immergeant pleinement dans l'écosystème technologique européen. Mon engagement bénévole lors du Choose France Tour 2025 témoigne de mon intérêt sincère et durable pour la France."
"""

class WriterAgent:
    def __init__(self):
        self.profiles = PROFILES

    def get_localization_context(self, country_code: str) -> Dict[str, Any]:
        return self.profiles.get(country_code, self.profiles["REMOTE"])

    async def generate_tailored_docs(self, resume_text: str, job_description: str, country_code: str = "US", candidate_data: Dict = None):
        profile = self.get_localization_context(country_code)
        
        # Candidate Info
        portfolio_url = "https://ai-engineer-portfolio-jj7pvdk9v-daaksh05s-projects.vercel.app"
        cgpa = "8.3/10"
        grad_date = "May 2026"
        
        # Inject context for CV
        cv_instructions = f"""
        HEADER RULES:
        - Name: Daakshayani Senthilkumar
        - GitHub: github.com/Daaksh05
        - Portfolio: {portfolio_url}
        - CGPA: {cgpa} (Include in Education)
        - Graduation: {grad_date}
        """
        
        if country_code == "FR":
            cv_instructions += "\nHeader Labels: Portfolio : [URL], GitHub : [URL]\n" + FRENCH_CV_RULES
            lang = "French"
        else:
            lang = "English"

        cv_prompt = f"""
        Tailor this {profile['doc']} for a {country_code} context.
        Candidate: Daakshayani Senthilkumar
        Language: {lang}. 
        {cv_instructions}
        
        IMPORTANT: Include CGPA {cgpa} and Portfolio {portfolio_url}.
        
        Resume: {resume_text}
        Job: {job_description}
        """

        # Inject context for Cover Letter
        cl_instructions = f"""
        - Mention CGPA: "Currently maintaining a CGPA of {cgpa}"
        - Portfolio Mention (Standard): "My portfolio at {portfolio_url} showcases 6+ production projects with live demos and published research papers with Zenodo DOIs, demonstrating my commitment to reproducible, open-science AI."
        """
        
        if country_code == "FR":
            cl_instructions += f"\n- Portfolio Mention (FR): 'Mon portfolio ({portfolio_url}) illustre mes projets en IA éthique, notamment un système de conformité à l'AI Act européen, reflétant mon engagement envers une innovation responsable.'\n"
            cl_instructions += FRENCH_CL_RULES
            
        # VIE Detection
        if "VIE" in job_description or (candidate_data and candidate_data.get("job_type") == "VIE"):
            cl_instructions += f"\n{VIE_CONTEXT}\n"

        research_context = ""
        if any(w in job_description.lower() for w in ["research", "data science", "scientist", "ai labs"]):
            research_context = "Mention: 'All projects are archived with Zenodo DOIs demonstrating commitment to reproducibility and open science principles.'"

        cl_prompt = f"""
        Write a professional {profile['doc']} for this job in {country_code}.
        Candidate: Daakshayani Senthilkumar
        Tone: {profile['tone']}. Sign-off: {profile['sign_off']}.
        {cl_instructions}
        {research_context}
        
        Resume: {resume_text}
        Job: {job_description}
        """

        # Generate using existing AI service
        tailored_cv = await ai_service.tailor_resume(resume_text, cv_prompt)
        cover_letter = await ai_service.generate_cover_letter(resume_text, cl_prompt)

        return {
            "cv": tailored_cv,
            "cover_letter": cover_letter,
            "profile": profile
        }

writer_agent = WriterAgent()
