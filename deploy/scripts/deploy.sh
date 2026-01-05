#!/bin/bash
set -e

# TUNING Deployment Script
# This script deploys the application to the server

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Variables (modify these)
APP_DIR=${APP_DIR:-"/opt/tuning"}
BACKUP_DIR=${BACKUP_DIR:-"/opt/tuning-backups"}

echo -e "${GREEN}=== TUNING Deployment Script ===${NC}"
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
echo -e "${YELLOW}[1/8] Creating backup...${NC}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
if [ -d "backend/dist" ]; then
    tar -czf $BACKUP_DIR/tuning-backup-$TIMESTAMP.tar.gz backend/dist backend/data 2>/dev/null || true
    echo "Backup created: $BACKUP_DIR/tuning-backup-$TIMESTAMP.tar.gz"
fi

# 2. Pull latest code (if using git)
if [ -d ".git" ]; then
    echo -e "${YELLOW}[2/8] Pulling latest code...${NC}"
    git pull
else
    echo -e "${YELLOW}[2/8] Skipping git pull (not a git repository)${NC}"
fi

# 3. Install dependencies
echo -e "${YELLOW}[3/8] Installing dependencies...${NC}"
npm ci --omit=dev

# 4. Build backend
echo -e "${YELLOW}[4/8] Building backend...${NC}"
npm run build:backend

# 5. Build frontend
echo -e "${YELLOW}[5/8] Building frontend...${NC}"
npm run build:frontend

# 6. Run database migrations/seed if needed
echo -e "${YELLOW}[6/8] Initializing database...${NC}"
cd backend
npm run db:seed || echo "Database already seeded"
cd ..

# 7. Restart backend service
echo -e "${YELLOW}[7/8] Restarting backend service...${NC}"
if sudo systemctl is-active --quiet tuning-backend; then
    sudo systemctl restart tuning-backend
    echo "Backend service restarted"
else
    echo -e "${RED}Backend service not running, please start it manually${NC}"
fi

# 8. Reload Nginx
echo -e "${YELLOW}[8/8] Reloading Nginx...${NC}"
if sudo systemctl is-active --quiet nginx; then
    sudo nginx -t && sudo systemctl reload nginx
    echo "Nginx reloaded"
else
    echo -e "${RED}Nginx not running, please start it manually${NC}"
fi

echo ""
echo -e "${GREEN}=== Deployment Complete ===${NC}"
echo ""
echo "Service status:"
sudo systemctl status tuning-backend --no-pager || true
