import React from 'react';
import 'boxicons/css/boxicons.min.css';

const Header = ({ onNavigate, currentView, user, onLogout }) => {
    const toggleMobileMenu = () => {
        const mobileMenu = document.getElementById('mobileMenu');
        mobileMenu.classList.toggle('hidden');
    };

    const handleNavClick = (e, view) => {
        e.preventDefault();
        onNavigate(view);
    };

    const isGameView = (view) => !['home', 'games', 'history', 'friends'].includes(view);

    return (
        <header className="flex justify-between items-center px-4 py-4 lg:px-20 relative z-50 bg-black text-white">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-light m-0 cursor-pointer" onClick={(e) => handleNavClick(e, 'home')}>
                HUAN
            </h1>

            <nav className="hidden md:flex items-center gap-10">
                <a className={`text-base tracking-wider transition-colors hover:text-gray-300 ${currentView === 'home' ? 'font-bold' : ''}`} href="#" onClick={(e) => handleNavClick(e, 'home')}>
                    TRANG CHỦ
                </a>
                <a className={`text-base tracking-wider transition-colors hover:text-gray-300 ${(currentView === 'games' || isGameView(currentView)) ? 'font-bold' : ''}`} href="#" onClick={(e) => handleNavClick(e, 'games')}>
                    THƯ VIỆN GAME
                </a>
                <a className={`text-base tracking-wider transition-colors hover:text-gray-300 ${currentView === 'history' ? 'font-bold' : ''}`} href="#" onClick={(e) => handleNavClick(e, 'history')}>
                    LỊCH SỬ
                </a>
                <a className={`text-base tracking-wider transition-colors hover:text-gray-300 ${currentView === 'friends' ? 'font-bold' : ''}`} href="#" onClick={(e) => handleNavClick(e, 'friends')}>
                    BẠN BÈ
                </a>
            </nav>

            <div className="hidden md:flex items-center gap-4">
                <span className="text-white">Chào, {user.username}</span>
                <button
                    onClick={onLogout}
                    className="bg-red-600 text-white py-2 px-6 rounded-full border-none font-medium transition-all duration-500 hover:bg-red-700 cursor-pointer"
                >
                    ĐĂNG XUẤT
                </button>
            </div>


            <button onClick={toggleMobileMenu} className="md:hidden text-3xl p-2">
                <i className="bx bx-menu"></i>
            </button>

            <div id="mobileMenu" className="hidden fixed top-16 bottom-0 right-0 left-0 p-5 md:hidden z-40 bg-black bg-opacity-70 backdrop-blur-md">
                <nav className="flex flex-col gap-6 items-center mt-10">
                    <a href="#" onClick={(e) => { handleNavClick(e, 'home'); toggleMobileMenu(); }} className="text-xl">TRANG CHỦ</a>
                    <a href="#" onClick={(e) => { handleNavClick(e, 'games'); toggleMobileMenu(); }} className="text-xl">THƯ VIỆN GAME</a>
                    <a href="#" onClick={(e) => { handleNavClick(e, 'history'); toggleMobileMenu(); }} className="text-xl">LỊCH SỬ</a>
                    <a href="#" onClick={(e) => { handleNavClick(e, 'friends'); toggleMobileMenu(); }} className="text-xl">BẠN BÈ</a>
                    <div className="mt-8 flex flex-col items-center gap-4">
                        <span className="text-white text-lg">Chào, {user.username}</span>
                        <button onClick={onLogout} className="bg-red-600 text-white py-2 px-6 rounded-full font-medium">ĐĂNG XUẤT</button>
                    </div>
                </nav>
            </div>
        </header>
    );
};

export default Header;