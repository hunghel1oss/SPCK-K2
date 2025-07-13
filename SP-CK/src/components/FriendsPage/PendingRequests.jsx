import React from 'react';
import { useFriends } from '../../context/FriendsContext';

const PendingRequests = () => {
    const { requests, respondToFriendRequest } = useFriends();

    const received = requests.filter(r => r.status === 'pending_received');
    const sent = requests.filter(r => r.status === 'pending_sent');

    return (
        <div className="bg-gray-800 p-4 rounded-lg mt-6">
            <h3 className="text-xl font-semibold mb-4 text-white">Yêu cầu đang chờ</h3>
            
            {/* Yêu cầu nhận được */}
            <div>
                <h4 className="text-lg font-medium text-gray-300 mb-2">Lời mời kết bạn ({received.length})</h4>
                {received.length === 0 ? <p className="text-gray-500">Không có lời mời nào.</p> : received.map(req => (
                    <div key={req.username} className="flex justify-between items-center bg-gray-700 p-2 rounded-md mt-2">
                        <span className="text-white">{req.username}</span>
                        <div className="flex gap-2">
                            <button onClick={() => respondToFriendRequest(req.username, 'accept')} className="bg-green-600 px-3 py-1 text-sm rounded-md hover:bg-green-700">Chấp nhận</button>
                            <button onClick={() => respondToFriendRequest(req.username, 'decline')} className="bg-red-600 px-3 py-1 text-sm rounded-md hover:bg-red-700">Từ chối</button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Yêu cầu đã gửi */}
            <div className="mt-6">
                <h4 className="text-lg font-medium text-gray-300 mb-2">Đã gửi lời mời ({sent.length})</h4>
                {sent.length === 0 ? <p className="text-gray-500">Chưa gửi lời mời nào.</p> : sent.map(req => (
                     <div key={req.username} className="flex justify-between items-center bg-gray-700 p-2 rounded-md mt-2">
                        <span className="text-white">{req.username}</span>
                        <span className="text-gray-400 text-sm">Đang chờ</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PendingRequests;