function handleLeaveGame(ws, payload, { gameRegistry, clients }) {
    const username = ws.username;
    const roomId = payload ? payload.roomId : ws.roomId;

    if (!roomId) {
        ws.roomId = null;
        return;
    }

    const gameType = roomId.split('_')[0];
    const gameModule = gameRegistry[gameType];

    if (!gameModule || !gameModule.games[roomId]) {
        ws.roomId = null; 
        return;
    }

    const game = gameModule.games[roomId];
    const opponent = game.players.find(p => p.username !== username);
    const opponentWs = opponent ? clients.get(opponent.username) : null;

    const isGameInProgress = game.status !== 'finished' && game.gameState !== 'finished';

    if (isGameInProgress) {
        console.log(`[ABANDON] ${username} abandoned game ${roomId}.`);
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
                    loser: username,
                    disconnectMessage: `Đối thủ "${username}" đã rời trận. Bạn đã thắng!`
                };
            }
            if (eventType && eventPayload) {
               opponentWs.send(JSON.stringify({ type: eventType, payload: eventPayload }));
            }
        }
    } else {
        console.log(`[POST_GAME_LEAVE] ${username} left post-game lobby ${roomId}.`);
        if (opponentWs && opponentWs.readyState === 1) {
            opponentWs.send(JSON.stringify({
                type: `${gameType}:rematch_declined`,
                payload: { from: username, reason: 'left_room' }
            }));
        }
    }

    ws.roomId = null;

    if (!opponentWs || opponentWs.readyState !== 1) {
        delete gameModule.games[roomId];
        console.log(`[CLEANUP] Room ${roomId} deleted because opponent was not connected.`);
    } else if (!isGameInProgress) {
        const playerInRoom = Array.from(clients.values()).some(client => client.roomId === roomId && client.username !== username);
        if (!playerInRoom) {
            delete gameModule.games[roomId];
            console.log(`[CLEANUP] Room ${roomId} deleted as last player left.`);
        }
    }
}

module.exports = { handleLeaveGame };