# NBA API - Endpoints & WebSocket Usage Examples

## Base URL
```
http://nba.m-api.net  (Production on Plesk)
http://localhost:8000 (Local Development)
```

---

## HTTP Endpoints

### 1. Health Check
**GET** `/`

Check if the API is running.

```bash
curl http://localhost:8000/
```

**Response:**
```json
{
  "message": "NBA Live API is running",
  "timestamp": "2026-01-27T10:30:45.123Z",
  "environment": "development",
  "iisnode": false
}
```

---

### 2. API Routes

All API endpoints use the `/api/v1` prefix:

#### Schedule
**GET** `/api/v1/schedule`
```bash
curl http://localhost:8000/api/v1/schedule
```

#### Standings
**GET** `/api/v1/standings`
```bash
curl http://localhost:8000/api/v1/standings
```

#### Players
**GET** `/api/v1/players`
```bash
curl http://localhost:8000/api/v1/players
```

#### Teams
**GET** `/api/v1/teams`
```bash
curl http://localhost:8000/api/v1/teams
```

#### Search
**GET** `/api/v1/search`
```bash
curl http://localhost:8000/api/v1/search
```

#### Predictions
**GET** `/api/v1/predictions`
```bash
curl http://localhost:8000/api/v1/predictions
```

#### League
**GET** `/api/v1/league`
```bash
curl http://localhost:8000/api/v1/league
```

#### Scoreboard
**GET** `/api/v1/scoreboard`
```bash
curl http://localhost:8000/api/v1/scoreboard
```

#### Play-by-Play
**GET** `/api/v1/scoreboard/playbyplay/:gameId`
```bash
curl http://localhost:8000/api/v1/scoreboard/playbyplay/0021900001
```

---

## WebSocket Endpoints

### 1. Scoreboard WebSocket (Live Scores)
**WS** `/api/v1/ws`

Real-time NBA scoreboard updates.

**JavaScript Example:**
```javascript
// Connect to scoreboard WebSocket
const ws = new WebSocket('ws://localhost:8000/api/v1/ws');

// Handle connection open
ws.onopen = () => {
  console.log('Connected to scoreboard WebSocket');
};

// Handle incoming messages
ws.onmessage = (event) => {
  const scoreboard = JSON.parse(event.data);
  console.log('Latest scores:', scoreboard);
  
  // Update UI with live scores
  scoreboard.games?.forEach(game => {
    console.log(`${game.awayTeam} vs ${game.homeTeam}: ${game.awayScore}-${game.homeScore}`);
  });
};

// Handle errors
ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

// Handle connection close
ws.onclose = () => {
  console.log('Scoreboard WebSocket disconnected');
};

// Close connection when done
// ws.close();
```

---

### 2. Play-by-Play WebSocket (Live Game Updates)
**WS** `/api/v1/playbyplay/ws/:gameId`

Real-time play-by-play updates for a specific game.

**JavaScript Example:**
```javascript
const gameId = '0021900001'; // NBA game ID

// Connect to play-by-play WebSocket
const pbpWs = new WebSocket(`ws://localhost:8000/api/v1/playbyplay/ws/${gameId}`);

pbpWs.onopen = () => {
  console.log(`Connected to play-by-play WebSocket for game ${gameId}`);
};

pbpWs.onmessage = (event) => {
  const playByPlay = JSON.parse(event.data);
  console.log('Play:', playByPlay);
  
  // Display play-by-play data
  if (playByPlay.action) {
    console.log(`${playByPlay.period}Q: ${playByPlay.description}`);
  }
};

pbpWs.onerror = (error) => {
  console.error('Play-by-Play WebSocket error:', error);
};

pbpWs.onclose = () => {
  console.log('Play-by-Play WebSocket disconnected');
};
```

---

## Complete Example: Live Scoreboard Dashboard

```javascript
class NBALiveDashboard {
  constructor() {
    this.scoreboardWs = null;
    this.playByPlayWs = null;
  }

  // Connect to scoreboard
  connectScoreboard() {
    this.scoreboardWs = new WebSocket('ws://localhost:8000/api/v1/ws');
    
    this.scoreboardWs.onmessage = (event) => {
      const scoreboard = JSON.parse(event.data);
      this.updateScoreboard(scoreboard);
    };
  }

