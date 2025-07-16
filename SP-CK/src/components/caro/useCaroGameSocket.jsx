import { useState, useEffect, useCallback, useRef } from 'react';
import * as websocketService from '../../services/websocketService';
import { useHistory } from '../../context/HistoryContext';
import { useAuth } from '../../context/AuthContext';

const generateId = () => Math.random().toString(36).substring(2, 15);

export const useCaroGameSocket = () => {
    const { saveGameForUser } = useHistory();
    const { apiKey } = useAuth();

    const [gameState, setGameState] = useState({
        status: 'lobby',
        roomId: null,
        board: Array(100).fill(null),
        isMyTurn: false,
        mySymbol: null,
        opponent: null,
        winner: null,
        winningLine: [],
        postGameStatus: 'none',
    });

    const matchmakingIdRef = useRef(null);
    const gameStateRef = useRef(gameState);
    const isRematchingRef = useRef(false);

    const updateGameState = useCallback((updates) => {
        setGameState(prev => {
            const newState = { ...prev, ...updates };
            gameStateRef.current = newState;
            return newState;
        });
    }, []);

    useEffect(() => {
        const handleGameStart = (data) => {
            isRematchingRef.current = false;
            matchmakingIdRef.current = null;
            updateGameState({
                status: 'playing',
                roomId: data.roomId,
                board: data.board,
                isMyTurn: data.isMyTurn,
                mySymbol: data.mySymbol,
                opponent: data.opponent,
                winner: null,
                winningLine: [],
                postGameStatus: 'none',
            });
        };
        const handleWaiting = (data) => {
            if (data && matchmakingIdRef.current === data.matchmakingId) {
                updateGameState({ status: 'waiting' });
            }
        };
        const handleError = (data) => {
            alert(`Lỗi: ${data.message}`);
            matchmakingIdRef.current = null;
            updateGameState({ status: 'lobby' });
        };
        const handleGameUpdate = (data) => {
            if (data.disconnectMessage) alert(data.disconnectMessage);
            updateGameState(data);
            if (data.status === 'finished') {
                const currentState = gameStateRef.current;
                const isWin = data.winner === currentState.mySymbol;
                const resultText = data.winner ? (isWin ? 'Thắng' : 'Thua') : 'Hòa';
                const gameResult = {
                    gameName: 'Cờ Caro',
                    difficulty: `Online vs ${currentState.opponent}`,
                    result: resultText,
                    imageSrc: '/img/caro.jpg'
                };
                saveGameForUser(apiKey, gameResult);
            }
        };
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

        websocketService.on('caro:game_start', handleGameStart);
        websocketService.on('caro:update', handleGameUpdate);
        websocketService.on('caro:waiting', handleWaiting);
        websocketService.on('caro:error', handleError);
        websocketService.on('caro:waiting_rematch', handleWaitingRematch);
        websocketService.on('caro:rematch_requested', handleRematchRequested);
        websocketService.on('caro:rematch_declined', handleRematchDeclined);

        return () => {
            websocketService.off('caro:game_start', handleGameStart);
            websocketService.off('caro:update', handleGameUpdate);
            websocketService.off('caro:waiting', handleWaiting);
            websocketService.off('caro:error', handleError);
            websocketService.off('caro:waiting_rematch', handleWaitingRematch);
            websocketService.off('caro:rematch_requested', handleRematchRequested);
            websocketService.off('caro:rematch_declined', handleRematchDeclined);

            const currentState = gameStateRef.current;
            if (currentState.roomId && !isRematchingRef.current) {
                websocketService.emit('game:leave', { roomId: currentState.roomId });
            }
        };
    }, [apiKey, saveGameForUser, updateGameState]);

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
        updateGameState({ status: 'lobby', roomId: null });
    };

    const makeMove = (index) => {
        if (gameState.status === 'playing' && gameState.isMyTurn && !gameState.board[index]) {
            websocketService.emit('caro:move', { index });
        }
    };
    
    const requestRematch = () => {
        isRematchingRef.current = true;
        websocketService.emit('caro:request_rematch');
    }

    const leaveGame = () => {
        isRematchingRef.current = false;
        websocketService.emit('game:leave', { roomId: gameState.roomId });
        updateGameState({ status: 'lobby', roomId: null, postGameStatus: 'none' });
    };

    return { gameState, findMatch, makeMove, requestRematch, leaveLobby, leaveGame };
};