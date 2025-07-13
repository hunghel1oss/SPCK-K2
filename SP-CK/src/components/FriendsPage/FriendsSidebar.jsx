import React from 'react';
import { useFriends } from '../../context/FriendsContext';

const FriendStatusItem = ({ friend, isOnline }) => {
    return (
        <div 
            className={`flex items-center gap-3 p-2 rounded-md transition-all duration-300 ${
                !isOnline ? 'opacity-50' : ''
            }`}
        >
            <div className="relative">
                <div className={`
                    w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center 
                    font-bold text-white transition-all duration-300 ${
                    !isOnline ? 'grayscale' : ''
                }`}>
                    {friend.username.charAt(0).toUpperCase()}
                </div>
                <span 
                    className={`absolute bottom-0 right-0 block h-3 w-3 rounded-full border-2 
                    border-gray-900 ${
                    isOnline ? 'bg-green-500' : 'bg-gray-500'
                }`}></span>
            </div>
            <span className="font-medium">{friend.username}</span>
        </div>
    );
};

const FriendsSidebar = () => {
    const { friends, onlineFriends } = useFriends();

    const sortedFriends = [...friends].sort((a, b) => {
        const aIsOnline = onlineFriends.has(a.username);
        const bIsOnline = onlineFriends.has(b.username);
        return bIsOnline - aIsOnline;
    });

    return (
        <aside className="fixed top-0 right-0 h-full w-64 bg-gray-900 text-white p-4 shadow-lg transform translate-x-full md:translate-x-0 transition-transform z-30 pt-20">
             <h3 className="text-lg font-semibold tracking-wider mb-4 border-b border-gray-700 pb-2">BẠN BÈ ({friends.length})</h3>
            <div className="flex flex-col gap-2 overflow-y-auto h-[calc(100%-4rem)]">
                {sortedFriends.length > 0 ? sortedFriends.map(friend => (
                    <FriendStatusItem 
                        key={friend.username} 
                        friend={friend} 
                        isOnline={onlineFriends.has(friend.username)} 
                    />
                )) : (
                    <p className="text-gray-500 text-sm mt-4 text-center">Chưa có bạn bè nào. Hãy tìm kiếm và kết bạn!</p>
                )}
            </div>
        </aside>
    );
};

export default FriendsSidebar;