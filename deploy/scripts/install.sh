#!/bin/bash
set -e

# TUNING Installation Script
# Run this on the target server to install the application

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Variables
APP_DIR=${APP_DIR:-"/opt/tuning"}
REPO_URL=${REPO_URL:-""}  # Set your git repository URL

echo -e "${GREEN}=== TUNING Installation Script ===${NC}"
echo "Application Directory: $APP_DIR"
echo ""

# 1. Clone or copy application
if [ -n "$REPO_URL" ] && [ -d ".git" ]; then
    echo -e "${YELLOW}[1/6] Cloning repository...${NC}"
    git clone $REPO_URL $APP_DIR
    cd $APP_DIR
else
    echo -e "${YELLOW}[1/6] Skipping clone (copy files manually to $APP_DIR)${NC}"
    cd $APP_DIR
fi

# 2. Install dependencies
echo -e "${YELLOW}[2/6] Installing dependencies...${NC}"
npm ci

# 3. Build application
echo -e "${YELLOW}[3/6] Building application...${NC}"
npm run build

# 4. Setup database
echo -e "${YELLOW}[4/6] Setting up database...${NC}"
mkdir -p backend/data
cd backend
npm run db:seed
cd ..

# 5. Install systemd service
echo -e "${YELLOW}[5/6] Installing systemd service...${NC}"
if [ -f "deploy/systemd/tuning-backend.service" ]; then
    sudo cp deploy/systemd/tuning-backend.service /etc/systemd/system/
    # Update paths in service file
    sudo sed -i "s|/path/to/tuning|$APP_DIR|g" /etc/systemd/system/tuning-backend.service
    sudo sed -i "s|YOUR_USERNAME|$USER|g" /etc/systemd/system/tuning-backend.service
    sudo systemctl daemon-reload
    sudo systemctl enable tuning-backend
    echo "Systemd service installed"
else
    echo -e "${RED}Warning: systemd service file not found${NC}"
fi

# 6. Install Nginx configuration
echo -e "${YELLOW}[6/6] Installing Nginx configuration...${NC}"
if [ -f "deploy/nginx/tuning.conf" ]; then
    sudo cp deploy/nginx/tuning.conf /etc/nginx/conf.d/
    # Update paths in nginx config
    sudo sed -i "s|/path/to/tuning|$APP_DIR|g" /etc/nginx/conf.d/tuning.conf
    sudo nginx -t
    echo "Nginx configuration installed"
else
    echo -e "${RED}Warning: Nginx configuration file not found${NC}"
fi

echo ""
echo -e "${GREEN}=== Installation Complete ===${NC}"
echo ""
echo "Next steps:"
echo "1. Configure environment variables: vim $APP_DIR/backend/.env"
echo "2. Update Nginx config with your domain: sudo vim /etc/nginx/conf.d/tuning.conf"
echo "3. Start services:"
echo "   sudo systemctl start tuning-backend"
echo "   sudo systemctl start nginx"
echo "4. Check status:"
echo "   sudo systemctl status tuning-backend"
echo "   sudo journalctl -u tuning-backend -f"
