from http.server import BaseHTTPRequestHandler
import json
import urllib.request
import urllib.parse

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length).decode('utf-8')
            payload = json.loads(post_data)
            
            lat = payload.get('lat')
            lon = payload.get('lon')
            radius = payload.get('radius', 10000)
            
            if not lat or not lon:
                raise ValueError("Missing 'lat' or 'lon'")
                
            overpass_query = f"""
            [out:json];
            node["tourism"="hotel"](around:{radius},{lat},{lon});
            out body;
            """
            
            url = "https://overpass-api.de/api/interpreter"
            req = urllib.request.Request(url, data=overpass_query.encode('utf-8'), headers={'Content-Type': 'text/plain', 'User-Agent': 'AI-Hotel-Revenue-Copilot/1.0'})
            
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
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
