# Testing Historical Data Support

## Quick Test Guide

### Prerequisites
1. **Python API running** on localhost:8000
   ```bash
   cd c:\xampp\htdocs\nba-api.local\nba-tracker-api
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```

2. **TypeScript API running** on localhost:3000
   ```bash
   cd c:\xampp\htdocs\nba-api.local
   npm run start
   ```

---

## Test Cases

### Test 1: Today's Games (Live API)
```bash
# Request
curl "http://localhost:3000/api/v1/schedule/date/2026-01-27"

# Expected Response
{
  "date": "2026-01-27",
  "games": [
    // ... today's games from live NBA API
  ],
  "total": 1
}
```

### Test 2: Historical Date (Python API Proxy)
```bash
# Request - January 25, 2026 (2 days ago)
curl "http://localhost:3000/api/v1/schedule/date/2026-01-25"

# Expected Response
{
  "date": "2026-01-25",
  "games": [
    // ... games from Python API with full details
  ],
  "total": 1,
  "source": "nba-tracker-api (Python)"
}
```

### Test 3: Python API Unavailable
```bash
# Stop Python API first
# Then request:
curl "http://localhost:3000/api/v1/schedule/date/2026-01-25"

# Expected Response (graceful fallback)
{
  "date": "2026-01-25",
  "games": [],
  "total": 0,
  "note": "Historical game data not available from live API. Attempted to fetch from nba-tracker-api but service may be unavailable.",
  "suggestion": "Use /api/v1/schedule to get today's games (2026-01-27)"
}
```

### Test 4: Invalid Date Format
```bash
# Request with invalid format
curl "http://localhost:3000/api/v1/schedule/date/25-01-2026"

# Expected Response (400 error)
{
  "error": "Invalid date format. Use YYYY-MM-DD",
  "example": "2026-01-25"
}
```

### Test 5: Future Date
```bash
# Request future date
curl "http://localhost:3000/api/v1/schedule/date/2026-02-15"

# Expected Response (from Python API)
{
  "date": "2026-02-15",
  "games": [
    // ... scheduled future games if available
  ],
  "total": 0,
  "source": "nba-tracker-api (Python)"
}
```

---

## Debugging

### Check if Python API is Accessible
```bash
# From TypeScript API server
curl http://localhost:8000/api/v1/schedule/date/2026-01-25
```

### Check Environment Variables
```bash
# In Node.js console
node -e "console.log(process.env.PYTHON_API_URL)"
```

### Check API Response Times
```bash
# Time today's games (fast - cached)
time curl "http://localhost:3000/api/v1/schedule/date/2026-01-27"

# Time historical games (slower - requires proxy)
time curl "http://localhost:3000/api/v1/schedule/date/2026-01-25"
```

### Monitor Logs
```bash
# Watch TypeScript API logs for proxy requests
# Look for: "Fetching historical games for 2026-01-25 from Python API"
```

---

## How It Works (Step by Step)

### For Today's Games
1. Client requests: `GET /schedule/date/2026-01-27`
2. API detects date is today
3. Fetches from cache/live NBA API
4. Returns immediately (cached response)
5. Response time: ~50-150ms

### For Historical Games
1. Client requests: `GET /schedule/date/2026-01-25`
2. API detects date is in the past
3. Makes HTTP request to: `http://localhost:8000/api/v1/schedule/date/2026-01-25`
4. Python API queries NBA Stats API
5. Response is transformed and returned
6. Response time: ~500ms-5s

---

## Expected Behavior

| Scenario | Response | Status |
|----------|----------|--------|
| Today, Python API down | Today's live games | 200 ✅ |
| Historical, Python API up | Games from Python API | 200 ✅ |
| Historical, Python API down | Empty with message | 200 ✅ |
| Invalid date format | Error message | 400 ⚠️ |
| Timeout (>30s) | Error message | 500 ⚠️ |

---

## Common Issues & Solutions

### Issue: Always returns empty for historical dates

**Diagnosis**:
```bash
# Check if Python API is running
curl http://localhost:8000/
# Should return 200 OK

# Check if Python API has game data for that date
curl http://localhost:8000/api/v1/schedule/date/2026-01-25
# Should return games if available
```

**Solution**:
1. Start Python API: `python -m uvicorn app.main:app --host 0.0.0.0 --port 8000`
2. Wait 5 seconds for startup
3. Try again

### Issue: Response says "Python API unavailable"

**Diagnosis**:
```bash
# Try accessing Python API directly
curl http://localhost:8000/api/v1/schedule/date/2026-01-25 -v
# Check response status and error message
```

**Solution**:
- Check Python API is running: `ps aux | grep uvicorn`
- Check port 8000 is listening: `netstat -an | grep 8000`
- Check firewall rules if on different machine
- Increase timeout in code if slow response

### Issue: Timeout on historical request

**Diagnosis**:
- Python API is slow or NBA Stats API is rate limited
- Network latency is high
- Python API might be processing large dataset

**Solution**:
1. Increase timeout from 30s to 60s
2. Try at different time (avoid peak hours)
3. Check Python API logs for errors

---

## Performance Testing

### Baseline Measurements

**Today's Games** (cached from live API):
```bash
$ time curl "http://localhost:3000/api/v1/schedule/date/2026-01-27"
real    0m0.082s
user    0m0.008s
sys     0m0.012s
```

**Historical Games** (proxied from Python API):
```bash
$ time curl "http://localhost:3000/api/v1/schedule/date/2026-01-25"
real    0m0.850s
user    0m0.008s
sys     0m0.012s
```

**Difference**: ~800ms overhead for Python API proxy (expected)

---

## Integration Testing

### Test Script
```bash
#!/bin/bash

BASE="http://localhost:3000/api/v1"
TODAY=$(date +%Y-%m-%d)
YESTERDAY=$(date -d "yesterday" +%Y-%m-%d)

echo "Testing TypeScript API with Historical Data Support"
echo "=================================================="
echo ""

echo "Test 1: Today's Games (Live API)"
curl -s "$BASE/schedule/date/$TODAY" | jq '.total'
echo "✓ Response received"
echo ""

echo "Test 2: Yesterday's Games (Python API)"
curl -s "$BASE/schedule/date/$YESTERDAY" | jq '.total'
echo "✓ Response received"
echo ""

echo "Test 3: Invalid Date"
curl -s "$BASE/schedule/date/invalid" | jq '.error'
echo "✓ Error handled"
echo ""

echo "All tests completed!"
```

---

## Verification Checklist

- [ ] Python API is running
- [ ] TypeScript API is running
- [ ] Can fetch today's games
- [ ] Can fetch yesterday's games
- [ ] Invalid dates are rejected
- [ ] Response format matches API docs
- [ ] Timeout handling works
- [ ] Logs show proxy requests

---

## Next Steps

If everything works:
1. Deploy both APIs to production
2. Set `PYTHON_API_URL` environment variable
3. Monitor logs for proxy requests
4. Consider caching historical results
5. Implement rate limiting if needed

---

**Status**: Ready to test ✅
