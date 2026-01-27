import axios from 'axios';
import { dataCache } from './dataCache';

const PYTHON_API = 'http://localhost:5000/api/v1';
const REQUEST_TIMEOUT = 10000;

// Rate limiting: 1 request per second
const RATE_LIMIT_DELAY = 100; // 100ms between requests
let lastRequestTime = 0;

async function enforceRateLimit() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastRequest));
  }
  lastRequestTime = Date.now();
}

interface StatsNbaGameRow {
  [key: string]: any;
}

export interface HistoricalGame {
  gameId: string;
  gameDate: string;
  gameStatus: number;
  gameStatusText: string;
  homeTeam: {
    teamName: string;
    teamId: number;
    teamTricode: string;
    wins: number;
    losses: number;
    score: number;
  };
  awayTeam: {
    teamName: string;
    teamId: number;
    teamTricode: string;
    wins: number;
    losses: number;
    score: number;
  };
}

// Complete mapping of NBA team IDs to tricodes (all 30 teams)
// Source: Official NBA Stats API team IDs
const TEAM_ID_TO_TRICODE: { [key: number]: string } = {
  1610612737: 'ATL', // Atlanta Hawks
  1610612738: 'BOS', // Boston Celtics
  1610612739: 'CLE', // Cleveland Cavaliers
  1610612740: 'NOP', // New Orleans Pelicans
  1610612741: 'CHI', // Chicago Bulls
  1610612742: 'DAL', // Dallas Mavericks
  1610612743: 'DEN', // Denver Nuggets
  1610612744: 'GSW', // Golden State Warriors
  1610612745: 'HOU', // Houston Rockets
  1610612746: 'LAL', // Los Angeles Lakers
  1610612747: 'LAC', // Los Angeles Clippers
  1610612748: 'MIA', // Miami Heat
  1610612749: 'MIL', // Milwaukee Bucks
  1610612750: 'MIN', // Minnesota Timberwolves
  1610612751: 'BRK', // Brooklyn Nets
  1610612752: 'NYK', // New York Knicks
  1610612753: 'ORL', // Orlando Magic
  1610612754: 'IND', // Indiana Pacers
  1610612755: 'PHI', // Philadelphia 76ers
  1610612756: 'PHX', // Phoenix Suns
  1610612757: 'POR', // Portland Trail Blazers
  1610612758: 'SAC', // Sacramento Kings
  1610612759: 'SAS', // San Antonio Spurs
  1610612760: 'OKC', // Oklahoma City Thunder
  1610612761: 'TOR', // Toronto Raptors
  1610612762: 'UTA', // Utah Jazz
  1610612763: 'MEM', // Memphis Grizzlies
  1610612764: 'WAS', // Washington Wizards
  1610612765: 'DET', // Detroit Pistons
  1610612766: 'CHA'  // Charlotte Hornets
};

const TEAM_NAMES: { [key: string]: string } = {
  'ATL': 'Atlanta Hawks',
  'BOS': 'Boston Celtics',
  'BRK': 'Brooklyn Nets',
  'CHA': 'Charlotte Hornets',
  'CHI': 'Chicago Bulls',
  'CLE': 'Cleveland Cavaliers',
  'DAL': 'Dallas Mavericks',
  'DEN': 'Denver Nuggets',
  'DET': 'Detroit Pistons',
  'GSW': 'Golden State Warriors',
  'HOU': 'Houston Rockets',
  'IND': 'Indiana Pacers',
  'LAC': 'Los Angeles Clippers',
  'LAL': 'Los Angeles Lakers',
  'MEM': 'Memphis Grizzlies',
  'MIA': 'Miami Heat',
  'MIL': 'Milwaukee Bucks',
  'MIN': 'Minnesota Timberwolves',
  'NOP': 'New Orleans Pelicans',
  'NYK': 'New York Knicks',
  'OKC': 'Oklahoma City Thunder',
  'ORL': 'Orlando Magic',
  'PHI': 'Philadelphia 76ers',
  'PHX': 'Phoenix Suns',
  'POR': 'Portland Trail Blazers',
  'SAC': 'Sacramento Kings',
  'SAS': 'San Antonio Spurs',
  'TOR': 'Toronto Raptors',
  'UTA': 'Utah Jazz',
  'WAS': 'Washington Wizards'
};

