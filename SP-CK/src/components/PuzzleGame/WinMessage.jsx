import React from 'react';

const WinMessage = ({ moves, time, onPlayAgain }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
            <div className="bg-white text-gray-800 p-10 rounded-xl shadow-2xl text-center transform transition-all scale-100">
                <h2 className="text-4xl font-bold text-green-500 mb-4">Bạn đã thắng!</h2>
                <p className="text-lg mb-2">
                    Số bước: <span className="font-bold text-blue-600">{moves}</span>
                </p>
                 <p className="text-lg mb-6">
                    Thời gian: <span className="font-bold text-blue-600">{time}</span>
                </p>
                <button
                    onClick={onPlayAgain}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-xl transition-transform transform hover:scale-105"
                >
                    Chơi lại
                </button>
            </div>
        </div>
    );
};

export default WinMessage;