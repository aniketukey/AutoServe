import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api';

const RegisterForm = ({ onRegisterSuccess }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    role: 'CUSTOMER' // Default role for new sign-ups
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser({ ...user, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Connecting to your Spring Boot /register endpoint (Auth not required)
      const response = await apiFetch('/auth/register', 'POST', user, false);

      if (response.ok) {
        alert(`Registration successful as ${user.role}! Please log in.`);
        navigate('/login');
        if (onRegisterSuccess) onRegisterSuccess();
      } else {
        setError('Username already exists or data is invalid.');
      }
    } catch (err) {
      setError('Server unreachable. Please check your backend.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100">
      <div className="card shadow-lg border-0" style={{ width: '100%', maxWidth: '450px' }}>
        <div className="card-body p-5">
          <div className="text-center mb-4">
            <h2 className="fw-bold text-dark">Join AutoServe</h2>
            <p className="text-muted">Create your account to book services</p>
          </div>

          {error && <div className="alert alert-danger py-2 small">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label small fw-bold text-secondary">Username</label>
              <input
                type="text"
                name="name"
                className="form-control border-secondary-subtle shadow-sm"
                placeholder="Enter username"
                value={user.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label small fw-bold text-secondary">Contact</label>
              <input
                type="number"
                name="phone"
                className="form-control border-secondary-subtle shadow-sm"
                placeholder="Enter Contact Number"
                value={user.phone}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label small fw-bold text-secondary">Email</label>
              <input
                type="email"
                name="email"
                className="form-control border-secondary-subtle shadow-sm"
                placeholder="Enter Email"
                value={user.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-4">
              <label className="form-label small fw-bold text-secondary">Password</label>
              <input
                type="password"
                name="password"
                className="form-control border-secondary-subtle shadow-sm"
                placeholder="••••••••"
                value={user.password}
                onChange={handleChange}
                required
              />
            </div>


            {/* Note: In a real app, 'role' would be hidden or restricted 
                to 'CUSTOMER' for public registration. */}
            <input type="hidden" name="userRole" value="CUSTOMER" />

            <button
              type="submit"
              className="btn btn-primary w-100 py-2 fw-bold rounded-pill shadow-sm mb-3"
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Create Account'}
            </button>

            <div className="text-center">
              <span className="small text-muted">Already have an account? </span>
              <a href="/login" className="small fw-bold text-decoration-none">Log in here</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;