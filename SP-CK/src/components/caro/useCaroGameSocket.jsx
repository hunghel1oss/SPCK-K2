import { useState, useEffect, useCallback, useRef } from 'react';
import * as websocketService from '../../services/websocketService';

const generateId = () => Math.random().toString(36).substring(2, 15);

export const useCaroGameSocket = (saveGame, apiKey) => {
    const [gameState, setGameState] = useState({
        status: 'lobby',
        board: Array(100).fill(null),
        isMyTurn: false,
        mySymbol: null,
        opponent: null,
        winner: null,
        winningLine: [],
    });

    const matchmakingIdRef = useRef(null);
    const gameStateRef = useRef(gameState);

    const updateGameState = useCallback((updates) => {
        setGameState(prev => {
            const newState = { ...prev, ...updates };
            gameStateRef.current = newState;
            return newState;
        });
    }, []);

    useEffect(() => {
        if (!apiKey) return;

        websocketService.connect(apiKey);

        const handleGameStart = (data) => {
            matchmakingIdRef.current = null;
            updateGameState({ status: 'playing', ...data });
        };
        const handleWaiting = (data) => {
            if (matchmakingIdRef.current === data.matchmakingId) {
                updateGameState({ status: 'waiting' });
            }
        };
        const handleError = (data) => {
            alert(`Lỗi: ${data.message}`);
            matchmakingIdRef.current = null;
            updateGameState({ status: 'lobby' });
        };
        const handleGameUpdate = (data) => {
            updateGameState(data);
            if (data.status === 'finished' && saveGame) {
                const currentState = gameStateRef.current;
                const isWin = data.winner === currentState.mySymbol;
                const result = {
                    gameName: 'Cờ Caro',
                    difficulty: `Online vs ${currentState.opponent}`,
                    moves: -1,
                    timeInSeconds: -1,
                    result: data.winner ? (isWin ? 'Thắng' : 'Thua') : 'Hòa',
                    imageSrc: '/caro-thumbnail.png'
                };
                saveGame(result);
            }
        };

        websocketService.on('caro:game_start', handleGameStart);
        websocketService.on('caro:update', handleGameUpdate);
        websocketService.on('caro:waiting', handleWaiting);
        websocketService.on('caro:error', handleError);

        return () => {
            websocketService.off('caro:game_start', handleGameStart);
            websocketService.off('caro:update', handleGameUpdate);
            websocketService.off('caro:waiting', handleWaiting);
            websocketService.off('caro:error', handleError);
        };
    }, [apiKey, saveGame, updateGameState]); 

    useEffect(() => {
        return () => {
            if (matchmakingIdRef.current) {
                 websocketService.emit('caro:leave', { matchmakingId: matchmakingIdRef.current });
            }
            websocketService.disconnect();
        }
    }, []);

    const findMatch = () => {
        const newMatchmakingId = generateId();
        matchmakingIdRef.current = newMatchmakingId;
        updateGameState({ status: 'waiting' });
        websocketService.emit('caro:find_match', { matchmakingId: newMatchmakingId });
    };

    const leaveLobby = () => {
        if (matchmakingIdRef.current) {
            websocketService.emit('caro:leave', { matchmakingId: matchmakingIdRef.current });
            matchmakingIdRef.current = null;
        }
        updateGameState({ status: 'lobby' });
    };

    const makeMove = (index) => {
        if (gameState.status === 'playing' && gameState.isMyTurn && !gameState.board[index]) {
            websocketService.emit('caro:move', { index });
        }
    };
    
    const requestRematch = () => {
        websocketService.emit('caro:rematch');
    }

    return { gameState, findMatch, makeMove, requestRematch, leaveLobby };
};