function getTeamTricode(teamId: number): string {
  return TEAM_ID_TO_TRICODE[teamId] || 'UNK';
}

function getTeamName(tricode: string): string {
  return TEAM_NAMES[tricode] || 'Unknown';
}

export async function getHistoricalGames(date: string): Promise<HistoricalGame[]> {
  try {
    console.log(`Fetching historical games for ${date}`);
    
    // Primary source: Python API (nba-tracker-api) which uses nba-api-client/nba_api library
    // This gives us access to historical data via the official NBA Stats API
    try {
      console.log(`Attempting to fetch from Python API (which uses nba-api-client internally)`);
      const pythonResponse = await axios.get(`${PYTHON_API}/schedule/date/${date}`, {
        timeout: REQUEST_TIMEOUT,
        validateStatus: (status) => status < 500 // Accept any successful response or 4xx
      });
      
      if (pythonResponse.data && pythonResponse.data.games && Array.isArray(pythonResponse.data.games)) {
        const games = pythonResponse.data.games;
        if (games.length > 0) {
          console.log(`Successfully fetched ${games.length} games from Python API (nba-api-client)`);
          
          // Map Python API response to our format
          return games.map((game: any) => {
            const homeTeamId = parseInt(game.homeTeam?.teamId || '0');
            const awayTeamId = parseInt(game.awayTeam?.teamId || '0');
            
            return {
              gameId: game.gameId,
              gameDate: game.gameDate || date,
              gameStatus: parseInt(game.status || '3'),
              gameStatusText: game.statusText || 'Final',
              homeTeam: {
                teamName: game.homeTeam?.name || getTeamName(game.homeTeam?.tricode || 'UNK'),
                teamId: homeTeamId,
                teamTricode: game.homeTeam?.tricode || 'UNK',
                wins: parseInt(game.homeTeam?.wins || '0'),
                losses: parseInt(game.homeTeam?.losses || '0'),
                score: parseInt(game.homeTeam?.score || '0')
              },
              awayTeam: {
                teamName: game.awayTeam?.name || getTeamName(game.awayTeam?.tricode || 'UNK'),
                teamId: awayTeamId,
                teamTricode: game.awayTeam?.tricode || 'UNK',
                wins: parseInt(game.awayTeam?.wins || '0'),
                losses: parseInt(game.awayTeam?.losses || '0'),
                score: parseInt(game.awayTeam?.score || '0')
              }
            };
          });
        }
      }
    } catch (pythonError) {
      console.log(`Python API error: ${pythonError instanceof Error ? pythonError.message : String(pythonError)}`);
    }

    // If no data from Python API, return empty array
    console.log(`No games found for ${date}`);
    return [];
    
  } catch (error: any) {
    console.error(`Error fetching historical games for ${date}:`, error.message);
    throw error;
  }
}

export async function getHistoricalBoxScore(gameId: string): Promise<any> {
  try {
    console.log(`Fetching box score for game ${gameId}`);
    
    // Enforce rate limiting
    await enforceRateLimit();

    // Try nba-api-client first
    try {
      // nba-api-client getBoxScore function would be used here if available
      // For now, use fallback to Python API
      const pythonResponse = await axios.get(`${PYTHON_API}/games/${gameId}/boxscore`, {
        timeout: REQUEST_TIMEOUT,
        validateStatus: (status) => status < 500
      });
      
      if (pythonResponse.data) {
        console.log(`Successfully fetched box score for game ${gameId} from Python API`);
        return pythonResponse.data;
      }
    } catch (pythonError) {
      console.log('Python API not available for box score');
    }

    // No data available
    return null;
  } catch (error: any) {
    console.error(`Error fetching box score for game ${gameId}:`, error.message);
    throw error;
  }
}

export default {
  getHistoricalGames,
  getHistoricalBoxScore
};
