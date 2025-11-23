#!/bin/bash

# Phase 1 Docker automation startup script

# Create log directories
mkdir -p /var/log/automation

# Start Xvfb (virtual display)
Xvfb :99 -screen 0 1920x1080x24 &
export DISPLAY=:99

# Start window manager
fluxbox &

# Start VNC server for remote viewing (development)
x11vnc -display :99 -nopw -listen 0.0.0.0 -xkb -forever -shared &

# Start PulseAudio for audio
pulseaudio --start --log-target=syslog

# Install npm dependencies if not already installed
if [ ! -d "node_modules" ]; then
  echo "Installing npm dependencies..."
  npm install
fi

# Wait for services to start
sleep 5

echo "Starting meeting automation service..."

# Start the Node.js server
npm start