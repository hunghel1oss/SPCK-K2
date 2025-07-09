import React, { useState, useEffect } from 'react';

const Lobby = ({ status, onFindMatch, onCancelFind }) => {
    const [elapsedTime, setElapsedTime] = useState(0);

    useEffect(() => {
        let timer;
        if (status === 'waiting') {
            timer = setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);
        } else {
            setElapsedTime(0);
        }
        return () => clearInterval(timer);
    }, [status]);

    if (status === 'waiting') {
        return (
            <div className="flex flex-col items-center justify-center bg-gray-800 p-10 rounded-lg shadow-xl text-center">
                <h2 className="text-2xl font-bold mb-4 text-cyan-400">Đang tìm đối thủ...</h2>
                <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mb-4 animate-spin border-t-blue-500"></div>
                <p className="text-gray-300 text-lg mb-6">
                    Thời gian chờ: <span className="font-bold text-white">{elapsedTime}s</span>
                </p>
                <button
                    onClick={onCancelFind}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg"
                >
                    Hủy
                </button>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col items-center justify-center bg-gray-800 p-10 rounded-lg shadow-xl">
            <h2 className="text-3xl font-bold mb-6 text-cyan-400">Phòng chờ Cờ Caro</h2>
            <p className="text-gray-400 mb-8">Sẵn sàng để thách đấu một người chơi khác?</p>
            <button
                onClick={onFindMatch}
                className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-4 px-10 rounded-full text-xl transition-all duration-300 transform hover:scale-110 shadow-lg"
            >
                Tìm trận đấu
            </button>
        </div>
    );
};

export default Lobby;