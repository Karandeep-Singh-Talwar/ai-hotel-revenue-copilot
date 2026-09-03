import os
from datetime import datetime, timedelta
import random

from engine.scraper import get_competitor_prices
from engine.events import check_local_events
from engine.db import get_last_median, save_median, init_db
from engine.notifier import send_whatsapp_alert

def calculate_anomaly(comp_data, last_median):
    if not comp_data:
        return None, 0.0
    
    prices = [c["price"] for c in comp_data]
    prices.sort()
    current_median = prices[len(prices) // 2]
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
    
    # Pass the actual competitor list to the scraper
    comp_data = get_competitor_prices(competitors, target_date_str)
    
    last_median = get_last_median(hotel_name, target_date_str)
    current_median, shift_pct = calculate_anomaly(comp_data, last_median)
    
    if current_median:
        save_median(hotel_name, target_date_str, current_median)
        print(f"Historical Baseline: ₹{last_median:,.2f}")
        print(f"Current Market Median: ₹{current_median:,.2f} ({shift_pct:+.2f}%)")
        
        action = "HOLD"
        reason = "Market is stable."
        
        # Build a structured reasoning chain for the Fact Check
        logic_steps = []
        logic_steps.append(f"Scraped {len(comp_data)} direct competitors for {target_date_str}.")
        logic_steps.append(f"Calculated Comp Set Median at ₹{current_median:,.0f} (Trailing Baseline: ₹{last_median:,.0f}).")
        
        if shift_pct < -5.0:
            logic_steps.append(f"Market Variance: Dropped by {abs(shift_pct):.1f}% (Triggers anomaly threshold).")
            if occupancy > 80:
                action = "HOLD"
                reason = f"Competitors dropped prices by {abs(shift_pct):.1f}%, but your occupancy is strong at {occupancy}%. Do not dilute ADR."
                logic_steps.append(f"PMS Check: Internal Occupancy is {occupancy}% (>80%).")
                logic_steps.append("Conclusion: Yield constraint active. Reject market drop. Hold rate.")
            else:
                action = "DROP"
                reason = f"Competitors dropped prices by {abs(shift_pct):.1f}% and occupancy is low ({occupancy}%). Match market to stimulate pickup."
                logic_steps.append(f"PMS Check: Internal Occupancy is {occupancy}% (<80%).")
                logic_steps.append("Conclusion: Need volume. Match competitor rate drop.")
        elif shift_pct > 5.0 or (event_data and event_data["impact"] == "High"):
            if shift_pct > 5.0:
                logic_steps.append(f"Market Variance: Surged by {shift_pct:.1f}% (Triggers anomaly threshold).")
            if event_data and event_data["impact"] == "High":
                logic_steps.append(f"External Data: High-impact local event detected ('{event_data['name']}').")
                
            if occupancy > 60:
                action = "RAISE"
                reason = f"Market prices surged by {shift_pct:.1f}% and occupancy is {occupancy}%. High demand detected. Push rate."
                logic_steps.append(f"PMS Check: Internal Occupancy is {occupancy}% (>60%).")
                logic_steps.append("Conclusion: High compression. Raise rate to maximize yield.")
            else:
                action = "HOLD"
                reason = f"Market prices surging, but your occupancy is only {occupancy}%. Hold to capture spillover demand before raising."
                logic_steps.append(f"PMS Check: Internal Occupancy is {occupancy}% (<60%).")
                logic_steps.append("Conclusion: Insufficient base loading. Hold rate to absorb market spillover.")
        else:
            logic_steps.append(f"Market Variance: {shift_pct:+.1f}% (Within standard bounds).")
            logic_steps.append("Conclusion: No anomaly detected. Maintain current strategy.")
                
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
            "event": event_data["name"] if event_data else None,
            "compData": comp_data,
            "logicSteps": logic_steps
        }
    else:
        print("No valid competitor prices found. Aborting analysis.")
        return None

def run_job():
    run_analysis_with_context({
        "hotelName": "Taj Mahal Delhi",
        "competitors": ["Oberoi", "Leela", "ITC Maurya"],
        "pmsData": {"occupancy": random.randint(40, 95)}
    })

if __name__ == "__main__":
    run_job()
