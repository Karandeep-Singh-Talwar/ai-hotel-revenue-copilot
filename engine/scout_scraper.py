"""
Direct entrypoint proxy for scout_scraper.py
"""
import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from scrapers.scout_scraper import execute_scout_cycle, OTARateScout

if __name__ == "__main__":
    from scrapers.scout_scraper import *
    import argparse
    parser = argparse.ArgumentParser(description="Competitor Rate Scraper")
    parser.add_argument("--hotel-id", type=int, default=1)
    parser.add_argument("--agency-id", type=str, default="a0000000-0000-0000-0000-000000000001")
    parser.add_argument("--days", type=int, default=2)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    result = execute_scout_cycle(hotel_id=args.hotel_id, agency_id=args.agency_id, days_ahead=args.days, dry_run=args.dry_run)
    print(result)
