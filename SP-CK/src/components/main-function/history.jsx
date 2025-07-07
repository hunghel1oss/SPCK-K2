import React, { useState, useEffect } from 'react';
import { formatTime } from './time';

const HISTORY_STORAGE_KEY = 'genericGameHistory';

export const saveGameToHistory = (gameData) => {
    try {
        const history = JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY)) || [];
        const newRecord = {
            id: Date.now(),
            date: new Date().toLocaleString('vi-VN'),
            ...gameData
        };
        history.unshift(newRecord);
        if (history.length > 20) {
            history.pop();
        }
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
        console.error("Không thể lưu lịch sử game:", error);
    }
};

export const getGameHistory = () => {
    try {
        return JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY)) || [];
    } catch (error) {
        console.error("Không thể lấy lịch sử game:", error);
        return [];
    }
};

export const clearGameHistory = () => {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
};

export const HistoryDisplay = ({ onBack }) => {
    const [history, setHistory] = useState([]);

    useEffect(() => {
        setHistory(getGameHistory());
    }, []);

    const handleClearHistory = () => {
        if (window.confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử không?")) {
            clearGameHistory();
            setHistory([]);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-6 bg-gray-800 rounded-lg shadow-xl mt-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-white">Lịch sử chơi</h1>
                <div>
                    <button onClick={onBack} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg mr-4 transition-colors">
                        Quay lại
                    </button>
                    <button onClick={handleClearHistory} disabled={history.length === 0} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        Xóa lịch sử
                    </button>
                </div>
            </div>

            {history.length === 0 ? (
                <p className="text-center text-gray-400 mt-8">Chưa có lịch sử nào.</p>
            ) : (
                <div className="space-y-4">
                    {history.map((game) => (
                        <div key={game.id} className="bg-gray-700 p-4 rounded-lg flex items-center gap-4">
                            {game.imageSrc && <img src={game.imageSrc} alt="Game thumbnail" className="w-24 h-24 object-cover rounded-md" />}
                            <div className="flex-grow">
                                <p className="font-bold text-lg text-gray-200">{game.gameName || 'Game'}</p>
                                <p className="text-sm text-gray-400">{game.date}</p>
                                <p className="text-gray-300">Độ khó: {game.difficulty}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-gray-300">Số bước: <span className="font-semibold text-white">{game.moves}</span></p>
                                <p className="text-gray-300">Thời gian: <span className="font-semibold text-white">{formatTime(game.timeInSeconds)}</span></p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};