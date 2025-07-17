import React from 'react';
import { useHistory } from '../../context/HistoryContext';
import { formatTime } from './time';
import { BASE_URL } from '../../services/api'; // Import BASE_URL

const getResultClass = (result) => {
    switch (result) {
        case 'Thắng':
            return 'text-green-400';
        case 'Thua':
            return 'text-red-400';
        case 'Hòa':
            return 'text-yellow-400';
        default:
            return 'text-white';
    }
};

export const HistoryDisplay = ({ onBack }) => {
    const { history, clearHistoryForUser } = useHistory();

    const handleClearHistory = () => {
        if (window.confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử không?")) {
            clearHistoryForUser();
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-6 bg-gray-800 rounded-lg shadow-xl mt-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-white">Lịch sử chơi</h1>
                <div>
                    <button onClick={onBack} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg mr-4 transition-colors">
                        Quay lại
                    </button>
                    <button onClick={handleClearHistory} disabled={history.length === 0} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        Xóa lịch sử
                    </button>
                </div>
            </div>

            {history.length === 0 ? (
                <p className="text-center text-gray-400 mt-8">Chưa có lịch sử nào.</p>
            ) : (
                <div className="space-y-4">
                    {history.map((game) => {
                        // TẠO ĐƯỜNG DẪN ẢNH ĐẦY ĐỦ Ở ĐÂY
                        const fullImageSrc = game.imageSrc && game.imageSrc.startsWith('/uploads')
                            ? `${BASE_URL}${game.imageSrc}`
                            : game.imageSrc;

                        return (
                            <div key={game.id} className="bg-gray-700 p-4 rounded-lg flex items-center gap-4">
                                <img 
                                    src={fullImageSrc || '/default-game-thumbnail.png'} 
                                    alt="Game thumbnail" 
                                    className="w-24 h-24 object-cover rounded-md flex-shrink-0" 
                                />
                                <div className="flex-grow">
                                    <p className="font-bold text-lg text-gray-200">{game.gameName || 'Game'}</p>
                                    <p className="text-sm text-gray-400">{game.date}</p>
                                    <p className="text-gray-300">Độ khó: {game.difficulty}</p>
                                </div>
                                <div className="text-right w-48 flex-shrink-0">
                                    {game.hasOwnProperty('result') ? (
                                        <div>
                                            <p className="text-gray-300 text-lg">Kết quả</p>
                                            <p className={`font-bold text-2xl ${getResultClass(game.result)}`}>
                                                {game.result}
                                            </p>
                                        </div>
                                    ) : (
                                        <div>
                                            <p className="text-gray-300">Số bước: <span className="font-semibold text-white">{game.moves}</span></p>
                                            <p className="text-gray-300">Thời gian: <span className="font-semibold text-white">{formatTime(game.timeInSeconds)}</span></p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};