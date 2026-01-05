#!/bin/bash
set -e

# TUNING Podman Deployment Script
# This script deploys/updates the application using Podman

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Variables
APP_DIR=${APP_DIR:-"/opt/tuning"}
BACKUP_DIR=${BACKUP_DIR:-"/opt/tuning-backups"}

echo -e "${GREEN}=== TUNING Podman Deployment Script ===${NC}"
echo "Application Directory: $APP_DIR"
echo ""

# Check if application directory exists
if [ ! -d "$APP_DIR" ]; then
    echo -e "${RED}Error: Application directory $APP_DIR does not exist${NC}"
    exit 1
fi

# Navigate to application directory
cd $APP_DIR

# 1. Create backup
echo -e "${YELLOW}[1/7] Creating backup...${NC}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
if [ -d "backend/data" ]; then
    tar -czf $BACKUP_DIR/tuning-backup-$TIMESTAMP.tar.gz backend/data 2>/dev/null || true
    echo "Backup created: $BACKUP_DIR/tuning-backup-$TIMESTAMP.tar.gz"
fi

# 2. Pull latest code (if using git)
if [ -d ".git" ]; then
    echo -e "${YELLOW}[2/7] Pulling latest code...${NC}"
    git pull
else
    echo -e "${YELLOW}[2/7] Skipping git pull (not a git repository)${NC}"
fi

# 3. Stop running containers
echo -e "${YELLOW}[3/7] Stopping running containers...${NC}"
podman-compose down || podman stop tuning-backend tuning-nginx 2>/dev/null || true

# 4. Build new images
echo -e "${YELLOW}[4/7] Building Docker images...${NC}"
podman-compose build

# 5. Initialize database if needed
echo -e "${YELLOW}[5/7] Initializing database...${NC}"
if [ ! -f "backend/data/tuning.db" ]; then
    echo "Database not found, will be created on first run"
fi

# 6. Start containers
echo -e "${YELLOW}[6/7] Starting containers...${NC}"
podman-compose up -d

# 7. Verify deployment
echo -e "${YELLOW}[7/7] Verifying deployment...${NC}"
sleep 5

# Check if containers are running
if podman ps | grep -q tuning-backend && podman ps | grep -q tuning-nginx; then
    echo -e "${GREEN}Containers are running successfully!${NC}"
    echo ""
    echo "Container status:"
    podman ps --filter "name=tuning-"
else
    echo -e "${RED}Error: Some containers failed to start${NC}"
    echo "Check logs with:"
    echo "  podman logs tuning-backend"
    echo "  podman logs tuning-nginx"
    exit 1
fi

echo ""
echo -e "${GREEN}=== Deployment Complete ===${NC}"
echo ""
echo "Useful commands:"
echo "  podman logs -f tuning-backend    # Follow backend logs"
echo "  podman logs -f tuning-nginx      # Follow nginx logs"
echo "  podman-compose down              # Stop all containers"
echo "  podman-compose restart           # Restart all containers"
