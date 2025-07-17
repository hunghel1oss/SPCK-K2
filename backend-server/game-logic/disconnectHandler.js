const { leaveAllQueues } = require('./matchmakingHandler');

function handleDisconnect(username, roomId, { gameRegistry, clients }) {
    leaveAllQueues(username);

    if (!roomId) {
        return;
    }

    const gameType = roomId.split('_')[0];
    const gameModule = gameRegistry[gameType];

    if (!gameModule || !gameModule.games || !gameModule.games[roomId]) return;

    const game = gameModule.games[roomId];

    if (game && (game.status !== 'finished' && game.gameState !== 'finished')) {
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
                        board: game.board, isMyTurn: false, status: 'finished',
                        winner: game.winner, winningLine: [],
                        disconnectMessage: `Đối thủ "${username}" đã thoát. Bạn đã thắng!`
                    };
                } else if (gameType === 'battleship') {
                    game.gameState = 'finished';
                    game.winner = opponent.username;
                    eventType = 'battleship:game_over';
                    eventPayload = {
                        winner: opponent.username,
                        loser: username,
                        disconnectMessage: `Đối thủ "${username}" đã thoát. Bạn đã thắng!`
                    };
                }
                
                if(eventType && eventPayload) {
                   opponentWs.send(JSON.stringify({ type: eventType, payload: eventPayload }));
                }
            }
        }
        delete gameModule.games[roomId];
    }
}

module.exports = { handleDisconnect };