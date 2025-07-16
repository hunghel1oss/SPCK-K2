import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import * as api from '../services/api';
import * as websocketService from '../services/websocketService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [apiKey, setApiKey] = useState(() => localStorage.getItem('apiKey'));
    const [isLoading, setIsLoading] = useState(true);

    const validateAndSetUser = useCallback(async (keyToValidate) => {
        if (!keyToValidate) {
            setIsLoading(false);
            return;
        }
        
        try {
            const userData = await api.validateApiKey(keyToValidate);
            setUser(userData);
            setApiKey(keyToValidate); 
            websocketService.connect(keyToValidate);
        } catch (error) {
            console.error("API Key không hợp lệ, đang dọn dẹp:", error.message);
            localStorage.removeItem('apiKey');
            setUser(null);
            setApiKey(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        validateAndSetUser(apiKey);
    }, [validateAndSetUser]); 
    
    const handleAuthSuccess = async (data) => {
        localStorage.setItem('apiKey', data.apiKey);
        setApiKey(data.apiKey);
        setUser({ username: data.username });
        websocketService.connect(data.apiKey);
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
    };

    const value = {
        user,
        apiKey,
        isAuthenticated: !!apiKey,
        isLoading,
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