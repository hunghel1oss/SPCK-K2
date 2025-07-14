const { v4: uuidv4 } = require('uuid');

const caroGames = {};
let waitingPlayer = null;

function checkWin(board, playerSymbol) {
    const size = 10;
    const winLength = 5;

    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            const index = r * size + c;
            if (board[index] !== playerSymbol) continue;
            if (c <= size - winLength) {
                let match = true;
                for (let i = 0; i < winLength; i++) if (board[index + i] !== playerSymbol) { match = false; break; }
                if (match) return Array.from({length: winLength}, (_, i) => index + i);
            }
            if (r <= size - winLength) {
                let match = true;
                for (let i = 0; i < winLength; i++) if (board[index + i * size] !== playerSymbol) { match = false; break; }
                if (match) return Array.from({length: winLength}, (_, i) => index + i * size);
            }
            if (r <= size - winLength && c <= size - winLength) {
                let match = true;
                for (let i = 0; i < winLength; i++) if (board[index + i * size + i] !== playerSymbol) { match = false; break; }
                if (match) return Array.from({length: winLength}, (_, i) => index + i * size + i);
            }
            if (r <= size - winLength && c >= winLength - 1) {
                let match = true;
                for (let i = 0; i < winLength; i++) if (board[index + i * size - i] !== playerSymbol) { match = false; break; }
                if (match) return Array.from({length: winLength}, (_, i) => index + i * size - i);
            }
        }
    }
    return null;
}

function handleCaroEvents(ws, type, payload, { clients }) {
    const currentUsername = ws.username;
    if (!currentUsername) return;

    if (type === 'caro:find_match') {
        if (waitingPlayer && waitingPlayer.user !== currentUsername) {
            const player1_ws = clients.get(waitingPlayer.user);
            if (!player1_ws || player1_ws.readyState !== 1) {
                waitingPlayer = { user: currentUsername };
                ws.send(JSON.stringify({ type: 'caro:waiting' }));
                return;
            }
            const roomId = `caro_${uuidv4()}`;
            const game = {
                players: [{ username: waitingPlayer.user, symbol: 'X' }, { username: currentUsername, symbol: 'O' }],
                board: Array(100).fill(null), currentPlayerSymbol: 'X', status: 'playing',
            };
            caroGames[roomId] = game;
            player1_ws.roomId = roomId;
            ws.roomId = roomId;
            player1_ws.send(JSON.stringify({ type: 'caro:game_start', payload: { isMyTurn: true, mySymbol: 'X', board: game.board, opponent: currentUsername } }));
            ws.send(JSON.stringify({ type: 'caro:game_start', payload: { isMyTurn: false, mySymbol: 'O', board: game.board, opponent: waitingPlayer.user } }));
            waitingPlayer = null;
        } else {
            waitingPlayer = { user: currentUsername };
            ws.send(JSON.stringify({ type: 'caro:waiting' }));
        }
    } else if (ws.roomId && caroGames[ws.roomId]) {
        const game = caroGames[ws.roomId];
        if (type === 'caro:move' && payload) {
            const playerInfo = game.players.find(p => p.username === currentUsername);
            if (playerInfo && playerInfo.symbol === game.currentPlayerSymbol && !game.board[payload.index] && game.status === 'playing') {
                game.board[payload.index] = playerInfo.symbol;
                const winningLine = checkWin(game.board, playerInfo.symbol);
                if (winningLine) { game.status = 'finished'; game.winner = playerInfo.symbol; } 
                else if (game.board.every(cell => cell !== null)) { game.status = 'finished'; } 
                else { game.currentPlayerSymbol = game.currentPlayerSymbol === 'X' ? 'O' : 'X'; }
                game.players.forEach(p => {
                    const playerWs = clients.get(p.username);
                    if (playerWs && playerWs.readyState === 1) {
                        playerWs.send(JSON.stringify({ type: 'caro:update', payload: { board: game.board, isMyTurn: p.symbol === game.currentPlayerSymbol && game.status === 'playing', status: game.status, winner: game.winner || null, winningLine: winningLine || [] } }));
                    }
                });
            }
        } else if (type === 'caro:rematch' && game.status === 'finished') {
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

module.exports = { handleCaroEvents, caroGames };