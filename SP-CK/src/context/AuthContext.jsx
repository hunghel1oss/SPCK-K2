import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import * as api from '../services/api';
import * as websocketService from '../services/websocketService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [apiKey, setApiKey] = useState(() => localStorage.getItem('apiKey'));
    const [isLoading, setIsLoading] = useState(true);
    const [elo, setElo] = useState(null);
    const [gachaTickets, setGachaTickets] = useState(0);

    const validateAndSetUser = useCallback(async (keyToValidate) => {
        if (!keyToValidate) {
            setIsLoading(false);
            return;
        }
        
        try {
            const userData = await api.validateApiKey(keyToValidate);
            setUser({ username: userData.username });
            setElo(userData.elo);
            setGachaTickets(userData.gachaTickets);
            setApiKey(keyToValidate); 
            websocketService.connect(keyToValidate);
        } catch (error) {
            localStorage.removeItem('apiKey');
            setUser(null);
            setApiKey(null);
            setElo(null);
            setGachaTickets(0);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        validateAndSetUser(apiKey);

        const handleRewardsUpdate = (payload) => {
            setElo(payload.newElo);
            setGachaTickets(payload.newGachaTickets);
        };
        websocketService.on('rewards:updated', handleRewardsUpdate);
        
        return () => {
            websocketService.off('rewards:updated', handleRewardsUpdate);
        };
    }, [validateAndSetUser]); 
    
    const handleAuthSuccess = async (data) => {
        localStorage.setItem('apiKey', data.apiKey);
        setApiKey(data.apiKey);
        await validateAndSetUser(data.apiKey);
    };

    const login = async (username, password) => {
        const data = await api.login(username, password);
        await handleAuthSuccess(data);
    };

    const register = async (username, password) => {
        const data = await api.register(username, password);
        await handleAuthSuccess(data);
    };

    const logout = () => {
        websocketService.disconnect();
        localStorage.removeItem('apiKey');
        setUser(null);
        setApiKey(null);
        setElo(null);
        setGachaTickets(0);
    };

    const value = {
        user,
        apiKey,
        isAuthenticated: !!apiKey,
        isLoading,
        elo,
        gachaTickets,
        login,
        register,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {!isLoading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth phải được sử dụng bên trong AuthProvider');
    }
    return context;
};