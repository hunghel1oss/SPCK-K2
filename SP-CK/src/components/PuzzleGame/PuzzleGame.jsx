import React, { useState } from 'react';
import { useTimer, formatTime } from '../main-function/time';
import { useHistory } from '../../context/HistoryContext';
import ImageUploader from './ImageUploader';
import DifficultySelector from './DifficultySelector';
import PuzzleBoard from './PuzzleBoard';
import WinMessage from './WinMessage';
import PieceTray from './PieceTray';

const shuffleArray = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};

const PuzzleGame = () => {
    const [imageSrc, setImageSrc] = useState(null);
    const [difficulty, setDifficulty] = useState(4);
    const [masterPieces, setMasterPieces] = useState([]);
    const [boardSlots, setBoardSlots] = useState([]);
    const [trayPieces, setTrayPieces] = useState([]);
    const [isSolved, setIsSolved] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);
    const [moveCount, setMoveCount] = useState(0);

    const { time, startTimer, stopTimer, resetTimer } = useTimer();
    const { saveGameForUser } = useHistory();
    
    const boardSize = 500;

    const setupGame = () => {
        if (!imageSrc) return;

        const totalPieces = difficulty * difficulty;
        const newMasterPieces = [];
        for (let i = 0; i < totalPieces; i++) {
            newMasterPieces.push({
                id: i,
                originalX: i % difficulty,
                originalY: Math.floor(i / difficulty),
            });
        }
        setMasterPieces(newMasterPieces);
        setBoardSlots(Array(totalPieces).fill(null));
        setTrayPieces(shuffleArray(newMasterPieces.map(p => p.id)));

        setGameStarted(true);
        setIsSolved(false);
        setMoveCount(0);
        
        resetTimer();
        startTimer();
    };

    const handlePieceMove = ({ pieceId, origin, fromSlotIndex, toSlotIndex }) => {
        if (isSolved) return;
        
        const currentMoveCount = moveCount + 1;
        setMoveCount(currentMoveCount);

        let newBoardSlots = [...boardSlots];
        let newTrayPieces = [...trayPieces];

        const displacedPieceId = toSlotIndex !== 'tray' ? newBoardSlots[toSlotIndex] : null;

        if (origin === 'tray') {
            newTrayPieces = newTrayPieces.filter(id => id !== pieceId);
        } else { 
            newBoardSlots[fromSlotIndex] = null;
        }

        if (toSlotIndex !== 'tray') {
            newBoardSlots[toSlotIndex] = pieceId;
        } else { 
            newTrayPieces.push(pieceId);
        }
        if (displacedPieceId !== null) {
            newTrayPieces.push(displacedPieceId);
        }
        
        setBoardSlots(newBoardSlots);
        setTrayPieces(newTrayPieces);

        if (newTrayPieces.length === 0 && newBoardSlots.every((id, index) => id === index)) {
            stopTimer();
            setIsSolved(true);

            const relativeImageSrc = imageSrc.startsWith('http') 
                ? new URL(imageSrc).pathname 
                : imageSrc;

            saveGameForUser({
                gameName: 'Xếp hình',
                imageSrc: relativeImageSrc,
                difficulty: `${difficulty}x${difficulty}`,
                moves: currentMoveCount,
                timeInSeconds: time,
            });
        }
    };
    
    const handleUploadSuccess = (imageUrl) => {
        setImageSrc(`http://localhost:8080${imageUrl}`);
        setGameStarted(false);
        setIsSolved(false);
    };

    const handlePlayAgain = () => {
        setIsSolved(false);
        setGameStarted(false);
        setImageSrc(null);
        setMasterPieces([]);
        setBoardSlots([]);
        setTrayPieces([]);
        resetTimer();
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4">
            <h1 className="text-5xl font-bold my-8 tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                Jigsaw Puzzle Game
            </h1>

            {isSolved && <WinMessage onPlayAgain={handlePlayAgain} moves={moveCount} time={formatTime(time)} />}

            {gameStarted && !isSolved && (
                <div className="flex justify-around items-center mb-4 p-4 w-full max-w-md bg-gray-800 rounded-lg">
                    <div className="text-center">
                        <span className="text-lg text-gray-400 block">Số bước</span>
                        <span className="text-2xl font-bold">{moveCount}</span>
                    </div>
                    <div className="text-center">
                        <span className="text-lg text-gray-400 block">Thời gian</span>
                        <span className="text-2xl font-bold">{formatTime(time)}</span>
                    </div>
                </div>
            )}

            {!imageSrc ? (
                <ImageUploader onUploadSuccess={handleUploadSuccess} />
            ) : (
                <div className="w-full max-w-7xl mx-auto">
                    {!gameStarted ? (
                        <div className="flex flex-col items-center gap-6 bg-gray-800 p-8 rounded-xl">
                            <img src={imageSrc} alt="Preview" className="w-48 h-48 object-cover rounded-lg shadow-lg"/>
                            <DifficultySelector selected={difficulty} onSelect={setDifficulty} />
                            <button onClick={setupGame} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg text-xl transition-transform transform hover:scale-105">
                                Bắt đầu chơi
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col md:flex-row gap-8 justify-center items-start">
                            <PuzzleBoard
                                boardSlots={boardSlots}
                                pieces={masterPieces}
                                imageSrc={imageSrc}
                                difficulty={difficulty}
                                boardSize={boardSize}
                                onPieceMove={handlePieceMove}
                            />
                            <PieceTray
                                trayPieces={trayPieces}
                                pieces={masterPieces}
                                imageSrc={imageSrc}
                                difficulty={difficulty}
                                boardSize={boardSize}
                                onPieceMove={handlePieceMove}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PuzzleGame;