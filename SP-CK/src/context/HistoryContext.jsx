import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import * as api from '../services/api';
import * as websocketService from '../services/websocketService'; // Import websocketService
import { useAuth } from './AuthContext';

const HistoryContext = createContext();

export const useHistory = () => useContext(HistoryContext);

export const HistoryProvider = ({ children }) => {
    const { isAuthenticated, apiKey } = useAuth();
    const [history, setHistory] = useState([]);

    const loadHistory = useCallback(async () => {
        if (isAuthenticated && apiKey) {
            try {
                console.log("Đang tải lại lịch sử...");
                const historyData = await api.getHistory(apiKey);
                setHistory(historyData);
                console.log("Tải lại lịch sử thành công.");
            } catch (error) {
                console.error("Lỗi khi tải lịch sử:", error);
                setHistory([]);
            }
        } else {
            setHistory([]);
        }
    }, [isAuthenticated, apiKey]);

    useEffect(() => {
        loadHistory();

        // Lắng nghe sự kiện từ server
        const handleHistoryUpdate = () => {
            console.log("Nhận được tín hiệu 'history:updated' từ server.");
            loadHistory();
        };

        websocketService.on('history:updated', handleHistoryUpdate);

        // Dọn dẹp listener khi component unmount
        return () => {
            websocketService.off('history:updated', handleHistoryUpdate);
        };

    }, [loadHistory]);

    const saveGameForUser = async (userApiKey, gameData) => {
        if (!userApiKey) {
            console.error("Không thể lưu lịch sử: API Key không tồn tại.");
            return;
        }
        try {
            const updatedHistory = await api.saveGameToHistory(userApiKey, gameData);
            setHistory(updatedHistory);
        } catch (error) {
            console.error("Không thể lưu lịch sử game lên server:", error);
        }
    };
    
    const clearHistoryForUser = async () => {
        if (!apiKey) return;
        try {
            await api.clearHistory(apiKey);
            setHistory([]);
        } catch(error) {
            console.error("Lỗi khi xóa lịch sử:", error);
        }
    }

    const value = {
        history,
        loadHistory,
        saveGameForUser,
        clearHistoryForUser
    };

    return (
        <HistoryContext.Provider value={value}>
            {children}
        </HistoryContext.Provider>
    );
};