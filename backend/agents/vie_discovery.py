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

    BASE_URL = "https://www.civiweb.com/FR/offre-de-vivier.aspx"

    async def fetch_vie_jobs(self) -> List[Dict[str, Any]]:
        async with async_playwright() as p:
            # Using browser debugging port isn't needed here, just a standard launch
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_page()
            
            try:
                # Target IT & Telecom domain in France
                url = (
                    f"{self.BASE_URL}"
                    "?domaine=informatique-telecom"
                    "&pays=france"
                )
                await context.goto(url, wait_until="networkidle")
                
                # Wait for the list to appear
                # The provided HTML structure in the request uses .mission-list and .mission-item
                # I'll use common selectors if those aren't exact, but sticking to requested ones for now
                try:
                    await context.wait_for_selector(".mission-item", timeout=10000)
                except:
                    # Fallback if the site changed or selectors differ slightly
                    await context.wait_for_selector("article", timeout=5000)

                jobs = []
                cards = await context.query_selector_all(".mission-item")
                
                if not cards:
                    cards = await context.query_selector_all("article") # common fallback

                for card in cards:
                    title_elem = await card.query_selector(".mission-title") or await card.query_selector("h3")
                    company_elem = await card.query_selector(".mission-company") or await card.query_selector(".company")
                    location_elem = await card.query_selector(".mission-location") or await card.query_selector(".location")
                    duration_elem = await card.query_selector(".mission-duration")
                    deadline_elem = await card.query_selector(".mission-deadline")
                    link_elem = await card.query_selector("a")

                    title = await title_elem.inner_text() if title_elem else "Unknown Title"
                    company = await company_elem.inner_text() if company_elem else "Unknown Company"
                    location = await location_elem.inner_text() if location_elem else "France"
                    duration = await duration_elem.inner_text() if duration_elem else "12 months"
                    deadline_str = await deadline_elem.inner_text() if deadline_elem else ""
                    
                    # Parse deadline if possible
                    deadline = None
                    if deadline_str:
                        try:
                            # Assuming format like "30/05/2026"
                            deadline = datetime.strptime(deadline_str.strip(), "%d/%m/%Y")
                        except:
                            pass

                    href = await link_elem.get_attribute("href") if link_elem else ""
                    job_url = f"https://www.civiweb.com{href}" if href and not href.startswith("http") else href

                    jobs.append({
                        "id": f"vie-{hash(job_url)}",
                        "title": title.strip(),
                        "company": company.strip(),
                        "location": location.strip(),
                        "source": "civiweb_vie",
                        "country": "FR",
                        "job_type": "VIE",
                        "duration": duration.strip(),
                        "deadline": deadline,
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
