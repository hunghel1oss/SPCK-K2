import React, { useState, useEffect } from 'react';
import { useBattleshipSocket } from './useBattleshipSocket'
import { useRoomChat } from '../chat/useRoomChat'
import PlacementBoard from './PlacementBoard';
import CombatGrid from './CombatGrid';
import PostGameScreen from '../Game/PostGameScreen.jsx'
import Lobby from '../caro/Lobby'; 
import ChatBox from '../chat/ChatBox';

const CombatScreenWrapper = ({ myBoard, opponentBoard, isMyTurn, onFireShot, opponentUsername, message }) => (
    <div className="flex flex-col items-center">
        <div className="h-10 mb-4 text-center">
            <h3 className={`text-2xl font-bold transition-all ${isMyTurn ? 'text-green-400 animate-pulse' : 'text-gray-500'}`}>
                {isMyTurn ? 'Lượt của bạn!' : `Đang chờ ${opponentUsername}...`}
            </h3>
            {message && <p className="text-xl text-yellow-300 h-8 mt-2">{message}</p>}
        </div>
        <div className="flex flex-col lg:flex-row gap-8 items-start mt-4">
             <CombatGrid board={myBoard} title="Hạm đội của bạn" onCellClick={() => {}} isMyBoard={true} />
            <CombatGrid board={opponentBoard} title={`Tấn công ${opponentUsername}`} onCellClick={onFireShot} isMyBoard={false} />
        </div>
    </div>
);


export const BattleshipGame = ({ onBack }) => {
    const { 
        gameState, 
        findMatch, 
        placeShips, 
        fireShot,
        leaveLobby,
        leaveGame,
        requestRematch
    } = useBattleshipSocket();

    const { chatMessages, sendRoomMessage } = useRoomChat(gameState.roomId);

    const [message, setMessage] = useState('');

    useEffect(() => {
        const shotResult = gameState.lastShotResult;
        if (!shotResult) return;
        let newMessage = '';
        if (shotResult.hitter !== gameState.opponent) {
            if (shotResult.result === 'miss') newMessage = 'Bạn đã bắn trượt!';
            if (shotResult.result === 'hit') newMessage = 'Bắn trúng! Tiếp tục bắn.';
            if (shotResult.result === 'sunk') newMessage = `Chính xác! Đã bắn chìm tàu của đối thủ!`;
        } else {
            if (shotResult.result === 'hit') newMessage = `Họ đã bắn trúng!`;
            if (shotResult.result === 'sunk') newMessage = `Họ đã bắn chìm tàu của bạn!`;
        }
        setMessage(newMessage);
        const timer = setTimeout(() => setMessage(''), 4000);
        return () => clearTimeout(timer);
    }, [gameState.lastShotResult, gameState.opponent]);

    const handleFireShot = (index) => {
        if (gameState.isMyTurn && gameState.status === 'combat') {
            fireShot(index);
        }
    };
    
    const renderContent = () => {
        switch (gameState.status) {
            case 'placement':
                return <PlacementBoard shipsToPlace={gameState.shipsToPlace} onPlacementComplete={placeShips} />;
            case 'combat':
                return (
                    <CombatScreenWrapper
                        myBoard={gameState.myBoard}
                        opponentBoard={gameState.opponentBoard}
                        isMyTurn={gameState.isMyTurn}
                        onFireShot={handleFireShot}
                        opponentUsername={gameState.opponent}
                        message={message}
                    />
                );
            case 'finished':
                return (
                     <PostGameScreen 
                        winner={gameState.winner}
                        opponent={gameState.opponent}
                        onRematch={requestRematch}
                        onLeave={leaveGame}
                        postGameStatus={gameState.postGameStatus}
                    />
                );
            case 'lobby':
            case 'waiting':
            default:
                return <Lobby status={gameState.status} onFindMatch={findMatch} onLeaveLobby={leaveLobby} onBack={onBack} />;
        }
    };

    const showChat = ['placement', 'combat', 'finished'].includes(gameState.status);

    return (
        <div className="w-full min-h-screen bg-gray-900 text-white p-4 flex flex-col items-center">
            <h1 className="text-4xl font-bold text-center my-4 text-blue-400">Game Bắn Tàu</h1>
            <div className="w-full max-w-7xl flex flex-col lg:flex-row gap-8 justify-center items-start">
                <div className="flex-grow flex justify-center">
                    {renderContent()}
                </div>
                {showChat && (
                    <div className="w-full lg:w-80 flex-shrink-0">
                        <ChatBox 
                            title="Chat Trong Trận"
                            messages={chatMessages}
                            onSendMessage={sendRoomMessage}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};