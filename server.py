#!/usr/bin/env python3
"""
Aesthetic Hello World Web Server
Zero-dependency HTTP and REST API server powered by Python's built-in standard library.
"""

import json
import os
import sys
import time
from datetime import datetime
from http.server import HTTPServer, SimpleHTTPRequestHandler
import urllib.parse

PORT = 8000
START_TIME = time.time()

# In-memory storage for interactive greetings and stats
STATS = {
    "visits": 0,
    "likes": 42,
    "greetings_sent": 0
}

GREETINGS = [
    {"name": "Ada Lovelace", "message": "Hello from the dawn of programming!", "timestamp": "1843-12-10 12:00:00", "avatar": "🌟"},
    {"name": "Alan Turing", "message": "Greetings to the machines that think.", "timestamp": "1950-06-23 09:15:00", "avatar": "⚡"},
    {"name": "Brian Kernighan", "message": "The only way to learn a new language is to write programs in it. hello, world!", "timestamp": "1974-05-01 10:30:00", "avatar": "🚀"}
]

class AestheticAppHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=os.path.dirname(os.path.abspath(__file__)), **kwargs)

    def do_GET(self):
        parsed_path = urllib.parse.urlparse(self.path)
        
        if parsed_path.path == "/api/status":
            self.handle_api_status()
        elif parsed_path.path == "/api/greetings":
            self.handle_api_greetings()
        elif parsed_path.path == "/api/stats":
            self.handle_api_stats()
        else:
            # Increment visit counter on root HTML requests
            if parsed_path.path in ["/", "/index.html"]:
                STATS["visits"] += 1
            # Serve static files (HTML, CSS, JS, etc.)
            super().do_GET()

    def do_POST(self):
        parsed_path = urllib.parse.urlparse(self.path)
        
        if parsed_path.path == "/api/like":
            STATS["likes"] += 1
            self._send_json({"success": True, "likes": STATS["likes"]})
            
        elif parsed_path.path == "/api/greet":
            content_length = int(self.headers.get("Content-Length", 0))
            post_data = self.rfile.read(content_length).decode("utf-8")
            try:
                data = json.loads(post_data)
                name = (data.get("name") or "Anonymous Explorer").strip()[:40]
                message = (data.get("message") or "Hello, World!").strip()[:200]
                avatar = data.get("avatar") or "✨"
                
                new_entry = {
                    "name": name,
                    "message": message,
                    "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "avatar": avatar
                }
                GREETINGS.insert(0, new_entry)
                if len(GREETINGS) > 50:
                    GREETINGS.pop()
                
                STATS["greetings_sent"] += 1
                self._send_json({"success": True, "greeting": new_entry, "total": len(GREETINGS)})
            except Exception as e:
                self._send_json({"error": str(e)}, status=400)
        else:
            self._send_json({"error": "Endpoint not found"}, status=404)

    def handle_api_status(self):
        uptime_seconds = round(time.time() - START_TIME, 1)
        data = {
            "status": "online",
            "message": "Hello World Backend Active",
            "uptime_seconds": uptime_seconds,
            "server_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC"),
            "python_version": sys.version.split()[0],
            "stats": STATS
        }
        self._send_json(data)

    def handle_api_greetings(self):
        self._send_json({"greetings": GREETINGS})

    def handle_api_stats(self):
        self._send_json(STATS)

    def _send_json(self, data, status=200):
        response_bytes = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(response_bytes)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.end_headers()
        self.wfile.write(response_bytes)

    def log_message(self, format, *args):
        # Clean logging format
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {format % args}")

def run_server(port=PORT):
    for candidate_port in [port, 8080, 5000, 3000, 8081, 8888]:
        try:
            server_address = ("127.0.0.1", candidate_port)
            httpd = HTTPServer(server_address, AestheticAppHandler)
            print("=" * 60)
            print(f" ✨ Aesthetic 'Hello World' App is live!")
            print(f" 🌐 URL: http://localhost:{candidate_port}")
            print(f" 📡 API Status: http://localhost:{candidate_port}/api/status")
            print("=" * 60)
            sys.stdout.flush()
            try:
                httpd.serve_forever()
            except KeyboardInterrupt:
                print("\n👋 Server gracefully stopped.")
                httpd.server_close()
            return
        except OSError as e:
            if e.errno == 48: # Address already in use
                continue
            raise e
    print("❌ Error: Could not find an open port.")

if __name__ == "__main__":
    port = PORT
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            pass
    run_server(port)
