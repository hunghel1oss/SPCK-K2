import SudokuGame from './components/sodoku/SudokuGame.jsx';
import PuzzleGame from './components/PuzzleGame/PuzzleGame.jsx';


export const gameList = [
    {
        key: 'sudoku', 
        name: 'Sudoku',
        description: 'Thử thách trí tuệ với những con số.',
        imageSrc: './img/SudokuImg.png', 
        Component: SudokuGame 
    },
    {
        key: 'puzzle-game',
        name: 'Xếp hình',
        description: 'Kéo và thả để hoàn thành bức tranh.',
        imageSrc: './img/PuzzleGameImg.jpg',
        Component: PuzzleGame 
    },
 
];