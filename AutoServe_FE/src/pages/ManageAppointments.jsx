import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
// import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const ManageAppointments = () => {
    const navigate = useNavigate();
    const [auth, setAuth] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [mechanics, setMechanics] = useState([]);
    const [filterMode, setFilterMode] = useState('ALL'); // ALL, UNASSIGNED, PENDING

    useEffect(() => {
        // Auth Check
        const token = localStorage.getItem('token');
        let currentUser = null;

        if (token) {
            try {
                const decoded = jwtDecode(token);
                if (decoded.role !== 'MANAGER' && decoded.role !== 'ADMIN') {
                    // Basic role protection
                    alert('Unauthorized');
                    navigate('/');
                    return;
                }
                currentUser = {
                    role: decoded.role,
                    name: decoded.name || decoded.sub,
                    id: decoded.sub
                };
                setAuth(currentUser);
            } catch (e) {
                console.error(e);
                navigate('/login');
                return;
            }
        } else {
            navigate('/login');
            return;
        }

        // Initial Data Load
        if (currentUser) {
            fetchAppointments(currentUser);
        }
        fetchMechanics();
    }, [navigate]);

    const fetchAppointments = async (userContext = auth) => {
        if (!userContext) return;
        setLoading(true);
        try {
            let endpoint = '/appointments';
            if (userContext.role === 'MANAGER') {
                endpoint = `/appointments/manager/${userContext.id}`;
            }

            const response = await apiFetch(endpoint);
            if (!response.ok) throw new Error('Failed to fetch appointments');
            const data = await response.json();
            setAppointments(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchMechanics = async () => {
        try {
            const response = await apiFetch('/users/mechanics');
            if (response.ok) {
                const data = await response.json();
                setMechanics(data);
            }
        } catch (e) {
            console.error('Failed to load mechanics', e);
        }
    };

    const handleAssignMechanic = async (appointmentId, mechanicId) => {
        if (!mechanicId) return;
        try {
            const response = await apiFetch(`/appointments/${appointmentId}/assign-mechanic/${mechanicId}`, 'PUT');

            if (response.ok) {
                alert('Mechanic assigned successfully!');
                fetchAppointments();
            } else {
                const errorData = await response.json();
                alert('Failed to assign mechanic: ' + (errorData.message || 'Unknown error'));
            }
        } catch (e) {
            alert('Error assigning mechanic');
        }
    };

    const handleUpdateStatus = async (appointmentId, newStatus) => {
        if (!newStatus) return;
        try {
            const response = await apiFetch(`/appointments/${appointmentId}/approve`, 'PUT'); // Note: Backend uses /approve for status change to approved

            if (response.ok) {
                alert(`Status updated successfully`);
                fetchAppointments();
            } else {
                alert('Failed to update status');
            }
        } catch (e) {
            alert('Error updating status');
        }
    };

    const getFilteredAppointments = () => {
        if (filterMode === 'UNASSIGNED') {
            return appointments.filter(a => !a.mechanicId && a.status !== 'CANCELLED' && a.status !== 'COMPLETED');
        }
        if (filterMode === 'PENDING') {
            return appointments.filter(a => a.status === 'PENDING');
        }
        return appointments;
    };

    const filteredList = getFilteredAppointments();

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    return (
        <div className="min-vh-100 bg-light">


            <div className="container py-5">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="fw-bold text-success">Manage Appointments</h2>
                        <p className="text-muted">Oversee service requests and assignments.</p>
                    </div>
                    <button className="btn btn-outline-secondary rounded-pill" onClick={() => navigate('/')}>
                        &larr; Back to Dashboard
                    </button>
                </div>

                <div className="card shadow border-0">
                    <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                        <div className="btn-group">
                            <button
                                className={`btn ${filterMode === 'ALL' ? 'btn-success' : 'btn-outline-success'}`}
                                onClick={() => setFilterMode('ALL')}
                            >
                                All
                            </button>
                            <button
                                className={`btn ${filterMode === 'UNASSIGNED' ? 'btn-success' : 'btn-outline-success'}`}
                                onClick={() => setFilterMode('UNASSIGNED')}
                            >
                                Unassigned
                            </button>
                            <button
                                className={`btn ${filterMode === 'PENDING' ? 'btn-success' : 'btn-outline-success'}`}
                                onClick={() => setFilterMode('PENDING')}
                            >
                                Pending
                            </button>
                        </div>
                        <button className="btn btn-sm btn-outline-primary rounded-pill" onClick={() => fetchAppointments()}>
                            Refresh List
                        </button>
                    </div>
                    <div className="card-body p-0">
                        {loading ? (
                            <div className="text-center py-5">
                                <div className="spinner-border text-success" role="status"></div>
                                <p className="mt-2 text-muted">Loading appointments...</p>
                            </div>
                        ) : error ? (
                            <div className="alert alert-danger m-4">{error}</div>
                        ) : filteredList.length === 0 ? (
                            <div className="text-center py-5 text-muted">
                                No appointments found for this filter.
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th>ID</th>
                                            <th>Date</th>
                                            <th>Vehicle</th>
                                            <th>Service Type</th>
                                            <th>Status</th>
                                            <th>Mechanic</th>
                                            <th>Vehicle Image</th>
                                            <th>Notes</th>
                                            <th style={{ minWidth: '180px' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredList.map(apt => {
                                            // Service Type Logic
                                            const desc = apt.description || apt.problemDescription || '';
                                            const match = desc.match(/^\s*\[([^\]]*)\]([\s\S]*)$/);
                                            const displayType = apt.serviceType || (match ? match[1].trim() : 'General Service');

                                            // Date Logic
                                            const rawDate = apt.requestDate || apt.appointmentDate || apt.date;
                                            let displayDate = 'N/A';
                                            if (Array.isArray(rawDate) && rawDate.length >= 3) {
                                                displayDate = new Date(rawDate[0], rawDate[1] - 1, rawDate[2]).toLocaleDateString();
                                            } else if (rawDate) {
                                                displayDate = new Date(rawDate).toLocaleDateString();
                                            }

                                            // Notes Logic
                                            // User confirmed field is "problemDescription"
                                            const rawDesc = apt.problemDescription || apt.description || apt.notes || '';
                                            const noteMatch = rawDesc.match(/[\])]\s*([\s\S]*)$/);
                                            const displayNotes = noteMatch ? noteMatch[1].trim() : rawDesc;

                                            // Vehicle Logic
                                            const vehicle = apt.vehicleModel || apt.model || (apt.vehicleId ? `#${apt.vehicleId}` : 'N/A');

                                            const isDone = apt.status === 'COMPLETED' || apt.status === 'CANCELLED';

                                            return (
                                                <tr key={apt.id || apt.appointmentId} className={isDone ? 'table-light text-muted' : ''}>
                                                    <td>{apt.id || apt.appointmentId}</td>
                                                    <td>{displayDate}</td>
                                                    <td className="fw-bold">{vehicle}</td>
                                                    <td>{displayType}</td>
                                                    <td>
                                                        <span className={`badge ${apt.status === 'COMPLETED' ? 'bg-success' :
                                                            apt.status === 'PENDING' ? 'bg-warning text-dark' :
                                                                apt.status === 'IN_PROGRESS' ? 'bg-primary' :
                                                                    'bg-secondary'
                                                            }`}>
                                                            {apt.status || 'Pending'}
                                                        </span>
                                                    </td>
                                                    <td>{apt.mechanicName || <span className="text-warning">Unassigned</span>}</td>
                                                    <td>
                                                        {apt.vehicleImageUrl ? (
                                                            <a href={apt.vehicleImageUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-info rounded-pill">
                                                                View Image
                                                            </a>
                                                        ) : (
                                                            <span className="text-muted small">No Image</span>
                                                        )}
                                                    </td>
                                                    <td className="small text-truncate" style={{ maxWidth: '150px' }}>
                                                        {displayNotes || '-'}
                                                    </td>
                                                    <td>
                                                        <div className="d-flex flex-column gap-2">
                                                            <select
                                                                className="form-select form-select-sm"
                                                                onChange={(e) => handleAssignMechanic(apt.id || apt.appointmentId, e.target.value)}
                                                                value={apt.mechanicId || ""}
                                                                disabled={isDone}
                                                            >
                                                                <option value="" disabled>Assign Mechanic</option>
                                                                {mechanics.map(m => (
                                                                    <option key={m.userId} value={m.userId}>{m.userName}</option>
                                                                ))}
                                                            </select>
                                                            <select
                                                                className="form-select form-select-sm"
                                                                onChange={(e) => handleUpdateStatus(apt.id || apt.appointmentId, e.target.value)}
                                                                value={apt.status || ''}
                                                                disabled={isDone}
                                                            >
                                                                <option value="PENDING">Pending</option>
                                                                <option value="APPROVED">Approved</option>
                                                                <option value="IN_PROGRESS">In Progress</option>
                                                                <option value="COMPLETED">Completed</option>
                                                                <option value="CANCELLED">Cancelled</option>
                                                            </select>
                                                            {apt.status === 'APPROVED' && apt.mechanicId && (
                                                                <button
                                                                    className="btn btn-primary btn-sm rounded-pill"
                                                                    onClick={() => navigate('/create-job-card', { state: { appointmentId: apt.id || apt.appointmentId } })}
                                                                >
                                                                    Generate Job Card
                                                                </button>
                                                            )}
                                                            {(apt.status === 'IN_PROGRESS' || apt.status === 'COMPLETED') && (
                                                                <button
                                                                    className="btn btn-info btn-sm rounded-pill text-white"
                                                                    onClick={() => navigate(`/job-card-details/${apt.id || apt.appointmentId}`)}
                                                                >
                                                                    View Job Card
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManageAppointments;
