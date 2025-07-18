async function handleFriendRequest(req, res, { User, clients }) {
    const { username: senderUsername } = req.user;
    const { targetUsername } = req.body;

    if (!targetUsername || senderUsername === targetUsername) {
        return res.status(400).json({ message: 'Yêu cầu không hợp lệ.' });
    }

    try {
        const sender = await User.findOne({ username: senderUsername });
        const target = await User.findOne({ username: targetUsername });

        if (!target) {
            return res.status(404).json({ message: 'Người dùng không tồn tại.' });
        }
        if (sender.friends.some(f => f.username === targetUsername)) {
            return res.status(400).json({ message: 'Đã gửi lời mời hoặc đã là bạn bè.' });
        }

        const timestamp = new Date().toISOString();
        const senderUpdate = User.updateOne(
            { username: senderUsername },
            { $push: { friends: { username: targetUsername, status: 'pending_sent', since: timestamp } } }
        );
        const targetUpdate = User.updateOne(
            { username: targetUsername },
            { $push: { friends: { username: senderUsername, status: 'pending_received', since: timestamp } } }
        );

        await Promise.all([senderUpdate, targetUpdate]);

        const targetClient = clients.get(targetUsername);
        if (targetClient) {
            targetClient.send(JSON.stringify({ type: 'friend:request_received', payload: { from: senderUsername, since: timestamp } }));
        }

        res.status(200).json({ message: 'Đã gửi lời mời kết bạn.' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server.' });
    }
}

async function handleFriendResponse(req, res, { User, clients }) {
    const { username: responderUsername } = req.user;
    const { requesterUsername, action } = req.body;

    if (!requesterUsername || !['accept', 'decline'].includes(action)) {
        return res.status(400).json({ message: 'Yêu cầu không hợp lệ.' });
    }

    try {
        if (action === 'accept') {
            const timestamp = new Date().toISOString();
            const responderUpdate = User.updateOne(
                { username: responderUsername, 'friends.username': requesterUsername },
                { $set: { 'friends.$.status': 'friends', 'friends.$.since': timestamp } }
            );
            const requesterUpdate = User.updateOne(
                { username: requesterUsername, 'friends.username': responderUsername },
                { $set: { 'friends.$.status': 'friends', 'friends.$.since': timestamp } }
            );
            await Promise.all([responderUpdate, requesterUpdate]);

            const requesterClient = clients.get(requesterUsername);
            const responderClient = clients.get(responderUsername);

            if (requesterClient) {
                requesterClient.send(JSON.stringify({ type: 'friend:request_accepted', payload: { by: responderUsername, since: timestamp } }));
                if(responderClient) requesterClient.send(JSON.stringify({ type: 'friend:online', payload: { username: responderUsername } }));
            }
            if (responderClient && requesterClient) {
                responderClient.send(JSON.stringify({ type: 'friend:online', payload: { username: requesterUsername } }));
            }
            res.status(200).json({ message: `Bạn và ${requesterUsername} đã trở thành bạn bè.` });
        } else { // decline
            const responderUpdate = User.updateOne({ username: responderUsername }, { $pull: { friends: { username: requesterUsername } } });
            const requesterUpdate = User.updateOne({ username: requesterUsername }, { $pull: { friends: { username: responderUsername } } });
            await Promise.all([responderUpdate, requesterUpdate]);
            
            const requesterClient = clients.get(requesterUsername);
            if (requesterClient) {
                requesterClient.send(JSON.stringify({ type: 'friend:request_declined', payload: { by: responderUsername } }));
            }
            res.status(200).json({ message: `Bạn đã từ chối lời mời kết bạn từ ${requesterUsername}.` });
        }
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server.' });
    }
}

async function handleRemoveFriend(req, res, { User, clients }) {
    const { username: selfUsername } = req.user;
    const { friendUsername } = req.params;

    if (!friendUsername) {
        return res.status(400).json({ message: 'Tên bạn bè là bắt buộc.' });
    }

    try {
        const selfUpdate = User.updateOne({ username: selfUsername }, { $pull: { friends: { username: friendUsername } } });
        const friendUpdate = User.updateOne({ username: friendUsername }, { $pull: { friends: { username: selfUsername } } });
        await Promise.all([selfUpdate, friendUpdate]);

        const friendClient = clients.get(friendUsername);
        if (friendClient) {
            friendClient.send(JSON.stringify({ type: 'friend:removed', payload: { by: selfUsername } }));
        }
        res.status(200).json({ message: `Đã xóa ${friendUsername} khỏi danh sách bạn bè.` });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server.' });
    }
}

module.exports = {
    handleFriendRequest,
    handleFriendResponse,
    handleRemoveFriend,
};