const { v4: uuidv4 } = require('uuid');
const fs = require('fs/promises');
const path = require('path');

const DB_FILE = path.join(__dirname, '..', 'database.json');

async function readDatabase() {
    try {
        await fs.access(DB_FILE);
        const data = await fs.readFile(DB_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return {};
    }
}

async function writeDatabase(data) {
    await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

async function saveGameHistoryToDb(username, gameData) {
    if (!username || !gameData) return;
    try {
        const database = await readDatabase();
        if (database[username]) {
            if (!database[username].history) {
                database[username].history = [];
            }
            const newRecord = { id: uuidv4(), date: new Date().toISOString(), ...gameData };
            database[username].history.unshift(newRecord);
            if (database[username].history.length > 20) {
                database[username].history.pop();
            }
            await writeDatabase(database);
            console.log(`[HISTORY_SAVER] Saved game for ${username}: ${gameData.result}`);
            return true; 
        }
        return false;
    } catch (error) {
        console.error(`[HISTORY_SAVER] Failed to save game for ${username}`, error);
        return false;
    }
}

function createHistorySavingHandler(originalHandler) {
    return async (leaver, roomIdOrPayload, context) => {
        const { gameRegistry, clients } = context;

        const isDisconnect = typeof leaver === 'string';
        const leaverUsername = isDisconnect ? leaver : leaver.username;
        const roomId = isDisconnect ? roomIdOrPayload : (roomIdOrPayload ? roomIdOrPayload.roomId : leaver.roomId);
        
        if (roomId && gameRegistry && clients) {
            const gameType = roomId.split('_')[0];
            const gameModule = gameRegistry[gameType];

            if (gameModule && gameModule.games[roomId]) {
                const game = gameModule.games[roomId];
                const opponent = game.players.find(p => p.username !== leaverUsername);
                
                if (opponent) {
                    const gameInfo = gameRegistry[gameType];
                    
                    const savedForOpponent = await saveGameHistoryToDb(opponent.username, {
                        gameName: gameInfo.gameName,
                        difficulty: `Online vs ${leaverUsername}`,
                        result: 'Thắng',
                        imageSrc: gameInfo.imageSrc
                    });
                    
                    const savedForLeaver = await saveGameHistoryToDb(leaverUsername, {
                        gameName: gameInfo.gameName,
                        difficulty: `Online vs ${opponent.username}`,
                        result: 'Thua',
                        imageSrc: gameInfo.imageSrc
                    });

                    if (savedForOpponent) {
                        const opponentWs = clients.get(opponent.username);
                        if (opponentWs && opponentWs.readyState === 1) {
                            opponentWs.send(JSON.stringify({ type: 'history:updated' }));
                        }
                    }
                    if (savedForLeaver) {
                        const leaverWs = clients.get(leaverUsername);
                        if (leaverWs && leaverWs.readyState === 1) {
                           leaverWs.send(JSON.stringify({ type: 'history:updated' }));
                        }
                    }
                }
            }
        }

        console.log(`[HISTORY_SAVER] Passing control to original handler for ${leaverUsername}`);
        originalHandler(leaver, roomIdOrPayload, context);
    };
}

module.exports = { createHistorySavingHandler };