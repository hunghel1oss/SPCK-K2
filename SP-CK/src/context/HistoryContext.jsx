import React, { createContext, useState, useContext, useCallback } from 'react';

const getHistoryKey = (apiKey) => `gameHistory_${apiKey}`;

export const HistoryContext = createContext(null);

export const HistoryProvider = ({ children }) => {
    const [history, setHistory] = useState([]);

    const loadHistoryForUser = useCallback((apiKey) => {
        if (!apiKey) {
            setHistory([]);
            return;
        }
        try {
            const historyKey = getHistoryKey(apiKey);
            const storedHistory = localStorage.getItem(historyKey);
            setHistory(storedHistory ? JSON.parse(storedHistory) : []);
        } catch (error) {
            console.error("Không thể tải lịch sử game:", error);
            setHistory([]);
        }
    }, []);

    const saveGameForUser = useCallback((apiKey, gameData) => {
        if (!apiKey) return;
        try {
            const historyKey = getHistoryKey(apiKey);
            const currentHistory = JSON.parse(localStorage.getItem(historyKey)) || [];

            const newRecord = {
                id: Date.now(),
                date: new Date().toLocaleString('vi-VN'),
                ...gameData
            };
            
            const updatedHistory = [newRecord, ...currentHistory];
            
            if (updatedHistory.length > 20) {
                updatedHistory.pop();
            }

            localStorage.setItem(historyKey, JSON.stringify(updatedHistory));
            setHistory(updatedHistory);
        } catch (error) {
            console.error("Không thể lưu lịch sử game:", error);
        }
    }, []);

    const clearHistoryForUser = useCallback((apiKey) => {
        if (!apiKey) return;
        const historyKey = getHistoryKey(apiKey);
        localStorage.removeItem(historyKey);
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