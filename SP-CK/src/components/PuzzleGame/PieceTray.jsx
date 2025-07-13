import React from 'react';

const PieceTray = ({ trayPieces, pieces, imageSrc, difficulty, boardSize, onPieceMove }) => {
    const pieceSize = boardSize / difficulty;

    const handleDragOver = (e) => e.preventDefault();

    const handleDrop = (e) => {
        e.preventDefault();
        const pieceData = JSON.parse(e.dataTransfer.getData('application/json'));
        if (pieceData.origin === 'board') {
            onPieceMove({ ...pieceData, toSlotIndex: 'tray' });
        }
    };
    
    const handleDragStart = (e, pieceId) => {
        const data = JSON.stringify({ pieceId, origin: 'tray' });
        e.dataTransfer.setData('application/json', data);
    };

    return (
        <div
            className="w-full md:w-64 h-auto md:max-h-[500px] p-4 bg-gray-800 rounded-lg shadow-inner"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            <h3 className="text-lg font-bold mb-4 text-center text-gray-300">
                Các mảnh ghép ({trayPieces.length})
            </h3>
            <div className="flex flex-wrap gap-2 justify-center overflow-y-auto max-h-[440px]">
                {trayPieces.map(pieceId => {
                    const pieceData = pieces.find(p => p.id === pieceId);
                    if (!pieceData) return null;
                    return (
                        <div
                            key={pieceId}
                            draggable
                            onDragStart={(e) => handleDragStart(e, pieceData.id)}
                            className="cursor-grab active:cursor-grabbing border-2 border-transparent hover:border-yellow-400 transition-all rounded"
                            style={{
                                width: `${pieceSize}px`,
                                height: `${pieceSize}px`,
                                backgroundImage: `url(${imageSrc})`,
                                backgroundSize: `${boardSize}px ${boardSize}px`,
                                backgroundPosition: `-${pieceData.originalX * pieceSize}px -${pieceData.originalY * pieceSize}px`,
                            }}
                        />
                    );
                })}
            </div>
        </div>
    );
};

export default PieceTray;