  // Connect to specific game play-by-play
  connectPlayByPlay(gameId) {
    this.playByPlayWs = new WebSocket(`ws://localhost:8000/api/v1/playbyplay/ws/${gameId}`);
    
    this.playByPlayWs.onmessage = (event) => {
      const play = JSON.parse(event.data);
      this.addPlayEvent(play);
    };
  }

  updateScoreboard(scoreboard) {
    console.log('Games today:');
    scoreboard.games?.forEach(game => {
      console.log(`${game.awayTeam} (${game.awayScore}) vs ${game.homeTeam} (${game.homeScore})`);
    });
  }

  addPlayEvent(play) {
    console.log(`[${play.period}Q] ${play.description}`);
  }

  disconnect() {
    if (this.scoreboardWs) this.scoreboardWs.close();
    if (this.playByPlayWs) this.playByPlayWs.close();
  }
}

// Usage
const dashboard = new NBALiveDashboard();
dashboard.connectScoreboard();
dashboard.connectPlayByPlay('0021900001');

// Cleanup when done
// dashboard.disconnect();
```

---

## Using with Fetch API (HTTP Requests)

```javascript
// Fetch schedule
fetch('http://localhost:8000/api/v1/schedule')
  .then(res => res.json())
  .then(data => console.log('Schedule:', data))
  .catch(err => console.error('Error:', err));

// Fetch standings
fetch('http://localhost:8000/api/v1/standings')
  .then(res => res.json())
  .then(data => console.log('Standings:', data))
  .catch(err => console.error('Error:', err));

// Fetch specific play-by-play
fetch('http://localhost:8000/api/v1/scoreboard/playbyplay/0021900001')
  .then(res => res.json())
  .then(data => console.log('Play-by-Play:', data))
  .catch(err => console.error('Error:', err));
```

---

## Using cURL

```bash
# Health check
curl http://localhost:8000/

# Get scoreboard
curl http://localhost:8000/api/v1/scoreboard

# Get standings
curl http://localhost:8000/api/v1/standings

# Get players
curl http://localhost:8000/api/v1/players

# Get teams
curl http://localhost:8000/api/v1/teams

# Get play-by-play for specific game
curl http://localhost:8000/api/v1/scoreboard/playbyplay/0021900001
```

---

## Response Format

### Scoreboard Response
```json
{
  "games": [
    {
      "gameId": "0021900001",
      "awayTeam": "Lakers",
      "homeTeam": "Celtics",
      "awayScore": 105,
      "homeScore": 110,
      "period": 4,
      "timeRemaining": "5:30",
      "gameStatus": "FINAL"
    }
  ],
  "timestamp": "2026-01-27T10:30:45.123Z"
}
```

### Play-by-Play Response
```json
{
  "gameId": "0021900001",
  "period": 1,
  "timeRemaining": "8:45",
  "action": "2PT",
  "description": "LeBron James 2PT Layup",
  "awayScore": 5,
  "homeScore": 3,
  "timestamp": "2026-01-27T10:30:45.123Z"
}
```

---

## Error Handling

```javascript
// HTTP Error Handling
fetch('http://localhost:8000/api/v1/scoreboard')
  .then(res => {
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return res.json();
  })
  .catch(error => {
    console.error('Fetch error:', error);
  });

// WebSocket Error Handling
const ws = new WebSocket('ws://localhost:8000/api/v1/ws');

ws.onerror = (event) => {
  console.error('WebSocket error:', event);
};

ws.onclose = (event) => {
  if (!event.wasClean) {
    console.error('WebSocket closed abnormally');
    // Implement reconnection logic
  }
};
```

---

## Notes

- **CORS**: All endpoints allow cross-origin requests (`*`)
- **Authentication**: Currently no authentication required
- **Rate Limiting**: None implemented (add as needed)
- **Data Updates**: WebSocket connections receive updates every few seconds
- **Game IDs**: Use standard NBA game IDs (format: `002YYYYMMDDNNNN`)
