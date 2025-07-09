import React from 'react';

const GameInfo = ({ status, onRematch }) => {
    return (
        <div className="w-full max-w-md p-4 text-center bg-gray-800 rounded-lg shadow-lg">
            <div className="text-2xl font-bold mb-4">{status}</div>
            {onRematch && (
                 <button 
                    onClick={onRematch}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition-transform transform hover:scale-105"
                >
                    Chơi lại
                </button>
            )}
        </div>
    );
};

export default GameInfo;