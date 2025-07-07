import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';

import Header  from './components/header.jsx'
import Hero from './components/hero.jsx'
import { HistoryDisplay } from './components/main-function/history';
import { gameList } from './GameList';

// Placeholder cho GameLibrary và GameCard, vì chúng không có trong cấu trúc thư mục ban đầu
// nhưng được tham chiếu. Bạn có thể tạo file cho chúng.
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
            {gameList.length === 0 ? (
                <p className="text-center text-gray-400">Chưa có game nào được thêm.</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {gameList.map(game => (
                        <GameCard key={game.key} game={game} onPlay={onPlay} />
                    ))}
                </div>
            )}
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
        return <AuthPage />;
    }

    const navigateTo = (view) => {
        setCurrentView(view);
    };

    const renderContent = () => {
        const ActiveGameComponent = gameList.find(game => game.key === currentView)?.Component;
        if (ActiveGameComponent) {
            // Giả sử component game nhận prop onBack để quay lại thư viện
            return <ActiveGameComponent onBack={() => navigateTo('games')} />;
        }
        switch (currentView) {
            case 'games':
                return <GameLibrary onPlay={navigateTo} />;
            case 'history':
                return <HistoryDisplay onBack={() => navigateTo('home')} />;
            case 'home':
            default:
                return <Hero />;
        }
    };

    return (
        <div className="bg-black text-white min-h-screen">
            {/* Truyền thêm user và logout vào Header để hiển thị thông tin và chức năng đăng xuất */}
            <Header onNavigate={navigateTo} currentView={currentView} user={user} onLogout={logout} />
            <main>
                {renderContent()}
            </main>
        </div>
    );
}

export default App;