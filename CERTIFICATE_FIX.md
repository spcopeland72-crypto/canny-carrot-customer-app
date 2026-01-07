# Certificate Security Warning Fix

## Problem

When using HTTPS with Expo's self-signed certificate, browsers show security warnings and may block the site entirely.

## Solutions

### Option 1: Use HTTP on localhost (Recommended for Development)

**Camera works on localhost with HTTP** - browsers treat localhost as a secure context.

```powershell
.\start-web-8084.ps1
```

Then access: `http://localhost:8084`

✅ Camera works  
✅ No certificate warnings  
✅ Works on all devices accessing via localhost  

### Option 2: Accept Self-Signed Certificate (For Network IP)

If you need to access via network IP (`192.168.0.36:8084`) with camera support:

```powershell
.\start-web-8084-https.ps1
```

Then accept the certificate warning:

**Chrome/Edge:**
1. Click "Advanced" or "Show Details"
2. Click "Proceed to 192.168.0.36 (unsafe)"
3. Site will load

**Firefox:**
1. Click "Advanced"
2. Click "Accept the Risk and Continue"
3. Site will load

**Safari (iPhone/iPad):**
1. Tap "Advanced" or "Show Details"
2. Tap "Proceed to 192.168.0.36"
3. Site will load

### Option 3: Use Port Forwarding (Best for Testing)

Instead of accessing via network IP, use port forwarding:

1. Use HTTP version: `.\start-web-8084.ps1`
2. Access via `http://localhost:8084` on your machine
3. Use SSH tunnel or port forwarding to access from other devices

## Why This Happens

Expo uses a self-signed certificate for HTTPS, which browsers don't trust by default. This is normal for development.

## Recommendation

**For local development**: Use HTTP on localhost (`http://localhost:8084`)  
**For network testing**: Use HTTP and access via localhost, or accept the certificate warning for HTTPS

