import os
import httpx
from dotenv import load_dotenv

load_dotenv()

APP_ID = os.getenv("ADZUNA_APP_ID")
APP_KEY = os.getenv("ADZUNA_APP_KEY")

async def test_india_discovery():
    try:
        url = f"https://api.adzuna.com/v1/api/jobs/in/search/1"
        params = {
            "app_id": APP_ID,
            "app_key": APP_KEY,
            "results_per_page": 5,
            "what": "software engineer",
            "content-type": "application/json"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params)
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                results = data.get("results", [])
                print(f"Found {len(results)} jobs in India")
                for job in results:
                    print(f"- {job.get('title')} at {job.get('company', {}).get('display_name')}")
            else:
                print(f"Error: {response.text}")
    except Exception as e:
        print(f"Failed: {e}")

if __name__ == "__main__":
    import asyncio
    asyncio.run(test_india_discovery())
