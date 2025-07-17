import React, { useEffect, useRef, useState } from 'react';
import 'boxicons/css/boxicons.min.css';

const MenuItem = ({ icon, text, onClick, colorClass = 'text-gray-200', disabled = false }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`w-full text-left flex items-center gap-3 px-4 py-2 rounded-md transition-colors duration-150 
        ${disabled 
            ? 'text-gray-500 cursor-not-allowed' 
            : `${colorClass} hover:bg-gray-700`
        }`}
    >
        <i className={`bx ${icon} text-lg`}></i>
        <span className="font-medium">{text}</span>
    </button>
);

const OfflineFriendContextMenu = ({ friend, position, onClose, onRemoveFriend }) => {
    const menuRef = useRef(null);
    const [adjustedPosition, setAdjustedPosition] = useState({ top: position.y, left: position.x });

    useEffect(() => {
        if (menuRef.current) {
            const menuWidth = menuRef.current.offsetWidth;
            const menuHeight = menuRef.current.offsetHeight;
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;

            let newLeft = position.x;
            let newTop = position.y;

            if (position.x + menuWidth > windowWidth) {
                newLeft = windowWidth - menuWidth - 10;
            }
            if (position.y + menuHeight > windowHeight) {
                newTop = windowHeight - menuHeight - 10;
            }
            
            setAdjustedPosition({ top: newTop, left: newLeft });
        }

        const handleInteractionOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                onClose();
            }
        };
        
        document.addEventListener('mousedown', handleInteractionOutside);
        window.addEventListener('scroll', onClose, true);
        window.addEventListener('resize', onClose);

        return () => {
            document.removeEventListener('mousedown', handleInteractionOutside);
            window.removeEventListener('scroll', onClose, true);
            window.removeEventListener('resize', onClose);
        };
    }, [onClose, position.x, position.y]);

    return (
        <div
            ref={menuRef}
            className="fixed z-50 w-60 bg-gray-800 rounded-lg shadow-2xl p-2 border border-gray-700 animate-fade-in-fast"
            style={{ top: `${adjustedPosition.top}px`, left: `${adjustedPosition.left}px` }}
        >
            <div className="flex items-center gap-3 p-2 border-b border-gray-700 mb-2">
                <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center font-bold text-white text-xl grayscale">
                    {friend.username.charAt(0).toUpperCase()}
                </div>
                <div>
                    <p className="font-bold text-gray-400">{friend.username}</p>
                    <p className="text-xs text-gray-500">Offline</p>
                </div>
            </div>
            
            <div className="flex flex-col gap-1">
                <MenuItem icon='bxs-chess' text='Mời chơi Caro' disabled={true} />
                <MenuItem icon='bxs-ship' text='Mời chơi Battleship' disabled={true} />
                
                <div className="border-t border-gray-600 my-1"></div>

                <MenuItem icon='bxs-user-circle' text='Xem hồ sơ' onClick={() => alert('Chức năng Xem hồ sơ')} />
                
                <MenuItem icon='bxs-chat' text='Nhắn tin' disabled={true} />
                
                <div className="border-t border-gray-600 my-1"></div>
                
                <MenuItem 
                    icon='bxs-user-minus' 
                    text='Xóa bạn' 
                    onClick={onRemoveFriend}
                    colorClass="text-red-400"
                />
            </div>
        </div>
    );
};

export default OfflineFriendContextMenu;