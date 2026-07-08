import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const MechanicDashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [stats, setStats] = useState({
        totalJobCards: 0,
        assignedJobCards: [],
        inProgressJobCards: [],
        completedJobCards: 0
    });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('appointments'); // appointments, jobcards

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                // In this app, decoded.sub is the userId (Long) sent as string
                const userId = decoded.sub;
                setUser({ ...decoded, id: userId });
                fetchDashboardData(userId);
            } catch (e) {
                console.error("Token decode error", e);
                navigate('/login');
            }
        } else {
            navigate('/login');
        }
    }, [navigate]);

    const fetchDashboardData = async (userId) => {
        setLoading(true);
        try {
            // Fetch Assigned Appointments (Status APPROVED, but no job card yet)
            const aptRes = await apiFetch(`/appointments/mechanic/${userId}`);
            if (aptRes.ok) {
                const aptData = await aptRes.json();
                setAppointments(aptData);
            } else {
                console.error(`Fetch Mechanic Appointments failed: ${aptRes.status}`);
            }

            // Fetch Job Card Stats & List
            const jcRes = await apiFetch(`/job_cards/dashboard/mechanic/${userId}`);
            if (jcRes.ok) {
                const jcData = await jcRes.json();
                setStats(jcData);
            } else {
                console.error(`Fetch Mechanic JobCards Dashboard failed: ${jcRes.status}`);
            }
        } catch (e) {
            console.error("Error fetching dashboard data", e);
        } finally {
            setLoading(false);
        }
    };

    const handleStartWork = async (jobCardId) => {
        try {
            const response = await apiFetch(`/job_cards/${jobCardId}/start`, 'PUT');
            if (response.ok) {
                alert('Work started!');
                fetchDashboardData(user.id);
            } else {
                alert('Failed to start work');
            }
        } catch (e) {
            alert('Error updating status');
        }
    };

    const handleCompleteWork = async (jobCardId) => {
        if (!window.confirm("Mark this job as completed? This will finalize the bill and notify the customer.")) return;
        try {
            const response = await apiFetch(`/job_cards/${jobCardId}/complete`, 'PUT');
            if (response.ok) {
                alert('Job completed successfully!');
                fetchDashboardData(user.id);
            } else {
                const errorData = await response.json();
                alert('Failed to complete job: ' + (errorData.message || 'Unknown error'));
            }
        } catch (e) {
            alert('Error updating status');
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
                <div className="text-center">
                    <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}></div>
                    <h5 className="text-muted fw-light">Preparing your workspace...</h5>
                </div>
            </div>
        );
    }

    return (
        <div className="min-vh-100 bg-light py-5">
            <div className="container">
                {/* Header Section */}
                <div className="row mb-5 align-items-center">
                    <div className="col">
                        <h2 className="fw-bold text-dark mb-1">Mechanic Dashboard</h2>
                        <p className="text-muted">Welcome back, <span className="text-primary fw-bold">{user?.name || 'Sir'}</span>. Here's your task overview.</p>
                    </div>
                    <div className="col-auto">
                        <button className="btn btn-white shadow-sm border-0 rounded-pill px-4" onClick={() => fetchDashboardData(user.id)}>
                            <i className="bi bi-arrow-clockwise me-2"></i> Refresh
                        </button>
                    </div>
                </div>

                {/* Stats Section */}
                <div className="row g-4 mb-5">
                    <div className="col-md-4">
                        <div className="card border-0 shadow-sm rounded-4 text-center p-4 h-100 bg-white hover-up text-primary">
                            <div className="bg-primary bg-opacity-10 text-primary rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                                <i className="bi bi-tools fs-3"></i>
                            </div>
                            <h3 className="fw-bold mb-1">{stats.assignedJobCards?.length || 0}</h3>
                            <p className="text-muted small mb-0">Assigned Jobs (Wait Start)</p>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="card border-0 shadow-sm rounded-4 text-center p-4 h-100 bg-white hover-up text-warning">
                            <div className="bg-warning bg-opacity-10 text-warning rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                                <i className="bi bi-clock-history fs-3"></i>
                            </div>
                            <h3 className="fw-bold mb-1">{stats.inProgressJobCards?.length || 0}</h3>
                            <p className="text-muted small mb-0">Working In Progress</p>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="card border-0 shadow-sm rounded-4 text-center p-4 h-100 bg-white hover-up text-success">
                            <div className="bg-success bg-opacity-10 text-success rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                                <i className="bi bi-check-circle fs-3"></i>
                            </div>
                            <h3 className="fw-bold mb-1">{stats.completedJobCards || 0}</h3>
                            <p className="text-muted small mb-0">Jobs Completed</p>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
                    <div className="card-header bg-white p-0">
                        <div className="d-flex border-bottom">
                            <button
                                className={`flex-fill py-3 border-0 transition-all ${activeTab === 'jobcards' ? 'bg-light text-primary fw-bold border-bottom border-primary border-3' : 'bg-white text-muted'}`}
                                onClick={() => setActiveTab('jobcards')}
                            >
                                Active Job Cards ({stats.assignedJobCards?.length + stats.inProgressJobCards?.length || 0})
                            </button>
                            <button
                                className={`flex-fill py-3 border-0 transition-all ${activeTab === 'appointments' ? 'bg-light text-primary fw-bold border-bottom border-primary border-3' : 'bg-white text-muted'}`}
                                onClick={() => setActiveTab('appointments')}
                            >
                                Upcoming Appointments ({appointments.length})
                            </button>
                        </div>
                    </div>

                    <div className="card-body p-4">
                        {activeTab === 'appointments' ? (
                            appointments.length === 0 ? (
                                <div className="text-center py-5">
                                    <div className="text-muted opacity-50 mb-3 fs-1"><i className="bi bi-clipboard2-check"></i></div>
                                    <h5 className="text-muted">No upcoming appointments.</h5>
                                    <p className="small text-muted">You'll see them here once assigned by a Manager.</p>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle border-0">
                                        <thead className="table-light border-0">
                                            <tr>
                                                <th className="border-0 px-4">#</th>
                                                <th className="border-0">Customer</th>
                                                <th className="border-0">Vehicle</th>
                                                <th className="border-0">Problem</th>
                                                <th className="border-0">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {appointments.map(apt => (
                                                <tr key={apt.id}>
                                                    <td className="px-4 text-muted small">{apt.id}</td>
                                                    <td>
                                                        <div className="fw-bold">{apt.customerName}</div>
                                                        <div className="small text-muted">{apt.mobile}</div>
                                                    </td>
                                                    <td>
                                                        <div className="badge bg-secondary bg-opacity-10 text-secondary mb-1">{apt.brand}</div>
                                                        <div className="small fw-bold">{apt.model}</div>
                                                        <div className="small text-muted">{apt.licensePlate}</div>
                                                    </td>
                                                    <td className="small text-truncate" style={{ maxWidth: '200px' }}>
                                                        {apt.problemDescription}
                                                    </td>
                                                    <td>
                                                        {apt.status === 'APPROVED' && <span className="badge bg-info bg-opacity-10 text-info">Approved</span>}
                                                        {apt.status === 'IN_PROGRESS' && <span className="badge bg-warning bg-opacity-10 text-warning">In Progress</span>}
                                                        {apt.status === 'COMPLETED' && <span className="badge bg-success bg-opacity-10 text-success">Completed</span>}
                                                        {apt.status === 'PENDING' && <span className="badge bg-secondary bg-opacity-10 text-secondary">Pending</span>}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )
                        ) : (
                            /* Job Cards Tab */
                            <div className="row g-4">
                                {([...(stats.assignedJobCards || []), ...(stats.inProgressJobCards || [])]).length === 0 ? (
                                    <div className="text-center py-5 col-12">
                                        <div className="text-muted opacity-50 mb-3 fs-1"><i className="bi bi-tools"></i></div>
                                        <h5 className="text-muted">No active job cards.</h5>
                                        <p className="small text-muted">Convert an appointment to start a job.</p>
                                    </div>
                                ) : (
                                    ([...(stats.assignedJobCards || []), ...(stats.inProgressJobCards || [])]).map(jc => (
                                        <div className="col-md-6 col-lg-4" key={jc.id}>
                                            <div className="card border shadow-none rounded-4 h-100 overflow-hidden">
                                                <div className={`card-header border-0 d-flex justify-content-between align-items-center py-3 ${jc.status === 'IN_PROGRESS' ? 'bg-primary text-white' : 'bg-light text-dark'}`}>
                                                    <span className="small fw-bold">#{jc.id}</span>
                                                    <span className={`badge rounded-pill ${jc.status === 'IN_PROGRESS' ? 'bg-white text-primary' : 'bg-secondary text-white'}`}>
                                                        {jc.status}
                                                    </span>
                                                </div>
                                                <div className="card-body d-flex flex-column">
                                                    <div className="mb-3">
                                                        <h6 className="fw-bold mb-1">{jc.brand} {jc.model}</h6>
                                                        <div className="badge bg-light text-dark border">{jc.licensePlate}</div>
                                                    </div>

                                                    <div className="mb-3">
                                                        <small className="text-muted d-block fw-bold text-uppercase" style={{ fontSize: '0.7rem' }}>Customer</small>
                                                        <div className="fw-bold text-dark">{jc.customerName}</div>
                                                        <div className="small text-muted">{jc.customerPhone}</div>
                                                    </div>

                                                    <div className="mb-3">
                                                        <small className="text-muted d-block fw-bold text-uppercase" style={{ fontSize: '0.7rem' }}>Problem</small>
                                                        <p className="text-muted small mb-0">{jc.problemDescription}</p>
                                                    </div>

                                                    <div className="d-flex justify-content-between align-items-center pt-3 border-top mt-auto">
                                                        <span className="text-muted small">
                                                            <i className="bi bi-calendar-event me-1"></i> {jc.createdAt ? new Date(jc.createdAt).toLocaleDateString() : 'N/A'}
                                                        </span>
                                                        {jc.status === 'CREATED' && (
                                                            <button className="btn btn-outline-primary btn-sm rounded-pill px-3 fw-bold" onClick={() => handleStartWork(jc.id)}>
                                                                <i className="bi bi-play-fill me-1"></i> Start
                                                            </button>
                                                        )}
                                                        {jc.status === 'IN_PROGRESS' && (
                                                            <button className="btn btn-success btn-sm rounded-pill px-3 fw-bold" onClick={() => handleCompleteWork(jc.id)}>
                                                                <i className="bi bi-check-lg me-1"></i> Done
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                .hover-up { transition: transform 0.3s ease; }
                .hover-up:hover { transform: translateY(-5px); }
                .transition-all { transition: all 0.3s ease; }
            `}</style>
        </div>
    );
};

export default MechanicDashboard;
