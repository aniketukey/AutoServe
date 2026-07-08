import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api';

const InvoiceDetail = () => {
    const { id } = useParams(); // invoice id
    const navigate = useNavigate();
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchInvoice();
    }, [id]);

    const fetchInvoice = async () => {
        setLoading(true);
        try {
            const res = await apiFetch(`/invoices/${id}`);
            if (res.ok) {
                const data = await res.json();
                setInvoice(data);
            } else {
                throw new Error('Failed to fetch invoice');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        try {
            const res = await apiFetch(`/invoices/${id}/download`);
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `invoice_${invoice.invoiceNumber}.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
            } else {
                alert('Failed to download invoice');
            }
        } catch (err) {
            alert('Error downloading invoice: ' + err.message);
        }
    };

    const handleSimulatedPayment = async () => {
        setProcessing(true);
        try {
            const res = await apiFetch(`/invoices/${id}/simulate_payment`, 'POST');
            if (res.ok) {
                alert('Payment Simulated Successfully!');
                fetchInvoice();
            } else {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Simulation failed');
            }
        } catch (err) {
            alert(err.message);
        } finally {
            setProcessing(false);
        }
    };

    const handlePayment = async () => {
        setProcessing(true);
        try {
            // 1. Create Order on Backend
            const res = await apiFetch(`/invoices/${id}/create_payment_order`, 'POST');
            if (!res.ok) throw new Error('Failed to create payment order');
            const orderData = await res.json();

            // Try to load Razorpay if not present
            if (!window.Razorpay) {
                if (window.confirm("Razorpay script is blocked by your browser/network (SSL Error). \n\nClick OK to simulate a successful payment for development purposes.")) {
                    await handleSimulatedPayment();
                } else {
                    setProcessing(false);
                }
                return;
            }

            // 2. Configure Razorpay
            const options = {
                key: orderData.razorpayKey,
                amount: orderData.amount * 100,
                currency: orderData.currency,
                name: "AutoServe",
                description: `Service Payment - ${orderData.invoiceNumber}`,
                order_id: orderData.orderId,
                handler: async function (response) {
                    // 3. Verify Payment on Backend
                    const verifyPayload = {
                        razorpayOrderId: response.razorpay_order_id,
                        razorpayPaymentId: response.razorpay_payment_id,
                        razorpaySignature: response.razorpay_signature,
                        paymentMethod: 'ONLINE' // You could detect card/upi etc if needed
                    };

                    const verifyRes = await apiFetch(`/invoices/${id}/verify_payment`, 'POST', verifyPayload);
                    if (verifyRes.ok) {
                        alert('Payment Successful!');
                        fetchInvoice();
                    } else {
                        alert('Payment verification failed. Please contact support.');
                    }
                },
                prefill: {
                    name: orderData.customerName,
                    email: orderData.customerEmail,
                    contact: orderData.customerPhone
                },
                theme: {
                    color: "#198754"
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
                alert('Payment Failed: ' + response.error.description);
            });
            rzp.open();

        } catch (err) {
            alert(err.message);
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <div className="container py-5 text-center"><div className="spinner-border"></div></div>;
    if (error) return <div className="container py-5"><div className="alert alert-danger">{error}</div></div>;
    if (!invoice) return null;

    return (
        <div className="container py-5">
            <div className="row justify-content-center">
                <div className="col-lg-8">
                    <div className="card shadow-lg border-0 overflow-hidden" style={{ borderRadius: '20px' }}>
                        <div className="bg-dark text-white p-4 d-flex justify-content-between align-items-center">
                            <div>
                                <h2 className="fw-bold mb-0">INVOICE</h2>
                                <p className="mb-0 small text-light opacity-75">#{invoice.invoiceNumber}</p>
                            </div>
                            <div className="text-end d-flex align-items-center">
                                {invoice.paymentStatus === 'PAID' && (
                                    <button
                                        className="btn btn-outline-light btn-sm me-3 border-0 d-flex align-items-center"
                                        onClick={handleDownload}
                                        title="Download PDF"
                                    >
                                        <span className="me-1">Download PDF</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                            <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z" />
                                            <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z" />
                                        </svg>
                                    </button>
                                )}
                                <div>
                                    <h4 className="fw-bold mb-0">AutoServe</h4>
                                    <p className="mb-0 small text-light opacity-75">Service Center Management</p>
                                </div>
                            </div>
                        </div>

                        <div className="card-body p-4 p-md-5">
                            <div className="row mb-5">
                                <div className="col-md-6 mb-4 mb-md-0">
                                    <h6 className="text-muted text-uppercase fw-bold small mb-3">Bill To:</h6>
                                    <h5 className="fw-bold mb-1">{invoice.customerName}</h5>
                                    <p className="text-muted mb-1">{invoice.customerEmail}</p>
                                    <p className="text-muted mb-0">{invoice.customerPhone}</p>
                                </div>
                                <div className="col-md-6 text-md-end">
                                    <h6 className="text-muted text-uppercase fw-bold small mb-3">Vehicle Details:</h6>
                                    <h5 className="fw-bold mb-1">{invoice.vehicleBrand} {invoice.vehicleModel}</h5>
                                    <p className="text-muted mb-0">Reg: {invoice.vehicleRegistration}</p>
                                    <p className="badge bg-success bg-opacity-10 text-success mt-2">
                                        Status: {invoice.paymentStatus}
                                    </p>
                                </div>
                            </div>

                            <div className="table-responsive mb-4">
                                <table className="table table-borderless">
                                    <thead className="border-bottom">
                                        <tr>
                                            <th className="px-0">Description</th>
                                            <th className="text-center">Qty</th>
                                            <th className="text-end px-0">Unit Price</th>
                                            <th className="text-end px-0">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {invoice.items.map((item, idx) => (
                                            <tr key={idx} className="border-bottom">
                                                <td className="px-0 py-3">
                                                    <div className="fw-bold">{item.itemName}</div>
                                                </td>
                                                <td className="text-center py-3">{item.quantity}</td>
                                                <td className="text-end py-3">₹{item.itemPrice.toLocaleString()}</td>
                                                <td className="text-end px-0 py-3">₹{item.totalPrice.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                        <tr className="border-bottom">
                                            <td className="px-0 py-3 fw-bold">Labor Charges</td>
                                            <td></td>
                                            <td></td>
                                            <td className="text-end px-0 py-3">₹{invoice.laborCost?.toLocaleString()}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div className="row justify-content-end">
                                <div className="col-md-5">
                                    <div className="d-flex justify-content-between mb-2">
                                        <span className="text-muted">Parts Total:</span>
                                        <span className="fw-bold">₹{invoice.baseAmount.toLocaleString()}</span>
                                    </div>
                                    <div className="d-flex justify-content-between mb-2">
                                        <span className="text-muted">Labor Charges:</span>
                                        <span className="fw-bold">₹{invoice.laborCost?.toLocaleString()}</span>
                                    </div>
                                    <div className="d-flex justify-content-between mb-2 border-top pt-2 mt-2">
                                        <span className="text-muted fw-bold">Subtotal (Before Tax):</span>
                                        <span className="fw-bold">₹{(invoice.baseAmount + (invoice.laborCost || 0)).toLocaleString()}</span>
                                    </div>
                                    <div className="d-flex justify-content-between mb-2">
                                        <span className="text-muted">Tax ({invoice.taxPercentage}%):</span>
                                        <span className="fw-bold">₹{invoice.taxAmount.toLocaleString()}</span>
                                    </div>
                                    <div className="d-flex justify-content-between border-top pt-2 mt-2">
                                        <h5 className="fw-bold">Total Amount:</h5>
                                        <h5 className="fw-bold text-success">₹{invoice.totalAmount.toLocaleString()}</h5>
                                    </div>
                                </div>
                            </div>

                            {invoice.paymentStatus !== 'PAID' && (
                                <div className="mt-5 text-center">
                                    <button
                                        className="btn btn-success btn-lg rounded-pill px-5 fw-bold shadow-sm"
                                        onClick={handlePayment}
                                        disabled={processing}
                                    >
                                        {processing ? 'Processing...' : 'Pay with Razorpay'}
                                    </button>
                                    <p className="text-muted small mt-3">Secure payment powered by Razorpay</p>
                                </div>
                            )}

                            {invoice.paymentStatus === 'PAID' && (
                                <div className="mt-5 text-center alert alert-success py-4" style={{ borderRadius: '15px' }}>
                                    <div className="display-4 mb-2">✅</div>
                                    <h4 className="fw-bold text-success mb-1">Invoice Paid</h4>
                                    <p className="mb-3">Payment processed via {invoice.paymentMethod} on {new Date(invoice.paidAt).toLocaleString()}</p>
                                    <button
                                        className="btn btn-success btn-lg rounded-pill px-4 fw-bold shadow-sm"
                                        onClick={handleDownload}
                                    >
                                        Download Invoice PDF
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="card-footer bg-light border-0 p-4 text-center">
                            <p className="text-muted small mb-0">Generated by AutoServe Management System. Thank you for your business!</p>
                        </div>
                    </div>

                    <div className="text-center mt-4">
                        <button className="btn btn-link text-dark" onClick={() => navigate(-1)}>
                            &larr; Back to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoiceDetail;
