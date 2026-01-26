# IISNode Deployment Guide for NBA API Server

This guide explains how to deploy the Node.js NBA API server using IISNode on Windows Server with IIS.

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

### 4. Environment Variables

Set the following environment variables in the application pool or system:

```powershell
# Required
GROQ_API_KEY=your_groq_api_key_here
NBA_API_PROXY=http://your-proxy-server:port  # Optional, for NBA API proxy

# Optional
FRONTEND_URL=https://your-frontend-domain.com
NODE_ENV=production
```

### 5. File Permissions

Ensure the application pool identity has read/write access to:
- The `server` directory
- `node_modules` directory
- Log directories (iisnode folder will be created automatically)

### 6. Build the Application

Before deployment, build the TypeScript application:

```bash
cd server
npm install
npm run build
```

## Configuration Details

### web.config Features

The `web.config` file includes:

- **IISNode Handler**: Routes requests to `dist/index.js`
- **URL Rewriting**: Properly routes API calls and WebSocket connections
- **WebSocket Support**: Enabled for real-time features
- **Security Headers**: Basic security headers configured
- **Static File Handling**: Proper MIME types for assets

### WebSocket Configuration

WebSockets are supported for:
- Live scoreboard updates: `ws://your-domain/api/v1/ws`
- Play-by-play updates: `ws://your-domain/api/v1/playbyplay/ws/{gameId}`

## Troubleshooting

### Common Issues

1. **"Cannot find module" errors**:
   - Ensure `npm install` was run
   - Check that `dist` folder exists and is up to date

2. **WebSocket connections failing**:
   - Verify WebSocket Protocol is installed in IIS
   - Check that `web.config` has WebSocket enabled

3. **Application not starting**:
   - Check IISNode logs in the `iisnode` folder
   - Verify Node.js path in `web.config`
   - Check application pool identity permissions

4. **Environment variables not working**:
   - Set them at the server level in IIS Manager
   - Or use `appSettings` in `web.config`

### Log Locations

- IISNode logs: `server/iisnode/`
- Application logs: Check console output in IISNode logs
- IIS logs: Default IIS logging location

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