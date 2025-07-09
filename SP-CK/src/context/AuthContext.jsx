import React, { createContext, useState, useContext, useEffect } from 'react';
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
        setIsLoading(true);
        try {
            const storedApiKey = localStorage.getItem('apiKey');
            const storedUser = localStorage.getItem('user');

            if (storedApiKey && storedUser) {
                const parsedUser = JSON.parse(storedUser);
                setUser({ username: parsedUser.username });
                setApiKey(storedApiKey);
                loadHistoryForUser(storedApiKey);
            }
        } catch (error) {
            console.error("Lỗi khi khởi tạo xác thực:", error);
            localStorage.clear();
        } finally {
            setIsLoading(false);
        }
    }, [loadHistoryForUser]);

    const handleAuthSuccess = (data) => {
        localStorage.setItem('apiKey', data.apiKey);
        localStorage.setItem('user', JSON.stringify({ username: data.username }));
        setUser({ username: data.username });
        setApiKey(data.apiKey);
        loadHistoryForUser(data.apiKey);
    };

    const login = async (username, password) => {
        const data = await api.login(username, password);
        handleAuthSuccess(data);
    };

    const register = async (username, password) => {
        const data = await api.register(username, password);
        handleAuthSuccess(data);
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