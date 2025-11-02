#!/bin/bash
HEALTH_URL="http://localhost:9001/health"
LOG_FILE="/var/log/tts-server/health.log"

if ! curl -f -s "$HEALTH_URL" > /dev/null; then
    echo "$(date): Health check failed, restarting service..." >> "$LOG_FILE"
    systemctl restart tts-server
    sleep 5
    if curl -f -s "$HEALTH_URL" > /dev/null; then
        echo "$(date): Service restarted successfully" >> "$LOG_FILE"
    else
        echo "$(date): Service restart failed" >> "$LOG_FILE"
    fi
else
    echo "$(date): Service healthy" >> "$LOG_FILE"
fi
