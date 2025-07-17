import React, { useEffect, useRef } from 'react';
import 'boxicons/css/boxicons.min.css';
import { useChat } from '../../context/ChatContext';

const MenuItem = ({ icon, text, onClick, colorClass = 'text-gray-200 hover:bg-gray-700' }) => (
    <button
        onClick={onClick}
        className={`w-full text-left flex items-center gap-3 px-4 py-2 rounded-md transition-colors duration-150 ${colorClass}`}
    >
        <i className={`bx ${icon} text-lg`}></i>
        <span className="font-medium">{text}</span>
    </button>
);

const FriendContextMenu = ({ friend, position, onClose, onInvite, onRemoveFriend }) => {
    const menuRef = useRef(null);
    const { openChat } = useChat();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    const handleOpenChat = () => {
        openChat(friend.username);
        onClose();
    };

    return (
        <div
            ref={menuRef}
            className="fixed z-50 w-60 bg-gray-800 rounded-lg shadow-2xl p-2 border border-gray-700 animate-fade-in-fast"
            style={{ top: `${position.y}px`, left: `${position.x}px` }}
        >
            <div className="flex items-center gap-3 p-2 border-b border-gray-700 mb-2">
                <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center font-bold text-white text-xl">
                    {friend.username.charAt(0).toUpperCase()}
                </div>
                <div>
                    <p className="font-bold text-white">{friend.username}</p>
                    <p className="text-xs text-green-400">Online</p>
                </div>
            </div>
            
            <div className="flex flex-col gap-1">
                <MenuItem icon='bxs-chess' text='Mời chơi Caro' onClick={() => onInvite('caro')} />
                <MenuItem icon='bxs-ship' text='Mời chơi Battleship' onClick={() => onInvite('battleship')} />
                <div className="border-t border-gray-600 my-1"></div>
                <MenuItem icon='bxs-user-circle' text='Xem hồ sơ' onClick={() => alert('Chức năng Xem hồ sơ')} />
                <MenuItem icon='bxs-chat' text='Nhắn tin' onClick={handleOpenChat} />
                <div className="border-t border-gray-600 my-1"></div>
                <MenuItem 
                    icon='bxs-user-minus' 
                    text='Xóa bạn' 
                    onClick={onRemoveFriend}
                    colorClass="text-red-400 hover:bg-red-900/50"
                />
            </div>
        </div>
    );
};

export default FriendContextMenu;