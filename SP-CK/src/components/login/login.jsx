import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const LoginSignUpForm = () => {
    const { login, register } = useAuth();
    const [isSignUpMode, setIsSignUpMode] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSignUpClick = () => {
        setIsSignUpMode(true);
        setError('');
    };

    const handleSignInClick = () => {
        setIsSignUpMode(false);
        setError('');
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await login(username, password);
        } catch (err) {
            setError(err.message || 'Đăng nhập thất bại.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await register(username, password);
        } catch (err) {
            setError(err.message || 'Đăng ký thất bại.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <style>{`
                @import url("https://fonts.googleapis.com/css2?family=Poppins:wght@200;300;400;500;600;700;800&display=swap");
                .login-container *, .login-container *:before, .login-container *:after { margin: 0; padding: 0; box-sizing: border-box; }
                .login-container, .login-container input { font-family: "Poppins", sans-serif; }
                .login-container { position: relative; width: 100%; background-color: #fff; min-height: 100vh; overflow: hidden; }
                .login-container .forms-container { position: absolute; width: 100%; height: 100%; top: 0; left: 0; }
                .login-container .signin-signup { position: absolute; top: 50%; transform: translate(-50%, -50%); left: 75%; width: 50%; transition: 1s 0.7s ease-in-out; display: grid; grid-template-columns: 1fr; z-index: 5; }
                .login-container form { display: flex; align-items: center; justify-content: center; flex-direction: column; padding: 0rem 5rem; transition: all 0.2s 0.7s; overflow: hidden; grid-column: 1 / 2; grid-row: 1 / 2; }
                .login-container form.sign-up-form { opacity: 0; z-index: 1; }
                .login-container form.sign-in-form { z-index: 2; }
                .login-container .title { font-size: 2.2rem; color: #444; margin-bottom: 10px; }
                .login-container .input-field { max-width: 380px; width: 100%; background-color: #f0f0f0; margin: 10px 0; height: 55px; border-radius: 55px; display: grid; grid-template-columns: 15% 85%; padding: 0 0.4rem; position: relative; }
                .login-container .input-field i { text-align: center; line-height: 55px; color: #acacac; transition: 0.5s; font-size: 1.1rem; }
                .login-container .input-field input { background: none; outline: none; border: none; line-height: 1; font-weight: 600; font-size: 1.1rem; color: #333; }
                .login-container .input-field input::placeholder { color: #aaa; font-weight: 500; }
                .login-container .social-text { padding: 0.7rem 0; font-size: 1rem; color: #444; }
                .login-container .social-media { display: flex; justify-content: center; }
                .login-container .social-icon { height: 46px; width: 46px; display: flex; justify-content: center; align-items: center; margin: 0 0.45rem; color: #333; border-radius: 50%; border: 1px solid #333; text-decoration: none; font-size: 1.1rem; transition: 0.3s; }
                .login-container .social-icon:hover { color: #4481eb; border-color: #4481eb; }
                .login-container .btn { width: 150px; background-color: #5995fd; border: none; outline: none; height: 49px; border-radius: 49px; color: #fff; text-transform: uppercase; font-weight: 600; margin: 10px 0; cursor: pointer; transition: 0.5s; }
                .login-container .btn:hover { background-color: #4d84e2; }
                .login-container .btn:disabled { background-color: #a3c1f7; cursor: not-allowed; }
                .login-container .panels-container { position: absolute; height: 100%; width: 100%; top: 0; left: 0; display: grid; grid-template-columns: repeat(2, 1fr); }
                .login-container:before { content: ""; position: absolute; height: 2000px; width: 2000px; top: -10%; right: 48%; transform: translateY(-50%); background-image: linear-gradient(-45deg, #4481eb 0%, #04befe 100%); transition: 1.8s ease-in-out; border-radius: 50%; z-index: 6; }
                .login-container .image { width: 100%; transition: transform 1.1s ease-in-out; transition-delay: 0.4s; }
                .login-container .panel { display: flex; flex-direction: column; align-items: flex-end; justify-content: space-around; text-align: center; z-index: 6; }
                .login-container .left-panel { pointer-events: all; padding: 3rem 17% 2rem 12%; }
                .login-container .right-panel { pointer-events: none; padding: 3rem 12% 2rem 17%; }
                .login-container .panel .content { color: #fff; transition: transform 0.9s ease-in-out; transition-delay: 0.6s; }
                .login-container .panel h3 { font-weight: 600; line-height: 1; font-size: 1.5rem; }
                .login-container .panel p { font-size: 0.95rem; padding: 0.7rem 0; }
                .login-container .btn.transparent { margin: 0; background: none; border: 2px solid #fff; width: 130px; height: 41px; font-weight: 600; font-size: 0.8rem; }
                .login-container .right-panel .image, .login-container .right-panel .content { transform: translateX(800px); }
                .login-container.sign-up-mode:before { transform: translate(100%, -50%); right: 52%; }
                .login-container.sign-up-mode .left-panel .image, .login-container.sign-up-mode .left-panel .content { transform: translateX(-800px); }
                .login-container.sign-up-mode .signin-signup { left: 25%; }
                .login-container.sign-up-mode form.sign-up-form { opacity: 1; z-index: 2; }
                .login-container.sign-up-mode form.sign-in-form { opacity: 0; z-index: 1; }
                .login-container.sign-up-mode .right-panel .image, .login-container.sign-up-mode .right-panel .content { transform: translateX(0%); }
                .login-container.sign-up-mode .left-panel { pointer-events: none; }
                .login-container.sign-up-mode .right-panel { pointer-events: all; }
                @media (max-width: 870px) { .login-container { min-height: 800px; height: 100vh; } .login-container .signin-signup { width: 100%; top: 95%; transform: translate(-50%, -100%); transition: 1s 0.8s ease-in-out; } .login-container .signin-signup, .login-container.sign-up-mode .signin-signup { left: 50%; } .login-container .panels-container { grid-template-columns: 1fr; grid-template-rows: 1fr 2fr 1fr; } .login-container .panel { flex-direction: row; justify-content: space-around; align-items: center; padding: 2.5rem 8%; grid-column: 1 / 2; } .login-container .right-panel { grid-row: 3 / 4; } .login-container .left-panel { grid-row: 1 / 2; } .login-container .image { width: 200px; transition: transform 0.9s ease-in-out; transition-delay: 0.6s; } .login-container .panel .content { padding-right: 15%; transition: transform 0.9s ease-in-out; transition-delay: 0.8s; } .login-container .panel h3 { font-size: 1.2rem; } .login-container .panel p { font-size: 0.7rem; padding: 0.5rem 0; } .login-container .btn.transparent { width: 110px; height: 35px; font-size: 0.7rem; } .login-container:before { width: 1500px; height: 1500px; transform: translateX(-50%); left: 30%; bottom: 68%; right: initial; top: initial; transition: 2s ease-in-out; } .login-container.sign-up-mode:before { transform: translate(-50%, 100%); bottom: 32%; right: initial; } .login-container.sign-up-mode .left-panel .image, .login-container.sign-up-mode .left-panel .content { transform: translateY(-300px); } .login-container.sign-up-mode .right-panel .image, .login-container.sign-up-mode .right-panel .content { transform: translateY(0px); } .login-container .right-panel .image, .login-container .right-panel .content { transform: translateY(300px); } .login-container.sign-up-mode .signin-signup { top: 5%; transform: translate(-50%, 0); } }
                @media (max-width: 570px) { .login-container form { padding: 0 1.5rem; } .login-container .image { display: none; } .login-container .panel .content { padding: 0.5rem 1rem; } .login-container { padding: 1.5rem; } .login-container:before { bottom: 72%; left: 50%; } .login-container.sign-up-mode:before { bottom: 28%; left: 50%; } }
            `}</style>

            <div className={`login-container ${isSignUpMode ? 'sign-up-mode' : ''}`}>
                <div className="forms-container">
                    <div className="signin-signup">
                        <form onSubmit={handleLogin} className="sign-in-form">
                            <h2 className="title">Đăng Nhập</h2>
                            <div className="input-field">
                                <i className="fas fa-user"></i>
                                <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
                            </div>
                            <div className="input-field">
                                <i className="fas fa-lock"></i>
                                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                            </div>
                            <button type="submit" disabled={isLoading} className="btn solid">{isLoading ? 'Đang xử lý...' : 'Login'}</button>
                            {error && !isSignUpMode && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
                            <p className="social-text">Hoặc đăng nhập với nền tảng khác</p>
                            <div className="social-media">
                                <a href="#" className="social-icon"><i className="fab fa-facebook-f"></i></a>
                                <a href="#" className="social-icon"><i className="fab fa-twitter"></i></a>
                                <a href="#" className="social-icon"><i className="fab fa-google"></i></a>
                                <a href="#" className="social-icon"><i className="fab fa-linkedin-in"></i></a>
                            </div>
                        </form>
                        <form onSubmit={handleRegister} className="sign-up-form">
                            <h2 className="title">Đăng Ký</h2>
                            <div className="input-field">
                                <i className="fas fa-user"></i>
                                <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
                            </div>
                            <div className="input-field">
                                <i className="fas fa-envelope"></i>
                                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                            </div>
                            <div className="input-field">
                                <i className="fas fa-lock"></i>
                                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                            </div>
                            <button type="submit" disabled={isLoading} className="btn">{isLoading ? 'Đang xử lý...' : 'Sign up'}</button>
                            {error && isSignUpMode && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
                            <p className="social-text">Hoặc bạn có thể dùng với mã bảo mật</p>
                            <div className="social-media">
                                <a href="#" className="social-icon"><i className="fab fa-facebook-f"></i></a>
                                <a href="#" className="social-icon"><i className="fab fa-twitter"></i></a>
                                <a href="#" className="social-icon"><i className="fab fa-google"></i></a>
                                <a href="#" className="social-icon"><i className="fab fa-linkedin-in"></i></a>
                            </div>
                        </form>
                    </div>
                </div>

                <div className="panels-container">
                    <div className="panel left-panel">
                        <div className="content">
                            <h3>Bạn là người mới?</h3>
                            <p>Hãy tạo tài khoản và khám phá những trò chơi thú vị cùng chúng tôi!</p>
                            <button className="btn transparent" onClick={handleSignUpClick}>Đăng ký</button>
                        </div>
                    </div>
                    <div className="panel right-panel">
                        <div className="content">
                            <h3>Đã là thành viên?</h3>
                            <p>Đăng nhập ngay để tiếp tục cuộc hành trình và lưu lại những thành tích của bạn.</p>
                            <button className="btn transparent" onClick={handleSignInClick}>Đăng nhập</button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default LoginSignUpForm;