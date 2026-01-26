# Camera Access Fix for Network IP

## Problem

When accessing the app via `http://192.168.0.36:8084`, the camera doesn't work with this error:

```
getUserMedia not available. navigator: true mediaDevices: undefined
protocol: http: hostname: 192.168.0.36
```

## Root Cause

**`navigator.mediaDevices` is only available in secure contexts:**
- ✅ HTTPS (any origin)
- ✅ localhost (HTTP or HTTPS)
- ❌ HTTP on network IP addresses (not secure)

This is a **browser security requirement** - camera access requires a secure context.

## Solution

**Use HTTPS for network access:**

```powershell
cd canny-carrot-mobile-app
.\start-web-8084-https.ps1
```

Then access: `https://192.168.0.36:8084`

**Important**: You'll need to accept the self-signed certificate warning on first visit.

## Why localhost Works

Browsers treat `localhost` as a secure context even with HTTP. This is why:
- ✅ `http://localhost:8084` - Camera works
- ❌ `http://192.168.0.36:8084` - Camera doesn't work
- ✅ `https://192.168.0.36:8084` - Camera works

## Quick Reference

| Access Method | Camera Works? | Notes |
|--------------|---------------|-------|
| `http://localhost:8084` | ✅ Yes | localhost is secure context |
| `http://192.168.0.36:8084` | ❌ No | HTTP on IP is not secure |
| `https://192.168.0.36:8084` | ✅ Yes | HTTPS is secure context |

## Accepting Certificate on Different Browsers

### Chrome/Edge
1. Click "Advanced"
2. Click "Proceed to 192.168.0.36 (unsafe)"
3. Camera will work after accepting

### Firefox
1. Click "Advanced"
2. Click "Accept the Risk and Continue"
3. Camera will work after accepting

### Safari (iPhone/iPad)
1. Tap "Advanced" or "Show Details"
2. Tap "Proceed to 192.168.0.36"
3. Camera will work after accepting

## Alternative: Use localhost

If you don't want to deal with HTTPS certificates, you can:
1. Use `http://localhost:8084` on the same machine
2. Use port forwarding or SSH tunnel to access from other devices
3. Use the Android Metro build (which uses native camera, not web API)











