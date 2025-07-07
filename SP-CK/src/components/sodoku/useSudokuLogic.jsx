import { useState, useEffect, useCallback } from 'react';
import { getPuzzle } from './Puzzle_Sudoku';

export const useSudokuLogic = (initialDifficulty = 'easy') => {
    const [initialBoard, setInitialBoard] = useState([]);
    const [solution, setSolution] = useState([]);
    const [board, setBoard] = useState([]);
    const [selectedCell, setSelectedCell] = useState({ row: null, col: null });
    const [isComplete, setIsComplete] = useState(false);
    const [moves, setMoves] = useState(0);
    const [mistakes, setMistakes] = useState(0);
    const [errorCells, setErrorCells] = useState([]);

    const newGame = useCallback((difficulty) => {
        const puzzle = getPuzzle(difficulty);
        setInitialBoard(puzzle.initial);
        setSolution(puzzle.solution);
        setBoard(puzzle.initial);
        setSelectedCell({ row: null, col: null });
        setIsComplete(false);
        setMoves(0);
        setMistakes(0);
        setErrorCells([]);
    }, []);

    useEffect(() => {
        newGame(initialDifficulty);
    }, [newGame, initialDifficulty]);

    const selectCell = (row, col) => {
        if (initialBoard[row] && initialBoard[row][col] === 0) {
            setSelectedCell({ row, col });
        }
    };

    const handleInput = (value) => {
        const { row, col } = selectedCell;
        if (row === null || col === null) return;
        
        const numValue = parseInt(value, 10);
        if (isNaN(numValue) || numValue < 0 || numValue > 9) return;

        if (initialBoard[row][col] !== 0) return;

        const newBoard = board.map(r => [...r]);
        newBoard[row][col] = numValue;
        
        if (numValue !== 0 && solution[row][col] !== numValue) {
            setMistakes(prev => prev + 1);
            setErrorCells(prev => [...prev, {row, col}]);
        } else {
             setErrorCells(prev => prev.filter(cell => !(cell.row === row && cell.col === col)));
        }

        setBoard(newBoard);
        setMoves(prev => prev + 1);
    };

    const checkCompletion = useCallback(() => {
        if (!board.length || !solution.length) return false;
        for(let i = 0; i < 9; i++) {
            for(let j = 0; j < 9; j++) {
                if (board[i][j] === 0 || board[i][j] !== solution[i][j]) {
                    return false;
                }
            }
        }
        return true;
    }, [board, solution]);
    
    useEffect(() => {
        if (checkCompletion()) {
            setIsComplete(true);
        }
    }, [board, checkCompletion]);

    return { board, initialBoard, solution, selectedCell, isComplete, moves, mistakes, errorCells, newGame, selectCell, handleInput };
};