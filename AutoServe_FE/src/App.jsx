import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

import Home from './pages/Home'
import Login from './pages/Login'
import LandingPage from './pages/LandingPage'
import RegisterForm from './pages/RegisterForm'
import Navbar from './components/Navbar';
import ManageAppointments from './pages/ManageAppointments';
import CreateJobCard from './pages/CreateJobCard';
import AddMembers from './pages/AddMembers';
import InvoiceDetail from './pages/InvoiceDetail';
import JobCardDetail from './pages/JobCardDetail';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    // Initial check and subscription to login changes
    const updateRole = () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const cleanToken = token.startsWith('Bearer ') ? token.substring(7) : token;
          const decoded = jwtDecode(cleanToken);

          // Check Expiration
          const currentTime = Date.now() / 1000;
          if (decoded.exp < currentTime) {
            console.log("Token expired");
            localStorage.removeItem('token');
            setIsLoggedIn(false);
            setUserRole(null);
            return;
          }

          // Try standard claim names or custom ones
          const role = decoded.role || decoded.userRole || (decoded.roles && decoded.roles[0]);

          setUserRole(role);
        } catch (error) {
          console.error("Token decode error:", error);
          setUserRole(null);
          // If decode fails, maybe invalid token?
          setIsLoggedIn(false);
        }
      } else {
        setUserRole(null);
        // Ensure isLoggedIn is sync'd if token is missing
        if (isLoggedIn) setIsLoggedIn(false);
      }
    };

    updateRole();
  }, [isLoggedIn]);

  return (
    <div>
      <Navbar
        isLoggedIn={isLoggedIn}
        setIsLoggedIn={setIsLoggedIn}
        userRole={userRole}
      />
      <Routes>
        <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
        <Route path='/' element={<LandingPage key={isLoggedIn} />} />
        <Route path='/manage-appointments' element={<ManageAppointments />} />
        <Route path='/create-job-card' element={<CreateJobCard />} />
        <Route path='/add-members' element={<AddMembers />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/invoice/:id" element={<InvoiceDetail />} />
        <Route path="/job-card-details/:appointmentId" element={<JobCardDetail />} />
      </Routes>
    </div>
  )
}

export default App;
