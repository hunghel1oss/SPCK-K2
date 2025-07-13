// backend-server/game_logic/caro.js

const { v4: uuidv4 } = require('uuid'); 

const caroGames = {};
let waitingPlayer = null;

function checkWin(board, playerSymbol) {
    const size = 10; const winLength = 5;
    const checkLine = (line) => { let count = 0; for (const cell of line) { if (cell === playerSymbol) { count++; if (count >= winLength) return true; } else { count = 0; } } return false; };
    const getWinningLine = (line, startIndex, step) => { let count = 0; let startWinIndex = -1; for (let i = 0; i < line.length; i++) { if (line[i] === playerSymbol) { if (count === 0) startWinIndex = i; count++; if (count >= winLength) { const winningLine = []; for (let j = 0; j < winLength; j++) { winningLine.push(startIndex + (startWinIndex + j) * step); } return winningLine; } } else { count = 0; startWinIndex = -1; } } return null; };
    for (let r = 0; r < size; r++) { const row = board.slice(r * size, r * size + size); const winningRow = getWinningLine(row, r * size, 1); if (winningRow) return winningRow; }
    for (let c = 0; c < size; c++) { const col = []; for (let r = 0; r < size; r++) col.push(board[r * size + c]); const winningCol = getWinningLine(col, c, size); if (winningCol) return winningCol; }
    for (let r = 0; r <= size - winLength; r++) { for (let c = 0; c <= size - winLength; c++) { const diag1 = []; for (let i = 0; i < winLength; i++) diag1.push(board[(r + i) * size + (c + i)]); if (checkLine(diag1)) { const winningDiag = []; for (let i = 0; i < winLength; i++) winningDiag.push((r + i) * size + (c + i)); return winningDiag; } } }
    for (let r = 0; r <= size - winLength; r++) { for (let c = winLength - 1; c < size; c++) { const diag2 = []; for (let i = 0; i < winLength; i++) diag2.push(board[(r + i) * size + (c - i)]); if (checkLine(diag2)) { const winningDiag = []; for (let i = 0; i < winLength; i++) winningDiag.push((r + i) * size + (c - i)); return winningDiag; } } }
    return null;
}

function handleCaroEvents(ws, type, payload, { clients }) {
    const currentUsername = ws.username;
    if (!currentUsername) return;

    if (type === 'caro:find_match' && payload) {
        const { matchmakingId } = payload;
        if (waitingPlayer && waitingPlayer.user !== currentUsername) {
            const player1_username = waitingPlayer.user;
            const player2_username = currentUsername;
            
            const player1_ws = clients.get(player1_username);
            const player2_ws = ws;

            if (!player1_ws || player1_ws.readyState !== 1) { // 1 = WebSocket.OPEN
                waitingPlayer = { user: currentUsername, matchmakingId };
                player2_ws.send(JSON.stringify({ type: 'caro:waiting', payload: { matchmakingId }}));
                return;
            }

            const roomId = `caro_${uuidv4()}`;
            const game = {
                players: [
                    { username: player1_username, symbol: 'X' },
                    { username: player2_username, symbol: 'O' }
                ],
                board: Array(100).fill(null),
                currentPlayerSymbol: 'X',
                status: 'playing',
            };
            caroGames[roomId] = game;

            player1_ws.roomId = roomId;
            player2_ws.roomId = roomId;

            console.log(`[Caro] Match found! Room: ${roomId}. Players: ${player1_username} (X) vs ${player2_username} (O)`);
            player1_ws.send(JSON.stringify({ type: 'caro:game_start', payload: { isMyTurn: true, mySymbol: 'X', board: game.board, opponent: player2_username } }));
            player2_ws.send(JSON.stringify({ type: 'caro:game_start', payload: { isMyTurn: false, mySymbol: 'O', board: game.board, opponent: player1_username } }));
            
            waitingPlayer = null;
        } else {
            waitingPlayer = { user: currentUsername, matchmakingId };
            ws.send(JSON.stringify({ type: 'caro:waiting', payload: { matchmakingId } }));
        }
    } else if (type === 'caro:leave' && payload) {
        if (waitingPlayer && waitingPlayer.matchmakingId === payload.matchmakingId) {
            waitingPlayer = null;
        }
    } else if (ws.roomId && caroGames[ws.roomId]) {
        const game = caroGames[ws.roomId];
        const playerInfo = game.players.find(p => p.username === currentUsername);
        if (!playerInfo) return;

        if (type === 'caro:move' && payload) {
            if (playerInfo.symbol === game.currentPlayerSymbol && !game.board[payload.index] && game.status === 'playing') {
                game.board[payload.index] = playerInfo.symbol;
                const winningLine = checkWin(game.board, playerInfo.symbol);
                
                if (winningLine) { 
                    game.status = 'finished';
                    game.winner = playerInfo.symbol; 
                } else if (game.board.every(cell => cell !== null)) { 
                    game.status = 'finished'; 
                } else { 
                    game.currentPlayerSymbol = game.currentPlayerSymbol === 'X' ? 'O' : 'X'; 
                }
                
                game.players.forEach(p => {
                    const playerWs = clients.get(p.username);
                    if (playerWs && playerWs.readyState === 1) { // 1 = WebSocket.OPEN
                        playerWs.send(JSON.stringify({ 
                            type: 'caro:update', 
                            payload: { 
                                board: game.board, 
                                isMyTurn: p.symbol === game.currentPlayerSymbol && game.status === 'playing', 
                                status: game.status, 
                                winner: game.winner || null, 
                                winningLine: winningLine || [] 
                            } 
                        }));
                    }
                });
            }
        } else if (type === 'caro:rematch') {
            if(game.status === 'finished') {
                game.board = Array(100).fill(null);
                game.currentPlayerSymbol = 'X';
                game.status = 'playing';
                game.winner = null;
                
                game.players.forEach(p => {
                    const playerWs = clients.get(p.username);
                    if (playerWs && playerWs.readyState === 1) {
                        playerWs.send(JSON.stringify({ type: 'caro:game_start', payload: { isMyTurn: p.symbol === 'X', mySymbol: p.symbol, board: game.board, opponent: game.players.find(op => op.username !== p.username).username } }));
                    }
                });
            }
        }
    }
}

function handleCaroDisconnect(ws, { clients }) {
    const username = ws.username;
    if (!username) return;

    if (waitingPlayer && waitingPlayer.user === username) {
        waitingPlayer = null;
    }

    const roomId = ws.roomId;
    if (roomId && caroGames[roomId]) {
        const game = caroGames[roomId];
        const opponentInfo = game.players.find(p => p.username !== username);
        if (opponentInfo) {
            const opponentWs = clients.get(opponentInfo.username);
            if (opponentWs && opponentWs.readyState === 1) {
                opponentWs.send(JSON.stringify({ type: 'caro:error', payload: { message: 'Đối thủ đã thoát!' } }));
            }
        }
        delete caroGames[roomId];
    }
}

module.exports = { handleCaroEvents, handleCaroDisconnect, caroGames };