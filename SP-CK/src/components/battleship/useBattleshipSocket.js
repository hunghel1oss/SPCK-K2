import { useState, useEffect, useCallback, useRef } from 'react';
import * as websocketService from '../../services/websocketService';
import { useAuth } from '../../context/AuthContext';
import { useHistory } from '../../context/HistoryContext';

export const useBattleshipSocket = () => {
    const { apiKey, user } = useAuth();
    const { saveGameForUser } = useHistory();
    const [gameState, setGameState] = useState({
        status: 'lobby', opponent: null, shipsToPlace: null, myBoard: [],
        opponentBoard: [], isMyTurn: false, lastShotResult: null, winner: null,
    });

    const updateGameState = useCallback((updates) => {
        setGameState(prev => ({ ...prev, ...updates }));
    }, []);

    useEffect(() => {
        const handleGameStart = (payload) => {
            updateGameState({
                status: 'placement', opponent: payload.opponent, shipsToPlace: payload.shipsToPlace,
                myBoard: Array(81).fill({ shipId: null, isHit: false }),
                opponentBoard: Array(81).fill({ shipId: null, isHit: false }),
                winner: null, lastShotResult: null,
            });
        };
        const handleCombatStart = (payload) => {
            updateGameState({ status: 'combat', isMyTurn: payload.isMyTurn });
        };
        const handleGameUpdate = (payload) => {
            setGameState(prev => {
                const { shotResult, isMyTurn } = payload;
                const { targetIndex, result, hitter } = shotResult;
                if (hitter === user.username) {
                    const newOpponentBoard = [...prev.opponentBoard];
                    if (newOpponentBoard[targetIndex]) {
                        newOpponentBoard[targetIndex] = { ...newOpponentBoard[targetIndex], isHit: true };
                        if (result !== 'miss') newOpponentBoard[targetIndex].shipId = 'hit';
                    }
                    return { ...prev, isMyTurn, opponentBoard: newOpponentBoard, lastShotResult: shotResult };
                } else {
                    const newMyBoard = [...prev.myBoard];
                    if (newMyBoard[targetIndex]) {
                        newMyBoard[targetIndex] = { ...newMyBoard[targetIndex], isHit: true };
                    }
                    return { ...prev, isMyTurn, myBoard: newMyBoard, lastShotResult: shotResult };
                }
            });
        };
        const handleGameOver = (payload) => {
            if (payload.disconnectMessage) alert(payload.disconnectMessage);
            setGameState(prev => {
                const didIWin = payload.winner === user.username;
                saveGameForUser(apiKey, {
                    gameName: 'Bắn Tàu', difficulty: `Online vs ${prev.opponent}`,
                    result: didIWin ? 'Thắng' : 'Thua', imageSrc: '/img/battleship.jpg'
                });
                return { ...prev, status: 'finished', winner: payload.winner };
            });
        };
        const handleWaiting = () => updateGameState({ status: 'waiting' });
        const handleOpponentReady = () => console.log('Đối thủ đã sẵn sàng! Chờ bạn...');
        const handleError = (payload) => alert(`Lỗi từ server: ${payload.message}`);

        websocketService.on('battleship:game_start', handleGameStart);
        websocketService.on('battleship:waiting', handleWaiting);
        websocketService.on('battleship:opponent_ready', handleOpponentReady);
        websocketService.on('battleship:combat_start', handleCombatStart);
        websocketService.on('battleship:game_update', handleGameUpdate);
        websocketService.on('battleship:game_over', handleGameOver);
        websocketService.on('battleship:error', handleError);

        return () => {
            websocketService.off('battleship:game_start', handleGameStart);
            websocketService.off('battleship:waiting', handleWaiting);
            websocketService.off('battleship:opponent_ready', handleOpponentReady);
            websocketService.off('battleship:combat_start', handleCombatStart);
            websocketService.off('battleship:game_update', handleGameUpdate);
            websocketService.off('battleship:game_over', handleGameOver);
            websocketService.off('battleship:error', handleError);
        };
    }, [apiKey, user.username, updateGameState, saveGameForUser]);

    const findMatch = () => websocketService.emit('battleship:find_match');
    const placeShips = (ships) => {
        const newMyBoard = Array(81).fill(null).map(() => ({ shipId: null, isHit: false }));
        ships.forEach(ship => {
            if (ship.isPlaced) {
                ship.positions.forEach(pos => { newMyBoard[pos].shipId = ship.id; });
            }
        });
        updateGameState({ myBoard: newMyBoard });
        websocketService.emit('battleship:place_ships', { ships });
    };
    const fireShot = (index) => websocketService.emit('battleship:fire_shot', { index });

    return { gameState, findMatch, placeShips, fireShot };
};