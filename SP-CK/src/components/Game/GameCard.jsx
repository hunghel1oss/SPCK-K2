import React from 'react';

const GameCard = ({ game, onPlay }) => {
    return (
        <div 
            className="group relative cursor-pointer overflow-hidden rounded-lg shadow-lg transition-transform transform hover:scale-105"
            onClick={() => onPlay(game.key)}
        >
            <img src={game.imageSrc} alt={game.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col items-center justify-center p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <h3 className="text-2xl font-bold text-white text-center">{game.name}</h3>
                <p className="text-gray-300 text-center mt-2">{game.description}</p>
                <button className="mt-4 bg-cyan-600 text-white py-2 px-6 rounded-full font-semibold">
                    Chơi ngay
                </button>
            </div>
            {/* Tiêu đề mặc định khi không hover */}
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-2 group-hover:opacity-0 transition-opacity">
                 <h3 className="text-xl font-bold text-white text-center truncate">{game.name}</h3>
            </div>
        </div>
    );
};

export default GameCard;