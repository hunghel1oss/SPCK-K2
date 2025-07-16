function handleLeaveGame(ws, payload, { gameRegistry, clients }) {
    const username = ws.username;
    const roomId = payload ? payload.roomId : ws.roomId;

    if (!roomId) {
        console.warn(`[LEAVE_GAME] No roomId provided for user ${username}. Clearing ws.roomId just in case.`);
        ws.roomId = null;
        return;
    }

    const gameType = roomId.split('_')[0];
    const gameModule = gameRegistry[gameType];

    if (!gameModule) {
        console.warn(`[LEAVE_GAME] No game module found for type: ${gameType}`);
        ws.roomId = null; 
        return;
    }

    const game = gameModule.games[roomId];

    if (game) {
        const opponent = game.players.find(p => p.username !== username);

        if (opponent) {
            const opponentWs = clients.get(opponent.username);
            if (opponentWs && opponentWs.readyState === 1) {
                let eventPayload, eventType;

                if (gameType === 'caro') {
                    game.status = 'finished';
                    game.winner = opponent.symbol;
                    eventType = 'caro:update';
                    eventPayload = {
                        board: game.board,
                        isMyTurn: false,
                        status: 'finished',
                        winner: game.winner,
                        winningLine: [],
                        disconnectMessage: `Đối thủ "${username}" đã rời trận. Bạn đã thắng!`
                    };
                } else if (gameType === 'battleship') {
                    game.gameState = 'finished';
                    game.winner = opponent.username;
                    eventType = 'battleship:game_over';
                    eventPayload = {
                        winner: opponent.username,
                        disconnectMessage: `Đối thủ "${username}" đã rời trận. Bạn đã thắng!`
                    };
                }

                if (eventType && eventPayload) {
                   opponentWs.send(JSON.stringify({ type: eventType, payload: eventPayload }));
                }
                
                console.log(`[LEAVE_GAME] Clearing roomId for opponent ${opponent.username}. Old roomId: ${opponentWs.roomId}`);
                opponentWs.roomId = null;
                console.log(`[LEAVE_GAME] Opponent's roomId is now: ${opponentWs.roomId}`);
            }
        }
        
        delete gameModule.games[roomId];
        console.log(`[LEAVE_GAME] Cleaned up ${gameType} game room: ${roomId} initiated by ${username}`);
    }
    
    console.log(`[LEAVE_GAME] Clearing roomId for self ${username}. Old roomId: ${ws.roomId}`);
    ws.roomId = null;
    console.log(`[LEAVE_GAME] Self's roomId is now: ${ws.roomId}`);
}

module.exports = { handleLeaveGame };