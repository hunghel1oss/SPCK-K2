import React, { useState, useEffect, useCallback } from 'react';
import { useSudokuLogic } from './useSudokuLogic';
import { useTimer, formatTime } from '../main-function/time';
import { useHistory } from '../../context/HistoryContext';
import { SudokuBoard } from './SudokuBoard';

const MAX_MISTAKES = 5;

const DIFFICULTIES = [
    { key: 'easy', label: 'Dễ' },
    { key: 'medium', label: 'Vừa' },
    { key: 'hard', label: 'Khó' },
    { key: 'expert', label: 'Siêu khó' }
];

export const SudokuGame = ({ onBack }) => {
    const [difficulty, setDifficulty] = useState('easy');
    const [gameState, setGameState] = useState('selecting');

    const { 
        board, initialBoard, selectedCell, isComplete, moves, mistakes, errorCells, newGame, selectCell, handleInput 
    } = useSudokuLogic(difficulty);

    const { time, isRunning, startTimer, stopTimer, resetTimer } = useTimer();
    const { saveGameForUser } = useHistory();

    const startGame = (selectedDifficulty) => {
        setDifficulty(selectedDifficulty);
        newGame(selectedDifficulty);
        resetTimer();
        setGameState('playing');
    };

    const handleWin = useCallback(() => {
        stopTimer();
        setGameState('won');
        saveGameForUser({
            gameName: 'Sudoku',
            difficulty: DIFFICULTIES.find(d => d.key === difficulty)?.label || difficulty,
            moves: moves,
            timeInSeconds: time,
            imageSrc: '/img/SudokuImg.png'
        });
    }, [difficulty, stopTimer, time, moves, saveGameForUser]);

    useEffect(() => {
        if (isComplete && gameState === 'playing') {
            handleWin();
        }
    }, [isComplete, gameState, handleWin]);

    useEffect(() => {
        if (mistakes >= MAX_MISTAKES && gameState === 'playing') {
            stopTimer();
            setGameState('lost');
        }
    }, [mistakes, gameState, stopTimer]);
    
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (gameState !== 'playing' || isComplete) return;

            if (e.key >= '1' && e.key <= '9') {
                if (!isRunning) startTimer();
                handleInput(e.key);
            } else if (e.key === 'Backspace' || e.key === 'Delete') {
                handleInput(0);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [gameState, isComplete, isRunning, handleInput, startTimer]);


    if (gameState === 'selecting' || gameState === 'won' || gameState === 'lost') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-800 text-white p-4">
                <h1 className="text-5xl font-bold mb-8 text-cyan-400">Sudoku</h1>
                {gameState === 'won' && (
                    <div className="bg-green-600 p-6 rounded-lg mb-8 text-center shadow-xl">
                        <h2 className="text-3xl font-bold">Chúc mừng! Bạn đã thắng!</h2>
                        <p className="mt-2 text-lg">Thời gian: {formatTime(time)} | Số bước: {moves}</p>
                    </div>
                )}
                 {gameState === 'lost' && (
                    <div className="bg-red-600 p-6 rounded-lg mb-8 text-center shadow-xl">
                        <h2 className="text-3xl font-bold">Bạn đã thua!</h2>
                        <p className="mt-2 text-lg">Bạn đã mắc quá {MAX_MISTAKES} lỗi.</p>
                    </div>
                )}
                <h2 className="text-3xl mb-6">Chọn độ khó</h2>
                <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                    {DIFFICULTIES.map(d => (
                        <button 
                            key={d.key} 
                            onClick={() => startGame(d.key)}
                            className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-lg text-xl transition-transform transform hover:scale-105"
                        >
                            {d.label}
                        </button>
                    ))}
                </div>
                 {onBack && <button onClick={onBack} className="mt-8 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg">Quay lại Thư viện</button>}
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center p-4 bg-gray-800 text-white min-h-screen">
            <h1 className="text-4xl font-bold mb-2 text-cyan-400">Sudoku</h1>
            <p className="text-lg text-gray-300 mb-4">{DIFFICULTIES.find(d => d.key === difficulty)?.label}</p>
            
            <div className="flex justify-around w-full max-w-md mb-4 text-center">
                <div>
                    <div className="text-sm text-gray-400">Lỗi sai</div>
                    <div className={`text-2xl font-semibold ${mistakes > 3 ? 'text-red-500' : ''}`}>{mistakes} / {MAX_MISTAKES}</div>
                </div>
                <div>
                    <div className="text-sm text-gray-400">Thời gian</div>
                    <div className="text-2xl font-semibold">{formatTime(time)}</div>
                </div>
            </div>

            <SudokuBoard 
                board={board} 
                initialBoard={initialBoard} 
                selectedCell={selectedCell}
                errorCells={errorCells}
                onCellClick={selectCell} 
            />

            <div className="mt-6 flex flex-wrap justify-center gap-4">
                 <button onClick={() => {newGame(difficulty); resetTimer();}} className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-6 rounded-lg transition-colors">
                    Thử lại
                </button>
                {onBack && <button onClick={onBack} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg">Quay lại</button>}
            </div>
        </div>
    );
};

export default SudokuGame;