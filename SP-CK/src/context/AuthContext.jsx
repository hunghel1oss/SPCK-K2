import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import * as api from '../services/api';
import * as websocketService from '../services/websocketService';
import { useHistory } from './HistoryContext';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [apiKey, setApiKey] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const { loadHistoryForUser } = useHistory();

    useEffect(() => {
        let isMounted = true;
        const initializeAuth = async () => {
            try {
                const storedApiKey = localStorage.getItem('apiKey');
                const storedUser = localStorage.getItem('user');
                if (storedApiKey && storedUser) {
                    const parsedUser = JSON.parse(storedUser);
                    if (isMounted) {
                        setUser({ username: parsedUser.username });
                        setApiKey(storedApiKey);
                        await loadHistoryForUser(storedApiKey);
                        websocketService.connect(storedApiKey);
                    }
                }
            } catch (error) {
                console.error("Lỗi khi khởi tạo xác thực:", error);
                localStorage.clear();
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };
        initializeAuth();
        return () => { isMounted = false; };
    }, [loadHistoryForUser]);

    const handleAuthSuccess = useCallback(async (data) => {
        localStorage.setItem('apiKey', data.apiKey);
        localStorage.setItem('user', JSON.stringify({ username: data.username }));
        setUser({ username: data.username });
        setApiKey(data.apiKey);
        await loadHistoryForUser(data.apiKey);
        websocketService.connect(data.apiKey);
    }, [loadHistoryForUser]);

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
        localStorage.removeItem('user');
        setUser(null);
        setApiKey(null);
        loadHistoryForUser(null);
    };

    const value = {
        user,
        apiKey,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
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