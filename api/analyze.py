from http.server import BaseHTTPRequestHandler
import json
import sys
import os
import io

# Add project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from engine.main import run_analysis_with_context

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        payload = json.loads(post_data)
        
        # Capture standard output so we can stream it to the frontend logs
        old_stdout = sys.stdout
        sys.stdout = my_stdout = io.StringIO()
        
        try:
            # Payload expected: { hotelName, competitors, whatsapp, pmsData: { occupancy, revpar } }
            run_analysis_with_context(payload)
            
            # Restore stdout
            sys.stdout = old_stdout
            output = my_stdout.getvalue()
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response_data = {
                "status": "success",
                "message": "Analysis job executed",
                "logs": output
            }
            self.wfile.write(json.dumps(response_data).encode('utf-8'))
            
        except Exception as e:
            sys.stdout = old_stdout
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
