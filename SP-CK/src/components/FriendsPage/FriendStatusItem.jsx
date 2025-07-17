import React from 'react';

const FriendStatusItem = ({ friend, isOnline, isExpanded, hasUnreadMessage }) => {
    return (
        <div 
            className={`flex items-center gap-3 p-2 rounded-md transition-all duration-200 cursor-pointer hover:bg-gray-800/50`}
            title={`${friend.username} - ${isOnline ? 'Online' : 'Offline'}`}
        >
            <div className="relative flex-shrink-0">
                <div className={`
                    w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center 
                    font-bold text-white text-xl transition-all duration-300 ${
                    !isOnline ? 'grayscale opacity-60' : ''
                }`}>
                    {friend.username.charAt(0).toUpperCase()}
                </div>
                <span 
                    className={`absolute bottom-0 right-0 block h-3 w-3 rounded-full border-2 
                    border-gray-900 transition-colors duration-300 ${
                    isOnline ? 'bg-green-400' : 'bg-gray-500'
                }`}></span>
                
                {hasUnreadMessage && (
                    <span className="absolute top-0 right-0 block h-3 w-3 bg-red-500 rounded-full border-2 border-gray-900 animate-pulse">
                    </span>
                )}
            </div>
            {isExpanded && (
                <div className="flex-grow overflow-hidden">
                    <span className={`font-medium truncate block ${isOnline ? 'text-white' : 'text-gray-400'}`}>
                        {friend.username}
                    </span>
                    <span className={`text-xs ${isOnline ? 'text-green-400' : 'text-gray-500'}`}>
                        {isOnline ? 'Online' : 'Offline'}
                    </span>
                </div>
            )}
        </div>
    );
};

export default FriendStatusItem;