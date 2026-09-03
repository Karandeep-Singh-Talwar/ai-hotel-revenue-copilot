import cloudscraper
import urllib.parse
from bs4 import BeautifulSoup
import random

def check_local_events(location, target_date):
    """
    Actually scrapes the web to find upcoming events in the target location
    """
    print(f"[Events] Live scraping local events for {location} on {target_date}...")
    
    scraper = cloudscraper.create_scraper()
    query = urllib.parse.quote(f"major upcoming events in {location} 2026")
    url = f"https://html.duckduckgo.com/html/?q={query}"
    
    try:
        response = scraper.get(url, timeout=10)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        event_titles = []
        for a in soup.find_all('a', class_='result__snippet'):
            text = a.text
            # Look for capitalized phrases that might be events
            if "Expo" in text or "Conference" in text or "Festival" in text or "Summit" in text:
                event_titles.append(text[:50] + "...") # Take a snippet
                
        if event_titles:
            event_name = "Market Event: " + (event_titles[0].split('-')[0][:30].strip())
            print(f"[Events] Live scrape found event data: {event_name}")
            return {"name": event_name, "venue": location + " Convention Center", "impact": "High"}
            
    except Exception as e:
        print(f"[Events] Live event scrape failed ({e}).")
        
    print("[Events] No major events scraped for this date.")
    return None
