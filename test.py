import requests
import json

url = "https://hotel-revenue-copilot.vercel.app/api/analyze"
payload = {
    "hotelName": "Taj Mahal",
    "competitors": ["Oberoi", "Leela"],
    "pmsData": {"occupancy": 85}
}
headers = {'Content-Type': 'application/json'}

try:
    response = requests.post(url, json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
