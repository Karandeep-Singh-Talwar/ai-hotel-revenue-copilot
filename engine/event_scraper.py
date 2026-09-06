"""
Direct entrypoint proxy for event_scraper.py
"""
import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from scrapers.event_scraper import execute_event_pipeline, EventScraperEngine

if __name__ == "__main__":
    from scrapers.event_scraper import *
    import argparse
    parser = argparse.ArgumentParser(description="Event Intelligence Scraper")
    parser.add_argument("--agency-id", type=str, default="a0000000-0000-0000-0000-000000000001")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    result = execute_event_pipeline(agency_id=args.agency_id, dry_run=args.dry_run)
    import json
    print(json.dumps(result, indent=2))
