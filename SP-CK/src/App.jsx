import React from 'react';
import { useAuth } from './context/AuthContext';
import LoginSignUpForm from './components/login/LoginSignUpForm.jsx';
import MainApp from './MainApp';

function App() {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Đang tải...</div>;
    }

    return isAuthenticated ? <MainApp /> : <LoginSignUpForm />;
}

export default App;