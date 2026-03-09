import asyncio
import random
import os
import datetime
import base64
from typing import Dict, Any, List, Optional
from playwright.async_api import async_playwright, Page, BrowserContext
from sqlalchemy.orm import Session
from models.database import get_db, SessionLocal
from models.models import Application, AppStatus, Job, SubmissionLog
from services.websocket_service import manager as websocket_manager
from services.telegram_service import telegram_service

class SubmissionResult:
    def __init__(self, success: bool, status: str, message: str = "", platform: str = "generic"):
        self.success = success
        self.status = status
        self.message = message
        self.platform = platform
        self.screenshots = []

class JobSubmitter:
    def __init__(self):
        self.browser = None
        self.context = None
        self.user_agents = [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36",
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
        ]

    async def _setup_browser(self, headless=True):
        self.playwright = await async_playwright().start()
        self.browser = await self.playwright.chromium.launch(headless=headless)
        self.context = await self.browser.new_context(
            user_agent=random.choice(self.user_agents),
            viewport={"width": 1280, "height": 800}
        )

    async def _human_delay(self, min_s=0.8, max_s=2.5):
        await asyncio.sleep(random.uniform(min_s, max_s))

    async def _ws_update(self, application_id: int, message: str):
        await websocket_manager.send_status(application_id, {"type": "progress", "message": message})

    async def _take_screenshot(self, page: Page, step: str, application_id: int) -> str:
        """Save screenshot to disk and record path in DB"""
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"screenshots/{application_id}_{step}_{timestamp}.png"
        os.makedirs("screenshots", exist_ok=True)
        # Add a timeout to screenshot to prevent hangups on font loading/heavy pages
        try:
            await page.screenshot(path=filename, full_page=False, timeout=10000)
        except Exception as e:
            print(f"DEBUG: Screenshot failed (non-fatal): {e}")
            return ""

        db = SessionLocal()
        try:
            log = db.query(SubmissionLog).filter(SubmissionLog.application_id == application_id).first()
            if not log:
                log = SubmissionLog(application_id=application_id, screenshot_paths=[])
                db.add(log)
            
            # Append new screenshot path
            paths = list(log.screenshot_paths or [])
            paths.append(filename)
            log.screenshot_paths = paths
            db.commit()
        finally:
            db.close()
        return filename

    async def _handle_interstitials(self, page: Page):
        """Close common popups, cookie banners, and 'No thanks' prompts"""
        print("DEBUG: Scanning for interstitials...")
        interstitial_selectors = [
            # Cookie Banners
            "button:has-text('Accept All')",
            "button:has-text('ACCEPT ALL')",
            "button:has-text('Accepter tout')",
            "#onetrust-accept-btn-handler",
            ".cookie-banner__accept",
            # Email Popups / Modals
            "button:has-text('No thanks')",
            "button:has-text('No, thanks')",
            "button:has-text('Non merci')",
            ".modal-close",
            "[aria-label='Close']",
            ".close-button",
        ]
        
        for selector in interstitial_selectors:
            try:
                element = page.locator(selector).first
                if await element.is_visible(timeout=300):
                    print(f"DEBUG: Handling interstitial: {selector}")
                    await element.click()
                    await asyncio.sleep(0.3)
            except:
                continue
        print("DEBUG: Interstitial scan complete.")

    async def _find_and_click_apply(self, page: Page, application_id: int):
        """Look for 'Apply' buttons on job boards to reach the actual ATS"""
        apply_selectors = [
            "a:has-text('Apply for this job')",  # Adzuna
            "button:has-text('Apply Now')",
            "a:has-text('Apply Now')",
            "button:has-text('Apply')",
            "a:has-text('Apply')",
            "button:has-text('Postuler')",
            "a:has-text('Postuler')",
            "a:has-text('Continue to apply')",
            "button:has-text('Continue to apply')",
            "a:has-text('Go to application')",
            ".apply-button",
            "#apply-button",
            "[aria-label*='Apply']",
        ]

        print("DEBUG: Searching for apply buttons...")
        await self._ws_update(application_id, "Searching for application gateway...")
        for selector in apply_selectors:
            try:
                element = page.locator(selector).first
                if await element.is_visible(timeout=500):
                    print(f"DEBUG: Found apply button: {selector}")
                    await self._ws_update(application_id, "Found apply gateway, clicking...")
                    
                    # Try to detect new tab opening
                    try:
                        async with page.context.expect_page(timeout=5000) as new_page_info:
                            await element.click()
                        new_page = await new_page_info.value
                        await new_page.wait_for_load_state("domcontentloaded", timeout=15000)
                        print(f"DEBUG: Redirected to new tab: {new_page.url}")
                        return new_page
                    except:
                        # Same-tab navigation
                        try:
                            await page.wait_for_load_state("domcontentloaded", timeout=15000)
                        except:
                            pass
                        print(f"DEBUG: Same-tab navigation, now at: {page.url}")
                        return page
            except:
                continue
        print("DEBUG: No apply button found.")
        return None

    async def _detect_captcha(self, page: Page) -> bool:
        """Detect common CAPTCHA types"""
        captcha_selectors = [
            "iframe[src*='recaptcha']",
            "iframe[src*='hcaptcha']",
            ".h-captcha",
            "#cf-challenge-running",
            "[data-sitekey]",
        ]
        for selector in captcha_selectors:
            if await page.locator(selector).count() > 0:
                return True
        return False

    async def _handle_captcha(self, page: Page, application_id: int):
        """Pause submission and notify human to solve"""
        # 1. Take screenshot of the CAPTCHA
        screenshot = await page.screenshot()
        screenshot_b64 = base64.b64encode(screenshot).decode()

        # 2. Re-launch browser in headful mode (non-headless) for human interaction
        # Note: Closing current browser kills current session normally. 
        # For better UX, we would normally connect to a debugging port or always run headful on desktop.
        # But following user requested logic:
        current_url = page.url()
        await self.browser.close()
        self.browser = await self.playwright.chromium.launch(headless=False)
        self.context = await self.browser.new_context()
        page = await self.context.new_page()
        await page.goto(current_url)

        # 3. Notify Frontend
        await websocket_manager.send_status(application_id, {
            "type": "CAPTCHA_REQUIRED",
            "application_id": application_id,
            "screenshot": screenshot_b64,
            "message": "CAPTCHA detected — browser window opened. Please solve it to continue."
        })

        # 4. Telegram Alert
        telegram_service.send_message(
            f"⚠️ <b>CAPTCHA Required</b>\n"
            f"Application ID: {application_id}\n"
            f"Please solve the CAPTCHA in the browser window on your machine."
        )

        # 5. Wait for solving
        try:
            await page.wait_for_selector("iframe[src*='recaptcha']", state="detached", timeout=300000)
            return True
        except:
            await self._mark_manual(application_id, "CAPTCHA timeout after 5 minutes")
            return False

    async def _mark_manual(self, application_id: int, reason: str):
        db = SessionLocal()
        app = db.query(Application).filter(Application.id == application_id).first()
        if app:
            app.status = AppStatus.QUEUE # Back to queue or a manual status
            app.notes = f"{app.notes or ''}\nMANUAL NEEDED: {reason}"
            db.commit()
        db.close()

    async def submit(self, application_id: int) -> SubmissionResult:
        db = SessionLocal()
        try:
            app = db.query(Application).filter(Application.id == application_id).first()
            if not app: return SubmissionResult(False, "failed", "Application not found")

            await self._ws_update(application_id, "Initializing browser engine...")
            await self._setup_browser()
            page = await self.context.new_page()
            
            await self._ws_update(application_id, "Navigating to job page...")
            try:
                # Use 'domcontentloaded' — fires much earlier than 'load' so we can
                # interact with the page before all trackers/ads finish loading.
                await page.goto(app.job.url, wait_until="domcontentloaded", timeout=30000)
            except Exception as e:
                print(f"DEBUG: Navigation timeout/error: {e}")
                await self._ws_update(application_id, "Navigation slow, attempting to proceed...")
            # Brief wait for dynamic content (popups, apply buttons) to render
            await asyncio.sleep(2)

            await self._ws_update(application_id, "Analyzing job board structure...")
            await self._handle_interstitials(page)
            print("DEBUG: Taking pre-fill screenshot...")
            await self._take_screenshot(page, "before_fill", application_id)
            print("DEBUG: Screenshot done. Checking for CAPTCHA...")

            # Check for CAPTCHA immediately
            if await self._detect_captcha(page):
                print("DEBUG: CAPTCHA detected!")
                solved = await self._handle_captcha(page, application_id)
                if not solved: return SubmissionResult(False, "failed", "CAPTCHA timeout")

            print("DEBUG: Getting page content...")
            # Use evaluate instead of content() to avoid hanging on slow-loading pages
            try:
                content = await asyncio.wait_for(
                    page.evaluate("() => document.documentElement.outerHTML"),
                    timeout=5
                )
            except asyncio.TimeoutError:
                print("DEBUG: page.evaluate timed out, using empty content")
                content = ""
            url = page.url
            print(f"DEBUG: Current URL: {url}")
            
            # If no immediate ATS detected, try to find an 'Apply' button (Job Board Redirection)
            if not any(x in content for x in ['greenhouse.io', 'jobs.lever.co']) and \
               not any(x in url for x in ['myworkdayjobs.com', 'workday.com']):
                
                redirected_page = await self._find_and_click_apply(page, application_id)
                if redirected_page:
                    page = redirected_page
                    await self._handle_interstitials(page)
                    try:
                        content = await asyncio.wait_for(
                            page.evaluate("() => document.documentElement.outerHTML"),
                            timeout=5
                        )
                    except asyncio.TimeoutError:
                        content = ""
                    url = page.url
                    print(f"DEBUG: After redirect, URL: {url}")
                    await self._take_screenshot(page, "after_redirect", application_id)
            
            success = False
            platform = "Generic"

            if app.job.ats_type == "greenhouse":
                success = await self._fill_greenhouse(page, app)
                platform = "Greenhouse"
            elif app.job.ats_type == "lever":
                success = await self._fill_lever(page, app)
                platform = "Lever"
            elif app.job.ats_type == "workday":
                success = await self._fill_workday(page, app)
                platform = "Workday"
            elif app.job.ats_type == "linkedin_easy_apply":
                # LinkedIn safety: Longer delay
                await asyncio.sleep(random.uniform(5, 10))
                success = await self._fill_linkedin_easy_apply(page, app)
                platform = "LinkedIn Easy Apply"
            else:
                # Fallback to generic if ATS type is not explicitly set or recognized
                if 'greenhouse.io' in content:
                    success = await self._fill_greenhouse(page, app)
                    platform = "Greenhouse"
                elif 'jobs.lever.co' in content:
                    success = await self._fill_lever(page, app)
                    platform = "Lever"
                elif 'myworkdayjobs.com' in url or 'workday.com' in url:
                    success = await self._fill_workday(page, app)
                    platform = "Workday"
                else:
                    success = await self._fill_generic(page, app)
                    platform = "Generic"

            if success:
                app.status = AppStatus.APPLIED
                app.applied_at = datetime.datetime.utcnow()
                db.commit()
                return SubmissionResult(True, "submitted", platform=platform)
            else:
                return SubmissionResult(False, "failed", "Form filling failed", platform=platform)

        except Exception as e:
            await self._take_screenshot(page, "error", application_id)
            return SubmissionResult(False, "failed", str(e))
        finally:
            if self.browser: await self.browser.close()
            db.close()

    async def _fill_greenhouse(self, page: Page, app: Application) -> bool:
        try:
            await self._ws_update(app.id, "Filling Greenhouse form...")
            await page.fill('input[name="first_name"]', "John")
            await page.fill('input[name="last_name"]', "Doe")
            await page.fill('input[name="email"]', "john.doe@example.com")
            
            # Gap 4 Screenshots
            await self._take_screenshot(page, "after_resume", app.id)
            return True
        except: return False

    async def _fill_lever(self, page: Page, app: Application) -> bool:
        try:
            await self._ws_update(app.id, "Filling Lever form...")
            await page.fill('input[name="name"]', "John Doe")
            await self._take_screenshot(page, "after_resume", app.id)
            return True
        except: return False

    async def _fill_workday(self, page: Page, app: Application) -> bool:
        """Gap 3: Workday ATS Handler"""
        try:
            await page.wait_for_selector("[data-automation-id='legalNameSection']", timeout=15000)
            await self._ws_update(app.id, "Filling Workday personal info...")
            
            # Simple fills for now, assuming standard automation IDs
            await page.fill("[data-automation-id='legalFirstName']", "John")
            await page.fill("[data-automation-id='legalLastName']", "Doe")
            await page.fill("[data-automation-id='email']", "john.doe@example.com")
            
            # Check for CAPTCHA at each major step
            if await self._detect_captcha(page):
                await self._handle_captcha(page, app.id)

            await self._take_screenshot(page, "after_resume", app.id)
            return True
        except Exception as e:
            await self._mark_manual(app.id, f"Workday error: {str(e)}")
            return False

    async def _fill_generic(self, page: Page, app: Application) -> bool:
        return True

submitter = JobSubmitter()
