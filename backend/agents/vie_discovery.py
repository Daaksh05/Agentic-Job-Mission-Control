import asyncio
import random
from datetime import datetime
from typing import List, Dict, Any
from playwright.async_api import async_playwright

class VIEDiscovery:
    """
    Scrapes civiweb.com — the ONLY official VIE job board.
    All legitimate VIE offers MUST be posted here by law.
    """

    BASE_URL = "https://mon-vie-via.businessfrance.fr/offres/recherche"

    async def fetch_vie_jobs(self) -> List[Dict[str, Any]]:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_page()
            
            try:
                # Target IT & Telecom domain in France
                url = (
                    f"{self.BASE_URL}"
                    "?query=informatique"
                )
                await context.goto(url, wait_until="networkidle")
                
                # Wait for the list to appear (using the new selectors found)
                try:
                    await context.wait_for_selector("figure", timeout=10000)
                except:
                    # Generic fallback
                    await context.wait_for_selector(".figure-item", timeout=5000)

                jobs = []
                cards = await context.query_selector_all("figure")
                
                for card in cards:
                    title_elem = await card.query_selector("h2.mission-title")
                    company_elem = await card.query_selector("h3.organization-name")
                    location_elem = await card.query_selector("h2.location")
                    link_elem = await card.query_selector("a")

                    title = await title_elem.inner_text() if title_elem else "Unknown Title"
                    company = await company_elem.inner_text() if company_elem else "Unknown Company"
                    location = await location_elem.inner_text() if location_elem else "France"
                    
                    href = await link_elem.get_attribute("href") if link_elem else ""
                    job_url = f"https://mon-vie-via.businessfrance.fr{href}" if href and not href.startswith("http") else href

                    jobs.append({
                        "id": f"vie-{hash(job_url)}",
                        "title": title.strip(),
                        "company": company.strip(),
                        "location": location.strip(),
                        "source": "business_france_vie",
                        "country": "FR",
                        "job_type": "VIE",
                        "duration": "12-24 months",
                        "url": job_url,
                        "match_score": 0,
                    })


                return jobs
            except Exception as e:
                print(f"VIE Scraper Error: {e}")
                return []
            finally:
                await browser.close()

    def check_eligibility(self) -> Dict[str, Any]:
        """Verify candidate meets VIE requirements"""
        # Daaksh's info: Born April 24, 2005 (implied age 20)
        # Indian nationality (non-EU)
        from datetime import date
        birth_date = date(2005, 4, 24)
        today = date.today()
        age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
        
        return {
            "eligible": age >= 18 and age <= 28,
            "age": age,
            "nationality": "Indian",
            "max_age_remaining": 28 - age,
            "recommended_duration": "12-24 months",
            "monthly_indemnity_eur": 2747,
            "tax_free": True,
        }

vie_discovery = VIEDiscovery()
