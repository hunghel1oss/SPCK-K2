import React, { useState } from 'react';
import { useFriends } from '../../context/FriendsContext';
import { useChat } from '../../context/ChatContext';
import 'boxicons/css/boxicons.min.css';
import FriendStatusItem from './FriendStatusItem';
import FriendContextMenu from './FriendContextMenu';
import OfflineFriendContextMenu from './OfflineFriendContextMenu';

const FriendsSidebar = () => {
    const { friends, onlineFriends, removeFriend } = useFriends();
    const { unreadChats } = useChat();
    const [isExpanded, setIsExpanded] = useState(false);
    const [activeMenu, setActiveMenu] = useState({ friend: null, position: { x: 0, y: 0 } });

    const sortedFriends = [...friends].sort((a, b) => {
        const aIsOnline = onlineFriends.has(a.username);
        const bIsOnline = onlineFriends.has(b.username);
        if (aIsOnline !== bIsOnline) {
            return bIsOnline - aIsOnline;
        }
        return a.username.localeCompare(b.username);
    });

    const handleFriendClick = (friend, event) => {
        event.preventDefault();
        setActiveMenu({
            friend: friend,
            position: { x: event.clientX, y: event.clientY }
        });
    };

    const handleCloseMenu = () => {
        setActiveMenu({ friend: null, position: { x: 0, y: 0 } });
    };
    
    const handleInvite = (gameType) => {
        console.log(`Mời ${activeMenu.friend.username} chơi ${gameType}`);
        handleCloseMenu();
    };

    const handleRemoveFriend = () => {
        if (activeMenu.friend) {
            removeFriend(activeMenu.friend.username);
        }
        handleCloseMenu();
    };

    const renderContextMenu = () => {
        if (!activeMenu.friend) return null;

        const isFriendOnline = onlineFriends.has(activeMenu.friend.username);

        if (isFriendOnline) {
            return (
                <FriendContextMenu 
                    friend={activeMenu.friend}
                    position={activeMenu.position}
                    onClose={handleCloseMenu}
                    onInvite={handleInvite}
                    onRemoveFriend={handleRemoveFriend}
                />
            );
        } else {
            return (
                <OfflineFriendContextMenu
                    friend={activeMenu.friend}
                    position={activeMenu.position}
                    onClose={handleCloseMenu}
                    onRemoveFriend={handleRemoveFriend}
                />
            );
        }
    };

    return (
        <>
            <aside 
                className={`sticky top-0 h-screen bg-gray-900 text-white shadow-lg transition-all duration-300 ease-in-out flex-shrink-0
                ${isExpanded ? 'w-64' : 'w-16'}`}
            >
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
                                    <div 
                                        key={friend.username}
                                        onContextMenu={(e) => handleFriendClick(friend, e)}
                                    >
                                        <FriendStatusItem 
                                            friend={friend} 
                                            isOnline={onlineFriends.has(friend.username)} 
                                            isExpanded={isExpanded}
                                            hasUnreadMessage={unreadChats.has(friend.username)}
                                        />
                                    </div>
                                )) : (
                                    <p className="text-gray-500 text-sm mt-4 text-center">Chưa có bạn bè nào.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </aside>
            
            {renderContextMenu()}
        </>
    );
};

export default FriendsSidebar;