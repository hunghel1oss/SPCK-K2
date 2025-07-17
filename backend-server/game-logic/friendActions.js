const { v4: uuidv4 } = require('uuid');

async function handleFriendRequest(req, res, { readDatabase, writeDatabase, clients }) {
    const { user: { username: senderUsername }, body: { targetUsername } } = req;
    
    if(!targetUsername) return res.status(400).json({ message: 'Tên người nhận là bắt buộc.' });
    if(senderUsername === targetUsername) return res.status(400).json({ message: 'Bạn không thể tự kết bạn với chính mình.'});
    
    const database = await readDatabase();
    if(!database[targetUsername]) return res.status(404).json({ message: 'Người dùng không tồn tại.'});
    
    const sender = database[senderUsername];
    const target = database[targetUsername];
    if(!sender.friends) sender.friends = [];
    if(!target.friends) target.friends = [];
    
    if(sender.friends.some(f => f.username === targetUsername)) return res.status(400).json({ message: 'Đã gửi lời mời hoặc đã là bạn bè.'});
    
    const timestamp = new Date().toISOString();
    sender.friends.unshift({ username: targetUsername, status: 'pending_sent', since: timestamp });
    target.friends.unshift({ username: senderUsername, status: 'pending_received', since: timestamp });
    
    await writeDatabase(database);
    
    const targetClient = clients.get(targetUsername);
    if(targetClient && targetClient.readyState === 1) {
        targetClient.send(JSON.stringify({ type: 'friend:request_received', payload: { from: senderUsername, since: timestamp } }));
    }
    
    res.status(200).json({ message:'Đã gửi lời mời kết bạn.'});
}

async function handleFriendResponse(req, res, { readDatabase, writeDatabase, clients }) {
    const { user: { username: responderUsername }, body: { requesterUsername, action } } = req;
    if (!requesterUsername || !['accept', 'decline'].includes(action)) return res.status(400).json({ message: 'Yêu cầu không hợp lệ.' });

    const database = await readDatabase();
    const responder = database[responderUsername];
    const requester = database[requesterUsername];
    if (!requester) return res.status(404).json({ message: 'Người gửi yêu cầu không tồn tại.' });

    const requestInResponder = responder.friends.find(f => f.username === requesterUsername && f.status === 'pending_received');
    if (!requestInResponder) return res.status(404).json({ message: 'Không tìm thấy lời mời kết bạn.' });

    if (action === 'accept') {
        const requestInRequester = requester.friends.find(f => f.username === responderUsername && f.status === 'pending_sent');
        const timestamp = new Date().toISOString();
        requestInResponder.status = 'friends';
        requestInResponder.since = timestamp;
        if(requestInRequester) { 
            requestInRequester.status = 'friends'; 
            requestInRequester.since = timestamp; 
        }

        const requesterClient = clients.get(requesterUsername);
        const responderClient = clients.get(responderUsername);

        if (requesterClient && requesterClient.readyState === 1) {
            requesterClient.send(JSON.stringify({ type: 'friend:request_accepted', payload: { by: responderUsername, since: timestamp } }));
            requesterClient.send(JSON.stringify({ type: 'friend:online', payload: { username: responderUsername }}));
        }

        if (responderClient && requesterClient && requesterClient.readyState === 1) {
            responderClient.send(JSON.stringify({ type: 'friend:online', payload: { username: requesterUsername }}));
        }
        
        res.status(200).json({ message: `Bạn và ${requesterUsername} đã trở thành bạn bè.` });
    } else {
        responder.friends = responder.friends.filter(f => f.username !== requesterUsername);
        requester.friends = requester.friends.filter(f => f.username !== responderUsername);
        
        const requesterClient = clients.get(requesterUsername);
        if (requesterClient && requesterClient.readyState === 1) {
            requesterClient.send(JSON.stringify({ type: 'friend:request_declined', payload: { by: responderUsername } }));
        }
        res.status(200).json({ message: `Bạn đã từ chối lời mời kết bạn từ ${requesterUsername}.` });
    }

    await writeDatabase(database);
}

async function handleRemoveFriend(req, res, { readDatabase, writeDatabase, clients }) {
    const { username: selfUsername } = req.user;
    const { friendUsername } = req.params;

    if (!friendUsername) {
        return res.status(400).json({ message: 'Tên bạn bè là bắt buộc.' });
    }

    const database = await readDatabase();
    const self = database[selfUsername];
    const friend = database[friendUsername];

    if (!friend) {
        return res.status(404).json({ message: 'Không tìm thấy người dùng này.' });
    }

    if (self && self.friends) {
        self.friends = self.friends.filter(f => f.username !== friendUsername);
    }
    if (friend && friend.friends) {
        friend.friends = friend.friends.filter(f => f.username !== selfUsername);
    }

    await writeDatabase(database);

    const friendClient = clients.get(friendUsername);
    if (friendClient && friendClient.readyState === 1) {
        friendClient.send(JSON.stringify({ type: 'friend:removed', payload: { by: selfUsername }}));
    }

    res.status(200).json({ message: `Đã xóa ${friendUsername} khỏi danh sách bạn bè.` });
}


module.exports = {
    handleFriendRequest,
    handleFriendResponse,
    handleRemoveFriend,
};