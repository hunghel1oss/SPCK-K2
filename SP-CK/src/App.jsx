import React, { useState, Suspense } from 'react';
import { useAuth } from './context/AuthContext';
import LoginSignUpForm from './components/login/login.jsx';
import Header from './components/header.jsx';
import HomePage from './pages/HomePage';
import { HistoryDisplay } from './components/main-function/history';
import FriendsPage from './components/FriendsPage/index.jsx';
import FriendsSidebar from './components/FriendsPage/FriendsSidebar.jsx';
import { gameList } from './GameList';

const GameCard = ({ game, onPlay }) => (
    <div className="group relative cursor-pointer overflow-hidden rounded-lg shadow-lg transition-transform transform hover:scale-105" onClick={() => onPlay(game.key)}>
        <img src={game.imageSrc} alt={game.name} className="w-full h-48 object-cover" />
        <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col items-center justify-center p-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <h3 className="text-2xl font-bold text-white text-center">{game.name}</h3>
            <p className="text-gray-300 text-center mt-2">{game.description}</p>
            <button className="mt-4 bg-cyan-600 text-white py-2 px-6 rounded-full font-semibold">Chơi ngay</button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-2 group-hover:opacity-0 transition-opacity">
            <h3 className="text-xl font-bold text-white text-center truncate">{game.name}</h3>
        </div>
    </div>
);

const GameLibrary = ({ onPlay }) => (
    <div className="w-full bg-gray-900 min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl font-bold text-white mb-8 text-center">Thư Viện Game</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {gameList.map(game => (
                    <GameCard key={game.key} game={game} onPlay={onPlay} />
                ))}
            </div>
        </div>
    </div>
);


function App() {
    const { isAuthenticated, isLoading, user, logout } = useAuth();
    const [currentView, setCurrentView] = useState('home');

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Đang tải...</div>;
    }

    if (!isAuthenticated) {
        return <LoginSignUpForm />;
    }

    const navigateTo = (view) => {
        setCurrentView(view);
    };

    const renderContent = () => {
        const ActiveGameComponent = gameList.find(game => game.key === currentView)?.Component;
        if (ActiveGameComponent) {
            return (
                <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white text-2xl">Đang tải Game...</div>}>
                    <ActiveGameComponent onBack={() => navigateTo('games')} />
                </Suspense>
            );
        }
        switch (currentView) {
            case 'games':
                return <GameLibrary onPlay={navigateTo} />;
            case 'history':
                return <HistoryDisplay onBack={() => navigateTo('home')} />;
            case 'friends':
                return <FriendsPage />;
            case 'home':
            default:
                return <HomePage />;
        }
    };

    return (
        <div className="bg-black text-white min-h-screen">
            <Header onNavigate={navigateTo} currentView={currentView} user={user} onLogout={logout} />
            <main className="mr-64">
                {renderContent()}
            </main>
            <FriendsSidebar />
        </div>
    );
}

export default App;