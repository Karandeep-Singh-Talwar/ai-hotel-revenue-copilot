import random

def get_competitor_prices(hotel_id, target_date):
    """
    Mock function to simulate scraping 5 competitors on OTAs.
    In a real app, this would use ScrapeBadger/Scrapfly to bypass TLS fingerprinting.
    """
    print(f"[Scraper] Fetching competitor prices for {hotel_id} on {target_date}...")
    
    # Simulating a sudden price drop or increase randomly for the demo
    base_price = 4000
    shift_scenario = random.choice(["normal", "normal", "normal", "drop", "surge"])
    
    if shift_scenario == "drop":
        base_price = 3500  # competitors dropped prices
    elif shift_scenario == "surge":
        base_price = 4800  # competitors raised prices
        
    prices = [
        base_price + random.randint(-200, 200),
        base_price + random.randint(-150, 250),
        base_price + random.randint(-300, 100),
        base_price + random.randint(-50, 150),
        base_price + random.randint(-100, 300)
    ]
    
    return prices
