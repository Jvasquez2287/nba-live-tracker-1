# Historical Game Data - Implementation Guide

## Problem Analysis

### Current Limitation
The TypeScript API only has access to **today's games** because it uses the free NBA CDN (`cdn.nba.com/static/json/liveData/scoreboard/`), which only provides current-day data.

### Python API Solution
The `nba-tracker-api` uses `nba_api` library which has access to **historical game data** via the official NBA Stats API (`stats.nba.com`).

```python
# From nba-tracker-api/app/services/schedule.py
from nba_api.stats.endpoints import scoreboardv2

games_data = scoreboardv2.ScoreboardV2(game_date=date, **api_kwargs).get_dict()
# This works for ANY date (past, present, or future if scheduled)
```

---

## Solution Options

### Option 1: Use NBA Stats API Directly (Recommended)
The `stats.nba.com` API is the official source used by `nba_api`.

**Endpoint**: `https://stats.nba.com/stats/scoreboard`
**Parameters**: `?GameDate=2026-01-25&LeagueID=00`

**Advantages**:
- ✅ Access to all historical games (entire NBA history)
- ✅ Complete game statistics
- ✅ Official source
- ✅ No library dependency

**TypeScript Implementation**:
```typescript
async function getGamesForDate(date: string): Promise<any> {
  const url = `https://stats.nba.com/stats/scoreboard?GameDate=${date}&LeagueID=00`;
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json',
      'Accept-Language': 'en-US,en;q=0.9',
      'Origin': 'https://nba.com',
      'Referer': 'https://nba.com/'
    }
  });
  
  return response.json();
}
```

### Option 2: Call Python API from TypeScript (Quick Fix)
Since the Python API is already running, you can call it from TypeScript for historical data.

**Advantages**:
- ✅ Minimal code changes
- ✅ Leverages existing Python implementation
- ✅ Single source of truth for historical data

**TypeScript Implementation**:
```typescript
async function getHistoricalGames(date: string): Promise<any> {
  const pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:8000';
  
  const response = await fetch(`${pythonApiUrl}/api/v1/schedule/date/${date}`, {
    method: 'GET'
  });
  
  return response.json();
}
```

### Option 3: Hybrid Approach (Best Practice)
- Use free NBA CDN for **today's games** (realtime, cached)
- Fall back to stats.nba.com for **historical games**
- Cache results in database for performance

---

## Recommended Implementation: Direct stats.nba.com API

### Step 1: Create Historical Data Service

Create `src/services/historicalData.ts`:

```typescript
import axios from 'axios';

const STATS_NBA_API = 'https://stats.nba.com/stats/scoreboard';

interface StatsNbaGame {
  GAME_ID: string;
  GAME_DATE: string;
  GAME_TIME: string;
  HOME_TEAM_ID: number;
  VISITOR_TEAM_ID: number;
  HOME_TEAM_NAME: string;
  VISITOR_TEAM_NAME: string;
  GAME_STATUS: number;
  HOME_TEAM_WINS: number;
  HOME_TEAM_LOSSES: number;
  VISITOR_TEAM_WINS: number;
  VISITOR_TEAM_LOSSES: number;
}

export async function getHistoricalGames(date: string): Promise<StatsNbaGame[]> {
  try {
    const response = await axios.get(STATS_NBA_API, {
      params: {
        GameDate: date,
        LeagueID: '00'
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Origin': 'https://nba.com',
        'Referer': 'https://nba.com/'
      },
      timeout: 10000
    });

    const resultSets = response.data.resultSets || [];
    const gameHeader = resultSets.find((rs: any) => rs.name === 'GameHeader');
    
    if (!gameHeader) {
      return [];
    }

    const headers = gameHeader.headers;
    const games = gameHeader.rowSet || [];

    return games.map((game: any[]) => {
      const gameObj: any = {};
      headers.forEach((header: string, idx: number) => {
        gameObj[header] = game[idx];
      });
      return gameObj;
    });

  } catch (error) {
    console.error('Error fetching historical games:', error);
    throw error;
  }
}

