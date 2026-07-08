import React, { useState } from 'react';
import { apiFetch } from '../utils/api';
import { useNavigate } from 'react-router-dom';

const DEFAULT_PASSWORDS = {
    ADMIN: "Admin@123",
    MANAGER: "Manager@123",
    MECHANIC: "Mechanic@123"
};

const AddMembers = () => {
    const navigate = useNavigate();
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        salary: '',
        role: 'ADMIN' // Default role
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleStartCreate = (role) => {
        setFormData(prev => ({ ...prev, role: role }));
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            console.log('Creating new Member...');

            const payload = {
                userName: formData.name,
                email: formData.email,
                password: DEFAULT_PASSWORDS[formData.role], // Role-based default password
                userRole: formData.role,
                mobile: formData.phone,
                salary: parseFloat(formData.salary),
                isActive: true
            };

            const response = await apiFetch('/users', 'POST', payload);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to create member');
            }

            const data = await response.json();
            console.log('Member created:', data);
            alert(`New ${formData.role} created successfully!\nDefault Password: ${DEFAULT_PASSWORDS[formData.role]}`);

            setFormData({ ...formData, name: '', email: '', phone: '', salary: '' });
            setShowForm(false); // Go back to selection screen

        } catch (err) {
            console.error('Create Member Error:', err);
            alert(`Error creating member: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mt-5">
            {!showForm ? (
                // Selection View
                <div className="row justify-content-center">
                    <div className="col-md-10 col-lg-8">
                        <div className="text-center mb-5">
                            <h2 className="fw-bold display-6">Manage Staff Members</h2>
                            <p className="text-muted">Select an action to proceed</p>
                        </div>
                        <div className="row g-4 justify-content-center">
                            {/* Create Admin Card */}
                            <div className="col-md-6 col-lg-5">
                                <div className="card h-100 shadow-sm hover-shadow transition-all border-0 rounded-4" style={{ cursor: 'pointer' }} onClick={() => handleStartCreate('ADMIN')}>
                                    <div className="card-body p-4 text-center d-flex flex-column align-items-center justify-content-center bg-white rounded-4">
                                        <div className="bg-primary bg-opacity-10 p-4 rounded-circle mb-4 text-primary">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" className="bi bi-shield-lock-fill" viewBox="0 0 16 16">
                                                <path fillRule="evenodd" d="M8 0c-.69 0-1.843.265-2.928.56-1.11.3-2.229.655-2.887.87a1.54 1.54 0 0 0-1.044 1.262c-.596 4.477.787 7.795 2.465 9.99a11.8 11.8 0 0 0 2.517 2.453c.386.273.744.482 1.048.625.28.132.581.24.829.24s.548-.108.829-.24a7 7 0 0 0 1.048-.625 11.8 11.8 0 0 0 2.517-2.453c1.678-2.195 3.061-5.513 2.465-9.99a1.54 1.54 0 0 0-1.044-1.263 63 63 0 0 0-2.887-.87C9.843.266 8.69 0 8 0m0 5a1.5 1.5 0 0 1 .5 2.915l.385 1.99a.5.5 0 0 1-.491.595h-.788a.5.5 0 0 1-.49-.595l.384-1.99A1.5 1.5 0 0 1 8 5" />
                                            </svg>
                                        </div>
                                        <h4 className="fw-bold mb-2">Create New Admin</h4>
                                        <p className="text-muted small mb-0">Add a new administrator with full system access privileges.</p>
                                        <button className="btn btn-outline-primary rounded-pill mt-3 px-4 fw-bold">Select</button>
                                    </div>
                                </div>
                            </div>

                            {/* Create Manager Card */}
                            <div className="col-md-6 col-lg-5">
                                <div className="card h-100 shadow-sm hover-shadow transition-all border-0 rounded-4" style={{ cursor: 'pointer' }} onClick={() => handleStartCreate('MANAGER')}>
                                    <div className="card-body p-4 text-center d-flex flex-column align-items-center justify-content-center bg-white rounded-4">
                                        <div className="bg-success bg-opacity-10 p-4 rounded-circle mb-4 text-success">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" className="bi bi-person-fill-gear" viewBox="0 0 16 16">
                                                <path d="M11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0m-9 8c0 1 1 1 1 1h5.256A4.5 4.5 0 0 1 8 12.5a4.5 4.5 0 0 1 1.544-3.393C9.077 9.038 8.564 9 8 9c-5 0-6 3-6 4m9.886-3.54c.18-.613 1.048-.613 1.229 0l.043.148a.64.64 0 0 0 .921.382l.136-.074c.561-.306 1.175.308.87.869l-.075.136a.64.64 0 0 0 .382.92l.149.045c.612.18.612 1.048 0 1.229l-.15.043a.64.64 0 0 0-.38.921l.074.136c.305.561-.309 1.175-.87.87l-.136-.075a.64.64 0 0 0-.92.382l-.045.149c-.18.612-1.048.612-1.229 0l-.043-.15a.64.64 0 0 0-.921-.38l-.136.074c-.561.305-1.175-.309-.87-.87l.075-.136a.64.64 0 0 0-.382-.92l-.148-.045c-.613-.18-.613-1.048 0-1.229l.148-.043a.64.64 0 0 0 .382-.921l-.074-.136c-.306-.561.308-1.175.869-.87l.136.075a.64.64 0 0 0 .92-.382zM14 12.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0" />
                                            </svg>
                                        </div>
                                        <h4 className="fw-bold mb-2">Create New Manager</h4>
                                        <p className="text-muted small mb-0">Add a manager to oversee operations and appointments.</p>
                                        <button className="btn btn-outline-success rounded-pill mt-3 px-4 fw-bold">Select</button>
                                    </div>
                                </div>
                            </div>

                            {/* Create Mechanic Card */}
                            <div className="col-md-6 col-lg-5">
                                <div className="card h-100 shadow-sm hover-shadow transition-all border-0 rounded-4" style={{ cursor: 'pointer' }} onClick={() => handleStartCreate('MECHANIC')}>
                                    <div className="card-body p-4 text-center d-flex flex-column align-items-center justify-content-center bg-white rounded-4">
                                        <div className="bg-warning bg-opacity-10 p-4 rounded-circle mb-4 text-warning">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" className="bi bi-wrench-adjustable" viewBox="0 0 16 16">
                                                <path d="M16 4.5a4.492 4.492 0 0 1-1.703 3.526L13 5l2.959-1.11c.027.2.041.403.041.61Z" />
                                                <path d="M11.5 9c.653 0 1.273-.139 1.833-.39L12 5.5 11 3l3.826-1.53A4.5 4.5 0 0 0 7.29 6.092l-6.116 5.096a2.583 2.583 0 1 0 3.638 3.638L9.908 8.71A4.49 4.49 0 0 0 11.5 9m-1.292-4.361-.596.893.809-.27a.25.25 0 0 1 .287.377l-.596.893.809-.27.158.475-1.5.5a.25.25 0 0 1-.287-.376l.596-.893-.809.27a.25.25 0 0 1-.287-.377l.596-.893-.809.27-.158-.475 1.5-.5a.25.25 0 0 1 .287.376ZM3 14a1 1 0 1 1 0-2 1 1 0 0 1 0 2" />
                                            </svg>
                                        </div>
                                        <h4 className="fw-bold mb-2">Create New Mechanic</h4>
                                        <p className="text-muted small mb-0">Add a mechanic to perform vehicle services and repairs.</p>
                                        <button className="btn btn-outline-warning rounded-pill mt-3 px-4 fw-bold">Select</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="text-center mt-5">
                            <button className="btn btn-link text-muted text-decoration-none" onClick={() => navigate('/')}>
                                ← Back to Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                // Form View
                <div className="row justify-content-center">
                    <div className="col-md-8 col-lg-6">
                        <div className="card shadow-lg border-0 rounded-4">
                            <div className="card-header bg-primary bg-gradient text-white p-4 rounded-top-4 d-flex align-items-center">
                                <button type="button" className="btn btn-link text-white p-0 me-3" onClick={() => setShowForm(false)}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-arrow-left" viewBox="0 0 16 16">
                                        <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8" />
                                    </svg>
                                </button>
                                <h3 className="fw-bold mb-0">Create New {formData.role.charAt(0) + formData.role.slice(1).toLowerCase()}</h3>
                            </div>
                            <div className="card-body p-4 p-md-5">
                                <form onSubmit={handleSubmit}>
                                    <div className="mb-4">
                                        <label className="form-label fw-bold text-secondary text-uppercase small letter-spacing-1">Full Name</label>
                                        <input
                                            type="text"
                                            name="name"
                                            className="form-control form-control-lg bg-light border-0"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                            minLength={5}
                                            maxLength={20}
                                            placeholder="Enter full name"
                                        />
                                    </div>
                                    <div className="mb-4">
                                        <label className="form-label fw-bold text-secondary text-uppercase small letter-spacing-1">Email Address</label>
                                        <input
                                            type="email"
                                            name="email"
                                            className="form-control form-control-lg bg-light border-0"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            placeholder="name@example.com"
                                        />
                                    </div>
                                    <div className="row">
                                        <div className="col-md-6 mb-4">
                                            <label className="form-label fw-bold text-secondary text-uppercase small letter-spacing-1">Phone Number</label>
                                            <input
                                                type="text"
                                                name="phone"
                                                className="form-control form-control-lg bg-light border-0"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                required
                                                pattern="\d{10}"
                                                placeholder="10 digit number"
                                            />
                                        </div>
                                        <div className="col-md-6 mb-4">
                                            <label className="form-label fw-bold text-secondary text-uppercase small letter-spacing-1">Salary</label>
                                            <input
                                                type="number"
                                                name="salary"
                                                className="form-control form-control-lg bg-light border-0"
                                                value={formData.salary}
                                                onChange={handleChange}
                                                required
                                                min={1}
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>



                                    <div className="alert alert-info d-flex align-items-center mb-4" role="alert">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-info-circle-fill flex-shrink-0 me-2" viewBox="0 0 16 16">
                                            <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
                                        </svg>
                                        <div>
                                            Default Password: <strong>{DEFAULT_PASSWORDS[formData.role]}</strong> | Active: <strong>True</strong>
                                        </div>
                                    </div>

                                    <div className="d-grid gap-2">
                                        <button type="submit" className="btn btn-primary btn-lg fw-bold rounded-pill shadow-sm" disabled={loading}>
                                            {loading ? 'Creating...' : 'Create Member'}
                                        </button>
                                        <button type="button" className="btn btn-outline-secondary btn-lg fw-bold rounded-pill" onClick={() => setShowForm(false)}>
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AddMembers;
