import React, { useState, useEffect } from 'react';
import { useBattleshipSocket } from '../components/battleship/useBattleshipSocket';
import { useRoomChat } from '../components/chat/useRoomChat';
import { useAuth } from '../context/AuthContext';
import PlacementBoard from '../components/battleship/PlacementBoard';
import CombatGrid from '../components/battleship/CombatGrid';
import PostGameScreen from '../components/game/PostGameScreen';
import Lobby from '../components/game/Lobby';
import ChatBox from '../components/chat/ChatBox';
import OpponentLeftModal from '../components/game/OpponentLeftModal';

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

const BattleshipPage = ({ onBack }) => {
    const { user } = useAuth();
    const { 
        gameState, 
        disconnectInfo,
        clearDisconnectInfo,
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

    const handleAcknowledgeDisconnect = () => {
        clearDisconnectInfo();
        leaveGame();
    };
    
    const renderContent = () => {
        if (disconnectInfo) {
            return (
                <OpponentLeftModal 
                    message={disconnectInfo} 
                    onAcknowledge={handleAcknowledgeDisconnect} 
                />
            );
        }
        
        switch (gameState.status) {
            case 'placement':
                return <PlacementBoard 
                            shipsToPlace={gameState.shipsToPlace} 
                            onReady={placeShips} 
                        />;
            case 'combat':
                return (
                    <CombatScreenWrapper
                        myBoard={gameState.myBoard}
                        opponentBoard={gameState.opponentBoard}
                        isMyTurn={gameState.isMyTurn}
                        onFireShot={fireShot}
                        opponentUsername={gameState.opponent}
                        message={message}
                    />
                );
            case 'finished':
                return (
                     <PostGameScreen 
                        isWinner={gameState.winner === user.username}
                        isDraw={!gameState.winner}
                        opponent={gameState.opponent}
                        onRematch={requestRematch}
                        onLeave={leaveGame}
                        postGameStatus={gameState.postGameStatus}
                    />
                );
            case 'lobby':
            case 'waiting':
            default:
                return <Lobby 
                            gameName="Bắn Tàu"
                            status={gameState.status} 
                            onFindMatch={findMatch} 
                            onLeaveLobby={leaveLobby} 
                            onBack={onBack} 
                        />;
        }
    };

    const showChat = ['placement', 'combat', 'finished'].includes(gameState.status) && !disconnectInfo;

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

export default BattleshipPage;