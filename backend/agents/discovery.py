import httpx
import os
import asyncio
from typing import List, Dict, Any
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

class DiscoveryAgent:
    def __init__(self):
        self.wttj_api_key = os.getenv("WTTJ_API_KEY")
        self.pe_client_id = os.getenv("POLE_EMPLOI_CLIENT_ID")
        self.pe_client_secret = os.getenv("POLE_EMPLOI_CLIENT_SECRET")

    async def fetch_wttj(self) -> List[Dict[str, Any]]:
        """
        Welcome to the Jungle public API
        Docs: https://developers.welcometothejungle.com
        No auth required for basic job search, but API key increases limits.
        """
        url = "https://api.welcometothejungle.com/api/v1/jobs"
        headers = {}
        if self.wttj_api_key:
            headers["Authorization"] = f"Bearer {self.wttj_api_key}"

        all_jobs = []
        # Paginate through pages 1-5 (50 jobs per page = 250 max)
        async with httpx.AsyncClient() as client:
            for page in range(1, 6):
                params = {
                    "page": page,
                    "per_page": 50,
                    "contract_type": "CDI",
                    "department_slugs": "engineering",
                    "language": "fr",
                    "query": "computer vision OR deep learning OR mlops OR research assistant OR node.js"
                }
                try:
                    response = await client.get(url, params=params, headers=headers)
                    if response.status_code == 200:
                        data = response.json()
                        jobs = data.get("jobs", [])
                        if not jobs:
                            break
                        
                        for job in jobs:
                            normalized = {
                                "id": f"wttj-{job.get('id')}",
                                "title": job.get("title"),
                                "company": job.get("company", {}).get("name"),
                                "location": job.get("office", {}).get("city", "Remote/Multiple"),
                                "country": "FR",
                                "description": job.get("description"),
                                "url": f"https://www.welcometothejungle.com/fr/companies/{job.get('company', {}).get('slug')}/jobs/{job.get('slug')}",
                                "source": "wttj",
                                "match_score": 0,
                                "contract_type": "CDI",
                                "salary_range": f"{job.get('salary_min', '')}-{job.get('salary_max', '')} {job.get('currency', '')}",
                                "remote": job.get("remote")
                            }
                            all_jobs.append(normalized)
                    else:
                        break
                except Exception as e:
                    print(f"Error fetching WTTJ page {page}: {e}")
                    break
        
        return all_jobs

    async def fetch_pole_emploi(self) -> List[Dict[str, Any]]:
        """Official French government job board - Pôle Emploi / France Travail"""
        if not self.pe_client_id or not self.pe_client_secret:
            return []

        try:
            async with httpx.AsyncClient() as client:
                # Step 1: Token
                token_resp = await client.post(
                    "https://entreprise.pole-emploi.fr/connexion/oauth2/access_token",
                    params={"realm": "/partenaire"},
                    data={
                        "grant_type": "client_credentials",
                        "client_id": self.pe_client_id,
                        "client_secret": self.pe_client_secret,
                        "scope": "api_offresdemploiv2 o2dsoffre"
                    },
                    headers={"Content-Type": "application/x-www-form-urlencoded"}
                )
                token = token_resp.json().get("access_token")
                if not token: return []

                # Step 2: Search
                resp = await client.get(
                    "https://api.pole-emploi.io/partenaire/offresdemploi/v2/offres/search",
                    headers={"Authorization": f"Bearer {token}"},
                    params={
                        "motsCles": "développeur OR engineer OR software OR 'vision par ordinateur' OR 'deep learning' OR 'MLOps' OR 'research assistant' OR 'node.js'",
                        "typeContrat": "CDI",
                        "range": "0-149",
                    }
                )
                
                if resp.status_code != 200: return []
                
                raw_jobs = resp.json().get("resultats", [])
                normalized_jobs = []
                for job in raw_jobs:
                    normalized_jobs.append({
                        "id": f"pe-{job.get('id')}",
                        "title": job.get("intitule"),
                        "company": job.get("entreprise", {}).get("nom", "Confidentiel"),
                        "location": job.get("lieuTravail", {}).get("libelle", "France"),
                        "country": "FR",
                        "description": job.get("description"),
                        "url": job.get("originede l'offre", {}).get("urlOrigine") or f"https://candidat.pole-emploi.fr/offres/recherche/detail/{job.get('id')}",
                        "source": "pole-emploi",
                        "match_score": 0,
                    })
                return normalized_jobs
        except Exception as e:
            print(f"Pôle Emploi Error: {e}")
            return []

discovery_agent = DiscoveryAgent()
