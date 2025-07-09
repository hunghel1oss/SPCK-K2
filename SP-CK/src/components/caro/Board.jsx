import React from 'react';
import Square from './Square';

const Board = ({ squares, onClick, winningLine }) => {
    const boardSize = 10;

    const renderSquare = (i) => {
        const isWinning = winningLine && winningLine.includes(i);
        return (
            <Square
                key={i}
                value={squares[i]}
                onClick={() => onClick(i)}
                isWinning={isWinning}
            />
        );
    };

    const boardRows = [];
    for (let row = 0; row < boardSize; row++) {
        const rowSquares = [];
        for (let col = 0; col < boardSize; col++) {
            rowSquares.push(renderSquare(row * boardSize + col));
        }
        boardRows.push(<div key={row} className="flex">{rowSquares}</div>);
    }

    return <div>{boardRows}</div>;
};

export default Board;