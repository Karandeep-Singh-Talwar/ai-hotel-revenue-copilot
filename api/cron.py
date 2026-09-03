from http.server import BaseHTTPRequestHandler
import sys
import os
import json
import io

# Add project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.main import run_job

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Capture standard output so we can return it to the frontend
        old_stdout = sys.stdout
        sys.stdout = my_stdout = io.StringIO()
        
        try:
            run_job()
            
            # Restore stdout
            sys.stdout = old_stdout
            output = my_stdout.getvalue()
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response_data = {
                "status": "success",
                "message": "Monitoring job executed",
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
