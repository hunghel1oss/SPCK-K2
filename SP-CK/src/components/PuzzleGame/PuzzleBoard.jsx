import React from 'react';

const PuzzleBoard = ({ boardSlots, pieces, imageSrc, difficulty, boardSize, onPieceMove }) => {
    const pieceSize = boardSize / difficulty;

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e, toSlotIndex) => {
        e.preventDefault();
        const pieceData = JSON.parse(e.dataTransfer.getData('application/json'));
        onPieceMove({ ...pieceData, toSlotIndex });
    };

    const handleDragStart = (e, pieceId, fromSlotIndex) => {
        const data = JSON.stringify({ pieceId, origin: 'board', fromSlotIndex });
        e.dataTransfer.setData('application/json', data);
    };

    return (
        <div
            className="grid rounded-lg shadow-2xl bg-gray-900 border-4 border-purple-800"
            style={{
                width: `${boardSize}px`,
                height: `${boardSize}px`,
                gridTemplateColumns: `repeat(${difficulty}, 1fr)`,
            }}
        >
            {boardSlots.map((pieceId, index) => {
                const piece = pieceId !== null ? pieces.find(p => p.id === pieceId) : null;
                return (
                    <div
                        key={index}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, index)}
                        className="border border-dashed border-gray-600 flex justify-center items-center"
                    >
                        {piece && (
                            <div
                                draggable
                                onDragStart={(e) => handleDragStart(e, piece.id, index)}
                                className="cursor-grab active:cursor-grabbing"
                                style={{
                                    width: `${pieceSize}px`,
                                    height: `${pieceSize}px`,
                                    backgroundImage: `url(${imageSrc})`,
                                    backgroundSize: `${boardSize}px ${boardSize}px`,
                                    backgroundPosition: `-${piece.originalX * pieceSize}px -${piece.originalY * pieceSize}px`,
                                }}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default PuzzleBoard;