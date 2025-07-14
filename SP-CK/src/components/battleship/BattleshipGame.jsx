import React, { useEffect, useState } from 'react';
import { useBattleshipSocket } from './useBattleshipSocket';
import PlacementBoard from './PlacementBoard';
import CombatGrid from './CombatGrid';

const BattleshipLobby = ({ status, onFindMatch, onBack }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            {status === 'waiting' ? (
                <div className="flex flex-col items-center justify-center bg-gray-800 p-10 rounded-lg shadow-xl text-center">
                    <h2 className="text-2xl font-bold mb-4 text-blue-400">Đang tìm đối thủ...</h2>
                    <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mb-4 animate-spin border-t-blue-500"></div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center bg-gray-800 p-10 rounded-lg shadow-xl">
                    <h2 className="text-3xl font-bold mb-6 text-blue-400">Phòng chờ Bắn Tàu</h2>
                    <p className="text-gray-400 mb-8">Sẵn sàng ra khơi và tiêu diệt hạm đội địch?</p>
                    <button onClick={onFindMatch} className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-4 px-10 rounded-full text-xl transition-all duration-300 transform hover:scale-110 shadow-lg">
                        Tìm trận
                    </button>
                </div>
            )}
            <button onClick={onBack} className="mt-8 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg">
                Quay lại
            </button>
        </div>
    );
};

export const BattleshipGame = ({ onBack }) => {
    const { gameState, findMatch, placeShips, fireShot } = useBattleshipSocket();
    const [message, setMessage] = useState('');

    useEffect(() => {
        const shotResult = gameState.lastShotResult;
        if (!shotResult) return;
        let newMessage = '';
        if (shotResult.hitter !== gameState.opponent) {
            if (shotResult.result === 'miss') newMessage = 'Bạn đã bắn trượt!';
            if (shotResult.result === 'hit') newMessage = 'Bắn trúng! Tiếp tục bắn.';
            if (shotResult.result === 'sunk') newMessage = `Chính xác! Đã bắn chìm thuyền ${shotResult.shipInfo?.type || ''} của đối thủ!`;
        } else {
            if (shotResult.result === 'hit') newMessage = `Họ đã bắn trúng!`;
            if (shotResult.result === 'sunk') newMessage = `Họ đã bắn chìm thuyền ${shotResult.shipInfo?.type || ''} của bạn!`;
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
    
    if (gameState.status === 'finished') {
        const didIWin = gameState.winner !== gameState.opponent;
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-center">
                <h2 className={`text-5xl font-bold mb-4 ${didIWin ? 'text-green-400' : 'text-red-500'}`}>
                    {didIWin ? 'Chiến thắng!' : 'Bạn đã thua!'}
                </h2>
                <button onClick={onBack} className="mt-8 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-xl">
                    Về sảnh chính
                </button>
            </div>
        )
    }

    const renderContent = () => {
        switch (gameState.status) {
            case 'placement':
                return <PlacementBoard shipsToPlace={gameState.shipsToPlace} onReady={placeShips} />;
            case 'combat':
                return (
                    <div className="flex flex-col items-center">
                        <div className="h-10 mb-4 text-center">
                            <h3 className={`text-2xl font-bold transition-all ${gameState.isMyTurn ? 'text-green-400 animate-pulse' : 'text-gray-500'}`}>
                                {gameState.isMyTurn ? 'Lượt của bạn!' : `Đang chờ ${gameState.opponent}...`}
                            </h3>
                            {message && <p className="text-xl text-yellow-300 h-8 mt-2">{message}</p>}
                        </div>
                        <div className="flex flex-col lg:flex-row gap-8 items-start mt-4">
                             <CombatGrid board={gameState.myBoard} title="Hạm đội của bạn" onCellClick={() => {}} isMyBoard={true} />
                            <CombatGrid board={gameState.opponentBoard} title={`Tấn công ${gameState.opponent}`} onCellClick={handleFireShot} isMyBoard={false} />
                        </div>
                    </div>
                );
            case 'lobby':
            case 'waiting':
            default:
                return <BattleshipLobby status={gameState.status} onFindMatch={findMatch} onBack={onBack} />;
        }
    };

    return (
        <div className="w-full min-h-screen bg-gray-900 text-white p-4 flex flex-col items-center">
            <h1 className="text-4xl font-bold text-center my-4 text-blue-400">Game Bắn Tàu</h1>
            {renderContent()}
        </div>
    );
};