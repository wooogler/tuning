#!/bin/bash
set -e

# TUNING Podman Setup Script for Rocky Linux 10.1
# This script prepares the server environment for Podman deployment

echo "=== TUNING Podman Setup Script for Rocky Linux 10.1 ==="

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variables (modify these before running)
DEPLOY_USER=${DEPLOY_USER:-"$USER"}
APP_DIR=${APP_DIR:-"/opt/tuning"}

echo -e "${YELLOW}Configuration:${NC}"
echo "Deploy User: $DEPLOY_USER"
echo "Application Directory: $APP_DIR"
echo ""

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root (use sudo)"
    exit 1
fi

# 1. Update system
echo -e "${GREEN}[1/6] Updating system packages...${NC}"
dnf update -y

# 2. Install EPEL and common tools
echo -e "${GREEN}[2/6] Installing EPEL and common tools...${NC}"
dnf install -y epel-release
dnf install -y git curl wget vim htop

# 3. Install Podman and podman-compose
echo -e "${GREEN}[3/6] Installing Podman and podman-compose...${NC}"
dnf install -y podman podman-compose podman-plugins

# Verify Podman installation
podman --version
podman-compose --version || echo "podman-compose not available, will use podman commands directly"

# Enable podman socket for rootless mode (optional)
systemctl --user enable --now podman.socket 2>/dev/null || true

# 4. Configure firewall
echo -e "${GREEN}[4/6] Configuring firewall...${NC}"
if command -v firewall-cmd &> /dev/null; then
    firewall-cmd --permanent --add-service=http
    firewall-cmd --permanent --add-service=https
    # Allow container ports
    firewall-cmd --permanent --add-port=3000/tcp
    firewall-cmd --reload
    echo "Firewall configured"
else
    echo "firewalld not found, skipping firewall configuration"
fi

# 5. Configure SELinux for containers (if enabled)
echo -e "${GREEN}[5/6] Configuring SELinux for containers...${NC}"
if command -v getenforce &> /dev/null && [ "$(getenforce)" != "Disabled" ]; then
    # Allow container networking
    setsebool -P container_manage_cgroup on
    setsebool -P httpd_can_network_connect on
    echo "SELinux configured for containers"
else
    echo "SELinux not enabled or not found"
fi

# 6. Create application directory
echo -e "${GREEN}[6/6] Creating application directory...${NC}"
mkdir -p $APP_DIR
chown -R $DEPLOY_USER:$DEPLOY_USER $APP_DIR

# Create required subdirectories
mkdir -p $APP_DIR/backend/data
mkdir -p $APP_DIR/deploy/ssl
chown -R $DEPLOY_USER:$DEPLOY_USER $APP_DIR

echo ""
echo -e "${GREEN}=== Setup Complete ===${NC}"
echo ""
echo "Podman is configured and ready to use."
echo ""
echo "Next steps:"
echo "1. Copy your application code to: $APP_DIR"
echo "2. Configure environment variables: cp $APP_DIR/.env.docker $APP_DIR/backend/.env"
echo "3. Edit environment file: vim $APP_DIR/backend/.env"
echo "4. Build and start containers (as $DEPLOY_USER):"
echo "   cd $APP_DIR"
echo "   podman-compose build"
echo "   podman-compose up -d"
echo ""
echo "Useful Podman commands:"
echo "  podman ps                    # List running containers"
echo "  podman logs tuning-backend   # View backend logs"
echo "  podman logs tuning-nginx     # View nginx logs"
echo "  podman-compose down          # Stop all containers"
