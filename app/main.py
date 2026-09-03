import os
import time
from datetime import datetime, timedelta
from dotenv import load_dotenv

from app.db import init_db
from app.engine import process_hotel

# Load environment variables
load_dotenv()

def run_job():
    print(f"Starting Market Monitoring Job at {datetime.now()}")
    init_db()
    
    # Mock portfolio of hotels managed by the agency
    portfolio = [
        {"id": "Hotel_Alpha_Delhi", "location": "Delhi NCR", "current_rate": 3800},
        {"id": "Hotel_Beta_Blr", "location": "Bengaluru", "current_rate": 4200},
        {"id": "Hotel_Gamma_Goa", "location": "Goa", "current_rate": 7500}
    ]
    
    # We look at dates in the immediate future (simulating a 30-day booking window)
    dates_to_monitor = [
        (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d"),
        (datetime.now() + timedelta(days=5)).strftime("%Y-%m-%d")
    ]
    
    for hotel in portfolio:
        for target_date in dates_to_monitor:
            process_hotel(
                hotel_id=hotel["id"],
                location=hotel["location"],
                target_date=target_date,
                current_hotel_rate=hotel["current_rate"]
            )
            time.sleep(1) # Rate limit / politeness delay

    print(f"\nMonitoring Job completed at {datetime.now()}")

if __name__ == "__main__":
    run_job()
