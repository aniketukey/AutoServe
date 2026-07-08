import React from 'react';
import { assets } from '../assets/assets'
// import Login from '../pages/Login';
// import RegisterForm from '../pages/RegisterForm';
import { useNavigate, NavLink } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ isLoggedIn, userRole, setIsLoggedIn, onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // 1. Remove the token from localStorage
    localStorage.removeItem('token');

    // 2. Call parent logout handler if provided
    if (onLogout) {
      onLogout();
    }

    // 3. Update global state if provided
    if (setIsLoggedIn) setIsLoggedIn(false);

    // 4. Redirect the user
    navigate('/');
  };

  // Determine Navbar Style based on login state
  const navbarClass = isLoggedIn
    ? "navbar navbar-expand-lg navbar-custom-light shadow-sm sticky-top px-4 py-2"
    : "navbar navbar-expand-lg navbar-custom-dark shadow sticky-top px-4 py-3";

  return (
    <nav className={navbarClass}>
      <div className="container-fluid">

        {/* 1. Logo & Brand */}
        <div className="d-flex align-items-center cursor-pointer" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <img
            src={assets.AutoServelogo}
            alt="AutoServ Logo"
            className="rounded me-2"
            style={{ width: '35px', height: '35px', objectFit: 'contain' }}
          />
          <h1 className={`h5 mb-0 fw-bold tracking-tight ${!isLoggedIn ? 'text-white' : 'text-dark'}`}>
            AutoServe
          </h1>
        </div>

        {/* 2. Responsive Toggle Button */}
        <button className="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* 3. Navigation Links (Role-Based) */}
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav mx-auto">
            {isLoggedIn ? (
              <>
                {/* Links for CUSTOMER */}
                {userRole === 'CUSTOMER' && (
                  <>
                    <li className="nav-item">
                      <NavLink className={({ isActive }) => `nav-link px-3 fw-medium ${isActive ? 'text-primary border-bottom border-2 border-primary' : 'text-secondary'}`} to="/my-cars">
                        {/* My Vehicles */}
                      </NavLink>
                    </li>
                    <li className="nav-item">
                      <NavLink className={({ isActive }) => `nav-link px-3 fw-medium ${isActive ? 'text-primary border-bottom border-2 border-primary' : 'text-secondary'}`} to="/book">
                        {/* Book Service */}
                      </NavLink>
                    </li>
                  </>
                )}

                {/* Links for MANAGER */}
                {userRole === 'MANAGER' && (
                  <>
                    <li className="nav-item">
                      <NavLink className={({ isActive }) => `nav-link px-3 fw-medium ${isActive ? 'text-primary border-bottom border-2 border-primary' : 'text-secondary'}`} to="/">
                        Dashboard
                      </NavLink>
                    </li>
                    <li className="nav-item">
                      <NavLink className={({ isActive }) => `nav-link px-3 fw-medium ${isActive ? 'text-primary border-bottom border-2 border-primary' : 'text-secondary'}`} to="/manage-appointments">
                        Appointments
                      </NavLink>
                    </li>
                    <li className="nav-item">
                      <NavLink className={({ isActive }) => `nav-link px-3 fw-medium ${isActive ? 'text-primary border-bottom border-2 border-primary' : 'text-secondary'}`} to="/create-job-card">
                        Create Job Card
                      </NavLink>
                    </li>
                  </>
                )}

                {/* Links for MECHANIC */}
                {userRole === 'MECHANIC' && (
                  <>
                    <li className="nav-item">
                      <NavLink className={({ isActive }) => `nav-link px-3 fw-medium ${isActive ? 'text-primary border-bottom border-2 border-primary' : 'text-secondary'}`} to="/">
                        My Jobs
                      </NavLink>
                    </li>
                  </>
                )}

                {/* Links for ADMIN */}
                {userRole === 'ADMIN' && (
                  <>
                    <li className="nav-item">
                      <NavLink className={({ isActive }) => `nav-link px-3 fw-medium ${isActive ? 'text-primary border-bottom border-2 border-primary' : 'text-secondary'}`} to="/">
                        Dashboard
                      </NavLink>
                    </li>
                    <li className="nav-item">
                      <NavLink className={({ isActive }) => `nav-link px-3 fw-medium ${isActive ? 'text-primary border-bottom border-2 border-primary' : 'text-secondary'}`} to="/add-members">
                        Add Members
                      </NavLink>
                    </li>
                  </>
                )}
              </>
            ) : (
              /* Public Links when not logged in */
              <>
                <li className="nav-item">
                  <NavLink className="nav-link px-3 fw-medium" to="/">
                    {/* Home */}
                  </NavLink>
                </li>
                {/* <li className="nav-item"><a className="nav-link px-3 fw-medium" href="#services">Services</a></li>
                <li className="nav-item"><a className="nav-link px-3 fw-medium" href="#features">Features</a></li>
                <li className="nav-item"><a className="nav-link px-3 fw-medium" href="#about">About Us</a></li>
                <li className="nav-item"><a className="nav-link px-3 fw-medium" href="#contact">Contact</a></li> */}
              </>
            )}
          </ul>

          {/* 4. Auth Buttons */}
          <div className="d-flex align-items-center gap-3 mt-3 mt-lg-0">
            {isLoggedIn ? (
              <button onClick={handleLogout} className="btn btn-outline-danger btn-sm rounded-pill px-4">
                Logout
              </button>
            ) : (
              <>
                <button onClick={() => navigate('/register')} className={`btn ${!isLoggedIn ? 'btn-regsiter-link-dark' : 'btn-link text-dark'} text-decoration-none fw-medium`}>
                  Register
                </button>
                <button onClick={() => navigate('/login')} className={`btn ${!isLoggedIn ? 'btn-login-dark' : 'btn-dark'} rounded-pill px-4 shadow-sm fw-bold`}>
                  Log In
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;