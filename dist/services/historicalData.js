"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHistoricalGames = getHistoricalGames;
exports.getHistoricalBoxScore = getHistoricalBoxScore;
const axios_1 = __importDefault(require("axios"));
const NBA = __importStar(require("nba"));
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
// Complete mapping of NBA team IDs to tricodes (all 30 teams)
// Source: Official NBA Stats API team IDs
const TEAM_ID_TO_TRICODE = {
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
    1610612766: 'CHA' // Charlotte Hornets
};
const TEAM_NAMES = {
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
function getTeamTricode(teamId) {
    return TEAM_ID_TO_TRICODE[teamId] || 'UNK';
}
function getTeamName(tricode) {
    return TEAM_NAMES[tricode] || 'Unknown';
}
async function getHistoricalGames(date) {
    try {
        console.log(`Fetching historical games for ${date}`);
        // Try Python API first (nba-tracker-api) since it has reliable access via nba_api library
        try {
            console.log(`Attempting to fetch from Python API at ${PYTHON_API}`);
            const pythonResponse = await axios_1.default.get(`${PYTHON_API}/schedule/date/${date}`, {
                timeout: REQUEST_TIMEOUT,
                validateStatus: (status) => status < 500 // Accept any successful response or 4xx
            });
            if (pythonResponse.data && pythonResponse.data.games && Array.isArray(pythonResponse.data.games)) {
                const games = pythonResponse.data.games;
                if (games.length > 0) {
                    console.log(`Successfully fetched ${games.length} games from Python API`);
                    // Map Python API response to our format
                    return games.map((game) => {
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
        }
        catch (pythonError) {
            console.log('Python API not available, trying nba package');
        }
        // Fallback: Try using nba npm package (leagueGameLog)
        try {
            console.log(`Attempting to fetch from nba package (leagueGameLog)`);
            await enforceRateLimit();
            // Format date as MM/DD/YYYY for nba package
            const [year, month, day] = date.split('-');
            const formattedDate = `${month}/${day}/${year}`;
            // Determine season from the date
            const currentYear = parseInt(year);
            const currentMonth = parseInt(month);
            const season = currentMonth < 10 ? `${currentYear - 1}-${currentYear}` : `${currentYear}-${currentYear + 1}`;
            const result = await NBA.stats.leagueGameLog({
                Counter: 1000,
                DateFrom: formattedDate,
                DateTo: formattedDate,
                Direction: 'DESC',
                LeagueID: '00',
                PlayerOrTeam: 'T',
                Season: season,
                SeasonType: 'Regular Season',
                Sorter: 'DATE'
            });
            if (result && Array.isArray(result)) {
                console.log(`Found ${result.length} game records from nba package`);
                // Group by game ID since league game log returns one row per team per game
                const gamesMap = new Map();
                for (const gameLog of result) {
                    const gameId = gameLog.GAME_ID;
                    if (!gamesMap.has(gameId)) {
                        // Initialize game entry
                        gamesMap.set(gameId, {
                            gameId: gameId,
                            gameDate: gameLog.GAME_DATE || date,
                            gameStatus: 3, // Assume Final for historical games
                            gameStatusText: 'Final',
                            homeTeam: null,
                            awayTeam: null
                        });
                    }
                    const game = gamesMap.get(gameId);
                    const teamId = parseInt(gameLog.TEAM_ID || '0');
                    // Determine if home or away based on team ID order
                    // NBA convention: rowSet sorts with home team first
                    if (!game.homeTeam) {
                        game.homeTeam = {
                            teamName: gameLog.TEAM_NAME || getTeamName(gameLog.TEAM_ABBREVIATION || 'UNK'),
                            teamId: teamId,
                            teamTricode: gameLog.TEAM_ABBREVIATION || 'UNK',
                            wins: parseInt(gameLog.W || '0'),
                            losses: parseInt(gameLog.L || '0'),
                            score: parseInt(gameLog.PTS || '0')
                        };
                    }
                    else {
                        game.awayTeam = {
                            teamName: gameLog.TEAM_NAME || getTeamName(gameLog.TEAM_ABBREVIATION || 'UNK'),
                            teamId: teamId,
                            teamTricode: gameLog.TEAM_ABBREVIATION || 'UNK',
                            wins: parseInt(gameLog.W || '0'),
                            losses: parseInt(gameLog.L || '0'),
                            score: parseInt(gameLog.PTS || '0')
                        };
                    }
                }
                const games = Array.from(gamesMap.values());
                if (games.length > 0) {
                    console.log(`Successfully processed ${games.length} games from nba package`);
                    return games;
                }
            }
        }
        catch (nbaError) {
            console.log('nba package failed:', nbaError.message);
        }
        // All sources failed
        console.log(`No games found for ${date} from any source`);
        return [];
    }
    catch (error) {
        console.error(`Error in getHistoricalGames for ${date}:`, error.message);
        return [];
    }
}
async function getHistoricalBoxScore(gameId) {
    try {
        console.log(`Fetching box score for game ${gameId}`);
        // Enforce rate limiting
        await enforceRateLimit();
        // Try nba package first
        try {
            const result = await NBA.stats.boxScoreSummaryV2({
                GameID: gameId
            });
            console.log(`Successfully fetched box score for game ${gameId} from nba package`);
            return result;
        }
        catch (nbaError) {
            console.log('nba package box score failed, returning error');
            throw nbaError;
        }
    }
    catch (error) {
        console.error(`Error fetching box score for game ${gameId}:`, error.message);
        throw error;
    }
}
function getGameStatusText(status) {
    const statusMap = {
        1: 'Not Started',
        2: 'In Progress',
        3: 'Final',
        4: 'Final/OT',
        5: 'Postponed',
        6: 'Cancelled',
        7: 'Suspended'
    };
    return statusMap[status] || 'Unknown';
}
exports.default = {
    getHistoricalGames,
    getHistoricalBoxScore
};
//# sourceMappingURL=historicalData.js.map