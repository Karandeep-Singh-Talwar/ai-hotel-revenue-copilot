from http.server import BaseHTTPRequestHandler
import json
import urllib.request
import urllib.parse

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            # Parse query parameters manually
            path = self.path
            query_string = path.split('?')[1] if '?' in path else ''
            params = urllib.parse.parse_qs(query_string)
            
            hotel_name = params.get('q', [''])[0]
            if not hotel_name:
                raise ValueError("Missing 'q' parameter")
                
            url = f"https://nominatim.openstreetmap.org/search?format=json&q={urllib.parse.quote(hotel_name)}&limit=1"
            
            req = urllib.request.Request(url, headers={'User-Agent': 'AI-Hotel-Revenue-Copilot/1.0'})
            with urllib.request.urlopen(req) as response:
                data = json.loads(response.read().decode('utf-8'))
                
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(data).encode('utf-8'))
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
