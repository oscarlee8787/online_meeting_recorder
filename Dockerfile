# Phase 1: Docker + Puppeteer Meeting Agent
FROM node:18-slim

# Install Chrome and dependencies
RUN apt-get update && apt-get install -y \
    chromium \
    xvfb \
    pulseaudio \
    alsa-utils \
    x11vnc \
    fluxbox \
    wget \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy package files
COPY automation/package*.json ./

# Install dependencies with optimized npm
RUN npm config set fetch-timeout 600000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 3 && \
    npm config set registry https://registry.npmjs.org/ && \
    npm install --omit=dev --no-audit --no-fund

# Copy automation code
COPY automation/ .

# Create necessary directories
RUN mkdir -p /tmp/.X11-unix /var/log

# Expose API port and VNC port
EXPOSE 3333 5900

# Setup audio
ENV PULSE_RUNTIME_PATH=/var/run/pulse

# Start script
COPY automation/start.sh .
RUN chmod +x start.sh

CMD ["./start.sh"]