import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { Link } from 'react-router-dom';
import './LandingPage.css'; // Import custom styles

// import Navbar from '../components/Navbar';
import CustomerDashboard from '../components/dashboard/CustomerDashboard';
import ManagerDashboard from '../components/dashboard/ManagerDashboard';
import MechanicDashboard from '../components/dashboard/MechanicDashboard';
import AdminDashboard from '../components/dashboard/AdminDashboard';
import { apiFetch } from '../utils/api';

const getUserInfo = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;

        if (decoded.exp < currentTime) {
            localStorage.removeItem('token');
            return null;
        }

        return {
            userId: Number(decoded.sub),
            role: decoded.role,
            name: decoded.name,//
            email: decoded.email,
            mobile: decoded.mobile,//
            isAuthenticated: true
        };
    } catch {
        localStorage.removeItem('token');
        return null;
    }
};

const LandingPage = () => {
    const [auth, setAuth] = useState(null);
    const [userDetails, setUserDetails] = useState(null);
    const [vehicles, setVehicles] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setAuth(getUserInfo());
    }, []);

    const loadData = () => {
        if (!auth?.userId) {
            setLoading(false);
            return;
        }

        const fetchUser = apiFetch(`/users/getUserById/${auth.userId}`)
            .then(res => {
                if (!res.ok) {
                    console.error(`Fetch user failed with status ${res.status}`);
                    return null;
                }
                return res.json();
            })
            .catch(e => { console.error("User fetch error", e); return null; });

        const fetchVehicles =
            auth.role === 'CUSTOMER'
                ? apiFetch(`/vehicles/customer/${auth.userId}`)
                    .then(res => {
                        if (!res.ok) console.error(`Fetch vehicles failed with status ${res.status}`);
                        return res.ok ? res.json() : [];
                    })
                    .catch(e => [])
                : Promise.resolve([]);

        const fetchAppointments =
            auth.role === 'CUSTOMER'
                ? apiFetch(`/appointments/customer/${auth.userId}`)
                    .then(res => {
                        if (!res.ok) console.error(`Fetch appointments failed with status ${res.status}`);
                        return res.ok ? res.json() : [];
                    })
                    .catch(e => [])
                : Promise.resolve([]);

        Promise.all([fetchUser, fetchVehicles, fetchAppointments])
            .then(([userData, vehicleData, appointmentData]) => {
                setUserDetails(userData);
                setVehicles(vehicleData);
                setAppointments(appointmentData);
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadData();
    }, [auth]);

    if (loading) {
        return <div className="text-center mt-5">Loading AutoServe Profile...</div>;
    }

    const renderDashboard = () => {
        switch (auth.role) {
            case 'CUSTOMER':
                return <CustomerDashboard
                    vehicles={vehicles}
                    appointments={appointments}
                    userId={auth.userId}
                    onRefresh={loadData}
                />;
            case 'MANAGER':
                return <ManagerDashboard />;
            case 'MECHANIC':
                return <MechanicDashboard />;
            case 'ADMIN':
                return <AdminDashboard />;
            default:
                return <div className="alert alert-warning">Unknown role: {auth.role}</div>;
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        setAuth(null);
        setUserDetails(null);
        setVehicles([]);
    };

    // LOGGED IN VIEW
    if (auth) {
        return (
            <div className="min-vh-100 bg-light">
                <main className="container py-5">
                    <div className="row">
                        {/* USER PROFILE */}
                        <div className="col-12 mb-4">
                            <div className="card shadow border-0 overflow-hidden" style={{ borderRadius: '1rem' }}>
                                {/* Gradient Header */}
                                <div className="bg-dark text-white p-4 position-relative" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' }}>
                                    <div className="d-flex align-items-center position-relative" style={{ zIndex: 2 }}>
                                        {/* Avatar Placeholder */}
                                        <div className="bg-white text-primary rounded-circle d-flex align-items-center justify-content-center shadow-lg me-3 fw-bold display-6"
                                            style={{ width: '80px', height: '80px', border: '4px solid rgba(255,255,255,0.2)' }}>
                                            {userDetails?.userName ? userDetails.userName.charAt(0).toUpperCase() : 'U'}
                                        </div>
                                        <div>
                                            <h3 className="fw-bold mb-0 text-white">{userDetails?.userName || 'Welcome User'}</h3>
                                            <span className="badge bg-white text-dark mt-2 px-3 rounded-pill text-uppercase small fw-bold" style={{ letterSpacing: '1px' }}>
                                                {auth.role}
                                            </span>
                                        </div>
                                    </div>
                                    {/* Decorative circle */}
                                    <div className="position-absolute top-0 end-0 bg-white opacity-10 rounded-circle" style={{ width: '150px', height: '150px', marginRight: '-50px', marginTop: '-50px' }}></div>
                                </div>

                                {/* Body Content */}
                                <div className="card-body p-4 bg-white">
                                    <div className="row g-4">
                                        <div className="col-md-6">
                                            <div className="d-flex align-items-center p-3 rounded bg-light hover-shadow transition-all">
                                                <div className="bg-primary bg-opacity-10 text-primary rounded-circle p-2 me-3">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-envelope-fill" viewBox="0 0 16 16">
                                                        <path d="M.05 3.555A2 2 0 0 1 2 2h12a2 2 0 0 1 1.95 1.555L8 8.414.05 3.555ZM0 4.697v7.104l5.803-3.558zM6.761 8.83l-6.57 4.027A2 2 0 0 0 2 14h12a2 2 0 0 0 1.808-1.144l-6.57-4.027L8 9.586l-1.239-.757Zm3.436-.586L16 11.801V4.697l-5.803 3.546Z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <p className="text-muted small mb-0 text-uppercase fw-bold" style={{ fontSize: '0.75rem' }}>Email Address</p>
                                                    <p className="mb-0 fw-medium text-dark">{userDetails?.email}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="d-flex align-items-center p-3 rounded bg-light hover-shadow transition-all">
                                                <div className="bg-success bg-opacity-10 text-success rounded-circle p-2 me-3">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-telephone-fill" viewBox="0 0 16 16">
                                                        <path fillRule="evenodd" d="M1.885.511a1.745 1.745 0 0 1 2.61.163L6.29 2.98c.329.423.445.974.315 1.494l-.547 2.19a.678.678 0 0 0 .178.643l2.457 2.457a.68.68 0 0 0 .644.178l2.189-.547a1.745 1.745 0 0 1 1.494.315l2.306 1.794c.829.645.905 1.87.163 2.611l-1.034 1.034c-.74.74-1.846 1.065-2.877.702a18.634 18.634 0 0 1-7.01-4.42 18.634 18.634 0 0 1-4.42-7.009c-.362-1.03-.037-2.137.703-2.877L1.885.511z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <p className="text-muted small mb-0 text-uppercase fw-bold" style={{ fontSize: '0.75rem' }}>Mobile Number</p>
                                                    <p className="mb-0 fw-medium text-dark">{userDetails?.mobile}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>


                        {/* ROLE SPECIFIC DASHBOARD */}
                        <div className="col-12">
                            {renderDashboard()}
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    // GUEST (LOGGED OUT) VIEW - NEW PREMIUM LANDING PAGE
    return (
        <div className="landing-page">
            {/* Hero Section */}
            <section className="hero-section text-center d-flex align-items-center justify-content-center">
                <div className="hero-overlay"></div>
                <div className="hero-content container">
                    <h1 className="hero-title animate__animated animate__fadeInUp">
                        AutoServe: Professional Car Care
                    </h1>
                    <p className="hero-subtitle animate__animated animate__fadeInUp animate__delay-1s">
                        Experience the future of vehicle maintenance. Smart bookings, real-time tracking, and expert service at your fingertips.
                    </p>
                    <Link
                        to="/login"
                        className="btn btn-premium rounded-pill btn-lg animate__animated animate__fadeInUp animate__delay-2s"
                    >
                        Login to Get Started
                    </Link>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-5 bg-light">
                <div className="container py-5">
                    <div className="row g-4">
                        <div className="col-md-4">
                            <div className="card feature-card h-100 p-4 bg-white">
                                <div className="card-body text-center">
                                    <div className="feature-icon-box bg-primary bg-opacity-10 text-primary mx-auto">
                                        <i className="bi bi-calendar-check display-6"></i>
                                    </div>
                                    <h3 className="h4 fw-bold mb-3">Easy Scheduling</h3>
                                    <p className="text-muted">
                                        Book appointments in seconds. Choose your preferred time and describe your issue with photo uploads.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="card feature-card h-100 p-4 bg-white">
                                <div className="card-body text-center">
                                    <div className="feature-icon-box bg-success bg-opacity-10 text-success mx-auto">
                                        <i className="bi bi-geo-alt display-6"></i>
                                    </div>
                                    <h3 className="h4 fw-bold mb-3">Live Tracking</h3>
                                    <p className="text-muted">
                                        Track your repair status in real-time. Get notified when your car is ready for pickup.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="card feature-card h-100 p-4 bg-white">
                                <div className="card-body text-center">
                                    <div className="feature-icon-box bg-warning bg-opacity-10 text-warning mx-auto">
                                        <i className="bi bi-shield-check display-6"></i>
                                    </div>
                                    <h3 className="h4 fw-bold mb-3">Genuine Parts</h3>
                                    <p className="text-muted">
                                        Rest assured with 100% genuine parts and transparent pricing. No hidden costs.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-dark text-white py-4 text-center">
                <div className="container">
                    <p className="mb-0 opacity-50">&copy; {new Date().getFullYear()} AutoServe. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
