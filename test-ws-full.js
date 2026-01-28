const WebSocket = require('ws');

console.log('\n🔧 WebSocket Full Test\n');
console.log('=' . repeat(50));

// Test 1: Scoreboard WebSocket
console.log('\nTest 1: Scoreboard WebSocket');
console.log('URL: ws://127.0.0.1:8000/api/v1/ws\n');

const ws1 = new WebSocket('ws://127.0.0.1:8000/api/v1/ws');
let scoreboardReceived = false;

ws1.on('open', () => {
  console.log('✅ [Scoreboard] Connected!');
});

ws1.on('message', (data) => {
  try {
    const parsed = JSON.parse(data);
    
    if (parsed.status === 'connected') {
      console.log('📨 [Scoreboard] Connection acknowledgement received');
      console.log(`   Message: ${parsed.message}`);
    } else if (parsed.scoreboard) {
      scoreboardReceived = true;
      console.log('📊 [Scoreboard] Received scoreboard data!');
      console.log(`   Games count: ${parsed.scoreboard.games?.length || 0}`);
      console.log(`   Game date: ${parsed.scoreboard.gameDate}`);
      
      if (parsed.scoreboard.games && parsed.scoreboard.games.length > 0) {
        const game = parsed.scoreboard.games[0];
        console.log(`   First game:`);
        console.log(`     - ID: ${game.gameId}`);
        console.log(`     - Status: ${game.gameStatus} (${game.gameStatusText})`);
        console.log(`     - Home: ${game.homeTeam?.teamName}`);
        console.log(`     - Away: ${game.awayTeam?.teamName}`);
      }
      ws1.close();
    } else {
      console.log('📨 [Scoreboard] Unknown message:', JSON.stringify(parsed).substring(0, 150));
    }
  } catch (e) {
    console.log('📨 [Scoreboard] Received (unparseable):', data.toString().substring(0, 100));
  }
});

ws1.on('error', (error) => {
  console.log('❌ [Scoreboard] Error:', error.message);
});

ws1.on('close', (code, reason) => {
  console.log(`\n✋ [Scoreboard] Closed - Code: ${code}, Data received: ${scoreboardReceived}`);
  
  // Test 2: Playbyplay WebSocket
  setTimeout(() => {
    console.log('\n' + '='.repeat(50));
    console.log('\nTest 2: Playbyplay WebSocket');
    console.log('URL: ws://127.0.0.1:8000/api/v1/playbyplay/ws/0022500664\n');
    
    const ws2 = new WebSocket('ws://127.0.0.1:8000/api/v1/playbyplay/ws/0022500664');
    let playbyplayReceived = false;

    ws2.on('open', () => {
      console.log('✅ [Playbyplay] Connected!');
    });

    ws2.on('message', (data) => {
      try {
        const parsed = JSON.parse(data);
        
        if (parsed.status === 'connected') {
          console.log('📨 [Playbyplay] Connection acknowledgement received');
        } else if (parsed.plays) {
          playbyplayReceived = true;
          console.log('🎬 [Playbyplay] Received play-by-play data!');
          console.log(`   Plays count: ${parsed.plays?.length || 0}`);
          if (parsed.plays && parsed.plays.length > 0) {
            console.log(`   First play: ${parsed.plays[0].actionType || parsed.plays[0].description}`);
          }
          ws2.close();
        } else {
          console.log('📨 [Playbyplay] Message:', JSON.stringify(parsed).substring(0, 150));
        }
      } catch (e) {
        console.log('📨 [Playbyplay] Received (unparseable):', data.toString().substring(0, 100));
      }
    });

    ws2.on('error', (error) => {
      console.log('❌ [Playbyplay] Error:', error.message);
    });

    ws2.on('close', (code, reason) => {
      console.log(`\n✋ [Playbyplay] Closed - Code: ${code}, Data received: ${playbyplayReceived}`);
      console.log('\n' + '='.repeat(50));
      console.log('\n✅ All tests completed!\n');
      process.exit(0);
    });
  }, 500);
});
