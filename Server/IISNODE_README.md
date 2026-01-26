# IISNode Deployment Guide for NBA API Server

This guide explains how to deploy the Node.js NBA API server using IISNode on Windows Server with IIS.

## Quick Diagnosis

If you're getting 500 errors, run the diagnostic script first:

```cmd
diagnose_iisnode.bat
```

This script will check:
- IISNode installation
- Node.js availability
- Application files
- Basic Node.js functionality
- IISNode logs

## Prerequisites

1. **Windows Server** with IIS installed
2. **IISNode** installed and configured
3. **Node.js** installed on the server
4. **URL Rewrite** module for IIS
5. **WebSocket Protocol Support** for IIS

## Installation Steps

### 1. Install IISNode

Download and install IISNode from: https://github.com/Azure/iisnode

Or install via Chocolatey:
```powershell
choco install iisnode
```

### 2. Install Required IIS Features

Make sure the following IIS features are enabled:
- IIS Management Console
- IIS Management Scripts and Tools
- URL Rewrite
- WebSocket Protocol

### 3. Configure IIS Site

1. Create a new website in IIS Manager
2. Set the physical path to the `server` directory (containing web.config)
3. Configure the application pool:
   - Set .NET CLR Version to "No Managed Code"
   - Set Process Model > Identity to an account with appropriate permissions
   - Ensure "Enable 32-Bit Applications" is set to False (for 64-bit Node.js)

### 4. Verify IISNode Installation

After installing IISNode, verify it's working:
1. Check that `C:\Program Files\iisnode\iisnode.dll` exists
2. Check that the IISNode module is registered in IIS
3. Test with a simple Node.js app first

### 5. Environment Variables

Set environment variables at the server level in IIS Manager:
- `GROQ_API_KEY`: Your Groq API key
- `NBA_API_PROXY`: Optional proxy for NBA API requests
- `FRONTEND_URL`: Your frontend domain for CORS

### 6. Troubleshooting Common Issues

#### "Internal Server Error" (500)
- Check IISNode is properly installed
- Verify application pool is set to "No Managed Code"
- Check the iisnode folder for log files
- Ensure Node.js is installed and accessible

#### "Cannot find module" errors
- Run `npm install` in the server directory
- Ensure `dist/index.js` exists (run `npm run build`)
- Check file permissions

#### WebSocket connections failing
- Ensure WebSocket Protocol is installed in IIS
- Check that `<webSocket enabled="true" />` is in web.config

#### Application Startup Issues

If the application fails to start under IISNode:

1. **Check the current configuration**: The app now skips background services when running under IISNode for initial testing
2. **Test with minimal app**: Use `test.js` to verify IISNode can execute Node.js at all
3. **Check IISNode logs**: Look for detailed error messages in `server/iisnode/`
4. **Verify Node.js path**: Ensure `C:\Program Files\nodejs\node.exe` exists

#### Application not starting
- Check iisnode logs in `server/iisnode/`
- Verify Node.js path (IISNode should auto-detect)
- Check environment variables are set correctly

### Log Locations
- IISNode application logs: `server/iisnode/`
- IIS logs: Check IIS Manager > Logging
- Application console output: In IISNode logs

## Monitoring

- Monitor the application via IIS Manager
- Check IISNode logs for application-specific errors
- Use the health check endpoint: `GET /`

## Performance Considerations

- IISNode automatically manages Node.js process lifecycle
- Configure application pool recycling as needed
- Monitor memory usage and adjust IISNode settings if necessary

## Security Notes

- The application includes basic security headers
- Configure SSL/TLS in IIS
- Set appropriate CORS settings via the `FRONTEND_URL` environment variable
- Regularly update Node.js and dependencies