
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api';
const Login = ({ setIsLoggedIn }) => {

    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };



    // ... (inside component)

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        try {
            // Step 1: Send credentials to your Spring Boot backend (Auth not required)
            const response = await apiFetch('/auth/login', 'POST', credentials, false);

            if (response.ok) {
                const data = await response.json();
                const token = data.token;

                // Step 2: Store the JWT in localStorage
                localStorage.setItem('token', token);

                // Step 3: Update global state
                if (setIsLoggedIn) setIsLoggedIn(true);

                // Step 4: Redirect to a dashboard or home
                navigate('/');
                console.log("Logged in")
            } else {
                setError('Invalid username or password');
            }
        } catch (err) {
            setError('Server is unreachable. Please check your Spring Boot app.');
        }
    };

    return (
        <div className="container d-flex justify-content-center align-items-center min-vh-100">
            <div className="card shadow border-0 p-4" style={{ maxWidth: '400px', width: '100%' }}>
                <div className="text-center mb-4">
                    <h2 className="fw-bold">AutoServe</h2>
                    <p className="text-muted">Welcome back! Please login.</p>
                </div>

                {error && <div className="alert alert-danger py-2 small">{error}</div>}

                <form onSubmit={handleLogin}>
                    <div className="mb-3">
                        <label className="form-label small fw-bold">Email</label>
                        <input
                            type="text"
                            name="email"
                            className="form-control"
                            placeholder="Enter Email"
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="form-label small fw-bold">Password</label>
                        <input
                            type="password"
                            name="password"
                            className="form-control"
                            placeholder="••••••••"
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-dark w-100 py-2 rounded-pill fw-bold shadow-sm">
                        Log-in
                    </button>
                </form>

                <div className="text-center mt-3">
                    <span className="small text-muted">New here? </span>
                    <button onClick={() => navigate('/register')} className="btn btn-link p-0 small fw-bold text-decoration-none">
                        Create Account
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login
