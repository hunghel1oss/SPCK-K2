import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import LoginComponent from '../components/login/login'
import GameCard from '../components/Game/GameCard';
import GameLibrary from '../components/Game/GameLibrary';
const AuthPage = () => {
    const [isLoginView, setIsLoginView] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login, register } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            if (isLoginView) {
                await login(username, password);
            } else {
                await register(username, password);
            }
            // App.jsx sẽ tự động render lại và chuyển trang
        } catch (err) {
            setError(err.message || 'Đã xảy ra lỗi. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        // <LoginComponent/>
        <GameLibrary/>
    );
};

export default AuthPage;