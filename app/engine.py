import statistics
from app.db import get_last_median, save_median
from app.scraper import get_competitor_prices
from app.events import check_local_events
from app.notifier import send_whatsapp_alert

def calculate_median(prices):
    return statistics.median(prices)

def process_hotel(hotel_id, location, target_date, current_hotel_rate):
    """
    Core pipeline: Scrape -> Calculate Median -> Detect Anomaly -> Alert
    """
    print(f"\n--- Processing {hotel_id} for {target_date} ---")
    
    # 1. Get competitor prices
    prices = get_competitor_prices(hotel_id, target_date)
    current_median = calculate_median(prices)
    print(f"[Engine] Competitor Prices: {prices} | Median: Rs.{current_median}")
    
    # 2. Check for events
    event = check_local_events(location, target_date)
    
    # 3. Anomaly Detection
    last_median = get_last_median(hotel_id, target_date)
    
    if last_median is None:
        print(f"[Engine] No historical data for {target_date}. Saving baseline...")
        save_median(hotel_id, target_date, current_median)
        return
        
    shift_percentage = ((current_median - last_median) / last_median) * 100
    print(f"[Engine] Last Median: Rs.{last_median} | Shift: {shift_percentage:.2f}%")
    
    save_median(hotel_id, target_date, current_median)
    
    # 4. Alert Logic
    threshold = 5.0
    
    if abs(shift_percentage) >= threshold or event:
        alert_msg = f" *Market Alert for {hotel_id}* \n\n"
        alert_msg += f"Target Date: {target_date}\n"
        alert_msg += f"Your Current Rate: Rs.{current_hotel_rate}\n\n"
        
        if abs(shift_percentage) >= threshold:
            direction = "INCREASED" if shift_percentage > 0 else "DROPPED"
            alert_msg += f" *Competitor Price Shift:* Median competitor price has {direction} by {abs(shift_percentage):.1f}% (from Rs.{last_median} to Rs.{current_median}).\n"
            
        if event:
            alert_msg += f" *Demand Driver:* '{event['name']}' announced at {event['venue']}.\n"
            
        # Recommendation
        if shift_percentage >= threshold or event:
            recommended_rate = current_median + 200 # Premium for compression
            alert_msg += f"\n *Recommendation:* Increase your BAR to ~Rs.{recommended_rate} to capture market compression."
        elif shift_percentage <= -threshold:
            recommended_rate = current_median
            alert_msg += f"\n *Recommendation:* Consider matching market drop to ~Rs.{recommended_rate} to maintain booking velocity."
            
        send_whatsapp_alert(alert_msg)
    else:
        print("[Engine] Market is stable. No alert needed.")
