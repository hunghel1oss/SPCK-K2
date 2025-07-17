import React from 'react';
import { useCaroGameSocket } from './useCaroGameSocket.jsx';
import { useRoomChat } from '../chat/useRoomChat.js';
import Board from './Board.jsx';
import GameInfo from './GameInfo.jsx';
import Lobby from '../game/Lobby.jsx';
import ChatBox from '../chat/ChatBox.jsx';
import PostGameScreen from '../game/PostGameScreen';

export const CaroGame = ({ onBack }) => {
    const { 
        gameState, 
        findMatch, 
        makeMove, 
        requestRematch, 
        leaveLobby,
        leaveGame
    } = useCaroGameSocket();

    const { chatMessages, sendRoomMessage } = useRoomChat(gameState.roomId);

    const { status, board, isMyTurn, mySymbol, opponent, winner, winningLine, postGameStatus } = gameState;

    const getStatusMessage = () => {
        if (status === 'playing') return isMyTurn ? `Lượt của bạn (${mySymbol})` : `Đang chờ ${opponent}...`;
        return 'Đang chờ...';
    };

    if (status === 'lobby' || status === 'waiting') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
                <Lobby 
                    gameName="Cờ Caro"
                    status={status} 
                    onFindMatch={findMatch} 
                    onLeaveLobby={leaveLobby} 
                    onBack={onBack}
                />
            </div>
        );
    }

    const showChat = ['playing', 'finished'].includes(status);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
            <h1 className="text-5xl font-bold mb-4 text-cyan-400">Cờ Caro</h1>
            <p className="text-lg mb-8 text-gray-400">Bạn ({mySymbol}) vs {opponent}</p>
            
            <div className="w-full max-w-7xl flex flex-col lg:flex-row gap-8 justify-center items-start">
                <div className="flex flex-col items-center gap-4 flex-grow">
                    <Board squares={board} onClick={status === 'playing' ? makeMove : () => {}} winningLine={winningLine} />
                    {status === 'playing' && <GameInfo status={isMyTurn ? `Lượt của bạn (${mySymbol})` : `Đang chờ ${opponent}...`} />}
                    {status === 'finished' && (
                        <div className="mt-4 w-full max-w-md">
                             <PostGameScreen
                                isWinner={winner === mySymbol}
                                isDraw={!winner}
                                opponent={opponent}
                                onRematch={requestRematch}
                                onLeave={leaveGame}
                                postGameStatus={postGameStatus}
                            />
                        </div>
                    )}
                </div>

                {showChat && (
                    <div className="w-full lg:w-80 flex-shrink-0">
                        <ChatBox
                            title="Chat trong trận"
                            messages={chatMessages}
                            onSendMessage={sendRoomMessage}
                        />
                    </div>
                )}
            </div>
            {onBack &&
                <button onClick={onBack} className="mt-8 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg">
                    Quay lại Thư viện
                </button>
            }
        </div>
    );
};