import React, { useState } from 'react';
import { useFriends } from '../../context/FriendsContext';
import 'boxicons/css/boxicons.min.css';
import FriendStatusItem from './FriendStatusItem';

const FriendsSidebar = () => {
    const { friends, onlineFriends } = useFriends();
    const [isExpanded, setIsExpanded] = useState(false);

    // DÒNG LOG QUAN TRỌNG ĐỂ BIẾT COMPONENT CÓ RENDER LẠI KHÔNG
    console.log('%c[SIDEBAR] Rendering. Online friends:', 'color: yellow;', onlineFriends);

    const sortedFriends = [...friends].sort((a, b) => {
        const aIsOnline = onlineFriends.has(a.username);
        const bIsOnline = onlineFriends.has(b.username);
        if (aIsOnline !== bIsOnline) {
            return bIsOnline - aIsOnline;
        }
        return a.username.localeCompare(b.username);
    });

    return (
        <aside 
            className={`sticky top-0 h-screen bg-gray-900 text-white shadow-lg transition-all duration-300 ease-in-out flex-shrink-0
            ${isExpanded ? 'w-64' : 'w-16'}`}
        >
           {/* ... phần JSX còn lại giữ nguyên ... */}
            <div className="h-full flex flex-col">
                <div 
                    className="flex items-center justify-center h-20 cursor-pointer border-b border-gray-700 hover:bg-gray-800 relative"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <i className={`bx bxs-user-detail text-2xl transition-all duration-300 ${isExpanded ? 'mr-2' : 'mr-0'}`}></i>
                    {isExpanded && (
                        <h3 className="text-lg font-semibold tracking-wider whitespace-nowrap">
                           BẠN BÈ ({friends.length})
                        </h3>
                    )}
                    <i className={`bx bx-chevron-left text-2xl absolute right-4 top-1/2 -translate-y-1/2 transition-transform duration-300 ${isExpanded ? 'rotate-0' : 'rotate-180'}`}></i>
                </div>
                
                <div className={`flex-grow overflow-y-auto transition-opacity duration-300 ${isExpanded ? 'opacity-100 p-4' : 'opacity-0 p-0'}`}>
                    {isExpanded && (
                         <div className="flex flex-col gap-2">
                            {sortedFriends.length > 0 ? sortedFriends.map(friend => (
                                <FriendStatusItem 
                                    key={friend.username} 
                                    friend={friend} 
                                    isOnline={onlineFriends.has(friend.username)} 
                                    isExpanded={isExpanded}
                                />
                            )) : (
                                <p className="text-gray-500 text-sm mt-4 text-center">Chưa có bạn bè nào.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
};

export default FriendsSidebar;