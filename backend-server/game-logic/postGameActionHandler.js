const { handleLeaveGame } = require('./gameSessionHandler.js');

function handlePostGameAction(ws, type, payload, context) {
    const { gameRegistry, clients } = context;
    const username = ws.username;
    const roomId = ws.roomId;

    if (!roomId) return;

    const gameType = roomId.split('_')[0];
    const gameModule = gameRegistry[gameType];
    if (!gameModule) return;

    const game = gameModule.games[roomId];
    if (!game || (game.status !== 'finished' && game.gameState !== 'finished')) return;
    
    if (type.endsWith(':request_rematch')) {
        const opponentInfo = game.players.find(p => p.username !== username);
        if (!opponentInfo) {
            return handleLeaveGame(ws, { roomId }, context);
        }

        if (!game.rematchState) game.rematchState = {};
        
        game.rematchState[username] = true;
        
        console.log(`[POST_GAME] ${username} requested rematch in ${roomId}. Current state:`, game.rematchState);

        if (game.rematchState[opponentInfo.username]) {
            console.log(`[POST_GAME] Rematch agreement in ${roomId}. Resetting game.`);
            if (gameModule.reset) {
                gameModule.reset(game, { clients });
            }
        } else {
            console.log(`[POST_GAME] Waiting for ${opponentInfo.username} in ${roomId}.`);
            const opponentWs = clients.get(opponentInfo.username);
            if (opponentWs) {
                opponentWs.send(JSON.stringify({ type: `${gameType}:rematch_requested`, payload: { from: username } }));
            }
            ws.send(JSON.stringify({ type: `${gameType}:waiting_rematch` }));
        }
    } 
    else if (type === 'game:leave') {
        console.log(`[POST_GAME] ${username} is leaving/declining rematch in ${roomId}.`);
        
        const opponentInfo = game.players.find(p => p.username !== username);
        if (opponentInfo) {
            const opponentWs = clients.get(opponentInfo.username);
            if (opponentWs) {
                opponentWs.send(JSON.stringify({ type: `${gameType}:rematch_declined`, payload: { from: username } }));
            }
        }
        
        handleLeaveGame(ws, { roomId }, context);
    }
}

module.exports = { handlePostGameAction };