import React, { createContext, useState, useContext, useEffect } from 'react';
import * as api from '/src/services/api.js';
import * as websocketService from '/src/services/websocketService.js';
import { useAuth } from './AuthContext';

const FriendsContext = createContext(null);

export const FriendsProvider = ({ children }) => {
    const { apiKey, isAuthenticated } = useAuth();
    const [friends, setFriends] = useState([]);
    const [requests, setRequests] = useState([]);
    const [onlineFriends, setOnlineFriends] = useState(new Set());

    useEffect(() => {
        if (!isAuthenticated || !apiKey) {
            setFriends([]);
            setRequests([]);
            setOnlineFriends(new Set());
            return;
        }

        const loadFriendData = async () => {
            try {
                const allRelations = await api.getFriends(apiKey);
                setFriends(allRelations.filter(r => r.status === 'friends'));
                setRequests(allRelations.filter(r => r.status !== 'friends'));
            } catch (error) {
                console.error("Lỗi khi tải danh sách bạn bè:", error);
            }
        };

        loadFriendData();

        const handleFriendOnline = ({ username }) => {
            console.log(`%c[CONTEXT] Received friend:online for: ${username}`, 'color: lightgreen; font-weight: bold;');
            setOnlineFriends(prev => {
                const newSet = new Set(prev);
                newSet.add(username);
                console.log('[CONTEXT] New online set is:', newSet);
                return newSet;
            });
        };
        const handleFriendOffline = ({ username }) => {
            console.log(`%c[CONTEXT] Received friend:offline for: ${username}`, 'color: orange; font-weight: bold;');
            setOnlineFriends(prev => {
                const newSet = new Set(prev);
                newSet.delete(username);
                console.log('[CONTEXT] New online set is:', newSet);
                return newSet;
            });
        };
        const handleOnlineList = (onlineUsernames) => {
            console.log('%c[CONTEXT] Received friend:list_online:', 'color: lightblue; font-weight: bold;', onlineUsernames);
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
    }, [isAuthenticated, apiKey]);

    const sendFriendRequest = async (targetUsername) => {
        const res = await api.sendFriendRequest(apiKey, targetUsername);
        return res;
    };

    const respondToFriendRequest = async (requesterUsername, action) => {
        const res = await api.respondToFriendRequest(apiKey, requesterUsername, action);
        return res;
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