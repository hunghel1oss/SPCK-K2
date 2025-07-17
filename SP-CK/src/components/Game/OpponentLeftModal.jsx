import React from 'react';

const OpponentLeftModal = ({ message, onAcknowledge }) => {
    if (!message) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-8 rounded-lg shadow-2xl text-center w-full max-w-sm animate-fade-in">
                <h3 className="text-2xl font-bold text-green-400 mb-4">Bạn đã thắng!</h3>
                <p className="text-white mb-6">{message}</p>
                <button
                    onClick={onAcknowledge}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-8 rounded-lg transition-colors"
                >
                    OK
                </button>
            </div>
        </div>
    );
};

export default OpponentLeftModal;