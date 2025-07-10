import { useState, useEffect, useCallback } from 'react';
import * as websocketService from '../../services/websocketService';
import { useAuth } from '../../context/AuthContext';
import { useHistory } from '../../context/HistoryContext';

export const useBattleshipSocket = () => {
    const { apiKey, username } = useAuth(); 
    const { saveGameForUser } = useHistory();
    const [gameState, setGameState] = useState({
        status: 'lobby',
        opponent: null,
        shipsToPlace: null,
        myBoard: [],
        opponentBoard: [],
        isMyTurn: false,
        lastShotResult: null,
        winner: null,
    });

    const updateGameState = useCallback((updates) => {
        setGameState(prev => ({ ...prev, ...updates }));
    }, []);

    useEffect(() => {
        if (!apiKey) return;

        websocketService.connect(apiKey);

        const handleGameStart = (payload) => {
            updateGameState({
                status: 'placement',
                opponent: payload.opponent,
                shipsToPlace: payload.shipsToPlace,
                myBoard: Array(81).fill({ shipId: null, isHit: false }),
                opponentBoard: Array(81).fill({ shipId: null, isHit: false }),
            });
        };
        
        const handleCombatStart = (payload) => {
             updateGameState({ status: 'combat', isMyTurn: payload.isMyTurn });
        };

        const handleGameUpdate = (payload) => {
            updateGameState({
                isMyTurn: payload.isMyTurn,
                myBoard: payload.myBoard,
                opponentBoard: payload.opponentBoard,
                lastShotResult: payload.shotResult,
            });
        };

        const handleGameOver = (payload) => {
            // Dùng một biến tạm để lấy giá trị opponent mới nhất
            setGameState(prev => {
                const didIWin = payload.winner === username;
                // Lưu lịch sử ngay tại đây để đảm bảo có state mới nhất
                saveGameForUser(apiKey, {
                    gameName: 'Bắn Tàu',
                    difficulty: `Online vs ${prev.opponent}`,
                    result: didIWin ? 'Thắng' : 'Thua',
                    imageSrc: '/img/battleship.png'
                });
                return { ...prev, status: 'finished', winner: payload.winner };
            });
        };

        const handleWaiting = () => updateGameState({ status: 'waiting' });
        const handleOpponentReady = () => {
            // Có thể thêm một thông báo nhỏ ở đây
            console.log('Đối thủ đã sẵn sàng! Chờ bạn...');
        };
        const handleError = (payload) => alert(`Lỗi từ server: ${payload.message}`);

        websocketService.on('battleship:game_start', handleGameStart);
        websocketService.on('battleship:waiting', handleWaiting);
        websocketService.on('battleship:opponent_ready', handleOpponentReady);
        websocketService.on('battleship:combat_start', handleCombatStart);
        websocketService.on('battleship:game_update', handleGameUpdate);
        websocketService.on('battleship:game_over', handleGameOver);
        websocketService.on('battleship:error', handleError);

        // --- GIAI ĐOẠN 2: DỌN DẸP KHI COMPONENT UNMOUNT ---
        return () => {
            console.log("Dọn dẹp Battleship Socket: gỡ listener và ngắt kết nối.");
            websocketService.off('battleship:game_start', handleGameStart);
            websocketService.off('battleship:waiting', handleWaiting);
            websocketService.off('battleship:opponent_ready', handleOpponentReady);
            websocketService.off('battleship:combat_start', handleCombatStart);
            websocketService.off('battleship:game_update', handleGameUpdate);
            websocketService.off('battleship:game_over', handleGameOver);
            websocketService.off('battleship:error', handleError);
            
            // Di chuyển disconnect vào đây!
            websocketService.disconnect();
        };
    }, [apiKey, username, updateGameState, saveGameForUser]);


    const findMatch = () => {
        websocketService.emit('battleship:find_match');
    };

    const placeShips = (ships) => {
        websocketService.emit('battleship:place_ships', { ships });
    };

    const fireShot = (index) => {
        websocketService.emit('battleship:fire_shot', { index });
    };

    return { gameState, findMatch, placeShips, fireShot };
};