import React, { useState } from 'react';
import Header from '../components/header';
import CaroGame from '../components/Game/CaroGame/CaroGame';
import SudokuGame from '../components/Game/PuzzleGame/SudokuGame';
import Hero from '../components/hero';

const Placeholder = ({ title }) => (
    <div className="flex items-center justify-center h-[calc(100vh-80px)] bg-gray-800 text-white">
        <h1 className="text-4xl font-bold">{title} Page</h1>
        <p className="text-gray-400 ml-4">(Giao diện sẽ được cập nhật sau)</p>
    </div>
);

function HomePage() {
    const [currentView, setCurrentView] = useState('home');

    const handleNavigate = (view) => {
        setCurrentView(view);
    };

    const renderContent = () => {
        switch (currentView) {
            case 'home':
                return <Hero onNavigate={handleNavigate} />;
            case 'sudoku':
                return <SudokuGame />;
            case 'caro':
                return <CaroGame />;
            case 'history':
                return <Placeholder title="Lịch sử" />;
            default:
                return <Hero onNavigate={handleNavigate} />;
        }
    };

    return (
        <div className="bg-gray-800 min-h-screen">
            <Header onNavigate={handleNavigate} currentView={currentView} />
            <main>{renderContent()}</main>
        </div>
    );
}

export default HomePage;
