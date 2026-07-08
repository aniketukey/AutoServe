import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
// import Navbar from '../components/Navbar';
import { useNavigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const CreateJobCard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [appointments, setAppointments] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);

    const [formData, setFormData] = useState({
        appointmentId: location.state?.appointmentId || '',
        mechanicId: '',
        laborCost: 0,
        notes: '',
        vehicleInfo: ''
    });

    const [selectedParts, setSelectedParts] = useState([]);
    const [currentPart, setCurrentPart] = useState({ inventoryId: '', quantity: 1 });

    useEffect(() => {
        const token = localStorage.getItem('token');
        let userId = null;
        let userRole = null;

        if (token) {
            try {
                const decoded = jwtDecode(token);
                userId = decoded.id || decoded.userId || decoded.sub;
                userRole = decoded.role || decoded.userRole;
                setCurrentUserId(userId);
            } catch (e) {
                console.error("Invalid token", e);
            }
        }

        let aptEndpoint = '/appointments';
        if (userRole === 'MANAGER' && userId) {
            aptEndpoint = `/appointments/manager/${userId}`;
        }

        Promise.all([
            apiFetch(aptEndpoint).then(res => res.json()),
            apiFetch('/inventory/available').then(res => res.json())
        ]).then(([aptData, invData]) => {
            // Filter only approved appointments (Backend requirement)
            const activeAppointments = aptData.filter(a => a.status === 'APPROVED');
            setAppointments(activeAppointments);
            setInventory(invData);

            // Pre-fill if appointmentId was passed in
            if (location.state?.appointmentId) {
                const selectedApt = activeAppointments.find(a => (a.id || a.appointmentId).toString() === location.state.appointmentId.toString());
                if (selectedApt) {
                    setFormData(prev => ({
                        ...prev,
                        mechanicId: selectedApt.mechanicId || '',
                        vehicleInfo: selectedApt.vehicleModel || selectedApt.model || `Vehicle #${selectedApt.vehicleId}`
                    }));
                }
            }

            setLoading(false);
        }).catch(err => {
            console.error('Error loading data:', err);
            setLoading(false);
        });
    }, []);

    const handleAppointmentChange = (e) => {
        const aptId = e.target.value;
        const apt = appointments.find(a => (a.id || a.appointmentId).toString() === aptId);
        setFormData({
            ...formData,
            appointmentId: aptId,
            mechanicId: apt?.mechanicId || '', // capture mechanic if available
            vehicleInfo: apt ? (apt.vehicleModel || apt.model || `Vehicle #${apt.vehicleId}`) : ''
        });
    };

    const handleAddPart = () => {
        if (!currentPart.inventoryId) return;

        const part = inventory.find(p => p.id.toString() === currentPart.inventoryId.toString());
        if (!part) return;

        const existingItem = selectedParts.find(p => p.inventoryId === currentPart.inventoryId);
        if (existingItem) {
            setSelectedParts(selectedParts.map(p =>
                p.inventoryId === currentPart.inventoryId
                    ? { ...p, quantity: p.quantity + parseInt(currentPart.quantity) }
                    : p
            ));
        } else {
            setSelectedParts([...selectedParts, {
                inventoryId: currentPart.inventoryId,
                name: part.itemName,
                price: part.currentPrice,
                quantity: parseInt(currentPart.quantity)
            }]);
        }
        setCurrentPart({ inventoryId: '', quantity: 1 });
    };

    const handleRemovePart = (id) => {
        setSelectedParts(selectedParts.filter(p => p.inventoryId !== id));
    };

    const calculateTotal = () => {
        const partsTotal = selectedParts.reduce((sum, part) => sum + (part.price * part.quantity), 0);
        return partsTotal + parseFloat(formData.laborCost || 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (submitting) return;

        if (!formData.appointmentId) {
            alert("Please select an appointment");
            return;
        }

        setSubmitting(true);

        const payload = {
            appointmentId: parseInt(formData.appointmentId, 10),
            managerId: parseInt(currentUserId, 10),
            mechanicId: formData.mechanicId ? parseInt(formData.mechanicId, 10) : null,
            parts: selectedParts.map(p => ({
                inventoryId: parseInt(p.inventoryId, 10),
                quantity: parseInt(p.quantity, 10)
            })),
            laborCost: parseFloat(formData.laborCost),
            totalCost: calculateTotal(),
            notes: formData.notes
        };

        console.log('Sending Job Card Payload:', payload);

        try {
            const response = await apiFetch('/job_cards', 'POST', payload);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to create Job Card');
            }
            alert('Job Card Created Successfully!');
            navigate('/manage-appointments');
        } catch (err) {
            alert('Error: ' + err.message);
            setSubmitting(false);
        }
    };

    if (loading) return <div className="text-center mt-5">Loading...</div>;

    return (
        <div className="min-vh-100 bg-light">

            <div className="container py-5">
                <div className="card shadow-lg mx-auto" style={{ maxWidth: '800px' }}>
                    <div className="card-header bg-primary text-white">
                        <h3 className="mb-0 fw-bold">Create New Job Card</h3>
                    </div>
                    <div className="card-body">
                        <form onSubmit={handleSubmit}>
                            {/* Appointment Selection */}
                            <div className="mb-4">
                                <label className="form-label fw-bold">Select Appointment</label>
                                <select
                                    className="form-select"
                                    value={formData.appointmentId}
                                    onChange={handleAppointmentChange}
                                    required
                                >
                                    <option value="">-- Choose Appointment --</option>
                                    {appointments.map(apt => (
                                        <option key={apt.id || apt.appointmentId} value={apt.id || apt.appointmentId}>
                                            #{apt.id || apt.appointmentId} - {apt.vehicleModel || apt.model || 'Vehicle'} - {new Date(apt.requestDate || apt.date).toLocaleDateString()}
                                        </option>
                                    ))}
                                </select>
                                {formData.vehicleInfo && (
                                    <div className="form-text text-primary">
                                        Selected Vehicle: <strong>{formData.vehicleInfo}</strong>
                                    </div>
                                )}
                            </div>

                            {/* Parts Section */}
                            <div className="mb-4 p-3 bg-light rounded border">
                                <h5 className="fw-bold mb-3">Add Parts</h5>
                                <div className="row g-2 align-items-end mb-3">
                                    <div className="col-md-6">
                                        <label className="small text-muted">Part Name</label>
                                        <select
                                            className="form-select form-select-sm"
                                            value={currentPart.inventoryId}
                                            onChange={(e) => setCurrentPart({ ...currentPart, inventoryId: e.target.value })}
                                        >
                                            <option value="">Select Part</option>
                                            {inventory.map(item => (
                                                <option key={item.id} value={item.id}>
                                                    {item.itemName} (₹{item.currentPrice}) - Stock: {item.stockQuantity}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-md-3">
                                        <label className="small text-muted">Qty</label>
                                        <input
                                            type="number"
                                            className="form-control form-control-sm"
                                            min="1"
                                            value={currentPart.quantity}
                                            onChange={(e) => setCurrentPart({ ...currentPart, quantity: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        <button type="button" className="btn btn-secondary btn-sm w-100" onClick={handleAddPart}>
                                            + Add
                                        </button>
                                    </div>
                                </div>

                                {/* Parts List Table */}
                                {selectedParts.length > 0 && (
                                    <table className="table table-sm table-bordered bg-white">
                                        <thead>
                                            <tr>
                                                <th>Part</th>
                                                <th>Price</th>
                                                <th>Qty</th>
                                                <th>Total</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedParts.map((part, idx) => (
                                                <tr key={idx}>
                                                    <td>{part.name}</td>
                                                    <td>₹{part.price}</td>
                                                    <td>{part.quantity}</td>
                                                    <td>₹{(part.price * part.quantity).toFixed(2)}</td>
                                                    <td>
                                                        <button type="button" className="btn btn-danger btn-sm py-0" onClick={() => handleRemovePart(part.inventoryId)}>&times;</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>

                            {/* Financials */}
                            <div className="row mb-4">
                                <div className="col-md-6">
                                    <label className="form-label fw-bold">Labor Cost (₹)</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        min="0"
                                        step="0.01"
                                        value={formData.laborCost}
                                        onChange={(e) => setFormData({ ...formData, laborCost: e.target.value })}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fw-bold">Total Job Cost</label>
                                    <div className="form-control bg-light fw-bold text-success display-6">
                                        ₹{calculateTotal().toFixed(2)}
                                    </div>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="form-label fw-bold">Technician Notes</label>
                                <textarea
                                    className="form-control"
                                    rows="3"
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Details of work done..."
                                ></textarea>
                            </div>

                            <div className="d-flex justify-content-between">
                                <button type="button" className="btn btn-outline-secondary" onClick={() => navigate(-1)} disabled={submitting}>Cancel</button>
                                <button type="submit" className="btn btn-primary fw-bold px-5" disabled={submitting}>
                                    {submitting ? 'Creating...' : 'Generate Job Card'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateJobCard;
