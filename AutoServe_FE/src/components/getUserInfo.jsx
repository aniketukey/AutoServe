import { jwtDecode } from 'jwt-decode';

// Helper function to get current user info
const getUserInfo = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
        return jwtDecode(token); // This contains { sub: "username", role: "CUSTOMER", ... }
    } catch (error) {
        return null;
    }
};