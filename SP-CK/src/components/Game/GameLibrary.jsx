import React from 'react';
import GameCard from './GameCard';
import { gameList } from '../../GameList';

const GameLibrary = ({ onPlay }) => {
    return (
        <div className="w-full bg-gray-900 min-h-screen p-8">
            <div className="max-w-7xl mx-auto">
                <h2 className="text-4xl font-bold text-white mb-8 text-center">Thư Viện Game</h2>
                
                {gameList.length === 0 ? (
                    <p className="text-center text-gray-400">Chưa có game nào được thêm.</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {gameList.map(game => (
                            <GameCard key={game.key} game={game} onPlay={onPlay} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default GameLibrary;