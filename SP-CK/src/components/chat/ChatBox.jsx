import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';

const ChatBox = ({ title, messages, onSendMessage, onClose }) => {
    const [newMessage, setNewMessage] = useState('');
    const { user } = useAuth();
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (newMessage.trim()) {
            onSendMessage(newMessage.trim());
            setNewMessage('');
        }
    };

    return (
        <div className="w-72 h-96 flex flex-col bg-gray-800 rounded-t-lg shadow-xl border border-b-0 border-gray-700">
            <div className="p-3 font-bold flex justify-between items-center text-white bg-gray-900 rounded-t-lg">
                <span>{title || 'Trò chuyện'}</span>
                {onClose && (
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <i className="bx bx-x text-xl"></i>
                    </button>
                )}
            </div>
            <div className="flex-1 p-3 overflow-y-auto">
                {messages.map((msg, index) => (
                    <div 
                        key={index} 
                        className={`mb-3 flex ${msg.sender === user.username ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`rounded-lg px-3 py-2 max-w-xs ${msg.sender === user.username ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-200'}`}>
                            {msg.sender !== user.username && (
                                <p className="text-xs font-bold text-purple-300">{msg.sender}</p>
                            )}
                            <p className="text-sm break-words">{msg.message}</p>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="p-2 border-t border-gray-700">
                <div className="flex">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Nhập tin nhắn..."
                        className="flex-1 px-3 py-2 bg-gray-700 text-white rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                    />
                    <button 
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-r-md hover:bg-blue-700 transition-colors"
                    >
                        Gửi
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ChatBox;