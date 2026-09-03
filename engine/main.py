import os
from datetime import datetime, timedelta
import random

from engine.scraper import get_competitor_prices
from engine.events import check_local_events
from engine.db import get_last_median, save_median, init_db
from engine.notifier import send_whatsapp_alert

def calculate_anomaly(current_prices, last_median):
    if not current_prices:
        return None, 0.0
    
    current_prices.sort()
    current_median = current_prices[len(current_prices) // 2]
    shift_pct = ((current_median - last_median) / last_median) * 100
    return current_median, shift_pct

def run_analysis_with_context(payload):
    init_db()
    
    hotel_name = payload.get("hotelName", "Unknown Hotel")
    competitors = payload.get("competitors", [])
    pms_data = payload.get("pmsData", {})
    occupancy = pms_data.get("occupancy", 0)
    target_date_str = (datetime.now() + timedelta(days=14)).strftime("%Y-%m-%d")
    
    print(f"=== INITIALIZING AI REVENUE ANALYST ===")
    print(f"Target: {hotel_name} | Date: {target_date_str}")
    print(f"PMS Data context: Occupancy = {occupancy}%")
    print(f"Competitor Set: {', '.join(competitors)}")
    
    event_data = check_local_events("Delhi", target_date_str)
    prices = get_competitor_prices(hotel_name, target_date_str)
    last_median = get_last_median(hotel_name, target_date_str)
    current_median, shift_pct = calculate_anomaly(prices, last_median)
    
    if current_median:
        save_median(hotel_name, target_date_str, current_median)
        print(f"Historical Baseline: ₹{last_median:,.2f}")
        print(f"Current Market Median: ₹{current_median:,.2f} ({shift_pct:+.2f}%)")
        
        action = "HOLD"
        reason = "Market is stable."
        
        if shift_pct < -5.0:
            if occupancy > 80:
                action = "HOLD"
                reason = f"Competitors dropped prices by {abs(shift_pct):.1f}%, but your occupancy is strong at {occupancy}%. Do not dilute ADR."
            else:
                action = "DROP"
                reason = f"Competitors dropped prices by {abs(shift_pct):.1f}% and occupancy is low ({occupancy}%). Match market to stimulate pickup."
        elif shift_pct > 5.0 or (event_data and event_data["impact"] == "High"):
            if occupancy > 60:
                action = "RAISE"
                reason = f"Market prices surged by {shift_pct:.1f}% and occupancy is {occupancy}%. High demand detected. Push rate."
            else:
                action = "HOLD"
                reason = f"Market prices surging, but your occupancy is only {occupancy}%. Hold to capture spillover demand before raising."
                
        alert_msg = f"""🏨 *{hotel_name} AI Alert*
📅 Date: {target_date_str}

*Market Shift Detected!*
• Competitor Median: ₹{current_median:,.0f} ({shift_pct:+.1f}%)
• PMS Occupancy: {occupancy}%
{f'• Event Driver: {event_data["name"]}' if event_data else ''}

*AI Recommendation:*
👉 *{action} RATE*: {reason}"""

        send_whatsapp_alert(alert_msg)
        
        return {
            "currentMedian": current_median,
            "baseline": last_median,
            "shiftPct": shift_pct,
            "action": action,
            "reason": reason,
            "alertMsg": alert_msg,
            "event": event_data["name"] if event_data else None
        }
    else:
        print("No valid competitor prices found. Aborting analysis.")
        return None

def run_job():
    run_analysis_with_context({
        "hotelName": "Taj Mahal Delhi",
        "competitors": ["Oberoi", "Leela"],
        "pmsData": {"occupancy": random.randint(40, 95)}
    })

if __name__ == "__main__":
    run_job()
