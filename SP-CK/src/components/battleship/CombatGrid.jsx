import React from 'react';

const BOARD_SIZE = 9;

const Cell = ({ cellData, isMyBoard }) => {
    let bgColor = 'bg-blue-900/50';
    let content = null;
    let hoverEffect = isMyBoard ? '' : 'hover:bg-blue-700';

    if (cellData.isHit) {
        hoverEffect = ''; // Không cho hover ô đã bắn
        if (cellData.shipId) {
            bgColor = 'bg-red-500 animate-pulse';
            content = '🔥';
        } else {
            bgColor = 'bg-gray-700';
            content = <div className="w-2 h-2 bg-gray-400 rounded-full"></div>;
        }
    } else if (isMyBoard && cellData.shipId) {
        bgColor = 'bg-gray-500'; // Hiển thị thuyền của mình
    }

    return (
        <div className={`w-9 h-9 border border-blue-800 flex items-center justify-center text-xl ${bgColor} ${hoverEffect} transition-colors`}>
            {content}
        </div>
    );
};

const Coordinate = ({ children }) => (
    <div className="w-9 h-9 flex items-center justify-center font-bold text-cyan-400">
        {children}
    </div>
);

const BoardLayout = ({ children }) => {
    const letters = "ABCDEFGHI".split('');
    const numbers = "123456789".split('');

    return (
        <div className="flex gap-1">
            <div className="flex flex-col gap-0.5 mt-9">
                {numbers.map(n => <Coordinate key={n}>{n}</Coordinate>)}
            </div>
            <div>
                <div className="flex gap-0.5 ml-9">
                    {letters.map(l => <Coordinate key={l}>{l}</Coordinate>)}
                </div>
                {children}
            </div>
        </div>
    );
};

const CombatGrid = ({ board, onCellClick, title, isMyBoard = false }) => {
    if (!board || board.length === 0) {
        return <div>Đang tải bàn cờ...</div>;
    }

    return (
        <div className="flex flex-col items-center">
            <h3 className="text-xl font-semibold mb-2">{title}</h3>
            <BoardLayout>
                <div
                    className={`grid gap-0.5 bg-blue-700 p-1 ${isMyBoard ? '' : 'cursor-crosshair'}`}
                    style={{ gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`}}
                >
                    {board.map((cell, index) => (
                        <div key={index} onClick={() => onCellClick(index)}>
                             <Cell cellData={cell} isMyBoard={isMyBoard} />
                        </div>
                    ))}
                </div>
            </BoardLayout>
        </div>
    );
};

export default CombatGrid;