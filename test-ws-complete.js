const WebSocket = require('ws');

console.log('\n🎬 Complete /api/v1/ws Test\n');
console.log('=' .repeat(60));

const ws = new WebSocket('ws://localhost:8000/api/v1/ws');
let messageCount = 0;

ws.on('open', () => {
  console.log('✅ Connected to /api/v1/ws\n');
});

ws.on('message', (data) => {
  messageCount++;
  try {
    const parsed = JSON.parse(data);
    
    if (parsed.status === 'connected') {
      console.log(`📨 Message ${messageCount}: Acknowledgement`);
      console.log(`   - Status: ${parsed.status}`);
      console.log(`   - Message: ${parsed.message}\n`);
    } else if (parsed.allPlaybyplay) {
      console.log(`📨 Message ${messageCount}: All Playbyplay Data`);
      console.log(`   - Total games: ${parsed.gameCount}`);
      console.log(`   - Games with data: ${parsed.allPlaybyplay.length}`);
      parsed.allPlaybyplay.forEach((game, i) => {
        console.log(`     Game ${i + 1}: ${game.gameId} - ${game.plays.length} plays`);
      });
      console.log(`   - Timestamp: ${parsed.timestamp}\n`);
    } else if (parsed.scoreboard) {
      console.log(`📨 Message ${messageCount}: Scoreboard Update`);
      console.log(`   - Games: ${parsed.scoreboard.games.length}`);
      console.log(`   - Date: ${parsed.scoreboard.gameDate}`);
      if (parsed.scoreboard.games.length > 0) {
        const game = parsed.scoreboard.games[0];
        console.log(`   - First game: ${game.homeTeam?.teamName} vs ${game.awayTeam?.teamName}`);
        console.log(`     Status: ${game.gameStatusText}\n`);
      }
      
      // Close after receiving a few messages
      if (messageCount >= 3) {
        ws.close();
      }
    }
  } catch (e) {
    console.log(`❌ Message ${messageCount}: Parse error - ${e.message}`);
  }
});

ws.on('error', (error) => {
  console.log('❌ Error:', error.message);
});

ws.on('close', () => {
  console.log('=' .repeat(60));
  console.log(`\n✋ Connection closed after ${messageCount} messages\n`);
  process.exit(0);
});

setTimeout(() => {
  console.log('Timeout - closing connection');
  ws.close();
}, 10000);
