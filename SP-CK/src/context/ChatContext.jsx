import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import * as api from '../services/api';
import * as websocketService from '../services/websocketService';
import { useAuth } from './AuthContext';

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
    const { apiKey, user, isAuthenticated } = useAuth();
    const [activeChats, setActiveChats] = useState({});
    const [unreadChats, setUnreadChats] = useState(new Set());

    useEffect(() => {
        if (!isAuthenticated) {
            setActiveChats({});
            setUnreadChats(new Set());
            return;
        }

        const handleNewDM = (data) => {
            const friendUsername = data.sender === user.username ? data.recipient : data.sender;
            
            setActiveChats(prev => {
                if (!prev[friendUsername]) {
                    if (data.sender !== user.username) {
                        setUnreadChats(prevUnread => new Set(prevUnread).add(friendUsername));
                    }
                    return prev;
                }
                return {
                    ...prev,
                    [friendUsername]: {
                        ...prev[friendUsername],
                        messages: [...prev[friendUsername].messages, data]
                    }
                };
            });
        };

        websocketService.on('chat:new_dm', handleNewDM);
        return () => {
            websocketService.off('chat:new_dm', handleNewDM);
        };
    }, [isAuthenticated, user]);

    const openChat = async (friendUsername) => {
        // SỬA LẠI: Kiểm tra apiKey một cách chặt chẽ hơn
        if (!apiKey) {
            console.error("Không thể mở chat: API Key không tồn tại.");
            return;
        }
        if (activeChats[friendUsername]) return;

        setUnreadChats(prev => {
            const newSet = new Set(prev);
            newSet.delete(friendUsername);
            return newSet;
        });

        try {
            const history = await api.getChatHistory(apiKey, friendUsername);
            setActiveChats(prev => ({
                ...prev,
                [friendUsername]: { messages: history }
            }));
        } catch (error) {
            console.error(`Lỗi khi mở chat với ${friendUsername}:`, error);
            // Có thể hiển thị thông báo lỗi cho người dùng ở đây
        }
    };
    
    const closeChat = (friendUsername) => {
        setActiveChats(prev => {
            const newChats = { ...prev };
            delete newChats[friendUsername];
            return newChats;
        });
    };

    const sendMessage = (recipient, message) => {
        // SỬA LẠI: Kiểm tra trước khi gửi
        if (!apiKey) {
            console.error("Không thể gửi tin nhắn: API Key không tồn tại.");
            return;
        }
        websocketService.emit('chat:dm', { recipient, message });
    };
    
    const value = { activeChats, openChat, closeChat, sendMessage, unreadChats };

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChat phải được sử dụng trong ChatProvider');
    }
    return context;
};