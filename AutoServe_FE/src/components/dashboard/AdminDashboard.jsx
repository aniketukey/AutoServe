import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { apiFetch } from '../../utils/api';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showUsers, setShowUsers] = useState(false);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [pendingRevenue, setPendingRevenue] = useState(0);
    const [paidCount, setPaidCount] = useState(0);
    const [pendingCount, setPendingCount] = useState(0);
    const [loadingRevenue, setLoadingRevenue] = useState(false);

    // Appointments State
    const [appointments, setAppointments] = useState([]);
    const [showAppointments, setShowAppointments] = useState(false);
    const [loadingAppointments, setLoadingAppointments] = useState(false);

    // Filtering State
    const [activeTab, setActiveTab] = useState('ALL');

    // Edit State
    const [editingUser, setEditingUser] = useState(null);
    const [editFormData, setEditFormData] = useState({
        name: '',
        email: '',
        role: '',
        phone: ''
    });

    // Manager Assignment state
    const [managers, setManagers] = useState([]);
    const [assigningApt, setAssigningApt] = useState(null);
    const [selectedManagerId, setSelectedManagerId] = useState('');
    const [isAssigning, setIsAssigning] = useState(false);

    React.useEffect(() => {
        fetchRevenue();
    }, []);

    const fetchRevenue = async () => {
        setLoadingRevenue(true);
        try {
            // Fetch total revenue (PAID)
            const resRev = await apiFetch('/job_cards/revenue/total');
            if (resRev.ok) {
                const data = await resRev.json();
                setTotalRevenue(data.totalRevenue || 0);
            }

            // Fetch pending revenue
            const resPendRev = await apiFetch('/invoices/stats/pending_revenue');
            if (resPendRev.ok) {
                const data = await resPendRev.json();
                setPendingRevenue(data || 0);
            }

            // Fetch paid count
            const resPaidCount = await apiFetch('/invoices/stats/paid_count');
            if (resPaidCount.ok) {
                const data = await resPaidCount.json();
                setPaidCount(data || 0);
            }

            // Fetch pending count
            const resPendCount = await apiFetch('/invoices/stats/pending_count');
            if (resPendCount.ok) {
                const data = await resPendCount.json();
                setPendingCount(data || 0);
            }
        } catch (err) {
            console.error('Error fetching revenue stats:', err);
        } finally {
            setLoadingRevenue(false);
        }
    };



    const fetchAppointments = async () => {
        setLoadingAppointments(true);
        try {
            // DEBUG: Check decoded token before request (Optional)
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const cleanToken = token.startsWith('Bearer ') ? token.substring(7) : token;
                    const decoded = jwtDecode(cleanToken);
                    console.log('Decoded Token:', decoded);
                } catch (e) { console.error('Token Decode Error', e) }
            }

            const response = await apiFetch('/appointments');

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to fetch appointments. Status: ${response.status}. Msg: ${errorText}`);
            }

            const data = await response.json();
            console.log('Fetched appointments:', data);

            // Sort appointments by date - most recent first
            const sortedData = data.sort((a, b) => {
                const dateA = a.requestDate || a.appointmentDate || a.date;
                const dateB = b.requestDate || b.appointmentDate || b.date;

                // Handle array format dates from Java
                const getDateValue = (dateVal) => {
                    if (Array.isArray(dateVal) && dateVal.length >= 3) {
                        return new Date(dateVal[0], dateVal[1] - 1, dateVal[2]);
                    }
                    return new Date(dateVal);
                };

                return getDateValue(dateB) - getDateValue(dateA); // Descending order
            });

            setAppointments(sortedData);
        } catch (err) {
            console.error(err);
            alert('Error fetching appointments: ' + err.message);
        } finally {
            setLoadingAppointments(false);
        }
    };

    const handleViewAppointments = () => {
        if (!showAppointments) {
            fetchAppointments();
            setShowUsers(false); // Close user list to avoid clutter
        }
        setShowAppointments(!showAppointments);
    };

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiFetch('/users/getUsers');

            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }

            const data = await response.json();
            console.log('Fetched users:', data);
            setUsers(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchManagers = async () => {
        try {
            const response = await apiFetch('/users/managers');
            if (response.ok) {
                const data = await response.json();
                setManagers(data);
            }
        } catch (err) {
            console.error('Error fetching managers:', err);
        }
    };

    const handleOpenAssignModal = (apt) => {
        setAssigningApt(apt);
        fetchManagers();
    };

    const handleAssignManager = async () => {
        if (!selectedManagerId) {
            alert('Please select a manager');
            return;
        }

        setIsAssigning(true);
        try {
            const aptId = assigningApt.id || assigningApt.appointmentId;
            const response = await apiFetch(`/appointments/${aptId}/assign-manager/${selectedManagerId}`, 'PUT');

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to assign manager');
            }

            alert('Manager assigned successfully!');
            setAssigningApt(null);
            setSelectedManagerId('');
            fetchAppointments(); // Refresh list to show assigned manager
        } catch (err) {
            alert('Error: ' + err.message);
        } finally {
            setIsAssigning(false);
        }
    };

    const handleManageUsers = () => {
        if (!showUsers) {
            fetchUsers();
            setShowAppointments(false); // Close appointments to avoid clutter
        }
        setShowUsers(!showUsers);
    };

    const getRole = (user) => {
        return user.role || user.userRole || (Array.isArray(user.roles) ? user.roles.map(r => r.name || r).join(', ') : 'N/A');
    };

    // Filter Logic
    const filteredUsers = users.filter(user => {
        if (activeTab === 'ALL') return true;
        if (activeTab === 'INACTIVE') return user.isActive === false;
        const role = getRole(user).toUpperCase();
        return role.includes(activeTab);
    });

    // Edit Handlers
    const handleEditClick = (user) => {
        setEditingUser(user);
        setEditFormData({
            name: user.name || user.userName || '',
            email: user.email || '',
            role: getRole(user),
            phone: user.phone || user.mobile || ''
        });
    };

    const handleEditChange = (e) => {
        setEditFormData({
            ...editFormData,
            [e.target.name]: e.target.value
        });
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        const userId = editingUser.userId || editingUser.id;

        // Construct payload to match backend UpdateUserDto exactly
        const payload = {
            userName: editFormData.name,
            userRole: editFormData.role,
            mobile: editFormData.phone,
            // email is NOT in UpdateUserDto, so we exclude it
            // Add default values for other DTO fields if needed or let backend handles nulls
            isActive: true
        };

        console.log('Attempting to update user:', userId);
        console.log('Update Payload:', payload);

        if (!userId) {
            alert('Error: User ID is missing. Cannot update.');
            return;
        }

        try {
            let token = localStorage.getItem('token');
            if (token && token.startsWith('Bearer ')) {
                token = token.substring(7);
            }

            const response = await fetch(`http://localhost:8081/api/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const responseText = await response.text();
            console.log('Update Response:', responseText);

            if (!response.ok) {
                throw new Error(responseText || 'Failed to update user');
            }

            alert('User updated successfully!');
            setEditingUser(null);
            fetchUsers(); // Refresh list
        } catch (err) {
            alert('Error updating user: ' + err.message);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await apiFetch(`/users/${userId}`, 'DELETE');

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to delete user');
            }

            alert('User deleted successfully!');
            fetchUsers(); // Refresh the user list
        } catch (err) {
            alert('Error deleting user: ' + err.message);
        }
    };


    const handleUpdateStatus = async (appointmentId, newStatus) => {
        if (!window.confirm(`Are you sure you want to ${newStatus.toLowerCase()} this appointment?`)) {
            return;
        }

        let rejectionReason = null;
        if (newStatus === 'REJECTED') {
            rejectionReason = window.prompt("Please enter a reason for rejection (required):");
            if (!rejectionReason || rejectionReason.trim() === "") {
                alert("Rejection reason is required!");
                return;
            }
        }

        try {
            const action = newStatus === 'APPROVED' ? 'approve' : 'reject';
            const endpoint = `/appointments/${appointmentId}/${action}`;

            console.log(`Sending update request to: ${endpoint}`);

            const payload = {
                status: newStatus,
                rejectionReason: rejectionReason
            };

            const response = await apiFetch(endpoint, 'PUT', payload);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `Failed to update status to ${newStatus}`);
            }

            console.log(`Appointment ${appointmentId} updated to ${newStatus}`);

            // Update local state
            setAppointments(prev => prev.map(apt =>
                (apt.id === appointmentId || apt.appointmentId === appointmentId)
                    ? { ...apt, status: newStatus }
                    : apt
            ));

        } catch (err) {
            console.error('Update Status Error:', err);
            alert(`Error updating status: ${err.message}`);
        }
    };



    return (
        <div className="container" >
            <h3 className="fw-bold mb-4">Admin Dashboard</h3>

            <div className="row mb-4">
                <div className="col-md-4 mb-4">
                    <div className="card shadow border-0 h-100 overflow-hidden hover-card bg-primary bg-gradient text-white" style={{ borderRadius: '1rem', transition: 'transform 0.2s' }}>
                        <div className="card-body p-4 d-flex flex-column justify-content-between">
                            <div className="d-flex justify-content-between align-items-start">
                                <div>
                                    <h6 className="text-uppercase fw-bold mb-1" style={{ opacity: 0.8 }}>Total Revenue</h6>
                                    <h2 className="fw-bold mb-0">
                                        {loadingRevenue ? (
                                            <span className="spinner-border spinner-border-sm"></span>
                                        ) : (
                                            `₹${totalRevenue.toLocaleString()}`
                                        )}
                                    </h2>
                                </div>
                                <div className="bg-white bg-opacity-25 rounded-circle p-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-currency-rupee" viewBox="0 0 16 16">
                                        <path d="M4 3.06h2.726c1.22 0 2.12.575 2.325 1.724H4v1.051h5.051C8.81 6.987 8.002 7.55 6.739 7.55H4v1.05h3.042l4.123 4.407h1.445l-4.104-4.388c1.55-.101 2.656-.93 3.018-2.12H12v-1.05h-2.914c-.116-1.503-1.31-2.457-3.321-2.457H4z" />
                                    </svg>
                                </div>
                            </div>

                            <div className="mt-2 row g-2">
                                <div className="col-6">
                                    <div className="bg-white bg-opacity-10 rounded p-2">
                                        <p className="small mb-0 opacity-75">Paid Invoices</p>
                                        <p className="fw-bold mb-0">{paidCount}</p>
                                    </div>
                                </div>
                                <div className="col-6">
                                    <div className="bg-white bg-opacity-10 rounded p-2">
                                        <p className="small mb-0 opacity-75">Owed (Pending)</p>
                                        <p className="fw-bold mb-0">₹{pendingRevenue.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-3 d-flex justify-content-between align-items-center">
                                <button className="btn btn-sm btn-light rounded-pill fw-bold" onClick={fetchRevenue}>Refresh Stats</button>
                                <span className="small opacity-75">{pendingCount} pending bills</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-md-4 mb-4">
                    <div className="card shadow border-0 h-100 overflow-hidden hover-card" style={{ borderRadius: '1rem', transition: 'transform 0.2s' }}>
                        <div className="card-body p-0 d-flex flex-column h-100">
                            <div className="bg-info bg-gradient text-white p-3 d-flex align-items-center justify-content-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" className="bi bi-people-fill" viewBox="0 0 16 16">
                                    <path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6m-5.784 6A2.238 2.238 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.325 6.325 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1zM4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5" />
                                </svg>
                            </div>
                            <div className="p-3 flex-grow-1 d-flex flex-column justify-content-between">
                                <div>
                                    <h6 className="card-title fw-bold text-info mb-1">Users</h6>
                                    <p className="small text-muted mb-2">Control access & roles.</p>
                                </div>
                                <button
                                    className={`btn btn-sm ${showUsers ? 'btn-outline-info' : 'btn-info'} rounded-pill w-100 fw-bold border-0`}
                                    onClick={handleManageUsers}
                                    style={showUsers ? {} : { color: 'white' }}
                                >
                                    {showUsers ? 'Hide' : 'Manage'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-md-4 mb-4">
                    <div className="card shadow border-0 h-100 overflow-hidden hover-card" style={{ borderRadius: '1rem', transition: 'transform 0.2s' }}>
                        <div className="card-body p-0 d-flex flex-column h-100">
                            <div className="bg-success bg-gradient text-white p-3 d-flex align-items-center justify-content-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" className="bi bi-calendar-check-fill" viewBox="0 0 16 16">
                                    <path d="M4 .5a.5.5 0 0 0-1 0V1H2a2 2 0 0 0-2 2v1h16V3a2 2 0 0 0-2-2h-1V.5a.5.5 0 0 0-1 0V1H4zM16 14V5H0v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2m-5.146-5.146-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 0 1 .708-.708L7.5 10.793l2.646-2.647a.5.5 0 0 1 .708.708" />
                                </svg>
                            </div>
                            <div className="p-3 flex-grow-1 d-flex flex-column justify-content-between">
                                <div>
                                    <h6 className="card-title fw-bold text-success mb-1">Appointments</h6>
                                    <p className="small text-muted mb-2">Track all scheduled jobs.</p>
                                </div>
                                <button
                                    className={`btn btn-sm ${showAppointments ? 'btn-outline-success' : 'btn-success'} rounded-pill w-100 fw-bold`}
                                    onClick={handleViewAppointments}
                                >
                                    {showAppointments ? 'Hide' : 'View'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            {
                showUsers && (
                    <div className="card shadow-sm border-0">
                        <div className="card-header bg-white fw-bold d-flex justify-content-between align-items-center">
                            <span>User List</span>
                            <div className="d-flex gap-2">

                                <button className="btn btn-outline-secondary btn-sm rounded-pill" onClick={fetchUsers}>Refresh</button>
                            </div>
                        </div>

                        {/* Role Filter Tabs */}
                        <div className="card-body border-bottom p-0">
                            <ul className="nav nav-tabs px-3 pt-2">
                                {['ALL', 'CUSTOMER', 'MECHANIC', 'MANAGER', 'ADMIN', 'INACTIVE'].map(role => (
                                    <li className="nav-item" key={role}>
                                        <button
                                            className={`nav-link ${activeTab === role ? 'active fw-bold' : ''}`}
                                            onClick={() => setActiveTab(role)}
                                        >
                                            {role}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="card-body p-0">
                            {loading ? (
                                <div className="text-center py-4">Loading users...</div>
                            ) : error ? (
                                <div className="alert alert-danger m-3">{error}</div>
                            ) : filteredUsers.length > 0 ? (
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Name</th>
                                                <th>Email</th>
                                                <th>Role</th>
                                                <th>Mobile</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredUsers.map(user => (
                                                <tr key={user.userId || user.id}>
                                                    <td className="fw-bold">{user.name || user.userName}</td>
                                                    <td>{user.email}</td>
                                                    <td>
                                                        <span className="badge bg-info text-dark">
                                                            {getRole(user)}
                                                        </span>
                                                    </td>
                                                    <td>{user.phone || user.mobile}</td>
                                                    <td>
                                                        <div className="d-flex gap-2">
                                                            <button
                                                                className="btn btn-sm btn-outline-primary rounded-pill"
                                                                onClick={() => handleEditClick(user)}
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                className="btn btn-sm btn-outline-danger rounded-pill"
                                                                onClick={() => handleDeleteUser(user.userId || user.id)}
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-4 text-muted">No users found for {activeTab}.</div>
                            )}
                        </div>
                    </div>
                )
            }

            {
                showAppointments && (
                    <div className="card shadow-sm border-0 mt-4">
                        <div className="card-header bg-white fw-bold d-flex justify-content-between align-items-center">
                            <span className="text-success">Appointment List</span>
                            <button className="btn btn-outline-secondary btn-sm rounded-pill" onClick={fetchAppointments}>Refresh</button>
                        </div>
                        <div className="card-body p-0">
                            {loadingAppointments ? (
                                <div className="text-center py-4">Loading appointments...</div>
                            ) : appointments.length > 0 ? (
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Date</th>
                                                <th>Vehicle</th>
                                                <th>Service Type</th>
                                                <th>Status</th>
                                                <th>Mechanic</th>
                                                <th>Manager</th>
                                                <th>Service Description</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {appointments.map(apt => {
                                                const desc = apt.description || '';
                                                // Relaxed regex to allow leading whitespace
                                                const match = desc.match(/^\s*\[([^\]]*)\]([\s\S]*)$/);

                                                // Usage: match[1] is type. We display full description in notes col as requested.
                                                const displayType = apt.serviceType || (match ? match[1].trim() : 'General Service');

                                                // User confirmed field is "problemDescription"
                                                const rawDesc = apt.problemDescription || apt.description || apt.notes || '';
                                                // Extract text outside brackets if present
                                                const noteMatch = rawDesc.match(/[\])]\s*([\s\S]*)$/);
                                                // If match found, use captured group 1, otherwise use full string. 
                                                // Using regex to look for closing bracket ']' and capturing everything after it.
                                                // Alternatively: rawDesc.replace(/^\[.*?\]\s*/, '') might be safer/simpler?
                                                // Let's stick to the match logic I used before but simpler:
                                                const displayNotes = noteMatch ? noteMatch[1].trim() : rawDesc;

                                                // Try multiple fields for vehicle model
                                                const vehicleDisplay = apt.vehicleModel || apt.model || apt.vehicleName || (apt.vehicleId ? `Vehicle #${apt.vehicleId}` : 'N/A');

                                                // Date Parsing Logic
                                                const rawDate = apt.requestDate || apt.appointmentDate || apt.date;
                                                let displayDate = 'Invalid Date';

                                                if (rawDate) {
                                                    if (Array.isArray(rawDate)) {
                                                        // Handle Java LocalDateTime array [year, month, day, hour, minute]
                                                        // Note: Month is 1-indexed in Java array usually, but Date expects 0-indexed? 
                                                        // Actually standard JSON array from Java is [yyyy, mm, dd]. Let's try to construct it.
                                                        // JS Date((monthIndex)) is 0-11. Java usually sends 1-12.
                                                        if (rawDate.length >= 3) {
                                                            const dateObj = new Date(rawDate[0], rawDate[1] - 1, rawDate[2]);
                                                            displayDate = dateObj.toLocaleDateString();
                                                        }
                                                    } else {
                                                        // Standard string or timestamp
                                                        const dateObj = new Date(rawDate);
                                                        if (!isNaN(dateObj)) {
                                                            displayDate = dateObj.toLocaleDateString();
                                                        }
                                                    }
                                                }

                                                return (
                                                    <tr key={apt.id || apt.appointmentId}>
                                                        <td>{displayDate}</td>
                                                        <td className="fw-bold text-dark">{vehicleDisplay}</td>
                                                        <td>{displayType}</td>
                                                        <td>
                                                            <span className={`badge ${(apt.status === 'COMPLETED' || apt.status === 'APPROVED') ? 'bg-success' :
                                                                (apt.status === 'PENDING') ? 'bg-warning text-dark' :
                                                                    'bg-secondary'
                                                                }`}>
                                                                {apt.status || 'Pending'}
                                                            </span>
                                                        </td>
                                                        <td>{apt.mechanicName || <span className="text-muted small">Unassigned</span>}</td>
                                                        <td>
                                                            {apt.managerName ? (
                                                                <span className="fw-bold text-primary">{apt.managerName}</span>
                                                            ) : (
                                                                <span className="text-muted small">Not Assigned</span>
                                                            )}
                                                        </td>
                                                        <td className="small text-muted">{displayNotes || 'No notes'}</td>
                                                        <td>
                                                            {apt.status === 'PENDING' && (
                                                                <div className="d-flex gap-2">
                                                                    <button
                                                                        className="btn btn-sm btn-success rounded-pill"
                                                                        onClick={() => handleUpdateStatus(apt.id || apt.appointmentId, 'APPROVED')}
                                                                    >
                                                                        Approve
                                                                    </button>
                                                                    <button
                                                                        className="btn btn-sm btn-danger rounded-pill"
                                                                        onClick={() => handleUpdateStatus(apt.id || apt.appointmentId, 'REJECTED')}
                                                                    >
                                                                        Reject
                                                                    </button>
                                                                </div>
                                                            )}
                                                            {apt.status === 'APPROVED' && !apt.managerId && (
                                                                <button
                                                                    className="btn btn-sm btn-primary rounded-pill mt-1"
                                                                    onClick={() => handleOpenAssignModal(apt)}
                                                                >
                                                                    Assign Manager
                                                                </button>
                                                            )}
                                                            {apt.managerId && (
                                                                <button
                                                                    className="btn btn-sm btn-outline-primary rounded-pill mt-1"
                                                                    onClick={() => handleOpenAssignModal(apt)}
                                                                >
                                                                    Reassign
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-4 text-muted">No appointments found.</div>
                            )}
                        </div>
                    </div>
                )
            }

            {/* Edit User Modal Overlay */}

            {/* Edit User Modal Overlay */}
            {
                editingUser && (
                    <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                        <div className="card shadow-lg" style={{ width: '400px' }}>
                            <div className="card-header bg-white fw-bold d-flex justify-content-between align-items-center">
                                <span>Edit User</span>
                                <button className="btn-close" onClick={() => setEditingUser(null)}></button>
                            </div>
                            <div className="card-body">
                                <form onSubmit={handleUpdateUser}>
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold">Name</label>
                                        <input
                                            type="text"
                                            name="name"
                                            className="form-control"
                                            value={editFormData.name}
                                            onChange={handleEditChange}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold">Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            className="form-control"
                                            value={editFormData.email}
                                            onChange={handleEditChange}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold">Phone</label>
                                        <input
                                            type="text"
                                            name="phone"
                                            className="form-control"
                                            value={editFormData.phone}
                                            onChange={handleEditChange}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold">Role</label>
                                        <select
                                            name="role"
                                            className="form-select"
                                            value={editFormData.role}
                                            onChange={handleEditChange}
                                        >
                                            <option value="CUSTOMER">CUSTOMER</option>
                                            <option value="MECHANIC">MECHANIC</option>
                                            <option value="MANAGER">MANAGER</option>
                                            <option value="ADMIN">ADMIN</option>
                                        </select>
                                    </div>
                                    <div className="d-grid gap-2">
                                        <button type="submit" className="btn btn-primary rounded-pill">Save Changes</button>
                                        <button type="button" className="btn btn-light rounded-pill" onClick={() => setEditingUser(null)}>Cancel</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Assign Manager Modal */}
            {assigningApt && (
                <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
                    <div className="card shadow-lg" style={{ width: '450px' }}>
                        <div className="card-header bg-primary text-white fw-bold d-flex justify-content-between align-items-center">
                            <span>Assign Manager to Appointment #{assigningApt.id || assigningApt.appointmentId}</span>
                            <button className="btn-close btn-close-white" onClick={() => setAssigningApt(null)}></button>
                        </div>
                        <div className="card-body p-4">
                            <p className="text-muted small mb-3">
                                Select a manager to oversee the service for <strong>{assigningApt.licensePlate || 'this vehicle'}</strong>.
                            </p>

                            <div className="mb-4">
                                <label className="form-label fw-bold small">Available Managers</label>
                                <select
                                    className="form-select form-select-lg"
                                    value={selectedManagerId}
                                    onChange={(e) => setSelectedManagerId(e.target.value)}
                                >
                                    <option value="">-- Choose Manager --</option>
                                    {managers.map(m => (
                                        <option key={m.id || m.userId} value={m.id || m.userId}>
                                            {m.name || m.userName} ({m.email})
                                        </option>
                                    ))}
                                </select>
                                {managers.length === 0 && (
                                    <small className="text-danger mt-1 d-block">No managers found in the system.</small>
                                )}
                            </div>

                            <div className="d-grid gap-2">
                                <button
                                    className="btn btn-primary rounded-pill fw-bold"
                                    onClick={handleAssignManager}
                                    disabled={isAssigning || !selectedManagerId}
                                >
                                    {isAssigning ? 'Assigning...' : 'Confirm Assignment'}
                                </button>
                                <button
                                    className="btn btn-light rounded-pill"
                                    onClick={() => setAssigningApt(null)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}


        </div>
    );
};

export default AdminDashboard;
