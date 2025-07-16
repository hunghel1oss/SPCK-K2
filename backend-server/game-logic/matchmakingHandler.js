const waitingQueues = {
    caro: null,
    battleship: null,
};

function handleLobbyEvent(ws, type, payload, { clients }) {
    const gameType = type.split(':')[0];
    const action = type.split(':')[1];

    if (action === 'find_match') {
        const username = ws.username;
        const matchmakingId = payload ? payload.matchmakingId : null;
        if (!matchmakingId) return null;

        const waitingPlayer = waitingQueues[gameType];

        if (waitingPlayer && waitingPlayer.user !== username) {
            const player1_ws = clients.get(waitingPlayer.user);
            if (!player1_ws || player1_ws.readyState !== 1) {
                waitingQueues[gameType] = { user: username, matchmakingId };
                ws.send(JSON.stringify({ type: `${gameType}:waiting`, payload: { matchmakingId } }));
                return null;
            }
            console.log(`[MATCHMAKING] Match found for ${gameType}: ${waitingPlayer.user} vs ${username}`);
            waitingQueues[gameType] = null;
            
            return { player1: player1_ws, player2: ws, gameType: gameType };

        } else {
            waitingQueues[gameType] = { user: username, matchmakingId };
            ws.send(JSON.stringify({ type: `${gameType}:waiting`, payload: { matchmakingId } }));
            return null;
        }
    } else if (action === 'leave') {
        const username = ws.username;
        if (waitingQueues[gameType] && waitingQueues[gameType].user === username) {
            console.log(`[MATCHMAKING] Player ${username} left the ${gameType} queue.`);
            waitingQueues[gameType] = null;
        }
    }
    return null;
}

function leaveAllQueues(username) {
    for (const gameType in waitingQueues) {
        if (waitingQueues[gameType] && waitingQueues[gameType].user === username) {
            console.log(`[MATCHMAKING] Removing ${username} from ${gameType} queue due to disconnect.`);
            waitingQueues[gameType] = null;
        }
    }
}

module.exports = { handleLobbyEvent, leaveAllQueues };