import React, { useCallback } from 'react';
import { useHistory } from '../../context/HistoryContext';
import { useAuth } from '../../context/AuthContext';
import { useCaroGameSocket } from './useCaroGameSocket';
import Board from './Board';
import GameInfo from './GameInfo';
import Lobby from './Lobby';

export const CaroGame = ({ onBack }) => {
    const { saveGameForUser } = useHistory();
    const { apiKey } = useAuth();

    const saveCurrentGame = useCallback((gameData) => {
        if (apiKey) {
            saveGameForUser(apiKey, gameData);
        }
    }, [apiKey, saveGameForUser]);

    const { gameState, findMatch, makeMove, requestRematch, leaveLobby } = useCaroGameSocket(saveCurrentGame, apiKey);
    const { status, board, isMyTurn, mySymbol, opponent, winner, winningLine } = gameState;

    const getStatusMessage = () => {
        if (status === 'finished') {
            if (winner) {
                return winner === mySymbol ? 'Bạn đã thắng!' : 'Bạn đã thua!';
            }
            return 'Hòa cờ!';
        }
        if (status === 'playing') {
            return isMyTurn ? `Lượt của bạn (${mySymbol})` : `Đang chờ ${opponent}...`;
        }
        return 'Đang chờ...';
    };

    const handleBack = () => {
        if (status === 'waiting') {
            leaveLobby();
        }
        onBack();
    }

    if (status === 'lobby' || status === 'waiting') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
                <Lobby 
                    status={status} 
                    onFindMatch={findMatch} 
                    onCancelFind={leaveLobby} 
                />
                <button onClick={handleBack} className="mt-8 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg">
                    Quay lại
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
            <h1 className="text-5xl font-bold mb-4 text-cyan-400">Cờ Caro</h1>
            <p className="text-lg mb-8 text-gray-400">Bạn ({mySymbol}) vs {opponent}</p>
            <div className="flex flex-col lg:flex-row gap-8 items-center">
                <Board squares={board} onClick={makeMove} winningLine={winningLine} />
                <GameInfo status={getStatusMessage()} onRematch={status === 'finished' ? requestRematch : null} />
            </div>
            <button onClick={onBack} className="mt-8 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg">Quay lại Thư viện</button>
        </div>
    );
};