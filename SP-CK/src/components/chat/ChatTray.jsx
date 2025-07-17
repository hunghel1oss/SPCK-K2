import React from 'react';
import { useChat } from '../../context/ChatContext';
import ChatBox from './ChatBox';

const ChatTray = () => {
    const { activeChats, sendMessage, closeChat } = useChat();

    return (
        <div className="fixed bottom-0 right-4 flex items-end gap-4 z-50 pointer-events-none">
            {Object.keys(activeChats).map(friendUsername => (
                <div key={friendUsername} className="mb-0 pointer-events-auto">
                     <ChatBox 
                        key={friendUsername}
                        title={friendUsername}
                        messages={activeChats[friendUsername].messages}
                        onSendMessage={(message) => sendMessage(friendUsername, message)}
                        onClose={() => closeChat(friendUsername)}
                    />
                </div>
            ))}
        </div>
    );
};

export default ChatTray;