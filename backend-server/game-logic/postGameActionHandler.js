const { handleLeaveGame } = require('./gameSessionHandler.js');

function handlePostGameAction(ws, type, payload, context) {
    const { gameRegistry, clients } = context;
    const username = ws.username;
    const roomId = ws.roomId;

    if (!roomId) return;

    const gameType = roomId.split('_')[0];
    const gameModule = gameRegistry[gameType];
    if (!gameModule || !gameModule.games[roomId]) return;

    const game = gameModule.games[roomId];
    if (game.status !== 'finished' && game.gameState !== 'finished') return;
    
    if (type.endsWith(':request_rematch')) {
        const opponentInfo = game.players.find(p => p.username !== username);
        if (!opponentInfo) {
            return handleLeaveGame(ws, { roomId }, context);
        }

        if (!game.rematchState) game.rematchState = {};
        game.rematchState[username] = true;

        if (game.rematchState[opponentInfo.username]) {
            if (gameModule.reset) {
                gameModule.reset(game, { clients });
            }
        } else {
            const opponentWs = clients.get(opponentInfo.username);
            if (opponentWs) {
                opponentWs.send(JSON.stringify({ type: `${gameType}:rematch_requested`, payload: { from: username } }));
            }
            ws.send(JSON.stringify({ type: `${gameType}:waiting_rematch` }));
        }
    } 
    else if (type === 'game:leave') {
        handleLeaveGame(ws, { roomId }, context);
    }
}

module.exports = { handlePostGameAction };