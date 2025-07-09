import React from 'react';

const Square = ({ value, onClick, isWinning }) => {
    const textClass = value === 'X' ? 'text-blue-400' : 'text-yellow-400';
    const bgClass = isWinning ? 'bg-green-500' : 'bg-gray-800 hover:bg-gray-700';

    return (
        <button
            className={`w-10 h-10 sm:w-12 sm:h-12 border border-gray-600 flex items-center justify-center transition-colors ${bgClass}`}
            onClick={onClick}
        >
            <span className={`text-3xl font-bold ${textClass}`}>
                {value}
            </span>
        </button>
    );
};

export default Square;