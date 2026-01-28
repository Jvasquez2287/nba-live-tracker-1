"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleService = void 0;
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../utils/config");
// Cache for schedule data
let scheduleCache = null;
let scheduleCacheTimestamp = 0;
const SCHEDULE_CACHE_TTL = 3600 * 1000; // 1 hour in milliseconds
const SCHEDULE_URL = 'https://cdn.nba.com/static/json/staticData/scheduleLeagueV2_1.json';
async function fetchNBASchedule() {
    try {
        const proxyConfig = config_1.config.getApiProxyConfig();
        const axiosConfig = {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        };
        if (proxyConfig) {
            axiosConfig.proxy = proxyConfig;
        }
        const response = await axios_1.default.get(SCHEDULE_URL, axiosConfig);
        let data = response.data;
        // Handle different response types
        if (typeof data === 'string') {
            // If it's a string, try to parse as JSON
            try {
                data = JSON.parse(data);
            }
            catch (e) {
                // If JSON parse fails, try to extract from HTML
                if (data.includes('<pre')) {
                    const jsonMatch = data.match(/<pre[^>]*>(.*?)<\/pre>/s);
                    if (jsonMatch) {
                        data = JSON.parse(jsonMatch[1]);
                    }
                    else {
                        throw new Error('Could not extract JSON from HTML pre tags');
                    }
                }
                else if (data.includes('<html') || data.includes('<!DOCTYPE')) {
                    throw new Error('Received HTML response instead of JSON');
                }
                else {
                    throw e;
                }
            }
        }
        let games = data.leagueSchedule?.gameDates || [];
        data.league = {
            season: data.leagueSchedule?.seasonId,
            games: games
        };
        console.log('\n==============================================');
        console.log('Fetched NBA schedule data from CDN');
        console.log(`Status: ${response.status} ${response.statusText}`);
        console.log(`Data structure:`, Object.keys(data));
        console.log(`Number of games:`, data.league?.games.length || 'N/A');
        console.log('==============================================\n');
        return data;
    }
    catch (error) {
        console.error('Error fetching NBA schedule:', error instanceof Error ? error.message : error);
        throw new Error('Failed to fetch NBA schedule');
    }
}
function parseScheduleData(rawData) {
    const season = rawData.league?.season || new Date().getFullYear();
    const games = rawData.league?.games || [];
    return {
        season,
        games,
        lastUpdated: new Date().toISOString()
    };
}
async function getSchedule() {
    const currentTime = Date.now();
    // Return cached data if available and not expired
    if (scheduleCache && (currentTime - scheduleCacheTimestamp) < SCHEDULE_CACHE_TTL) {
        console.log('[Schedule] Returning cached schedule data');
        return scheduleCache;
    }
    try {
        console.log('[Schedule] Fetching fresh schedule data');
        const rawData = await fetchNBASchedule();
        scheduleCache = parseScheduleData(rawData);
        scheduleCacheTimestamp = currentTime;
        console.log(`[Schedule] Successfully fetched schedule with ${scheduleCache.games.length} games`);
        return scheduleCache;
    }
    catch (error) {
        // Return cached data even if expired, as fallback
        if (scheduleCache) {
            console.warn('[Schedule] Using stale cache as fallback');
            return scheduleCache;
        }
        throw error;
    }
}
async function getSchedules() {
    const schedule = await getSchedule();
    if (schedule && schedule.games) {
        const allSchedules = schedule.games.map(gameDate => {
            let gameDateStr;
            if (typeof gameDate.gameDate === 'string') {
                // Remove time portion if present (e.g., "MM/DD/YYYY 00:00:00" -> "MM/DD/YYYY")
                const dateOnly = gameDate.gameDate.split(' ')[0];
                // Convert MM/DD/YYYY to YYYY-MM-DD
                const parts = dateOnly.split('/');
                if (parts.length === 3) {
                    const [month, day, year] = parts;
                    gameDateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                }
                else {
                    gameDateStr = dateOnly; // Already in correct format
                }
            }
            else {
                // Convert date to ISO format YYYY-MM-DD
                gameDateStr = new Date(gameDate.gameDate).toISOString().split('T')[0];
            }
            return {
                gameDate: gameDateStr,
                games: gameDate.games ? formatGameResponse(gameDate.games) : []
            };
        });
        return allSchedules;
    }
    return [];
}
async function getTodaysSchedule() {
    try {
        const schedule = await getSchedule();
        const todayDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
        // Find today's game date entry
        const todayGameDate = schedule.games.find(gameDate => {
            if (!gameDate.gameDate)
                return false;
            let gameDateStr;
            if (typeof gameDate.gameDate === 'string') {
                // Remove time portion if present (e.g., "MM/DD/YYYY 00:00:00" -> "MM/DD/YYYY")
                const dateOnly = gameDate.gameDate.split(' ')[0];
                // Convert MM/DD/YYYY to YYYY-MM-DD
                const parts = dateOnly.split('/');
                if (parts.length === 3) {
                    const [month, day, year] = parts;
                    gameDateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                }
                else {
                    gameDateStr = dateOnly; // Already in correct format
                }
            }
            else {
                // Convert date to ISO format YYYY-MM-DD
                gameDateStr = new Date(gameDate.gameDate).toISOString().split('T')[0];
            }
            return gameDateStr === todayDate;
        });
        if (todayGameDate) {
            return {
                gameDate: todayDate,
                games: todayGameDate.games ? formatGameResponse(todayGameDate.games) : []
            };
        }
        // Return empty games for today if none found
        console.log('[Schedule] No games found for today:', todayDate);
        return {
            gameDate: todayDate,
            games: []
        };
    }
    catch (error) {
        console.error('[Schedule] Error getting today\'s games:', error instanceof Error ? error.message : error);
        throw error;
    }
}
async function getScheduleByDate(date) {
    try {
        const schedule = await getSchedule();
        // Find game date entry matching the provided date
        const gameDateEntry = schedule.games.find(gameDate => {
            if (!gameDate.gameDate)
                return false;
            let gameDateStr;
            if (typeof gameDate.gameDate === 'string') {
                // Remove time portion if present (e.g., "MM/DD/YYYY 00:00:00" -> "MM/DD/YYYY")
                const dateOnly = gameDate.gameDate.split(' ')[0];
                // Convert MM/DD/YYYY to YYYY-MM-DD
                const parts = dateOnly.split('/');
                if (parts.length === 3) {
                    const [month, day, year] = parts;
                    gameDateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                }
                else {
                    gameDateStr = dateOnly; // Already in correct format
                }
            }
            else {
                // Convert date to ISO format YYYY-MM-DD
                gameDateStr = new Date(gameDate.gameDate).toISOString().split('T')[0];
            }
            return gameDateStr.includes(date);
        });
        if (gameDateEntry) {
            return {
                gameDate: date,
                games: gameDateEntry.games ? formatGameResponse(gameDateEntry.games) : []
            };
        }
        // Return empty games for the specified date if none found
        console.log('[Schedule] No games found for date:', date);
        return {
            gameDate: date,
            games: []
        };
    }
    catch (error) {
        console.error('[Schedule] Error getting games by date:', error instanceof Error ? error.message : error);
        throw error;
    }
}
async function refreshSchedule() {
    try {
        console.log('[Schedule] Manually refreshing schedule data');
        const rawData = await fetchNBASchedule();
        scheduleCache = parseScheduleData(rawData);
        scheduleCacheTimestamp = Date.now();
        console.log(`[Schedule] Successfully refreshed schedule with ${scheduleCache.games.length} games`);
        return scheduleCache;
    }
    catch (error) {
        console.error('[Schedule] Error refreshing schedule:', error instanceof Error ? error.message : error);
        throw error;
    }
}
function clearScheduleCache() {
    scheduleCache = null;
    scheduleCacheTimestamp = 0;
    console.log('[Schedule] Cache cleared');
}
function formatGameResponse(games) {
    return games.map((game) => ({
        gameId: game.gameId,
        gameStatus: game.gameStatus || 0,
        gameStatusText: game.gameStatusText || '',
        period: game.period || 0,
        gameClock: game.gameClock || null,
        gameTimeUTC: game.gameTimeUTC || '',
        homeTeam: {
            teamId: game.homeTeam?.teamId,
            teamName: game.homeTeam?.teamName || '',
            teamCity: game.homeTeam?.teamCity || '',
            teamTricode: game.homeTeam?.teamTricode || '',
            wins: game.homeTeam?.wins || 0,
            losses: game.homeTeam?.losses || 0,
            score: game.homeTeam?.score || 0,
            timeoutsRemaining: game.homeTeam?.timeoutsRemaining || 0
        },
        awayTeam: {
            teamId: game.awayTeam?.teamId,
            teamName: game.awayTeam?.teamName || '',
            teamCity: game.awayTeam?.teamCity || '',
            teamTricode: game.awayTeam?.teamTricode || '',
            wins: game.awayTeam?.wins || 0,
            losses: game.awayTeam?.losses || 0,
            score: game.awayTeam?.score || 0,
            timeoutsRemaining: game.awayTeam?.timeoutsRemaining || 0
        },
        gameLeaders: game.pointsLeaders || null
    }));
}
exports.scheduleService = {
    getSchedules,
    getTodaysSchedule,
    getScheduleByDate,
    refreshSchedule,
    clearScheduleCache
};
//# sourceMappingURL=schedule.js.map