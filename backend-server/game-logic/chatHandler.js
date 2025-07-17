const { v4: uuidv4 } = require('uuid');

const createConversationId = (user1, user2) => {
    return [user1, user2].sort().join('_');
};

async function handleDirectMessage(ws, payload, { clients, readDatabase, writeDatabase }) {
    const sender = ws.username;
    const { recipient, message } = payload;

    if (!recipient || !message) {
        return;
    }
    
    const conversationId = createConversationId(sender, recipient);
    const messageData = {
        id: uuidv4(),
        sender,
        recipient,
        message,
        timestamp: new Date().toISOString()
    };

    const database = await readDatabase();
    if (!database.conversations) {
        database.conversations = {};
    }
    if (!database.conversations[conversationId]) {
        database.conversations[conversationId] = {
            participants: [sender, recipient],
            messages: []
        };
    }
    database.conversations[conversationId].messages.push(messageData);
    await writeDatabase(database);

    const recipientWs = clients.get(recipient);
    if (recipientWs && recipientWs.readyState === 1) {
        recipientWs.send(JSON.stringify({ type: 'chat:new_dm', payload: messageData }));
    }

    ws.send(JSON.stringify({ type: 'chat:new_dm', payload: messageData }));
}

async function getChatHistory(req, res, { readDatabase }) {
    const selfUsername = req.user.username;
    const friendUsername = req.params.friendUsername;
    
    const conversationId = createConversationId(selfUsername, friendUsername);
    
    const database = await readDatabase();
    if (database.conversations && database.conversations[conversationId]) {
        res.status(200).json(database.conversations[conversationId].messages);
    } else {
        res.status(200).json([]);
    }
}

module.exports = {
    handleDirectMessage,
    getChatHistory
};