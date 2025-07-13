import React, { createContext, useState, useContext, useCallback } from 'react';
import { getHistory, saveGameToHistory } from '../services/api';

export const HistoryContext = createContext(null);

export const HistoryProvider = ({ children }) => {
    const [history, setHistory] = useState([]);

    const loadHistoryForUser = useCallback(async (apiKey) => {
        if (!apiKey) {
            setHistory([]);
            return;
        }
        try {
            const serverHistory = await getHistory(apiKey);
            setHistory(serverHistory);
        } catch (error) {
            console.error("Không thể tải lịch sử game từ server:", error);
            setHistory([]);
        }
    }, []);

    const saveGameForUser = useCallback(async (apiKey, gameData) => {
        if (!apiKey) return;
        try {
            const updatedHistory = await saveGameToHistory(apiKey, gameData);
            setHistory(updatedHistory);
        } catch (error) {
            console.error("Không thể lưu lịch sử game lên server:", error);
        }
    }, []);

    const clearHistoryForUser = useCallback((apiKey) => {
        console.warn("Chức năng xóa lịch sử trên server chưa được cài đặt.");
        setHistory([]); 
    }, []);

    const value = {
        history,
        loadHistoryForUser,
        saveGameForUser,
        clearHistoryForUser,
    };

    return (
        <HistoryContext.Provider value={value}>
            {children}
        </HistoryContext.Provider>
    );
};

export const useHistory = () => {
    const context = useContext(HistoryContext);
    if (!context) {
        throw new Error('useHistory phải được sử dụng bên trong HistoryProvider');
    }
    return context;
};