import React from 'react';

export const gameList = [
    {
        key: 'sudoku', 
        name: 'Sudoku',
        description: 'Thử thách trí tuệ với những con số.',
        imageSrc: '/img/SudokuImg.png', 
        Component: React.lazy(() => import('/src/components/sodoku/SudokuGame.jsx'))
    },
    {
        key: 'puzzle-game',
        name: 'Xếp hình',
        description: 'Kéo và thả để hoàn thành bức tranh.',
        imageSrc: '/img/PuzzleGameImg.jpg',
        Component: React.lazy(() => import('/src/components/PuzzleGame/PuzzleGame.jsx')) 
    },
    {
        key: 'caro',
        name: 'Cờ Caro',
        description: 'Đánh bại đối thủ bằng cách tạo thành 1 hàng 5',
        imageSrc: '/img/caro.jpg',
        Component: React.lazy(() => import('/src/pages/CaroPage.jsx'))
    },
    {
        key: 'battleship',
        name: 'Bắn Tàu',
        description: 'Sắp xếp hạm đội và tiêu diệt đối thủ.',
        imageSrc: '/img/battleship.jpg', 
        Component: React.lazy(() => import('/src/pages/BattleshipPage.jsx'))
    }
];