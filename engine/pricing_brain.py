"""
Direct entrypoint proxy for pricing_brain.py
"""
import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from forecasting.pricing_brain import execute_pricing_engine, PricingEngineBrain

if __name__ == "__main__":
    from forecasting.pricing_brain import *
    import argparse
    parser = argparse.ArgumentParser(description="Predictive Pricing Brain")
    parser.add_argument("--hotel-id", type=int, default=1)
    parser.add_argument("--agency-id", type=str, default="a0000000-0000-0000-0000-000000000001")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    result = execute_pricing_engine(hotel_id=args.hotel_id, agency_id=args.agency_id, dry_run=args.dry_run)
    import json
    print(json.dumps(result, indent=2))
