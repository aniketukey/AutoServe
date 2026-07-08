import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../utils/api';

const CustomerDashboard = ({ vehicles, appointments, userId, onRefresh }) => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('garage');
    const [jobCards, setJobCards] = useState([]);

    // Booking State
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [bookingData, setBookingData] = useState({
        date: '',
        serviceType: 'General Service',
        notes: ''
    });
    const [isBookingLoading, setIsBookingLoading] = useState(false);

    // Add Vehicle State
    const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
    const [vehicleData, setVehicleData] = useState({
        brand: '',
        model: '',
        color: '',
        licensePlate: ''
    });

    // Rating State
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [ratingJobId, setRatingJobId] = useState(null);
    const [ratingData, setRatingData] = useState({
        rating: 5,
        feedback: ''
    });

    const fetchJobCards = async () => {
        if (!userId) return;
        try {
            const res = await apiFetch(`/job_cards/customer/${userId}`);
            if (res.ok) {
                const data = await res.json();
                setJobCards(data);
            }
        } catch (err) {
            console.error("Error fetching job cards:", err);
        }
    };

    React.useEffect(() => {
        fetchJobCards();
    }, [userId]);

    const handleRefresh = () => {
        onRefresh();
        fetchJobCards();
    };

    // --- Booking Handlers ---
    const handleBookClick = (vehicle) => {
        setSelectedVehicle(vehicle);
        setBookingData({ ...bookingData, date: '', notes: '' });
        setShowBookingModal(true);
    };

    const handleBookingChange = (e) => {
        setBookingData({ ...bookingData, [e.target.name]: e.target.value });
    };

    const handleBookingSubmit = async (e) => {
        e.preventDefault();
        if (!selectedVehicle) return;

        const appointmentDto = {
            vehicleId: selectedVehicle.id || selectedVehicle.vehicleId,
            requestDate: bookingData.date,
            description: `[${bookingData.serviceType}] ${bookingData.notes}`,
            rsa: false,
            customerPhotoUrl: null,
            rsaCoordinates: null
        };

        const formData = new FormData();
        // Append the DTO as a JSON blob for @RequestPart
        formData.append('appointment', new Blob([JSON.stringify(appointmentDto)], { type: 'application/json' }));


        try {
            setIsBookingLoading(true);
            console.log('Sending Booking FormData');
            // apiFetch needs to handle FormData (usually by not setting Content-Type)
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8081/api';
            const response = await fetch(`${baseUrl}/appointments`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || 'Booking failed');
            }
            alert('Appointment booked successfully!');
            setShowBookingModal(false);
            if (onRefresh) onRefresh();
        } catch (err) {
            console.error('Booking Error:', err);
            alert('Error booking appointment: ' + err.message);
        } finally {
            setIsBookingLoading(false);
        }
    };

    // --- Add Vehicle Handlers ---
    const handleVehicleChange = (e) => {
        setVehicleData({ ...vehicleData, [e.target.name]: e.target.value });
    };

    const handleVehicleSubmit = async (e) => {
        e.preventDefault();

        if (!userId) {
            alert('User ID missing. Please relogin.');
            return;
        }

        const payload = {
            brand: vehicleData.brand,
            model: vehicleData.model,
            color: vehicleData.color,
            licensePlate: vehicleData.licensePlate,
            customerId: userId
        };

        try {
            console.log('Adding Vehicle Payload:', payload);
            const response = await apiFetch('/vehicles', 'POST', payload);

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || 'Failed to add vehicle');
            }

            alert('Vehicle added successfully!');
            setShowAddVehicleModal(false);
            setVehicleData({ brand: '', model: '', color: '', licensePlate: '' }); // Reset form
            if (onRefresh) onRefresh(); // Refresh the list
        } catch (err) {
            console.error('Add Vehicle Error:', err);
            alert('Error adding vehicle: ' + err.message);
        }
    };

    const handleRatingClick = (jobId, existingRating, existingFeedback) => {
        setRatingJobId(jobId);
        setRatingData({
            rating: existingRating || 5,
            feedback: existingFeedback || ''
        });
        setShowRatingModal(true);
    };

    const handleRatingSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await apiFetch(`/job_cards/${ratingJobId}/rate`, 'PUT', ratingData);
            if (res.ok) {
                alert('Thank you for your feedback!');
                setShowRatingModal(false);
                fetchJobCards();
            } else {
                const text = await res.text();
                throw new Error(text || 'Failed to submit rating');
            }
        } catch (err) {
            alert(err.message);
        }
    };

    const handleViewInvoice = async (jobCardId) => {
        try {
            const res = await apiFetch(`/invoices/job_card/${jobCardId}`);
            if (res.ok) {
                const data = await res.json();
                navigate(`/invoice/${data.id}`);
            } else {
                alert('Invoice not generated yet. Please contact the service manager.');
            }
        } catch (err) {
            alert('Error checking invoice status');
        }
    };

    const formatDescription = (desc) => {
        if (!desc) return <span className="text-muted">Service</span>;

        const match = desc.match(/^\[(.*?)\]\s*([\s\S]*)$/);
        if (match) {
            return (
                <div>
                    <div className="fw-bold text-dark">{match[1]}</div>
                    {match[2] && <div className="small text-muted">{match[2]}</div>}
                </div>
            );
        }
        return desc;
    };

    return (
        <div className="container pb-5">
            {/* Tab Navigation */}
            <ul className="nav nav-pills nav-fill mb-4 p-1 bg-white rounded-pill shadow-sm" style={{ border: '1px solid #eee' }}>
                <li className="nav-item">
                    <button
                        className={`nav-link rounded-pill fw-bold ${activeTab === 'garage' ? 'active bg-dark text-white' : 'text-dark'}`}
                        onClick={() => setActiveTab('garage')}
                    >
                        My Garage
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        className={`nav-link rounded-pill fw-bold ${activeTab === 'active' ? 'active bg-dark text-white' : 'text-dark'}`}
                        onClick={() => setActiveTab('active')}
                    >
                        Active Services {(jobCards.filter(j => j.status !== 'COMPLETED' && j.status !== 'CANCELLED').length + appointments.filter(a => (a.status === 'PENDING' || a.status === 'APPROVED') && !jobCards.some(j => j.appointmentId === a.id)).length > 0) && <span className="badge bg-danger ms-1">!</span>}
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        className={`nav-link rounded-pill fw-bold ${activeTab === 'history' ? 'active bg-dark text-white' : 'text-dark'}`}
                        onClick={() => setActiveTab('history')}
                    >
                        Service History
                    </button>
                </li>
            </ul>

            {/* TAB: GARAGE */}
            {activeTab === 'garage' && (
                <div>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h4 className="fw-bold m-0 text-dark">Vehicles</h4>
                        <button
                            className="btn btn-dark btn-sm rounded-pill px-4 shadow-sm"
                            onClick={() => setShowAddVehicleModal(true)}
                        >
                            + Add New
                        </button>
                    </div>

                    {vehicles.length > 0 ? (
                        <div className="table-responsive bg-white rounded shadow-sm">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>Brand</th>
                                        <th>Model</th>
                                        <th>Color</th>
                                        <th>Plate Number</th>
                                        <th className="text-end">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {vehicles.map((car, index) => (
                                        <tr key={car.id || car.vehicleId || index}>
                                            <td className="fw-bold">{car.brand || car.make || 'N/A'}</td>
                                            <td>{car.model}</td>
                                            <td>{car.color || 'N/A'}</td>
                                            <td>{car.licensePlate}</td>
                                            <td className="text-end">
                                                <button
                                                    className="btn btn-sm btn-primary rounded-pill px-3 fw-bold"
                                                    onClick={() => handleBookClick(car)}
                                                >
                                                    Book Service
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="alert alert-secondary text-center py-5 border-0 shadow-sm" style={{ borderRadius: '15px' }}>
                            <div className="display-6 text-muted mb-2">🚗</div>
                            <h5 className="text-muted">No vehicles found in your garage.</h5>
                            <button className="btn btn-outline-dark btn-sm rounded-pill mt-3" onClick={() => setShowAddVehicleModal(true)}>Register Your First Vehicle</button>
                        </div>
                    )}

                    {/* Pending Appointments in Garage Tab */}
                    <div className="d-flex justify-content-between align-items-center mb-4 mt-5">
                        <h4 className="fw-bold m-0 text-dark">Recent Requests</h4>
                        <button className="btn btn-outline-secondary btn-sm rounded-pill px-3" onClick={handleRefresh}>↻ Refresh</button>
                    </div>

                    {appointments && appointments.length > 0 ? (
                        <div className="table-responsive bg-white rounded shadow-sm">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>Date</th>
                                        <th>Vehicle</th>
                                        <th>Service Type</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...appointments]
                                        .sort((a, b) => (b.id || 0) - (a.id || 0))
                                        .slice(0, 10).map(apt => {
                                            const rawDesc = apt.description || apt.problemDescription || apt.serviceType || '';
                                            const match = rawDesc.match(/^\s*\[([^\]]*)\]([\s\S]*)$/);
                                            const displayType = match ? match[1].trim() : (apt.serviceType || 'General Service');

                                            return (
                                                <tr key={apt.id || apt.appointmentId}>
                                                    <td className="fw-bold small">{new Date(apt.requestDate || apt.appointmentDate || apt.date).toLocaleDateString()}</td>
                                                    <td>{vehicles.find(v => (v.id || v.vehicleId) === apt.vehicleId)?.model || `Vehicle #${apt.vehicleId}`}</td>
                                                    <td>{displayType}</td>
                                                    <td>
                                                        <span className={`badge rounded-pill ${(apt.status === 'APPROVED' || apt.status === 'COMPLETED') ? 'bg-success' : (apt.status === 'REJECTED') ? 'bg-danger' : 'bg-warning text-dark'}`}>
                                                            {apt.status || 'PENDING'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="alert alert-info text-center border-0 shadow-sm">No recent requests.</div>
                    )}
                </div>
            )}

            {/* TAB: ACTIVE SERVICES (Live Tracker) */}
            {activeTab === 'active' && (
                <div>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h4 className="fw-bold m-0 text-dark">Service Tracker</h4>
                        <button className="btn btn-outline-secondary btn-sm rounded-pill px-3" onClick={handleRefresh}>↻ Update Status</button>
                    </div>

                    {/* Show Appointments that are not yet Job Cards */}
                    {appointments && appointments.filter(a => (a.status === 'PENDING' || a.status === 'APPROVED') && !jobCards.some(j => j.appointmentId === a.id)).map(apt => {
                        const rawDesc = apt.description || apt.problemDescription || apt.serviceType || '';
                        const match = rawDesc.match(/^\s*\[([^\]]*)\]([\s\S]*)$/);
                        const displayType = match ? match[1].trim() : (apt.serviceType || 'General Service');

                        return (
                            <div key={`apt-${apt.id}`} className="col-12 mb-4">
                                <div className="card border-0 shadow-sm bg-light" style={{ borderRadius: '15px' }}>
                                    <div className="card-body p-4">
                                        <div className="d-flex justify-content-between align-items-start">
                                            <div>
                                                <h5 className="fw-bold mb-1 text-muted">{vehicles.find(v => (v.id || v.vehicleId) === apt.vehicleId)?.brand} {vehicles.find(v => (v.id || v.vehicleId) === apt.vehicleId)?.model}</h5>
                                                <div className="badge bg-warning text-dark rounded-pill mb-2">{displayType}</div>
                                                <p className="text-muted small mb-0">
                                                    Status: <span className="fw-bold text-primary">{apt.status}</span> | Requested for: {new Date(apt.requestDate || apt.appointmentDate).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="text-end">
                                                <div className="spinner-grow spinner-grow-sm text-primary me-2" role="status"></div>
                                                <span className="small text-primary fw-bold">Wait for Manager</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {jobCards.filter(j => j.status !== 'COMPLETED' && j.status !== 'CANCELLED').length > 0 ? (
                        <div className="row">
                            {jobCards
                                .filter(j => j.status !== 'COMPLETED' && j.status !== 'CANCELLED')
                                .sort((a, b) => (b.id || 0) - (a.id || 0))
                                .map(job => (
                                    <div key={job.id} className="col-12 mb-4">
                                        <div className="card border-0 shadow-sm" style={{ borderRadius: '15px', overflow: 'hidden' }}>
                                            <div className="card-body p-4">
                                                <div className="d-flex justify-content-between align-items-start mb-4">
                                                    <div>
                                                        <h5 className="fw-bold mb-1">{job.brand} {job.model}</h5>
                                                        <p className="text-muted small mb-0">
                                                            <span className="fw-bold text-dark">{job.licensePlate}</span> | {job.problemDescription}
                                                        </p>
                                                    </div>
                                                    <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-pill px-3 py-2 text-uppercase fw-bold" style={{ fontSize: '0.7rem' }}>
                                                        {job.status.replace('_', ' ')}
                                                    </span>
                                                </div>

                                                {/* Progress Tracker */}
                                                <div className="position-relative mb-5 px-2">
                                                    <div className="progress" style={{ height: '6px', borderRadius: '3px' }}>
                                                        <div
                                                            className={`progress-bar progress-bar-striped progress-bar-animated ${job.status === 'COMPLETED' ? 'bg-success' : 'bg-primary'}`}
                                                            role="progressbar"
                                                            style={{ width: job.status === 'CREATED' ? '33.33%' : job.status === 'IN_PROGRESS' ? '66.66%' : '100%' }}
                                                        ></div>
                                                    </div>

                                                    {/* Steps Icons */}
                                                    <div className="d-flex justify-content-between position-absolute w-100 start-0" style={{ top: '-12px' }}>
                                                        <div className="text-center" style={{ width: '40px' }}>
                                                            <div className={`rounded-circle bg-white shadow-sm border mx-auto mb-1 d-flex align-items-center justify-content-center ${['CREATED', 'IN_PROGRESS', 'COMPLETED'].includes(job.status) ? 'border-primary text-primary' : 'text-muted'}`} style={{ width: '30px', height: '30px' }}>
                                                                <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z" /><path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1z" /></svg>
                                                            </div>
                                                            <span className="small fw-bold d-block" style={{ fontSize: '0.65rem' }}>ASSIGNED</span>
                                                        </div>
                                                        <div className="text-center" style={{ width: '40px' }}>
                                                            <div className={`rounded-circle bg-white shadow-sm border mx-auto mb-1 d-flex align-items-center justify-content-center ${['IN_PROGRESS', 'COMPLETED'].includes(job.status) ? 'border-primary text-primary' : 'text-muted'}`} style={{ width: '30px', height: '30px' }}>
                                                                <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.17.311c.586.465.586 1.341 0 1.806l-.17.311c-.699 1.282.705 2.686 1.987 1.987l.311-.17a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.311.17c1.282.699 2.686-.705 1.987-1.987l-.17-.311a1.464 1.464 0 0 1 0-1.806l.17-.311c.699-1.282-.705-2.686-1.987-1.987l-.311.17a1.464 1.464 0 0 1-2.105-.872l-.1-.34z" /></svg>
                                                            </div>
                                                            <span className="small fw-bold d-block" style={{ fontSize: '0.65rem' }}>WORKING</span>
                                                        </div>
                                                        <div className="text-center" style={{ width: '40px' }}>
                                                            <div className={`rounded-circle bg-white shadow-sm border mx-auto mb-1 d-flex align-items-center justify-content-center ${job.status === 'COMPLETED' ? 'border-success text-success' : 'text-muted'}`} style={{ width: '30px', height: '30px' }}>
                                                                <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.447a.02.02 0 0 1 .02-.022z" /></svg>
                                                            </div>
                                                            <span className="small fw-bold d-block" style={{ fontSize: '0.65rem' }}>READY</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="d-flex justify-content-between align-items-center pt-3 border-top mt-2">
                                                    <div className="text-muted small">
                                                        <span className="me-3"><strong>Mechanic:</strong> {job.mechanicName || 'Searching...'}</span>
                                                        {job.estimatedCompletionDate && <span><strong>Estimated:</strong> {new Date(job.estimatedCompletionDate).toLocaleDateString()}</span>}
                                                    </div>
                                                    <button className="btn btn-outline-dark btn-sm rounded-pill px-3">View Details</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    ) : (
                        <div className="alert alert-light text-center py-5 border shadow-sm" style={{ borderRadius: '15px' }}>
                            <h5 className="text-muted mb-0">No active service at the moment.</h5>
                        </div>
                    )}
                </div>
            )}

            {/* TAB: HISTORY */}
            {activeTab === 'history' && (
                <div>
                    <h4 className="fw-bold mb-4 text-dark">Completed Service History</h4>

                    {jobCards.filter(j => j.status === 'COMPLETED').length > 0 ? (
                        <div className="table-responsive bg-white rounded shadow-sm">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>Date</th>
                                        <th>Vehicle</th>
                                        <th>Service Details</th>
                                        <th>Total Bill</th>
                                        <th>Feedback</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {jobCards
                                        .filter(j => j.status === 'COMPLETED')
                                        .sort((a, b) => (b.id || 0) - (a.id || 0))
                                        .map(job => (
                                            <tr key={job.id}>
                                                <td className="small fw-bold">{new Date(job.completionTime || job.updatedAt).toLocaleDateString()}</td>
                                                <td className="fw-bold">{job.brand} {job.model}</td>
                                                <td className="small text-muted">{job.problemDescription}</td>
                                                <td className="fw-bold">₹{job.totalAmount?.toLocaleString()}</td>
                                                <td>
                                                    <div className="d-flex flex-column gap-2">
                                                        {job.customerRating ? (
                                                            <div className="text-warning small text-center">
                                                                {[...Array(5)].map((_, i) => (
                                                                    <span key={i} style={{ fontSize: '1.2rem' }}>{i < job.customerRating ? '★' : '☆'}</span>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <button className="btn btn-sm btn-outline-primary rounded-pill px-3 fw-bold" onClick={() => handleRatingClick(job.id)}>
                                                                Rate
                                                            </button>
                                                        )}
                                                        <button className="btn btn-sm btn-dark rounded-pill px-3 fw-bold" onClick={() => handleViewInvoice(job.id)}>
                                                            View Bill
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="alert alert-light text-center py-5 border shadow-sm">
                            <h5 className="text-muted mb-0">No past service records found.</h5>
                        </div>
                    )}
                </div>
            )}

            {/* Booking Modal */}
            {showBookingModal && (
                <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                    <div className="card shadow-lg border-0" style={{ width: '450px', borderRadius: '20px' }}>
                        <div className="card-header bg-white border-0 pt-4 px-4 fw-bold d-flex justify-content-between align-items-center">
                            <h5 className="fw-bold m-0">Book Service</h5>
                            <button className="btn-close" onClick={() => setShowBookingModal(false)}></button>
                        </div>
                        <div className="px-4 pb-2 text-muted small">Vehicle: {selectedVehicle?.brand} {selectedVehicle?.model} ({selectedVehicle?.licensePlate})</div>
                        <div className="card-body p-4">
                            <form onSubmit={handleBookingSubmit}>
                                <div className="mb-3">
                                    <label className="form-label small fw-bold">Preferred Date</label>
                                    <input
                                        type="date"
                                        name="date"
                                        className="form-control rounded-pill"
                                        required
                                        min={new Date().toISOString().split('T')[0]}
                                        value={bookingData.date}
                                        onChange={handleBookingChange}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label small fw-bold">Service Type</label>
                                    <select
                                        name="serviceType"
                                        className="form-select rounded-pill"
                                        value={bookingData.serviceType}
                                        onChange={handleBookingChange}
                                    >
                                        <option value="General Service">General Service</option>
                                        <option value="Oil Change">Oil Change</option>
                                        <option value="Break Repair">Break Repair</option>
                                        <option value="Body Wash">Body Wash & Polish</option>
                                        <option value="Wheel Alignment">Wheel Alignment</option>
                                    </select>
                                </div>
                                <div className="mb-4">
                                    <label className="form-label small fw-bold">Describe Any Issues</label>
                                    <textarea
                                        name="notes"
                                        className="form-control"
                                        rows="3"
                                        placeholder="Ex: Strange noise from left engine side..."
                                        style={{ borderRadius: '15px' }}
                                        value={bookingData.notes}
                                        onChange={handleBookingChange}
                                    ></textarea>
                                </div>

                                <div className="d-grid gap-2">
                                    <button
                                        type="submit"
                                        className="btn btn-primary rounded-pill py-2 fw-bold shadow-sm"
                                        disabled={isBookingLoading}
                                    >
                                        {isBookingLoading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                Processing...
                                            </>
                                        ) : 'Confirm Booking'}
                                    </button>
                                    <button type="button" className="btn btn-light rounded-pill py-2" onClick={() => setShowBookingModal(false)}>Cancel</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Vehicle Modal */}
            {showAddVehicleModal && (
                <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                    <div className="card shadow-lg border-0" style={{ width: '450px', borderRadius: '20px' }}>
                        <div className="card-header bg-white border-0 pt-4 px-4 fw-bold d-flex justify-content-between align-items-center">
                            <h5 className="fw-bold m-0">Add New Vehicle</h5>
                            <button className="btn-close" onClick={() => setShowAddVehicleModal(false)}></button>
                        </div>
                        <div className="card-body p-4">
                            <form onSubmit={handleVehicleSubmit}>
                                <div className="mb-3">
                                    <label className="form-label small fw-bold">Brand</label>
                                    <input
                                        type="text"
                                        name="brand"
                                        className="form-control rounded-pill"
                                        placeholder="Toyota, Honda, etc."
                                        required
                                        value={vehicleData.brand}
                                        onChange={handleVehicleChange}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label small fw-bold">Model</label>
                                    <input
                                        type="text"
                                        name="model"
                                        className="form-control rounded-pill"
                                        placeholder="Camry, Civic, etc."
                                        required
                                        value={vehicleData.model}
                                        onChange={handleVehicleChange}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label small fw-bold">Color</label>
                                    <input
                                        type="text"
                                        name="color"
                                        className="form-control rounded-pill"
                                        placeholder="Red, Black, Silver..."
                                        required
                                        value={vehicleData.color}
                                        onChange={handleVehicleChange}
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="form-label small fw-bold">License Plate</label>
                                    <input
                                        type="text"
                                        name="licensePlate"
                                        className="form-control rounded-pill"
                                        placeholder="ABC-1234"
                                        required
                                        value={vehicleData.licensePlate}
                                        onChange={handleVehicleChange}
                                    />
                                </div>
                                <div className="d-grid gap-2">
                                    <button type="submit" className="btn btn-dark rounded-pill py-2 fw-bold shadow-sm">Save Vehicle</button>
                                    <button type="button" className="btn btn-light rounded-pill py-2" onClick={() => setShowAddVehicleModal(false)}>Cancel</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Rating Modal */}
            {showRatingModal && (
                <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                    <div className="card shadow-lg border-0" style={{ width: '400px', borderRadius: '20px' }}>
                        <div className="card-header bg-white border-0 pt-4 px-4 text-center">
                            <h5 className="fw-bold m-0">How was your service?</h5>
                        </div>
                        <div className="card-body p-4">
                            <form onSubmit={handleRatingSubmit}>
                                <div className="text-center mb-4">
                                    <div className="d-flex justify-content-center gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <span
                                                key={star}
                                                style={{ cursor: 'pointer', fontSize: '2rem', color: star <= ratingData.rating ? '#ffc107' : '#e4e5e9' }}
                                                onClick={() => setRatingData({ ...ratingData, rating: star })}
                                            >
                                                ★
                                            </span>
                                        ))}
                                    </div>
                                    <p className="small text-muted mt-2">Click to rate your experience</p>
                                </div>
                                <div className="mb-4">
                                    <label className="form-label small fw-bold">Additional Comments</label>
                                    <textarea
                                        className="form-control"
                                        rows="3"
                                        placeholder="Tell us what you liked or what we can improve..."
                                        style={{ borderRadius: '15px' }}
                                        value={ratingData.feedback}
                                        onChange={(e) => setRatingData({ ...ratingData, feedback: e.target.value })}
                                    ></textarea>
                                </div>
                                <div className="d-grid gap-2">
                                    <button type="submit" className="btn btn-primary rounded-pill py-2 fw-bold shadow-sm">Submit Feedback</button>
                                    <button type="button" className="btn btn-light rounded-pill py-2" onClick={() => setShowRatingModal(false)}>Cancel</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerDashboard;
