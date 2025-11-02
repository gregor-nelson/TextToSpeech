#!/usr/bin/env python3
"""
TTS Web Server - Subdirectory Version
Optimized for running as subdirectory of existing domain
"""

import os
import sys
import time
import tempfile
import asyncio
import uuid
import threading
from pathlib import Path
import logging
from logging.handlers import RotatingFileHandler
import argparse

# Flask imports
from flask import Flask, request, jsonify, send_file, render_template
from flask_cors import CORS
import edge_tts

class TTSWebServer:
    def __init__(self, host='127.0.0.1', port=9001, debug=False, url_prefix='/'):
        self.host = host
        self.port = port
        self.debug = debug
        self.url_prefix = url_prefix.rstrip('/')
        
        # Setup logging
        self.setup_logging()
        
        # Setup Flask app
        self.setup_flask_app()
        
        # Setup cleanup
        self.setup_cleanup()
        
        self.logger.info(f"TTS Server initialized on {host}:{port} with prefix '{self.url_prefix}'")

    def setup_logging(self):
        """Setup logging configuration"""
        log_dir = Path('/var/log/tts-server')
        log_dir.mkdir(exist_ok=True)
        
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger('tts-server')
        
        # File handler with rotation
        file_handler = RotatingFileHandler(
            log_dir / 'tts-server.log',
            maxBytes=10*1024*1024,  # 10MB
            backupCount=5
        )
        file_handler.setFormatter(logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        ))
        self.logger.addHandler(file_handler)
        
        # Console handler for systemd journal
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(logging.Formatter(
            '%(asctime)s - %(levelname)s - %(message)s'
        ))
        self.logger.addHandler(console_handler)

    def setup_flask_app(self):
        """Setup Flask application"""
        # Get the directory where this script is located
        app_dir = Path(__file__).parent.absolute()
        
        self.app = Flask(__name__, 
                        static_folder=str(app_dir / 'static'),
                        template_folder=str(app_dir / 'templates'),
                        static_url_path='/static')
        
        # Configure URL prefix if provided
        if self.url_prefix:
            self.app.config['APPLICATION_ROOT'] = self.url_prefix
            
        # Add context processor to handle URL prefixes in templates
        @self.app.context_processor
        def inject_url_prefix():
            return {'url_prefix': self.url_prefix}
            
        CORS(self.app)
        
        # Disable Flask's default logging in production
        if not self.debug:
            log = logging.getLogger('werkzeug')
            log.setLevel(logging.ERROR)
        
        # Store temporary audio files
        self.TEMP_DIR = Path(tempfile.gettempdir()) / "tts_server"
        self.TEMP_DIR.mkdir(exist_ok=True)
        
        self.logger.info(f"Temp directory: {self.TEMP_DIR}")
        
        # Setup routes
        self.setup_routes()

    def setup_cleanup(self):
        """Start cleanup thread for old files"""
        cleanup_thread = threading.Thread(target=self.cleanup_old_files, daemon=True)
        cleanup_thread.start()
        self.logger.info("Cleanup thread started")

    def cleanup_old_files(self):
        """Remove audio files older than 1 hour"""
        while True:
            try:
                current_time = time.time()
                cleaned = 0
                for file_path in self.TEMP_DIR.glob("*.mp3"):
                    if current_time - file_path.stat().st_mtime > 3600:  # 1 hour
                        file_path.unlink(missing_ok=True)
                        cleaned += 1
                
                if cleaned > 0:
                    self.logger.info(f"Cleaned up {cleaned} old audio files")
                    
            except Exception as e:
                self.logger.error(f"Cleanup error: {e}")
            
            time.sleep(300)  # Run every 5 minutes

    def setup_routes(self):
        """Setup all Flask routes"""
        
        @self.app.route('/')
        def index():
            return render_template('index.html')

        @self.app.route('/health')
        def health_check():
            """Health check endpoint for monitoring"""
            return jsonify({
                "status": "healthy",
                "timestamp": time.time(),
                "temp_files": len(list(self.TEMP_DIR.glob("*.mp3"))),
                "version": "1.0.0",
                "url_prefix": self.url_prefix
            })

        @self.app.route('/api/voices')
        def get_voices():
            try:
                self.logger.info("Loading voices...")
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                try:
                    voices = loop.run_until_complete(edge_tts.list_voices())
                finally:
                    loop.close()
                
                # Prioritize English voices
                english_voices = [v for v in voices if v.get('Locale', '').startswith('en-')]
                other_voices = [v for v in voices if not v.get('Locale', '').startswith('en-')]
                result = english_voices + other_voices[:25]  # Limit for performance
                
                self.logger.info(f"Loaded {len(result)} voices")
                return jsonify(result)
                
            except Exception as e:
                self.logger.error(f"Voice loading error: {e}")
                return jsonify({"error": f"Failed to load voices: {str(e)}"}), 500

        @self.app.route('/api/synthesize', methods=['POST'])
        def synthesize_speech():
            client_ip = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)
            
            try:
                data = request.get_json()
                if not data:
                    return jsonify({"error": "No JSON data provided"}), 400
                    
                text = data.get('text', '').strip()
                voice = data.get('voice', 'en-US-AvaNeural')
                requested_speed = float(data.get('speed', 1.0))
                
                if not text:
                    return jsonify({"error": "No text provided"}), 400
                
                if len(text) > 10000:  # Limit text length
                    return jsonify({"error": "Text too long (max 10,000 characters)"}), 400
                
                # Log synthesis request
                self.logger.info(f"Synthesis request from {client_ip}: "
                               f"voice={voice}, speed={requested_speed}, "
                               f"text_length={len(text)}")
                
                # Calculate synthesis rate and browser playback rate
                if requested_speed <= 2.0:
                    synthesis_rate = int((requested_speed - 1.0) * 100)
                    browser_rate = 1.0
                else:
                    synthesis_rate = 100  # +100% = 2x
                    browser_rate = requested_speed / 2.0
                
                synthesis_rate = max(-50, min(100, synthesis_rate))
                
                audio_id = str(uuid.uuid4())
                audio_path = self.TEMP_DIR / f"{audio_id}.mp3"
                
                rate_str = f"+{synthesis_rate}%" if synthesis_rate >= 0 else f"{synthesis_rate}%"
                
                def run_synthesis():
                    synthesis_start = time.time()
                    try:
                        loop = asyncio.new_event_loop()
                        asyncio.set_event_loop(loop)
                        
                        async def generate_audio():
                            communicate = edge_tts.Communicate(text, voice, rate=rate_str)
                            await communicate.save(str(audio_path))
                        
                        loop.run_until_complete(generate_audio())
                        loop.close()
                        synthesis_time = time.time() - synthesis_start
                        return True, synthesis_time
                    except Exception as e:
                        self.logger.error(f"Synthesis error: {e}")
                        return False, 0
                
                success, synthesis_duration = run_synthesis()
                
                if not success or not audio_path.exists():
                    self.logger.error(f"Synthesis failed for request {audio_id}")
                    return jsonify({"error": "Speech synthesis failed"}), 500
                
                file_size = audio_path.stat().st_size
                chars_per_sec = len(text) / max(synthesis_duration, 0.1)
                
                self.logger.info(f"Synthesis successful: {audio_id}, "
                               f"size: {file_size} bytes, "
                               f"duration: {synthesis_duration:.2f}s, "
                               f"speed: {chars_per_sec:.1f} chars/sec")
                
                return jsonify({
                    "audio_id": audio_id,
                    "message": "Speech generated successfully",
                    "file_size": file_size,
                    "browser_playback_rate": browser_rate,
                    "synthesis_rate": rate_str,
                    "requested_speed": requested_speed,
                    "synthesis_time": round(synthesis_duration, 2),
                    "text_length": len(text),
                    "processing_speed": round(chars_per_sec, 1)
                })
                
            except Exception as e:
                self.logger.error(f"Synthesis error from {client_ip}: {e}")
                return jsonify({"error": str(e)}), 500

        @self.app.route('/api/audio/<audio_id>')
        def serve_audio(audio_id):
            client_ip = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)
            
            try:
                if not audio_id.replace('-', '').replace('_', '').isalnum():
                    return jsonify({"error": "Invalid audio ID"}), 400
                    
                audio_path = self.TEMP_DIR / f"{audio_id}.mp3"
                
                if not audio_path.exists():
                    self.logger.warning(f"Audio file not found: {audio_id} (requested by {client_ip})")
                    return jsonify({"error": "Audio file not found"}), 404
                
                return send_file(
                    str(audio_path),
                    mimetype='audio/mpeg',
                    as_attachment=False,
                    download_name=f"speech_{audio_id}.mp3"
                )
                
            except Exception as e:
                self.logger.error(f"Audio serving error: {e}")
                return jsonify({"error": str(e)}), 500

        @self.app.errorhandler(404)
        def not_found(error):
            return jsonify({"error": "Endpoint not found"}), 404

        @self.app.errorhandler(500)
        def internal_error(error):
            self.logger.error(f"Internal server error: {error}")
            return jsonify({"error": "Internal server error"}), 500


    def run(self):
        """Start the server"""
        self.logger.info(f"Starting TTS server on {self.host}:{self.port}")
        try:
            self.app.run(
                host=self.host,
                port=self.port,
                debug=self.debug,
                threaded=True
            )
        except Exception as e:
            self.logger.error(f"Server startup failed: {e}")
            sys.exit(1)

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description='TTS Web Server - Subdirectory Version')
    parser.add_argument('--host', default='127.0.0.1', help='Host to bind to (default: 127.0.0.1)')
    parser.add_argument('--port', type=int, default=9001, help='Port to bind to (default: 8000)')
    parser.add_argument('--debug', action='store_true', help='Enable debug mode')
    parser.add_argument('--url-prefix', default='', help='URL prefix for subdirectory deployment')
    
    args = parser.parse_args()
    
    # Create and run server
    server = TTSWebServer(
        host=args.host,
        port=args.port,
        debug=args.debug,
        url_prefix=args.url_prefix
    )
    
    server.run()

if __name__ == '__main__':
    main()
