const { v4: uuidv4 } = require('uuid');

const battleshipGames = {};
const BOARD_SIZE = 9;
const TOTAL_CELLS = BOARD_SIZE * BOARD_SIZE;

const SHIP_TYPES = {
    carrier: { size: 5, count: 1 },
    battleship: { size: 4, count: 2 },
    cruiser: { size: 3, count: 2 },
    destroyer: { size: 2, count: 1 },
};

const createEmptyBoard = () => Array(TOTAL_CELLS).fill(null).map(() => ({ shipId: null, isHit: false }));

function createBattleshipGame(player1_ws, player2_ws) {
    const roomId = `battleship_${uuidv4()}`;
    battleshipGames[roomId] = {
        roomId,
        players: [
            { username: player1_ws.username, board: createEmptyBoard(), ships: [], isReady: false },
            { username: player2_ws.username, board: createEmptyBoard(), ships: [], isReady: false },
        ],
        gameState: 'placement',
    };
    player1_ws.roomId = roomId;
    player2_ws.roomId = roomId;
    const gameStartPayload = { shipsToPlace: SHIP_TYPES };
    player1_ws.send(JSON.stringify({ type: 'battleship:game_start', payload: { roomId, ...gameStartPayload, opponent: player2_ws.username } }));
    player2_ws.send(JSON.stringify({ type: 'battleship:game_start', payload: { roomId, ...gameStartPayload, opponent: player1_ws.username } }));
}

function resetBattleshipGame(game, { clients }) {
    game.players.forEach(player => {
        player.board = createEmptyBoard();
        player.ships = [];
        player.isReady = false;
    });
    game.gameState = 'placement';
    delete game.rematchState;
    delete game.winner;

    const gameStartPayload = { shipsToPlace: SHIP_TYPES };
    game.players.forEach(p => {
        const playerWs = clients.get(p.username);
        if (playerWs) {
            playerWs.send(JSON.stringify({ type: 'battleship:game_start', payload: { roomId: playerWs.roomId, ...gameStartPayload, opponent: game.players.find(op => op.username !== p.username).username } }));
        }
    });
}

function handleBattleshipEvents(ws, type, payload, { clients }) {
    const username = ws.username;
    if (!username || !ws.roomId || !battleshipGames[ws.roomId]) return;

    const currentGame = battleshipGames[ws.roomId];

    switch (type) {
        case 'battleship:place_ships': {
            if (currentGame.gameState !== 'placement') return;
            const playerIndex = currentGame.players.findIndex(p => p.username === username);
            if (playerIndex === -1 || currentGame.players[playerIndex].isReady) return;
            const newBoard = createEmptyBoard();
            payload.ships.forEach(ship => { ship.positions.forEach(pos => { if (pos >= 0 && pos < TOTAL_CELLS) newBoard[pos].shipId = ship.id; }); });
            const updatedPlayer = { ...currentGame.players[playerIndex], isReady: true, ships: payload.ships, board: newBoard };
            const newPlayers = currentGame.players.map((p, index) => index === playerIndex ? updatedPlayer : p);
            const newGame = { ...currentGame, players: newPlayers };
            battleshipGames[ws.roomId] = newGame;
            const opponent = newGame.players.find(p => p.username !== username);
            if (opponent && opponent.isReady) {
                newGame.gameState = 'combat';
                newGame.currentPlayer = Math.random() < 0.5 ? username : opponent.username;
                newGame.players.forEach(p => {
                    const pWs = clients.get(p.username);
                    if (pWs && pWs.readyState === 1) {
                        pWs.send(JSON.stringify({ type: 'battleship:combat_start', payload: { isMyTurn: p.username === newGame.currentPlayer } }));
                    }
                });
            } else if (opponent) {
                const opponentWs = clients.get(opponent.username);
                if (opponentWs && opponentWs.readyState === 1) {
                    opponentWs.send(JSON.stringify({ type: 'battleship:opponent_ready' }));
                }
            }
            break;
        }
        case 'battleship:fire_shot': {
            if (currentGame.gameState !== 'combat' || currentGame.currentPlayer !== username) return;
            const targetIndex = currentGame.players.findIndex(p => p.username !== username);
            if (targetIndex === -1) return;
            const targetPlayer = currentGame.players[targetIndex];
            const targetCellIndex = payload.index;
            if (targetCellIndex == null || targetPlayer.board[targetCellIndex].isHit) return;
            const updatedTargetBoard = targetPlayer.board.map((cell, index) => index === targetCellIndex ? { ...cell, isHit: true } : cell);
            let shotResult = { hitter: username, targetIndex: targetCellIndex, result: 'miss' };
            if (updatedTargetBoard[targetCellIndex].shipId) {
                shotResult.result = 'hit';
                const hitShip = targetPlayer.ships.find(s => s.id === updatedTargetBoard[targetCellIndex].shipId);
                if (hitShip && hitShip.positions.every(pos => updatedTargetBoard[pos].isHit)) {
                    shotResult.result = 'sunk';
                    shotResult.shipInfo = { type: hitShip.type, positions: hitShip.positions };
                }
            }
            const updatedTargetPlayer = { ...targetPlayer, board: updatedTargetBoard };
            const newPlayers = currentGame.players.map((p, index) => index === targetIndex ? updatedTargetPlayer : p);
            let newGame = { ...currentGame, players: newPlayers };
            if (updatedTargetPlayer.ships.every(ship => ship.positions.every(pos => updatedTargetPlayer.board[pos].isHit))) {
                newGame.gameState = 'finished';
                newGame.winner = username;
                newGame.rematchState = {};
                const gameOverPayload = { winner: newGame.winner };
                newGame.players.forEach(p => { const pWs = clients.get(p.username); if (pWs) pWs.send(JSON.stringify({ type: 'battleship:game_over', payload: gameOverPayload })); });
            } else {
                if (shotResult.result === 'miss') newGame.currentPlayer = updatedTargetPlayer.username;
                const gameUpdatePayload = { shotResult: shotResult, isMyTurn: false };
                newGame.players.forEach(p => {
                    const pWs = clients.get(p.username);
                    if (pWs) {
                        gameUpdatePayload.isMyTurn = p.username === newGame.currentPlayer;
                        pWs.send(JSON.stringify({ type: 'battleship:game_update', payload: gameUpdatePayload }));
                    }
                });
            }
            battleshipGames[ws.roomId] = newGame;
            break;
        }
    }
}

module.exports = { handleBattleshipEvents, battleshipGames, createBattleshipGame, resetGame: resetBattleshipGame };