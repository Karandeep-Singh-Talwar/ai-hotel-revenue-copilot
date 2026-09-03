import sqlite3
import os
from datetime import datetime

DB_PATH = os.getenv("DB_PATH", "/tmp/hotel_intelligence.db" if os.getenv("VERCEL") else "hotel_intelligence.db")

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS market_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            target_hotel_id TEXT,
            target_date TEXT,
            median_price REAL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

def get_last_median(target_hotel_id, target_date):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT median_price FROM market_data
        WHERE target_hotel_id = ? AND target_date = ?
        ORDER BY timestamp DESC LIMIT 1
    ''', (target_hotel_id, target_date))
    row = cursor.fetchone()
    conn.close()
    return row[0] if row else None

def save_median(target_hotel_id, target_date, median_price):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO market_data (target_hotel_id, target_date, median_price)
        VALUES (?, ?, ?)
    ''', (target_hotel_id, target_date, median_price))
    conn.commit()
    conn.close()
