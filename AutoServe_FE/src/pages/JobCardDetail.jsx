
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api';

const JobCardDetail = () => {
    const { appointmentId } = useParams();
    const navigate = useNavigate();
    const [jobCard, setJobCard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchJobCard = async () => {
            try {
                const response = await apiFetch(`/job_cards/appointment/${appointmentId}`);
                if (!response.ok) {
                    throw new Error('Failed to load job card details');
                }
                const data = await response.json();
                setJobCard(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (appointmentId) {
            fetchJobCard();
        }
    }, [appointmentId]);

    if (loading) return <div className="text-center mt-5"><div className="spinner-border text-primary"></div></div>;
    if (error) return <div className="alert alert-danger m-5">{error} <button className="btn btn-link" onClick={() => navigate(-1)}>Go Back</button></div>;
    if (!jobCard) return <div className="text-center mt-5">No Job Card found.</div>;

    return (
        <div className="container py-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fw-bold">Job Card Details</h2>
                <button className="btn btn-outline-secondary rounded-pill" onClick={() => navigate(-1)}>
                    &larr; Back
                </button>
            </div>

            <div className="card shadow border-0 rounded-4">
                <div className="card-header bg-white p-4 d-flex justify-content-between align-items-center">
                    <div>
                        <span className="text-muted small text-uppercase fw-bold">Job Card ID</span>
                        <h4 className="fw-bold mb-0">#{jobCard.id}</h4>
                    </div>
                    <div>
                        <span className={`badge rounded-pill px-3 py-2 ${jobCard.status === 'COMPLETED' ? 'bg-success' :
                                jobCard.status === 'IN_PROGRESS' ? 'bg-primary' : 'bg-secondary'
                            }`}>
                            {jobCard.status}
                        </span>
                    </div>
                </div>
                <div className="card-body p-4">
                    <div className="row g-4">
                        {/* Customer & Vehicle Info */}
                        <div className="col-md-6">
                            <h5 className="fw-bold text-primary mb-3">Customer & Vehicle</h5>
                            <ul className="list-group list-group-flush">
                                <li className="list-group-item d-flex justify-content-between px-0">
                                    <span className="text-muted">Customer Name</span>
                                    <span className="fw-bold">{jobCard.customerName}</span>
                                </li>
                                <li className="list-group-item d-flex justify-content-between px-0">
                                    <span className="text-muted">Phone</span>
                                    <span className="fw-bold">{jobCard.customerPhone}</span>
                                </li>
                                <li className="list-group-item d-flex justify-content-between px-0">
                                    <span className="text-muted">Vehicle</span>
                                    <span className="fw-bold">{jobCard.brand} {jobCard.model} ({jobCard.licensePlate})</span>
                                </li>
                                <li className="list-group-item d-flex justify-content-between px-0">
                                    <span className="text-muted">Mechanic</span>
                                    <span className="fw-bold">{jobCard.mechanicName}</span>
                                </li>
                            </ul>
                        </div>

                        {/* Financials */}
                        <div className="col-md-6">
                            <h5 className="fw-bold text-primary mb-3">Cost Summary</h5>
                            <ul className="list-group list-group-flush">
                                <li className="list-group-item d-flex justify-content-between px-0">
                                    <span className="text-muted">Labor Cost</span>
                                    <span className="fw-bold">₹{jobCard.laborCost?.toFixed(2) || '0.00'}</span>
                                </li>
                                <li className="list-group-item d-flex justify-content-between px-0">
                                    <span className="text-muted">Parts Cost</span>
                                    <span className="fw-bold">₹{(jobCard.totalAmount - (jobCard.laborCost || 0)).toFixed(2)}</span>
                                </li>
                                <li className="list-group-item d-flex justify-content-between px-0 bg-light rounded p-2 mt-2">
                                    <span className="fw-bold text-dark">Total Amount</span>
                                    <span className="fw-bold text-success fs-5">₹{jobCard.totalAmount?.toFixed(2)}</span>
                                </li>
                            </ul>
                        </div>

                        <div className="col-12">
                            <h5 className="fw-bold text-primary mb-3">Parts Used</h5>
                            {jobCard.items && jobCard.items.length > 0 ? (
                                <div className="table-responsive">
                                    <table className="table table-sm table-bordered">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Item Name</th>
                                                <th>Unit Price</th>
                                                <th>Qty</th>
                                                <th>Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {jobCard.items.map((item, idx) => (
                                                <tr key={idx}>
                                                    <td>{item.itemName}</td>
                                                    <td>₹{item.itemPrice}</td>
                                                    <td>{item.quantity}</td>
                                                    <td>₹{item.totalPrice}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-muted">No parts used.</p>
                            )}
                        </div>

                        {jobCard.cancellationReason && (
                            <div className="col-12 mt-3">
                                <div className="alert alert-danger">
                                    <strong>Cancellation Reason:</strong> {jobCard.cancellationReason}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                {jobCard.status === 'COMPLETED' && (
                    <div className="card-footer bg-white p-3 text-end">
                        <button className="btn btn-success fw-bold" onClick={() => navigate(`/invoice/${jobCard.id}`)}>
                            View Invoice
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default JobCardDetail;
