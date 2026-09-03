import cloudscraper
import re
from bs4 import BeautifulSoup
import urllib.parse

def test_ddg():
    scraper = cloudscraper.create_scraper()
    query = urllib.parse.quote("Taj Mahal Hotel New Delhi price per night INR")
    url = f"https://html.duckduckgo.com/html/?q={query}"
    response = scraper.get(url)
    print(f"Status: {response.status_code}")
    soup = BeautifulSoup(response.text, 'html.parser')
    prices = []
    
    # Extract numbers from result snippets
    for a in soup.find_all('a', class_='result__snippet'):
        text = a.text.replace(',', '').replace('₹', '').replace('Rs', '')
        # Look for typical price patterns like 15000, 12000
        matches = re.findall(r'\b\d{4,5}\b', text)
        for m in matches:
            val = int(m)
            if 3000 < val < 50000: # realistic price range
                prices.append(val)
    print(f"Extracted possible prices: {prices}")

test_ddg()
