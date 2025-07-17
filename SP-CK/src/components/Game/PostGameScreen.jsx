import React from 'react';

const PostGameScreen = ({ isWinner, isDraw, opponent, onRematch, onLeave, postGameStatus }) => {
    let message = '';
    let messageClass = '';

    if (isDraw) {
        message = "Hòa cờ!";
        messageClass = "text-yellow-400";
    } else if (isWinner) {
        message = "Chiến thắng!";
        messageClass = "text-green-400";
    } else {
        message = "Bạn đã thua!";
        messageClass = "text-red-500";
    }
    
    return (
        <div className="w-full max-w-md p-4 text-center bg-gray-800 rounded-lg shadow-lg">
            <h3 className={`text-3xl font-bold mb-4 ${messageClass}`}>{message}</h3>
            <p className="mb-4 text-gray-400">
                {isDraw ? "Trận đấu kết thúc hòa." : (isWinner ? `Bạn đã thắng đối thủ ${opponent}!` : `Bạn đã thua đối thủ ${opponent}.`)}
            </p>
            <div className="flex justify-center gap-4">
                <button 
                    onClick={onRematch}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition-transform transform hover:scale-105 disabled:bg-gray-500"
                    disabled={postGameStatus === 'waiting_rematch'}
                >
                    {postGameStatus === 'waiting_rematch' ? 'Đang chờ...' : 'Chơi lại'}
                </button>
                <button 
                    onClick={onLeave}
                    className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg"
                >
                    Rời phòng
                </button>
            </div>
             {postGameStatus === 'waiting_rematch' && <p className="text-yellow-300 mt-4 animate-pulse">Đang chờ đối thủ đồng ý...</p>}
             {postGameStatus === 'rematch_requested' && <p className="text-blue-300 mt-4">{opponent} muốn chơi lại!</p>}
        </div>
    );
};

export default PostGameScreen;