import asyncio
import random
import os
import json
from typing import List, Dict, Any
from playwright.async_api import async_playwright
from dotenv import load_dotenv

load_dotenv()

class LinkedInDiscovery:
    def __init__(self):
        self.email = os.getenv("LINKEDIN_EMAIL", "daakshayanidaakshayani@gmail.com")
        self.password = os.getenv("LINKEDIN_PASSWORD")
        self.keywords = [
            "react developer", "machine learning intern",
            "stagiaire développeur", "alternance IA",
            "VIE informatique", "computer vision intern",
            "deep learning junior", "AI engineer intern"
        ]
        self.locations = ["France", "Remote", "United Kingdom", "Netherlands"]

    async def search_jobs(self) -> List[Dict[str, Any]]:
        """
        Use LinkedIn Job Search via Playwright scraping
        to find Easy Apply jobs matching candidate profile.
        """
        async with async_playwright() as p:
            # Reusing non-headless for login if needed, or headless for scrape
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                viewport={'width': 1280, 'height': 800},
                user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
            )
            
            # Load session if exists
            if os.path.exists("linkedin_session.json"):
                await context.add_cookies(json.load(open("linkedin_session.json")))

            page = await context.new_page()

            try:
                # Login if needed
                await self._login(page)

                all_jobs = []
                for keyword in self.keywords[:3]: # Limit to first 3 for now to avoid ban
                    for location in self.locations[:2]:
                        url = (
                            f"https://www.linkedin.com/jobs/search/"
                            f"?keywords={keyword.replace(' ', '%20')}"
                            f"&location={location}"
                            f"&f_AL=true"   # Easy Apply filter
                            f"&f_E=1,2"     # Entry level + Internship
                            f"&sortBy=DD"   # Most recent
                        )
                        print(f"Searching LinkedIn: {keyword} in {location}")
                        await page.goto(url, wait_until="networkidle")
                        await asyncio.sleep(random.uniform(2, 4))
                        
                        # Extract job cards
                        cards = await page.query_selector_all(".job-card-container") or await page.query_selector_all(".jobs-search__results-list li")
                        
                        for card in cards[:10]: # max 10 per category during dev
                            job = await self._extract_job_card(card)
                            if job and job["has_easy_apply"]:
                                all_jobs.append(job)
                                
                        await asyncio.sleep(random.uniform(5, 10)) # Anti-bot delay

                return self._deduplicate(all_jobs)
            except Exception as e:
                print(f"LinkedIn Discovery Error: {e}")
                return []
            finally:
                await browser.close()

    async def _login(self, page):
        """Login once per session"""
        await page.goto("https://www.linkedin.com/login")
        if await page.query_selector("#username"):
            await page.fill("#username", self.email)
            await page.fill("#password", self.password)
            await page.click('[type="submit"]')
            await page.wait_for_url("**/feed/**", timeout=15000)
            
            # Save session
            cookies = await page.context.cookies()
            with open("linkedin_session.json", "w") as f:
                json.dump(cookies, f)

    async def _extract_job_card(self, card) -> Dict[str, Any] or None:
        try:
            title_elem = await card.query_selector(".job-card-list__title") or await card.query_selector("h3")
            company_elem = await card.query_selector(".job-card-container__company-name") or await card.query_selector(".job-card-container__primary-description")
            location_elem = await card.query_selector(".job-card-container__metadata-item")
            easy_apply_elem = await card.query_selector(".job-card-container__apply-method") or await card.query_selector(".job-card-container__footer-item")

            title = await title_elem.inner_text() if title_elem else ""
            company = await company_elem.inner_text() if company_elem else ""
            location = await location_elem.inner_text() if location_elem else ""
            ea_text = await easy_apply_elem.inner_text() if easy_apply_elem else ""

            if not title: return None

            return {
                "id": f"linkedin-{hash(title+company)}",
                "title": title.strip(),
                "company": company.strip(),
                "location": location.strip(),
                "source": "linkedin",
                "country": "FR" if "France" in location else "US", # Simple detect
                "has_easy_apply": "Easy Apply" in ea_text,
                "url": await (await card.query_selector("a")).get_attribute("href") if await card.query_selector("a") else ""
            }
        except:
            return None

    def _deduplicate(self, jobs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        seen = set()
        unique = []
        for j in jobs:
            if j["id"] not in seen:
                unique.append(j)
                seen.add(j["id"])
        return unique

linkedin_discovery = LinkedInDiscovery()
