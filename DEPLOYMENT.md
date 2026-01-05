# TUNING - Rocky Linux 10.1 Deployment Guide (Podman)

This document explains how to deploy the TUNING application on Rocky Linux 10.1 using Podman.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Server Initial Setup](#server-initial-setup)
3. [Application Installation](#application-installation)
4. [Environment Configuration](#environment-configuration)
5. [Starting Services](#starting-services)
6. [Deployment and Updates](#deployment-and-updates)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

### Server Specifications
- OS: Rocky Linux 10.1 (Red Quartz)
- CPU: Minimum 1 core (2+ cores recommended)
- RAM: Minimum 2GB (4GB+ recommended)
- Disk: Minimum 10GB free space
- Network: Internet connection required (for OpenAI API)

### Required Software
- Podman (included by default in Rocky Linux)
- podman-compose
- Git (optional)

## Why Podman?

Rocky Linux 10.1 comes with Podman pre-installed as the default container engine. Podman is:
- Docker-compatible (uses same Dockerfile and docker-compose syntax)
- Rootless by default (more secure)
- Daemonless (no background daemon required)
- Compatible with SELinux

## Server Initial Setup

### Option 1: Automated Setup Script

After copying the code to the server:

```bash
cd /opt/tuning
sudo bash deploy/scripts/setup-podman.sh
```

### Option 2: Manual Setup

```bash
# 1. Update system
sudo dnf update -y

# 2. Install essential packages
sudo dnf install -y epel-release git curl wget vim htop

# 3. Install Podman and podman-compose
sudo dnf install -y podman podman-compose podman-plugins

# Verify installation
podman --version
podman-compose --version

# 4. Configure firewall
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload

# 5. Configure SELinux for containers
sudo setsebool -P container_manage_cgroup on
sudo setsebool -P httpd_can_network_connect on

# 6. Create application directory
sudo mkdir -p /opt/tuning
sudo chown $USER:$USER /opt/tuning
```

## Application Installation

### 1. Copy Application Code

Transfer your code to the server:

```bash
# Using scp from your local machine
scp -r /path/to/tuning user@server:/opt/

# Or using git
cd /opt
git clone <your-repo-url> tuning
cd tuning
```

### 2. Configure Environment Variables

```bash
cd /opt/tuning

# Copy environment template
cp .env.docker backend/.env

# Edit environment file
vim backend/.env
```

Required environment variables:

```bash
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# IMPORTANT: Set your actual OpenAI API key
OPENAI_API_KEY=sk-your-actual-api-key-here

DB_PATH=./data/tuning.db
LOG_LEVEL=info

# Replace with your actual domain
ALLOWED_ORIGINS=http://your-domain.edu,https://your-domain.edu
```

### 3. Update Nginx Configuration

Edit the Nginx configuration to use your domain:

```bash
vim deploy/nginx/conf.d/tuning.conf
```

Change `server_name`:

```nginx
server_name your-domain.edu;
```

### 4. Build and Start Containers

```bash
cd /opt/tuning

# Build containers
podman-compose build

# Start containers in detached mode
podman-compose up -d
```

## Starting Services

### Start Containers

```bash
cd /opt/tuning
podman-compose up -d
```

### Check Container Status

```bash
# List running containers
podman ps

# Expected output:
# CONTAINER ID  IMAGE                              COMMAND     CREATED        STATUS        PORTS                   NAMES
# xxxxxxxxxxxx  localhost/tuning-backend:latest    ...         2 minutes ago  Up 2 minutes  0.0.0.0:3000->3000/tcp  tuning-backend
# xxxxxxxxxxxx  docker.io/library/nginx:alpine     ...         2 minutes ago  Up 2 minutes  0.0.0.0:80->80/tcp      tuning-nginx
```

### View Logs

```bash
# View backend logs
podman logs tuning-backend

# Follow backend logs in real-time
podman logs -f tuning-backend

# View nginx logs
podman logs tuning-nginx

# Follow nginx logs
podman logs -f tuning-nginx
```

## Deployment and Updates

### Option 1: Automated Deployment Script

```bash
cd /opt/tuning
bash deploy/scripts/deploy-podman.sh
```

This script will:
1. Create a backup of your database
2. Pull latest code (if using git)
3. Stop running containers
4. Rebuild images
5. Start updated containers
6. Verify deployment

### Option 2: Manual Deployment

```bash
cd /opt/tuning

# 1. Backup database
mkdir -p ~/backups
tar -czf ~/backups/tuning-backup-$(date +%Y%m%d_%H%M%S).tar.gz backend/data

# 2. Pull latest code
git pull

# 3. Stop containers
podman-compose down

# 4. Rebuild images
podman-compose build

# 5. Start containers
podman-compose up -d

# 6. Verify
podman ps
```

## Container Management

### Common Podman Commands

```bash
# List running containers
podman ps

# List all containers (including stopped)
podman ps -a

# Stop containers
podman-compose down

# Start containers
podman-compose up -d

# Restart containers
podman-compose restart

# Restart specific container
podman restart tuning-backend

# View container logs
podman logs tuning-backend
podman logs tuning-nginx

# Follow logs
podman logs -f tuning-backend

# Execute command in running container
podman exec -it tuning-backend sh

# View container resource usage
podman stats

# Remove stopped containers
podman container prune

# Remove unused images
podman image prune
```

## Troubleshooting

### Backend Container Not Starting

```bash
# Check container status
podman ps -a

# View full logs
podman logs tuning-backend

# Common issues:
# 1. Missing OPENAI_API_KEY in backend/.env
# 2. Port 3000 already in use
# 3. Database permission issues
```

### Nginx 502 Bad Gateway

```bash
# Check if backend is running
podman ps | grep tuning-backend

# Check if backend is healthy
podman exec tuning-backend wget -qO- http://localhost:3000/api/health

# Check network connectivity between containers
podman network inspect tuning-network
```

### SELinux Permission Denied

```bash
# Check SELinux status
getenforce

# View SELinux denials
sudo ausearch -m avc -ts recent

# If you see permission denials, try:
sudo setsebool -P container_manage_cgroup on
sudo setsebool -P httpd_can_network_connect on

# Note: Volume mounts in docker-compose.yml use :z flag for SELinux
```

### Port Already in Use

```bash
# Check what's using port 80
sudo ss -tlnp | grep :80

# Check what's using port 3000
sudo ss -tlnp | grep :3000

# Change ports in docker-compose.yml if needed
```

### Reset Database

```bash
# Stop containers
podman-compose down

# Backup existing database
mv backend/data/tuning.db backend/data/tuning.db.backup

# Start containers (database will be recreated)
podman-compose up -d

# Check backend logs to verify database initialization
podman logs tuning-backend
```

### View Container Resource Usage

```bash
# Real-time resource monitoring
podman stats

# Check disk usage
podman system df
```

## Running Containers as Systemd Services (Optional)

For production, you may want containers to start automatically on boot:

### 1. Generate systemd service files

```bash
cd /opt/tuning

# Generate service files for podman-compose
podman-compose systemd

# Or manually create service file
mkdir -p ~/.config/systemd/user/
podman generate systemd --new --name tuning-backend > ~/.config/systemd/user/tuning-backend.service
podman generate systemd --new --name tuning-nginx > ~/.config/systemd/user/tuning-nginx.service
```

### 2. Enable and start services

```bash
systemctl --user daemon-reload
systemctl --user enable tuning-backend tuning-nginx
systemctl --user start tuning-backend tuning-nginx

# Enable lingering (allows user services to run without login)
sudo loginctl enable-linger $USER
```

## Security Considerations

### 1. Protect Environment Variables

```bash
chmod 600 /opt/tuning/backend/.env
```

### 2. Firewall Configuration

```bash
# Only allow necessary ports
sudo firewall-cmd --list-all

# Remove port 3000 if you don't need direct backend access
sudo firewall-cmd --permanent --remove-port=3000/tcp
sudo firewall-cmd --reload
```

### 3. SSL/TLS Setup with Let's Encrypt

```bash
# Install certbot
sudo dnf install -y certbot

# Obtain certificate (make sure port 80 is accessible)
sudo certbot certonly --standalone -d your-domain.edu

# Copy certificates to deploy/ssl directory
sudo cp /etc/letsencrypt/live/your-domain.edu/fullchain.pem /opt/tuning/deploy/ssl/
sudo cp /etc/letsencrypt/live/your-domain.edu/privkey.pem /opt/tuning/deploy/ssl/
sudo chown $USER:$USER /opt/tuning/deploy/ssl/*.pem

# Uncomment HTTPS configuration in deploy/nginx/conf.d/tuning.conf
vim /opt/tuning/deploy/nginx/conf.d/tuning.conf

# Restart nginx container
podman restart tuning-nginx

# Set up auto-renewal
sudo systemctl enable --now certbot-renew.timer
```

## Monitoring

### Container Health

```bash
# Check health status
podman inspect --format='{{.State.Health.Status}}' tuning-backend

# View health check logs
podman inspect tuning-backend | grep -A 10 Health
```

### System Resources

```bash
# CPU and memory usage
htop

# Disk usage
df -h

# Container disk usage
podman system df

# Clean up unused resources
podman system prune
```

### Log Management

Podman logs are managed by journald:

```bash
# View logs with journalctl
journalctl -u <service-name>

# Configure log retention
sudo vim /etc/systemd/journald.conf
# Set SystemMaxUse=500M

sudo systemctl restart systemd-journald
```

## Backup Strategy

### Manual Backup

```bash
#!/bin/bash
BACKUP_DIR=/backup/tuning
DATE=$(date +%Y%m%d)
mkdir -p $BACKUP_DIR

# Backup database
tar -czf $BACKUP_DIR/tuning-db-$DATE.tar.gz /opt/tuning/backend/data

# Backup environment and configs
tar -czf $BACKUP_DIR/tuning-config-$DATE.tar.gz \
  /opt/tuning/backend/.env \
  /opt/tuning/deploy/nginx/conf.d/tuning.conf
```

### Automated Backup with Cron

```bash
# Create backup script
cat > /opt/tuning/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR=/backup/tuning
DATE=$(date +%Y%m%d)
mkdir -p $BACKUP_DIR
tar -czf $BACKUP_DIR/tuning-$DATE.tar.gz /opt/tuning/backend/data
# Keep only last 7 days
find $BACKUP_DIR -name "tuning-*.tar.gz" -mtime +7 -delete
EOF

chmod +x /opt/tuning/backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /opt/tuning/backup.sh
```

## Performance Optimization

### Resource Limits

Edit [docker-compose.yml](docker-compose.yml) to add resource limits:

```yaml
services:
  backend:
    # ... existing config ...
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

### Nginx Caching

Already configured in [deploy/nginx/conf.d/tuning.conf](deploy/nginx/conf.d/tuning.conf) with:
- Static asset caching (1 year)
- Gzip compression
- Browser caching headers

## Differences from Development Environment

1. **Containers**: Production runs in Podman containers, development runs directly on host
2. **Database**: Same SQLite, but persisted in volume mount
3. **Logging**: Container logs via journald instead of console
4. **Frontend**: Pre-built static files served by Nginx

## Additional Help

If problems persist:

1. Check container logs: `podman logs tuning-backend`
2. Check nginx logs: `podman logs tuning-nginx`
3. Verify network connectivity: `podman exec tuning-backend ping -c 3 api.openai.com`
4. Check system resources: `df -h && free -h`
5. Review SELinux logs: `sudo ausearch -m avc -ts recent`

## Quick Reference

```bash
# Start everything
cd /opt/tuning && podman-compose up -d

# Stop everything
podman-compose down

# View logs
podman logs -f tuning-backend

# Restart after code changes
bash deploy/scripts/deploy-podman.sh

# Check status
podman ps

# Access backend shell
podman exec -it tuning-backend sh

# Check resource usage
podman stats
```
