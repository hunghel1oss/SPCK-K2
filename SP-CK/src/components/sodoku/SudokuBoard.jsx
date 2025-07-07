import React from 'react';

// Cell component được tích hợp vào đây cho đơn giản
const Cell = ({ value, isInitial, isSelected, isError, onClick, borderClasses }) => {
    const baseClasses = "w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-xl sm:text-2xl transition-colors duration-150";
    
    let conditionalClasses = '';

    if (isInitial) {
        conditionalClasses = 'text-white font-semibold bg-gray-700';
    } else if (isError) {
        conditionalClasses = 'bg-red-500 text-white font-bold';
    } else {
        conditionalClasses = 'text-cyan-300 bg-gray-900 cursor-pointer hover:bg-gray-600';
    }

    if (isSelected && !isInitial) {
        conditionalClasses += ' ring-2 ring-cyan-400 z-10';
    }

    return (
        <div className={`${baseClasses} ${conditionalClasses} ${borderClasses}`} onClick={onClick}>
            {value !== 0 ? value : ''}
        </div>
    );
};


export const SudokuBoard = ({ board, initialBoard, onCellClick, selectedCell, errorCells }) => {
    const getBorderClasses = (rowIndex, colIndex) => {
        let classes = '';
        if (rowIndex === 2 || rowIndex === 5) classes += ' border-b-2 border-b-cyan-500';
        if (colIndex === 2 || colIndex === 5) classes += ' border-r-2 border-r-cyan-500';
        return classes;
    };

    return (
        <div className="bg-gray-700 p-1 rounded-lg shadow-lg">
            <div className="grid grid-cols-9 border-t-2 border-l-2 border-cyan-500">
                {board.map((row, rowIndex) => 
                    row.map((cellValue, colIndex) => {
                        const isError = errorCells.some(cell => cell.row === rowIndex && cell.col === colIndex);
                        const isSelected = selectedCell && selectedCell.row === rowIndex && selectedCell.col === colIndex;

                        return (
                            <Cell 
                                key={`${rowIndex}-${colIndex}`}
                                value={cellValue}
                                isInitial={initialBoard[rowIndex][colIndex] !== 0}
                                isSelected={isSelected}
                                isError={isError}
                                onClick={() => onCellClick(rowIndex, colIndex)}
                                borderClasses={getBorderClasses(rowIndex, colIndex)}
                            />
                        );
                    })
                )}
            </div>
        </div>
    );
};