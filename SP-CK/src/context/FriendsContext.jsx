import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import * as api from '/src/services/api.js';
import * as websocketService from '/src/services/websocketService.js';
import { useAuth } from './AuthContext';

const FriendsContext = createContext(null);

export const FriendsProvider = ({ children }) => {
    const { apiKey, isAuthenticated } = useAuth();
    const [friends, setFriends] = useState([]);
    const [requests, setRequests] = useState([]);
    const [onlineFriends, setOnlineFriends] = useState(new Set());

    const loadFriendData = useCallback(async () => {
        if (!apiKey) return;
        try {
            const allRelations = await api.getFriends(apiKey);
            setFriends(allRelations.filter(r => r.status === 'friends'));
            setRequests(allRelations.filter(r => r.status !== 'friends'));
        } catch (error) {
            console.error("Lỗi khi tải danh sách bạn bè:", error);
        }
    }, [apiKey]);

    useEffect(() => {
        if (!isAuthenticated) {
            setFriends([]);
            setRequests([]);
            setOnlineFriends(new Set());
            return;
        }

        loadFriendData();

        const handleFriendOnline = ({ username }) => {
            setOnlineFriends(prev => {
                const newSet = new Set(prev);
                newSet.add(username);
                return newSet;
            });
        };
        const handleFriendOffline = ({ username }) => {
            setOnlineFriends(prev => {
                const newSet = new Set(prev);
                newSet.delete(username);
                return newSet;
            });
        };
        const handleOnlineList = (onlineUsernames) => {
            setOnlineFriends(new Set(onlineUsernames));
        };
        
        const handleFriendChange = () => {
            loadFriendData();
        };

        websocketService.on('friend:online', handleFriendOnline);
        websocketService.on('friend:offline', handleFriendOffline);
        websocketService.on('friend:list_online', handleOnlineList);
        websocketService.on('friend:request_received', handleFriendChange);
        websocketService.on('friend:request_accepted', handleFriendChange);
        websocketService.on('friend:request_declined', handleFriendChange); 

        return () => {
            websocketService.off('friend:online', handleFriendOnline);
            websocketService.off('friend:offline', handleFriendOffline);
            websocketService.off('friend:list_online', handleOnlineList);
            websocketService.off('friend:request_received', handleFriendChange);
            websocketService.off('friend:request_accepted', handleFriendChange);
            websocketService.off('friend:request_declined', handleFriendChange);
        };
    }, [isAuthenticated, apiKey, loadFriendData]);

    const sendFriendRequest = async (targetUsername) => {
        try {
            const res = await api.sendFriendRequest(apiKey, targetUsername);
            await loadFriendData();
            return res;
        } catch (error) {
            console.error("Lỗi khi gửi lời mời:", error);
            throw error;
        }
    };

    const respondToFriendRequest = async (requesterUsername, action) => {
        try {
            const res = await api.respondToFriendRequest(apiKey, requesterUsername, action);
            await loadFriendData();
            return res;
        } catch (error) {
            console.error("Lỗi khi phản hồi lời mời:", error);
            throw error;
        }
    };
    
    const value = {
        friends,
        requests,
        onlineFriends,
        sendFriendRequest,
        respondToFriendRequest,
    };

    return (
        <FriendsContext.Provider value={value}>
            {children}
        </FriendsContext.Provider>
    );
};

export const useFriends = () => {
    const context = useContext(FriendsContext);
    if (!context) {
        throw new Error('useFriends phải được sử dụng bên trong FriendsProvider');
    }
    return context;
};