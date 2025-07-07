import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import * as api from '../services/api';
import * as websocketService from '../services/websocketService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [apiKey, setApiKey] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const initAuth = useCallback(() => {
        setIsLoading(true);
        try {
            const storedApiKey = localStorage.getItem('apiKey');
            const storedUser = localStorage.getItem('user');
            if (storedApiKey && storedUser) {
                const parsedUser = JSON.parse(storedUser);
                setApiKey(storedApiKey);
                setUser(parsedUser);
                websocketService.connect(storedApiKey);
            }
        } catch (error) {
            console.error("Lỗi khi khởi tạo xác thực:", error);
            localStorage.clear();
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        initAuth();
        return () => {
            websocketService.disconnect();
        }
    }, [initAuth]);

    const login = async (username, password) => {
        const data = await api.login(username, password);
        localStorage.setItem('apiKey', data.apiKey);
        localStorage.setItem('user', JSON.stringify({ username: data.username }));
        setUser({ username: data.username });
        setApiKey(data.apiKey);
        websocketService.connect(data.apiKey);
        return data;
    };

    const register = async (username, password) => {
        const data = await api.register(username, password);
        localStorage.setItem('apiKey', data.apiKey);
        localStorage.setItem('user', JSON.stringify({ username: data.username }));
        setUser({ username: data.username });
        setApiKey(data.apiKey);
        websocketService.connect(data.apiKey);
        return data;
    };

    const logout = () => {
        setUser(null);
        setApiKey(null);
        localStorage.removeItem('apiKey');
        localStorage.removeItem('user');
        websocketService.disconnect();
        // Tải lại trang để đảm bảo mọi trạng thái được reset
        window.location.reload();
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