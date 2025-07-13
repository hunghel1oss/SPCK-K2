const { v4: uuidv4 } = require('uuid');

const battleshipGames = {};
let battleshipWaitingPlayer = null;

const BOARD_SIZE = 9;
const TOTAL_CELLS = BOARD_SIZE * BOARD_SIZE;

const SHIP_TYPES = {
    carrier: { size: 5, count: 1},
    battleship: { size: 4, count: 2 },
    cruiser: { size: 3, count: 2 },
    destroyer: { size: 2, count: 1 },
};

const createEmptyBoard = () => {
    return Array(TOTAL_CELLS).fill(null).map(() => ({
        shipId: null,
        isHit: false,
    }));
};

function handleBattleshipEvents(ws, type, payload, { clients }) {
    const username = ws.username;
    if (!username) return;

    switch (type) {
        case 'battleship:find_match': {
            if (battleshipWaitingPlayer && battleshipWaitingPlayer.user !== username) {
                const player1 = battleshipWaitingPlayer;
                const player2 = { user: username };
                const player1_ws = clients.get(player1.user);
                const player2_ws = ws;

                if (!player1_ws || player1_ws.readyState !== 1) {
                    battleshipWaitingPlayer = player2;
                    player2_ws.send(JSON.stringify({ type: 'battleship:waiting' }));
                    return;
                }

                const roomId = `battleship_${uuidv4()}`;
                const newGame = {
                    roomId,
                    players: [
                        { username: player1.user, board: createEmptyBoard(), ships: [], isReady: false },
                        { username: player2.user, board: createEmptyBoard(), ships: [], isReady: false },
                    ],
                    gameState: 'placement',
                    currentPlayer: null,
                    winner: null,
                };
                battleshipGames[roomId] = newGame;

                player1_ws.roomId = roomId;
                player2_ws.roomId = roomId;

                const gameStartPayload = { opponent: player2.user, shipsToPlace: SHIP_TYPES };
                player1_ws.send(JSON.stringify({ type: 'battleship:game_start', payload: gameStartPayload }));
                
                gameStartPayload.opponent = player1.user;
                player2_ws.send(JSON.stringify({ type: 'battleship:game_start', payload: gameStartPayload }));

                battleshipWaitingPlayer = null;
            } else {
                battleshipWaitingPlayer = { user: username };
                ws.send(JSON.stringify({ type: 'battleship:waiting' }));
            }
            break;
        }
        
        case 'battleship:place_ships': {
            const roomId = ws.roomId;
            if (!roomId || !battleshipGames[roomId]) return;

            const game = battleshipGames[roomId];
            const player = game.players.find(p => p.username === username);
            if (!player || player.isReady) return;

            player.ships = payload.ships;
            player.board = createEmptyBoard();
            
            player.ships.forEach(ship => {
                ship.positions.forEach(pos => {
                    if (player.board[pos]) {
                        player.board[pos].shipId = ship.id;
                    }
                });
            });

            player.isReady = true;
            
            const opponent = game.players.find(p => p.username !== username);
            const opponentWs = clients.get(opponent.username);

            if (opponent && opponent.isReady) {
                game.gameState = 'combat';
                game.currentPlayer = Math.random() < 0.5 ? player.username : opponent.username;

                game.players.forEach(p => {
                    const pWs = clients.get(p.username);
                    if (pWs) {
                        pWs.send(JSON.stringify({
                            type: 'battleship:combat_start',
                            payload: { isMyTurn: p.username === game.currentPlayer }
                        }));
                    }
                });
            } else if (opponentWs) {
                opponentWs.send(JSON.stringify({ type: 'battleship:opponent_ready' }));
            }
            break;
        }

        case 'battleship:fire_shot': {
            const roomId = ws.roomId;
            if (!roomId || !battleshipGames[roomId]) return;

            const game = battleshipGames[roomId];
            const shooter = game.players.find(p => p.username === ws.username);
            const target = game.players.find(p => p.username !== ws.username);

            if (!shooter || !target || game.gameState !== 'combat' || game.currentPlayer !== shooter.username) return;

            const targetCell = target.board[payload.index];
            if (!targetCell || targetCell.isHit) return;

            targetCell.isHit = true;
            
            const shotResult = {
                hitter: shooter.username,
                targetIndex: payload.index,
                result: 'miss'
            };

            if (targetCell.shipId) {
                shotResult.result = 'hit';
                const hitShip = target.ships.find(s => s.id === targetCell.shipId);
                if (hitShip) {
                    const allShipCells = hitShip.positions.map(pos => target.board[pos]);
                    if (allShipCells.every(cell => cell.isHit)) {
                        shotResult.result = 'sunk';
                        shotResult.shipType = hitShip.type;
                    }
                }
            }

            let isGameOver = false;
            const allTargetShips = target.ships;
            if (allTargetShips.length > 0 && allTargetShips.every(ship => ship.positions.every(pos => target.board[pos].isHit))) {
                isGameOver = true;
                game.gameState = 'finished';
                game.winner = shooter.username;
            }

            if (isGameOver) {
                game.players.forEach(p => {
                    const pWs = clients.get(p.username);
                    if (pWs) {
                        pWs.send(JSON.stringify({
                            type: 'battleship:game_over',
                            payload: { winner: game.winner }
                        }));
                    }
                });
            } else {
                if (shotResult.result === 'miss') {
                    game.currentPlayer = target.username;
                }

                game.players.forEach(p => {
                    const pWs = clients.get(p.username);
                    const opponentPlayer = game.players.find(op => op.username !== p.username);
                    
                    const opponentBoardForDisplay = opponentPlayer.board.map(cell => ({
                        shipId: cell.isHit ? cell.shipId : null,
                        isHit: cell.isHit,
                    }));

                    if (pWs) {
                        pWs.send(JSON.stringify({
                            type: 'battleship:game_update',
                            payload: {
                                isMyTurn: p.username === game.currentPlayer,
                                myBoard: p.board,
                                opponentBoard: opponentBoardForDisplay,
                                shotResult: shotResult
                            }
                        }));
                    }
                });
            }
            break;
        }
    }
}

function handleBattleshipDisconnect(ws, { clients }) {
    const username = ws.username;
    if (!username) return;

    if (battleshipWaitingPlayer && battleshipWaitingPlayer.user === username) {
        battleshipWaitingPlayer = null;
    }

    const roomId = ws.roomId;
    if (roomId && battleshipGames[roomId]) {
        const game = battleshipGames[roomId];
        const opponent = game.players.find(p => p.username !== username);
        if (opponent) {
            const opponentWs = clients.get(opponent.username);
            if (opponentWs && opponentWs.readyState === 1) {
                opponentWs.send(JSON.stringify({ type: 'battleship:error', payload: { message: 'Đối thủ đã thoát!' } }));
            }
        }
        delete battleshipGames[roomId];
    }
}

module.exports = { handleBattleshipEvents, handleBattleshipDisconnect, battleshipGames };