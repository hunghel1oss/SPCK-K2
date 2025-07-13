import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import * as api from '/src/services/api.js'
import * as websocketService from '/src/services/websocketService.js'
import { useAuth } from './AuthContext';

const FriendsContext = createContext(null);

export const FriendsProvider = ({ children }) => {
    const { apiKey, isAuthenticated } = useAuth();
    const [friends, setFriends] = useState([]);
    const [requests, setRequests] = useState([]);
    const [onlineFriends, setOnlineFriends] = useState(new Set());

    const fetchFriendsData = useCallback(async () => {
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
        if (isAuthenticated) {
            fetchFriendsData();
            
            websocketService.on('friend:online', ({ username }) => {
                setOnlineFriends(prev => new Set(prev).add(username));
            });
            websocketService.on('friend:offline', ({ username }) => {
                setOnlineFriends(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(username);
                    return newSet;
                });
            });
            websocketService.on('friend:list_online', (onlineUsernames) => {
                setOnlineFriends(new Set(onlineUsernames));
            });
            const reloadOnChange = () => fetchFriendsData();
            websocketService.on('friend:request_received', reloadOnChange);
            websocketService.on('friend:request_accepted', reloadOnChange);

            return () => {
                websocketService.off('friend:online');
                websocketService.off('friend:offline');
                websocketService.off('friend:list_online');
                websocketService.off('friend:request_received', reloadOnChange);
                websocketService.off('friend:request_accepted', reloadOnChange);
            };
        } else {
            setFriends([]);
            setRequests([]);
            setOnlineFriends(new Set());
        }
    }, [isAuthenticated, fetchFriendsData]);

    const sendFriendRequest = async (targetUsername) => {
        const res = await api.sendFriendRequest(apiKey, targetUsername);
        await fetchFriendsData();
        return res;
    };

    const respondToFriendRequest = async (requesterUsername, action) => {
        const res = await api.respondToFriendRequest(apiKey, requesterUsername, action);
        await fetchFriendsData();
        return res;
    };
    
    const value = {
        friends,
        requests,
        onlineFriends,
        fetchFriendsData,
        sendFriendRequest,
        respondToFriendRequest,
    };

    return (
        <FriendsContext.Provider value={value}>
            {children}
        </FriendsContext.Provider>
    );
};

// FIX: Thêm từ khóa "export" vào đây
export const useFriends = () => {
    const context = useContext(FriendsContext);
    if (!context) {
        throw new Error('useFriends phải được sử dụng bên trong FriendsProvider');
    }
    return context;
};