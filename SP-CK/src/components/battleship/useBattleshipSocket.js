import { useState, useEffect, useCallback, useRef } from 'react';
import * as websocketService from '../../services/websocketService';
import { useAuth } from '../../context/AuthContext';
import { useHistory } from '../../context/HistoryContext';

const generateId = () => Math.random().toString(36).substring(2, 15);

export const useBattleshipSocket = () => {
    const { apiKey, user } = useAuth();
    const { saveGameForUser } = useHistory();
    const [gameState, setGameState] = useState({
        status: 'lobby',
        roomId: null,
        opponent: null,
        shipsToPlace: null,
        myBoard: [],
        opponentBoard: [],
        isMyTurn: false,
        lastShotResult: null,
        winner: null,
        postGameStatus: 'none',
    });

    const updateGameState = useCallback((updates) => {
        setGameState(prev => ({ ...prev, ...updates }));
    }, []);

    const gameStateRef = useRef(gameState);
    const matchmakingIdRef = useRef(null);
    const isRematchingRef = useRef(false);
    
    useEffect(() => {
        gameStateRef.current = gameState;
    });

    useEffect(() => {
        const handleGameStart = (payload) => {
            isRematchingRef.current = false;
            matchmakingIdRef.current = null;
            updateGameState({
                status: 'placement',
                roomId: payload.roomId,
                opponent: payload.opponent,
                shipsToPlace: payload.shipsToPlace,
                myBoard: Array(81).fill({ shipId: null, isHit: false }),
                opponentBoard: Array(81).fill({ shipId: null, isHit: false }),
                winner: null,
                lastShotResult: null,
                postGameStatus: 'none',
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
                const gameResult = {
                    gameName: 'Bắn Tàu',
                    difficulty: `Online vs ${prev.opponent}`,
                    result: didIWin ? 'Thắng' : 'Thua',
                    imageSrc: '/img/battleship.jpg'
                };
                // Tạm thời comment lại dòng lỗi để tập trung vào luồng chính
                // saveGameForUser(apiKey, gameResult);
                console.log("Game over, result to save:", gameResult);
                return { ...prev, status: 'finished', winner: payload.winner };
            });
        };
        const handleWaiting = (data) => {
             if (data && matchmakingIdRef.current === data.matchmakingId) {
                updateGameState({ status: 'waiting' });
            }
        };
        const handleOpponentReady = () => console.log('Đối thủ đã sẵn sàng! Chờ bạn...');
        const handleError = (payload) => alert(`Lỗi từ server: ${payload.message}`);

        const handleWaitingRematch = () => {
            updateGameState({ postGameStatus: 'waiting_rematch' });
        };
        const handleRematchRequested = () => {
            updateGameState({ postGameStatus: 'rematch_requested' });
        };
        const handleRematchDeclined = (payload) => {
            alert(`Đối thủ ${payload.from} đã rời trận.`);
            updateGameState({ status: 'lobby', roomId: null, postGameStatus: 'none' });
        };

        websocketService.on('battleship:game_start', handleGameStart);
        websocketService.on('battleship:waiting', handleWaiting);
        websocketService.on('battleship:opponent_ready', handleOpponentReady);
        websocketService.on('battleship:combat_start', handleCombatStart);
        websocketService.on('battleship:game_update', handleGameUpdate);
        websocketService.on('battleship:game_over', handleGameOver);
        websocketService.on('battleship:error', handleError);
        websocketService.on('battleship:waiting_rematch', handleWaitingRematch);
        websocketService.on('battleship:rematch_requested', handleRematchRequested);
        websocketService.on('battleship:rematch_declined', handleRematchDeclined);

        return () => {
            websocketService.off('battleship:game_start', handleGameStart);
            websocketService.off('battleship:waiting', handleWaiting);
            websocketService.off('battleship:opponent_ready', handleOpponentReady);
            websocketService.off('battleship:combat_start', handleCombatStart);
            websocketService.off('battleship:game_update', handleGameUpdate);
            websocketService.off('battleship:game_over', handleGameOver);
            websocketService.off('battleship:error', handleError);
            websocketService.off('battleship:waiting_rematch', handleWaitingRematch);
            websocketService.off('battleship:rematch_requested', handleRematchRequested);
            websocketService.off('battleship:rematch_declined', handleRematchDeclined);
            
            const currentState = gameStateRef.current;
            if (currentState.roomId && !isRematchingRef.current) {
                websocketService.emit('game:leave', { roomId: currentState.roomId });
            }
        };
    }, [apiKey, user.username, updateGameState, saveGameForUser]);

    const findMatch = () => {
        const newMatchmakingId = generateId();
        matchmakingIdRef.current = newMatchmakingId;
        updateGameState({ status: 'waiting' });
        websocketService.emit('battleship:find_match', { matchmakingId: newMatchmakingId });
    };

    const leaveLobby = () => {
        if (matchmakingIdRef.current) {
            websocketService.emit('battleship:leave', { matchmakingId: matchmakingIdRef.current });
            matchmakingIdRef.current = null;
        }
        updateGameState({ status: 'lobby', roomId: null });
    };

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
    const requestRematch = () => {
        isRematchingRef.current = true;
        websocketService.emit('battleship:request_rematch');
    };
    const leaveGame = () => {
        isRematchingRef.current = false;
        websocketService.emit('game:leave', { roomId: gameState.roomId });
        updateGameState({ status: 'lobby', roomId: null, postGameStatus: 'none' });
    };

    return { gameState, findMatch, placeShips, fireShot, requestRematch, leaveGame, leaveLobby };
};