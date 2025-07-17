import React from 'react';

const Lobby = ({ gameName, status, onFindMatch, onLeaveLobby, onBack }) => {
    return (
        <div className="flex flex-col items-center justify-center p-8 bg-gray-800 rounded-xl shadow-2xl text-white w-full max-w-md">
            <h2 className="text-4xl font-bold mb-6 text-indigo-400">{gameName}</h2>
            
            {status === 'waiting' ? (
                <>
                    <p className="text-2xl mb-6 animate-pulse">Đang tìm trận...</p>
                    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-cyan-400"></div>
                    <button 
                        onClick={onLeaveLobby}
                        className="mt-8 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition-transform transform hover:scale-105"
                    >
                        Hủy
                    </button>
                </>
            ) : (
                <div className="flex flex-col gap-4 w-full">
                    <button 
                        onClick={onFindMatch}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-xl transition-transform transform hover:scale-105"
                    >
                        Tìm Trận
                    </button>
                    <button 
                        onClick={onBack}
                        className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg"
                    >
                        Quay lại
                    </button>
                </div>
            )}
        </div>
    );
};

export default Lobby;