#!/bin/bash
set -e

# TUNING Setup Script for Rocky Linux 10.1
# This script prepares the server environment for deployment

echo "=== TUNING Setup Script for Rocky Linux 10.1 ==="

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variables (modify these before running)
DEPLOY_USER=${DEPLOY_USER:-"YOUR_USERNAME"}
APP_DIR=${APP_DIR:-"/opt/tuning"}
NODE_VERSION=${NODE_VERSION:-"20"}

echo -e "${YELLOW}Configuration:${NC}"
echo "Deploy User: $DEPLOY_USER"
echo "Application Directory: $APP_DIR"
echo "Node.js Version: $NODE_VERSION"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root (use sudo)"
    exit 1
fi

# 1. Update system
echo -e "${GREEN}[1/7] Updating system packages...${NC}"
dnf update -y

# 2. Install EPEL and common tools
echo -e "${GREEN}[2/7] Installing EPEL and common tools...${NC}"
dnf install -y epel-release
dnf install -y git curl wget vim htop

# 3. Install Node.js
echo -e "${GREEN}[3/7] Installing Node.js ${NODE_VERSION}...${NC}"
dnf module reset -y nodejs
dnf module enable -y nodejs:${NODE_VERSION}
dnf install -y nodejs npm

# Verify Node.js installation
node --version
npm --version

# 4. Install build tools (required for better-sqlite3)
echo -e "${GREEN}[4/7] Installing build tools for native modules...${NC}"
dnf groupinstall -y "Development Tools"
dnf install -y gcc-c++ make python3 python3-devel

# 5. Install and configure Nginx
echo -e "${GREEN}[5/7] Installing Nginx...${NC}"
dnf install -y nginx
systemctl enable nginx

# 6. Configure firewall
echo -e "${GREEN}[6/7] Configuring firewall...${NC}"
if command -v firewall-cmd &> /dev/null; then
    firewall-cmd --permanent --add-service=http
    firewall-cmd --permanent --add-service=https
    firewall-cmd --reload
    echo "Firewall configured"
else
    echo "firewalld not found, skipping firewall configuration"
fi

# 7. Create application directory
echo -e "${GREEN}[7/7] Creating application directory...${NC}"
mkdir -p $APP_DIR
chown -R $DEPLOY_USER:$DEPLOY_USER $APP_DIR

echo ""
echo -e "${GREEN}=== Setup Complete ===${NC}"
echo ""
echo "Next steps:"
echo "1. Copy your application code to: $APP_DIR"
echo "2. Configure environment variables in: $APP_DIR/backend/.env"
echo "3. Install dependencies: cd $APP_DIR && npm ci"
echo "4. Build the application: npm run build"
echo "5. Copy systemd service file to: /etc/systemd/system/"
echo "6. Copy nginx config to: /etc/nginx/conf.d/"
echo "7. Start the services"
