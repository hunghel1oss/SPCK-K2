const { v4: uuidv4 } = require('uuid');

const createConversationId = (user1, user2) => {
    return [user1, user2].sort().join('_');
};

async function handleDirectMessage(ws, payload, { clients, Conversation }) {
    const sender = ws.username;
    const { recipient, message } = payload;
    if (!recipient || !message) return;

    const conversationId = createConversationId(sender, recipient);
    const messageData = {
        id: uuidv4(),
        sender,
        recipient,
        message,
        timestamp: new Date().toISOString()
    };

    try {
        await Conversation.findOneAndUpdate(
            { conversationId },
            { 
                $push: { messages: messageData },
                $setOnInsert: { participants: [sender, recipient] }
            },
            { upsert: true, new: true }
        );

        const recipientWs = clients.get(recipient);
        if (recipientWs) {
            recipientWs.send(JSON.stringify({ type: 'chat:new_dm', payload: messageData }));
        }
        ws.send(JSON.stringify({ type: 'chat:new_dm', payload: messageData }));

    } catch (error) {
        console.error("DM Error:", error);
    }
}

async function getChatHistory(req, res, { Conversation }) {
    const selfUsername = req.user.username;
    const friendUsername = req.params.friendUsername;
    const conversationId = createConversationId(selfUsername, friendUsername);

    try {
        const conversation = await Conversation.findOne({ conversationId }).lean();
        if (conversation) {
            res.status(200).json(conversation.messages);
        } else {
            res.status(200).json([]);
        }
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server.' });
    }
}

module.exports = {
    handleDirectMessage,
    getChatHistory
};