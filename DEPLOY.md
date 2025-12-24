# Deployment Guide for TUNING

This guide explains how to deploy the TUNING application to Fly.io.

## Prerequisites

1. Install Fly.io CLI:
```bash
# macOS
brew install flyctl

# Or via curl
curl -L https://fly.io/install.sh | sh
```

2. Sign up and authenticate:
```bash
flyctl auth signup  # Create account
# OR
flyctl auth login   # If you already have an account
```

## First-Time Deployment

### 1. Set OpenAI API Key Secret

Your OpenAI API key needs to be stored as a secret (not in the code):

```bash
flyctl secrets set OPENAI_API_KEY=your_openai_api_key_here
```

### 2. Launch the Application

```bash
# This will create the app and deploy it
flyctl launch

# When prompted:
# - App name: tuning-hci (or choose your own)
# - Region: nrt (Tokyo) - recommended for Korea
# - Use existing fly.toml? Yes
# - Would you like to set up a Postgresql database? No
# - Would you like to set up an Upstash Redis database? No
# - Would you like to deploy now? Yes
```

### 3. Verify Deployment

```bash
# Check app status
flyctl status

# View logs
flyctl logs

# Open the app in browser
flyctl open
```

Your app will be available at: `https://tuning-hci.fly.dev` (or your chosen app name)

## Updating the Deployment

After making code changes:

```bash
# Deploy updates
flyctl deploy

# Watch deployment progress
flyctl logs
```

## Managing Secrets

```bash
# List all secrets
flyctl secrets list

# Update OpenAI API key
flyctl secrets set OPENAI_API_KEY=new_key_here

# Remove a secret
flyctl secrets unset SECRET_NAME
```

## Monitoring

```bash
# View real-time logs
flyctl logs

# Check app status
flyctl status

# View machine metrics
flyctl machine list
```

## Scaling

The app is configured with auto-start/stop to save costs. To change this:

```bash
# Keep at least 1 machine running always
flyctl scale count 1

# Scale to 0 (auto-start on requests)
flyctl scale count 0

# Increase memory if needed
flyctl scale memory 512  # 512MB
```

## Troubleshooting

### App not starting?
```bash
# Check logs for errors
flyctl logs

# SSH into the machine
flyctl ssh console
```

### OpenAI API errors?
```bash
# Verify secret is set
flyctl secrets list

# Update the secret
flyctl secrets set OPENAI_API_KEY=your_key_here
```

### Database issues?
The app uses SQLite which persists in the container. For production with multiple machines, consider:
- Using Fly.io volumes for persistence
- Switching to Postgres

## Cost Optimization

The current configuration uses:
- **Free tier eligible**: 256MB RAM, shared CPU
- **Auto-stop**: Machines stop after 5 minutes of inactivity
- **Auto-start**: Automatically starts on incoming requests

Expected cost: **~$0-2/month** for research usage

## Custom Domain (Optional)

```bash
# Add custom domain
flyctl certs add yourdomain.com

# Follow the DNS instructions provided
```

## Deleting the App

```bash
# Destroy the app completely
flyctl apps destroy tuning-hci
```
