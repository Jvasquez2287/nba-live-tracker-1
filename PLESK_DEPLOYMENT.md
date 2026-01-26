# Plesk Deployment Guide for NBA API

## Prerequisites

1. **Plesk Windows Server** with IIS support
2. **IISNode installed** via Plesk or manually
3. **Node.js** available on the server
4. **URL Rewrite** module enabled

## Deployment Steps

### 1. Upload Files to Plesk

1. **Connect to Plesk** and go to your domain
2. **Upload files** to `httpdocs` directory:
   ```
   httpdocs/
   ├── dist/
   │   ├── index.js
   │   └── ... (other compiled files)
   ├── node_modules/
   ├── package.json
   ├── web.config
   └── ... (other files)
   ```

### 2. Configure Node.js in Plesk

1. Go to **Plesk > Domains > [your-domain] > Node.js**
2. **Enable Node.js** support
3. **Set Node.js version** (preferably 18+)
4. **Set Application Root**: `/httpdocs`
5. **Set Application Startup File**: `dist/index.js`
6. **Install dependencies**: Run `npm install`

### 3. Configure IIS Settings

1. Go to **Plesk > Domains > [your-domain] > IIS Settings**
2. Ensure **URL Rewrite** is enabled
3. Ensure **WebSocket Protocol** is enabled

### 4. File Permissions

Ensure the application has proper permissions:
- Read/write access to `iisnode` folder for logging
- Execute permissions for Node.js files

## Plesk-Specific web.config Features

The `web.config` is optimized for Plesk with:

- **Relative Node.js path**: Uses `node.exe` (Plesk finds it automatically)
- **Production settings**: `devErrorsEnabled="false"` for security
- **Resource limits**: `maxRequestSize="134217728"` (128MB)
- **Process management**: Optimized for Plesk's environment

## Troubleshooting

### Common Plesk Issues:

1. **"node.exe not found"**
   - Ensure Node.js is enabled in Plesk Node.js settings
   - Check Node.js version compatibility

2. **Permission errors**
   - Ensure application has write access to log directory
   - Check Plesk file permissions

3. **IISNode not working**
   - Verify IISNode is installed in Plesk
   - Check IIS handler mappings

### Logs Location:
- Plesk logs: `/var/log/plesk/`
- IISNode logs: `httpdocs/iisnode/`
- Application logs: Check console output in Plesk Node.js settings

## Environment Variables

Set these in **Plesk > Node.js > Environment variables**:

```
NODE_ENV=production
PORT=3000
```

## WebSocket Support

WebSockets are enabled in the configuration. If issues occur:
1. Ensure WebSocket Protocol is enabled in IIS
2. Check Plesk firewall settings allow WebSocket connections

## Health Check

After deployment, test:
- `https://yourdomain.com/` (health check)
- `https://yourdomain.com/api/v1/scoreboard` (API test)

## Performance Tuning

For production:
- Adjust `maxChildProcessesPerApplication` based on server resources
- Monitor memory usage in Plesk
- Configure appropriate timeouts in IIS settings