export async function getHistoricalBoxScore(gameId: string): Promise<any> {
  try {
    const response = await axios.get('https://stats.nba.com/stats/boxscore', {
      params: {
        GameID: gameId
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Origin': 'https://nba.com',
        'Referer': 'https://nba.com/'
      },
      timeout: 10000
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching historical box score:', error);
    throw error;
  }
}
```

### Step 2: Update Schedule Route

Modify `src/routes/schedule.ts` to use historical data:

```typescript
import { getHistoricalGames } from '../services/historicalData';

router.get('/date/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const today = new Date().toISOString().split('T')[0];

    // For today's games, use cache
    if (date === today) {
      const scoreboardData = await dataCache.getScoreboard();
      // ... existing today logic
    }

    // For historical games, use stats.nba.com
    const games = await getHistoricalGames(date);
    
    res.json({
      date,
      games: games.map(game => ({
        gameId: game.GAME_ID,
        gameStatus: game.GAME_STATUS,
        homeTeam: {
          teamName: game.HOME_TEAM_NAME,
          teamId: game.HOME_TEAM_ID,
          wins: game.HOME_TEAM_WINS,
          losses: game.HOME_TEAM_LOSSES
        },
        awayTeam: {
          teamName: game.VISITOR_TEAM_NAME,
          teamId: game.VISITOR_TEAM_ID,
          wins: game.VISITOR_TEAM_WINS,
          losses: game.VISITOR_TEAM_LOSSES
        }
      })),
      total: games.length,
      source: 'stats.nba.com'
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to fetch games' });
  }
});
```

### Step 3: Install Axios (if not already installed)

```bash
npm install axios
```

---

## API Response Comparison

### Current (Free CDN) - Today Only
```json
{
  "date": "2026-01-27",
  "games": [...],
  "total": 10,
  "note": "Historical game data not available. NBA API only provides current day games."
}
```

### After Update (stats.nba.com) - Any Date
```json
{
  "date": "2026-01-25",
  "games": [
    {
      "gameId": "0021500001",
      "gameStatus": 3,
      "homeTeam": {
        "teamName": "Los Angeles Lakers",
        "teamId": 1610612747,
        "wins": 28,
        "losses": 12
      },
      "awayTeam": {
        "teamName": "Boston Celtics",
        "teamId": 1610612738,
        "wins": 32,
        "losses": 8
      }
    }
  ],
  "total": 1,
  "source": "stats.nba.com"
}
```

---

## Advantages of stats.nba.com Approach

| Feature | CDN (Current) | stats.nba.com |
|---------|--------------|---------------|
| **Today's Games** | ✅ Real-time | ✅ Available |
| **Historical Games** | ❌ No | ✅ Full history |
| **Game Details** | Limited | ✅ Complete |
| **Performance** | Excellent | Good (cached) |
| **Updates** | Automatic | Hourly (typical) |
| **Reliability** | Very High | Very High |

---

## Implementation Steps

1. **Create `historicalData.ts` service** - Add the API client for stats.nba.com
2. **Update `schedule.ts` route** - Check date and call appropriate source
3. **Add error handling** - Fallback to CDN if stats.nba.com fails
4. **Test** - Verify historical dates work
5. **Update docs** - Note the new capability

---

## Rate Limiting Considerations

The stats.nba.com API has rate limiting:
- Recommended: 1 request per second
- Add delays between requests if needed

```typescript
async function waitForRateLimit() {
  await new Promise(resolve => setTimeout(resolve, 100)); // 100ms between requests
}
```

---

## Security Headers

The stats.nba.com API requires proper headers to avoid being blocked:

```typescript
headers: {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Origin': 'https://nba.com',
  'Referer': 'https://nba.com/'
}
```

---

## Next Steps

Would you like me to:
1. **Implement the historical data service** - Create `historicalData.ts` with stats.nba.com integration
2. **Update the schedule route** - Modify to use both CDN and stats.nba.com
3. **Add caching** - Cache historical queries to database
4. **Add all three** - Complete implementation

Let me know which approach you prefer!
