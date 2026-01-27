# NBA API - Quick Reference Guide

## 🚀 Quick Start

### Base URL
```
https://nba-api.local/api/v1
```

### Health Check
```bash
GET https://nba-api.local/
```

---

## 📊 Most Used Endpoints

### Get Today's Games
```bash
GET /schedule
```

### Get Live Scoreboard
```bash
GET /scoreboard
```

### Get Game Details
```bash
GET /scoreboard/game/{gameId}/boxscore
```

### Get Team Standings
```bash
GET /standings
```

### Get Player Stats
```bash
GET /players/{playerId}
GET /players/season-leaders?stat=PTS&limit=5
```

### Get Team Information
```bash
GET /teams/{teamId}
GET /teams/{teamId}/roster
GET /teams/{teamId}/game-log
```

---

## 🎯 Stat Categories

For season leaders and top-by-stat endpoints:
- `PTS` - Points
- `REB` - Rebounds
- `AST` - Assists
- `STL` - Steals
- `BLK` - Blocks
- `FG` - Field Goals
- `FT` - Free Throws
- `3P` - Three Pointers

---

## 🔄 Caching & Refresh

### Check Cache Status
```bash
GET /cache/status
```

### Manual Cache Refresh
```bash
POST /cache/refresh
```

---

## ⚡ WebSocket Endpoints

### Live Scoreboard Updates
```
wss://nba-api.local/ws/scoreboard
```

### Live Play-by-Play
```
wss://nba-api.local/ws/playbyplay/{gameId}
```

---

## 📋 Response Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success ✅ |
| 400 | Bad Request (invalid parameters) |
| 404 | Not Found |
| 500 | Server Error |
| 503 | Service Unavailable (cache empty) |

---

## 🆕 New Endpoints (Latest Implementation)

### Scoreboard Advanced
- `GET /scoreboard/game/:gameId/boxscore` - Detailed box score
- `GET /scoreboard/game/:gameId/key-moments` - Significant plays
- `GET /scoreboard/game/:gameId/win-probability` - Win odds

### Players Advanced
- `GET /players/season-leaders` - Top performers by stat
- `GET /players/top-by-stat` - Flexible ranking
- `GET /players/:id/game-log` - Recent game history

### Teams Advanced
- `GET /teams/:id/roster` - Team players
- `GET /teams/:id/game-log` - Recent games
- `GET /teams/:id/player-stats` - Player performance

---

## 🛠️ Common Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | integer | Results per page (default: varies) |
| `page` | integer | Page number (default: 1) |
| `stat` | string | Stat category (PTS, REB, AST, etc.) |
| `team` | string | Team tricode (LAL, BOS, etc.) |
| `season` | integer | Season year |
| `date` | string | Date (YYYY-MM-DD format) |

---

## 💡 Tips & Tricks

### 1. Filter Players by Team
```bash
GET /players?team=LAL&limit=50
```

### 2. Get Top 10 Rebounders
```bash
GET /players/top-by-stat?stat=REB&top_n=10
```

### 3. Get Specific Date's Games
```bash
GET /schedule/date/2024-01-15
```

### 4. Get Season Standings
```bash
GET /standings/season/2023
```

### 5. Search for Player
```bash
GET /search?q=LeBron&type=player
```

---

## 🔐 Error Handling

All errors follow this format:
```json
{
  "error": "Error message",
  "statusCode": 400,
  "timestamp": "2024-01-15T20:30:00Z"
}
```

---

## 📈 Performance Notes

- **Typical Response Time**: 50-200ms (cached data)
- **Cache Refresh**: Every 60 seconds
- **WebSocket Updates**: 2-second check interval
- **Connection Cleanup**: 10 minutes idle

---

## 🐛 Debugging

### Get Cache Status
```bash
curl https://nba-api.local/api/v1/cache/status
```

### Refresh Cache Manually
```bash
curl -X POST https://nba-api.local/api/v1/cache/refresh
```

### Check if Game Exists
```bash
curl https://nba-api.local/api/v1/scoreboard/game/{gameId}/boxscore
```

---

## 📚 Full Documentation

For complete endpoint documentation, see:
- **API_ENDPOINTS.md** - All 23 endpoints with examples
- **IMPLEMENTATION_SUMMARY.md** - Technical implementation details
- **technical-details.md** - Architecture and design decisions

---

## 🔗 Related Resources

- **Python Reference API**: `nba-tracker-api/` directory
- **Frontend**: Check `nba-tracker/` for React/TypeScript UI
- **Configuration**: See `.env` for environment variables

---

## ✅ Feature Checklist

- ✅ 23 Endpoints Implemented
- ✅ Real-time WebSocket Updates
- ✅ Intelligent Caching
- ✅ Error Handling
- ✅ CORS Enabled
- ✅ TypeScript Compiled
- ✅ Production Ready

---

**Last Updated**: January 2024  
**Build Status**: ✅ PASSING  
**Total Endpoints**: 23/23  
**Feature Parity**: 100% with Python API
