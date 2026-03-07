import os
import httpx
from typing import List, Dict, Any
from dotenv import load_dotenv

from agents.discovery import discovery_agent
from agents.vie_discovery import vie_discovery
from agents.linkedin_discovery import linkedin_discovery
from config import COUNTRY_CONFIG, COUNTRY_SCORE_BOOST, PRIMARY_COUNTRY, API_QUOTA_ALLOCATION
load_dotenv()

class JobService:
    def __init__(self):
        self.adzuna_id = os.getenv("ADZUNA_APP_ID")
        self.adzuna_key = os.getenv("ADZUNA_APP_KEY")

    async def fetch_adzuna_jobs(self, query: str = "software engineer", location: str = "us", limit: int = 50) -> List[Dict[str, Any]]:
        """Fetch jobs from Adzuna API."""
        url = f"https://api.adzuna.com/v1/api/jobs/{location}/search/1"
        params = {
            "app_id": self.adzuna_id,
            "app_key": self.adzuna_key,
            "what": query,
            "results_per_page": limit,
            "content-type": "application/json"
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params)
                if response.status_code == 200:
                    data = response.json()
                    results = data.get("results", [])
                    # Mark country for sorting
                    for r in results: r["country"] = location.upper()
                    return results
                return []
        except Exception:
            return []

    async def fetch_remotive_jobs(self, category: str = "software-dev", country: str = None) -> List[Dict[str, Any]]:
        """Fetch jobs from Remotive API."""
        url = f"https://remotive.com/api/remote-jobs?category={category}"
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url)
                if response.status_code == 200:
                    data = response.json()
                    jobs = data.get("jobs", [])
                    # Filter by country in description/location if requested
                    if country:
                        jobs = [j for j in jobs if country.lower() in j.get("location", "").lower()]
                    for j in jobs: j["country"] = country.upper() if country else "REMOTE"
                    return jobs
                return []
        except Exception:
            return []

    async def get_all_jobs(self, country: str = "FR") -> List[Dict[str, Any]]:
        """Aggregate jobs from multiple sources with priority and quota allocation."""
        
        # Expanded queries for better discovery
        queries = [
            "software engineer", 
            "computer vision", 
            "deep learning", 
            "mlops", 
            "ai research",
            "node.js developer"
        ]
        
        # Priority Order: WTTJ -> Pôle Emploi (Gap 6) -> Adzuna(FR) -> Remotive -> Others
        
        # 1. WTTJ
        wttj_jobs = await discovery_agent.fetch_wttj()
        
        # 2. Pôle Emploi
        pe_jobs = await discovery_agent.fetch_pole_emploi()
        
        # 3. VIE Jobs (Official Government Source)
        vie_jobs = await vie_discovery.fetch_vie_jobs()
        
        # 4. France Adzuna
        fr_adzuna = []
        for q in queries[:3]: # Limit queries to save quota
            fr_adzuna += await self.fetch_adzuna_jobs(query=q, location="fr", limit=40)
        
        # 5. Remote
        remote_jobs = await self.fetch_remotive_jobs()
        
        # 6. EU
        eu_countries = ["gb", "de", "nl", "be", "ch"]
        eu_jobs = []
        for c in eu_countries[:3]:
             eu_jobs += await self.fetch_adzuna_jobs(query="software engineer", location=c, limit=30)
             
        # 7. Rest
        rest_jobs = await self.fetch_adzuna_jobs(query="software engineer", location="us", limit=50)

        # 8. LinkedIn Easy Apply
        linkedin_jobs = await linkedin_discovery.search_jobs()

        all_jobs_raw = wttj_jobs + pe_jobs + vie_jobs + fr_adzuna + remote_jobs + eu_jobs + rest_jobs + linkedin_jobs
        
        normalized = []
        for job in all_jobs_raw:
            source = job.get("source", "Adzuna" if "redirect_url" in job else "Remotive")
            country_code = job.get("country", "REMOTE").upper()
            
            # Base score initialization
            score = 0
            # Apply 15% FR boost if country matches primary
            if country_code == PRIMARY_COUNTRY:
                # We'll calculate actual score later in matcher agent, 
                # but we can set a multiplier flag or base boost here
                pass

            if source == "wttj":
                normalized_job = job
            else:
                normalized_job = {
                    "id": str(job.get("id")),
                    "title": job.get("title"),
                    "company": job.get("company", {}).get("display_name") if source == "Adzuna" else job.get("company_name"),
                    "location": job.get("location", {}).get("display_name") if source == "Adzuna" else job.get("location"),
                    "country": country_code,
                    "description": job.get("description"),
                    "url": job.get("redirect_url") if source == "Adzuna" else job.get("url"),
                    "source": source,
                    "job_type": job.get("job_type"),
                    "duration": job.get("duration"),
                    "deadline": job.get("deadline"),
                    "match_score": 0
                }
            normalized.append(normalized_job)
            
        # Sort: VIE + WTTJ + PE + FR first
        normalized.sort(key=lambda x: (
            0 if x["job_type"] == "VIE" else
            1 if x["source"] == "wttj" else 
            2 if x["source"] == "pole-emploi" else
            3 if x["country"] == PRIMARY_COUNTRY else 
            4
        ))
        
        return normalized

job_service = JobService()

job_service = JobService()
