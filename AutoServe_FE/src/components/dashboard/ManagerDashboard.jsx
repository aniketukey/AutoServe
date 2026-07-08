import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../utils/api';

const ManagerDashboard = () => {
    const navigate = useNavigate(); // Hook
    const [appointments, setAppointments] = useState([]);
    const [showAppointments, setShowAppointments] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('DASHBOARD'); // DASHBOARD, INVENTORY
    const [lowStockItems, setLowStockItems] = useState([]);

    const fetchAppointments = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiFetch('/appointments');

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to fetch appointments');
            }

            const data = await response.json();
            console.log('Fetched appointments:', data);
            setAppointments(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Inventory State
    const [inventory, setInventory] = useState([]);
    const [showInventory, setShowInventory] = useState(false);
    const [loadingInventory, setLoadingInventory] = useState(false);
    const [inventoryError, setInventoryError] = useState(null);
    const [inventoryFilter, setInventoryFilter] = useState('ALL');
    const [searchKeyword, setSearchKeyword] = useState('');



    // Initial Load
    React.useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.userId) {
            fetchLowStock(user.userId);
        }
    }, []);

    const fetchLowStock = async () => {
        try {
            const res = await apiFetch('/inventory/low_stock');
            if (res.ok) {
                const data = await res.json();
                setLowStockItems(data);
            }
        } catch (e) { console.error(e); }
    };



    // Trigger fetch when filter changes
    React.useEffect(() => {
        if (activeTab === 'INVENTORY') {
            fetchInventory();
        }
    }, [inventoryFilter, activeTab]);

    const fetchInventory = async () => {
        setLoadingInventory(true);
        setInventoryError(null);
        try {
            let endpoint = '/inventory';

            // Prioritize search if keyword exists
            if (searchKeyword.trim()) {
                endpoint = `/inventory/search?keyword=${encodeURIComponent(searchKeyword)}`;
            } else {
                // Otherwise use filters
                switch (inventoryFilter) {
                    case 'AVAILABLE': endpoint = '/inventory/available'; break;
                    case 'LOW_STOCK': endpoint = '/inventory/low_stock'; break;
                    case 'OUT_OF_STOCK': endpoint = '/inventory/out_of_stock'; break;
                    default: endpoint = '/inventory';
                }
            }

            const response = await apiFetch(endpoint);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to fetch inventory');
            }

            const data = await response.json();
            console.log(`Fetched inventory (${endpoint}):`, data);
            setInventory(data);
        } catch (err) {
            setInventoryError(err.message);
        } finally {
            setLoadingInventory(false);
        }
    };

    const handleViewInventory = () => {
        setActiveTab('INVENTORY');
    };

    // Add Item State
    const [showAddItemModal, setShowAddItemModal] = useState(false);
    const [newItem, setNewItem] = useState({
        itemName: '',
        skuCode: '',
        currentPrice: '',
        stockQuantity: '',
        description: ''
    });

    const handleAddItemChange = (e) => {
        setNewItem({ ...newItem, [e.target.name]: e.target.value });
    };

    const handleAddItemSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...newItem,
                currentPrice: parseFloat(newItem.currentPrice),
                stockQuantity: parseInt(newItem.stockQuantity)
            };

            const response = await apiFetch('/inventory', 'POST', payload);
            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || 'Failed to create item');
            }

            alert('Item added successfully!');
            setShowAddItemModal(false);
            setNewItem({ itemName: '', skuCode: '', currentPrice: '', stockQuantity: '', description: '' });
            fetchInventory(); // Refresh list
        } catch (err) {
            alert('Error adding item: ' + err.message);
        }
    };

    // Delete Item
    const handleDeleteItem = async (itemId) => {
        if (!window.confirm('Are you sure you want to delete this item?')) return;
        try {
            const res = await apiFetch(`/inventory/${itemId}`, 'DELETE');
            if (res.ok) {
                alert('Item deleted successfully!');
                fetchInventory();
            } else {
                throw new Error('Failed to delete item');
            }
        } catch (err) {
            alert(err.message);
        }
    };

    // Edit Item State
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const handleEditClick = (item) => {
        setEditingItem({ ...item });
        setShowEditModal(true);
    };

    const handleEditChange = (e) => {
        setEditingItem({ ...editingItem, [e.target.name]: e.target.value });
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...editingItem,
                currentPrice: parseFloat(editingItem.currentPrice),
                stockQuantity: parseInt(editingItem.stockQuantity)
            };

            const response = await apiFetch(`/inventory/${editingItem.id}`, 'PUT', payload);
            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || 'Failed to update item');
            }

            alert('Item updated successfully!');
            setShowEditModal(false);
            fetchInventory();
        } catch (err) {
            alert('Error updating item: ' + err.message);
        }
    };

    const handleGenerateInvoice = async (jobCardId) => {
        try {
            // Check if invoice exists
            const checkRes = await apiFetch(`/invoices/job_card/${jobCardId}`);
            if (checkRes.ok) {
                const invoice = await checkRes.json();
                navigate(`/invoice/${invoice.id}`);
                return;
            }

            // Generate new invoice
            const res = await apiFetch(`/invoices/generate/job_card/${jobCardId}`, 'POST');
            if (res.ok) {
                const data = await res.json();
                alert('Invoice generated successfully!');
                navigate(`/invoice/${data.id}`);
            } else {
                const text = await res.text();
                alert('Failed to generate invoice: ' + text);
            }
        } catch (err) {
            alert('Error processing invoice');
        }
    };

    return (
        <div className="container py-4">
            {/* Low Stock Banner */}
            {lowStockItems.length > 0 && activeTab === 'DASHBOARD' && (
                <div className="alert alert-warning border-0 shadow-sm d-flex align-items-center mb-4" style={{ borderRadius: '1rem' }}>
                    <div className="bg-warning text-dark rounded-circle p-2 me-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-exclamation-triangle-fill" viewBox="0 0 16 16">
                            <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
                        </svg>
                    </div>
                    <div>
                        <span className="fw-bold">Inventory Alert:</span> {lowStockItems.length} items are running low on stock.
                        <button className="btn btn-sm btn-link text-dark fw-bold p-0 ms-2" onClick={() => setActiveTab('INVENTORY')}>Restock Now →</button>
                    </div>
                </div>
            )}

            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="fw-bold mb-0">Manager Dashboard</h3>
                <div className="nav nav-pills bg-light p-1 rounded-pill shadow-sm">
                    <button className={`nav-link rounded-pill px-4 ${activeTab === 'DASHBOARD' ? 'active bg-dark text-white' : 'text-dark fw-bold'}`} onClick={() => setActiveTab('DASHBOARD')}>Home</button>
                    <button className={`nav-link rounded-pill px-4 ${activeTab === 'INVENTORY' ? 'active bg-dark text-white' : 'text-dark fw-bold'}`} onClick={() => setActiveTab('INVENTORY')}>Inventory</button>
                </div>
            </div>

            {activeTab === 'DASHBOARD' && (
                <div className="row mb-4">
                    <div className="col-md-6 mb-3">
                        <div className="card shadow border-0 h-100 overflow-hidden hover-card" style={{ borderRadius: '1rem', transition: 'transform 0.2s' }}>
                            <div className="card-body p-0 d-flex flex-column">
                                <div className="bg-success bg-gradient text-white p-4 d-flex align-items-center justify-content-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="currentColor" className="bi bi-calendar-check-fill" viewBox="0 0 16 16">
                                        <path d="M4 .5a.5.5 0 0 0-1 0V1H2a2 2 0 0 0-2 2v1h16V3a2 2 0 0 0-2-2h-1V.5a.5.5 0 0 0-1 0V1H4zM16 14V5H0v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2m-5.146-5.146-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 0 1 .708-.708L7.5 10.793l2.646-2.647a.5.5 0 0 1 .708.708" />
                                    </svg>
                                </div>
                                <div className="p-4 flex-grow-1 d-flex flex-column justify-content-between">
                                    <div>
                                        <h5 className="card-title fw-bold text-success mb-2">Appointments</h5>
                                        <p className="card-text text-muted mb-3">Manage upcoming service appointments.</p>
                                    </div>
                                    <button
                                        className="btn btn-success rounded-pill w-100 fw-bold"
                                        onClick={() => navigate('/manage-appointments')}
                                    >
                                        Manage
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-6 mb-3">
                        <div className="card shadow border-0 h-100 overflow-hidden hover-card" style={{ borderRadius: '1rem', transition: 'transform 0.2s' }}>
                            <div className="card-body p-0 d-flex flex-column">
                                <div className="bg-primary bg-gradient text-white p-4 d-flex align-items-center justify-content-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="currentColor" className="bi bi-box-seam-fill" viewBox="0 0 16 16">
                                        <path fillRule="evenodd" d="M15.528 2.973a.75.75 0 0 1 .472.696v8.662a.75.75 0 0 1-.472.696l-7.25 2.9a.75.75 0 0 1-.557 0l-7.25-2.9A.75.75 0 0 1 0 12.331V3.669a.75.75 0 0 1 .471-.696L7.443.184l.01-.003.268-.108a.75.75 0 0 1 .558 0l.269.108.01.003 6.97 2.789ZM10.404 2 4.25 4.461 1.846 3.5 1 3.839v.4l6.5 2.6v7.922l.5.2.5-.2V6.84l6.5-2.6v-.4l-.846-.339L8 5.961 5.596 5l6.154-2.461z" />
                                    </svg>
                                </div>
                                <div className="p-4 flex-grow-1 d-flex flex-column justify-content-between">
                                    <div>
                                        <h5 className="card-title fw-bold text-primary mb-2">Inventory</h5>
                                        <p className="card-text text-muted mb-3">Check parts availability and stock levels.</p>
                                    </div>
                                    <button
                                        className="btn btn-primary rounded-pill w-100 fw-bold"
                                        onClick={() => setActiveTab('INVENTORY')}
                                    >
                                        Check Inventory
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}



            {activeTab === 'INVENTORY' && (
                <div className="card shadow border-0" style={{ borderRadius: '1rem' }}>
                    <div className="card-header bg-white fw-bold d-flex flex-column flex-md-row justify-content-between align-items-center gap-3 p-4">
                        <h5 className="fw-bold mb-0 text-primary">Parts Inventory</h5>

                        <div className="d-flex gap-2 w-100 w-md-auto">
                            <div className="input-group">
                                <input
                                    type="text"
                                    className="form-control bg-light border-0"
                                    placeholder="Search parts SKU or name..."
                                    value={searchKeyword}
                                    onChange={(e) => setSearchKeyword(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && fetchInventory()}
                                />
                                <button className="btn btn-dark" onClick={() => fetchInventory()}>Search</button>
                            </div>
                            <button className="btn btn-success text-nowrap rounded-pill px-3" onClick={() => setShowAddItemModal(true)}>
                                + Add New
                            </button>
                        </div>

                        <div className="btn-group rounded-pill overflow-hidden border shadow-sm">
                            {['ALL', 'AVAILABLE', 'LOW_STOCK', 'OUT_OF_STOCK'].map(f => (
                                <button
                                    key={f}
                                    className={`btn btn-sm px-3 ${inventoryFilter === f ? 'btn-dark' : 'btn-white'}`}
                                    onClick={() => { setInventoryFilter(f); setSearchKeyword(''); }}
                                >
                                    {f.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="card-body p-0">
                        {loadingInventory ? (
                            <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
                        ) : inventoryError ? (
                            <div className="alert alert-danger m-3">{inventoryError}</div>
                        ) : inventory.length > 0 ? (
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th className="ps-4">ID</th>
                                            <th>Item Name</th>
                                            <th>SKU</th>
                                            <th>Price</th>
                                            <th>Quantity</th>
                                            <th>Status</th>
                                            <th className="text-end pe-4">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {inventory.map(item => (
                                            <tr key={item.id}>
                                                <td className="ps-4 text-muted small">{item.id}</td>
                                                <td className="fw-bold">{item.itemName || 'Unknown Item'}</td>
                                                <td className="small font-monospace">{item.skuCode || 'N/A'}</td>
                                                <td>₹{(item.currentPrice || 0).toLocaleString()}</td>
                                                <td className="fw-bold">{item.stockQuantity}</td>
                                                <td>
                                                    <span className={`badge rounded-pill ${item.outOfStock ? 'bg-danger bg-opacity-10 text-danger' : item.lowStock ? 'bg-warning bg-opacity-10 text-dark' : 'bg-success bg-opacity-10 text-success'}`}>
                                                        {item.outOfStock ? 'Out of Stock' : item.lowStock ? 'Low Stock' : 'In Stock'}
                                                    </span>
                                                </td>
                                                <td className="text-end pe-4">
                                                    <div className="btn-group btn-group-sm">
                                                        <button className="btn btn-outline-primary border-0" onClick={() => handleEditClick(item)}>
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-pencil" viewBox="0 0 16 16"><path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z" /></svg>
                                                        </button>
                                                        <button className="btn btn-outline-danger border-0" onClick={() => handleDeleteItem(item.id)}>
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-trash" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" /><path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" /></svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-5 text-muted">No inventory items found.</div>
                        )}
                    </div>
                </div>
            )}

            {/* Add Item Modal */}
            {showAddItemModal && (
                <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                    <div className="card shadow-lg border-0" style={{ width: '500px', borderRadius: '1rem' }}>
                        <div className="card-header bg-white fw-bold d-flex justify-content-between align-items-center p-4 border-0">
                            <h5 className="mb-0 fw-bold">Add New Inventory Item</h5>
                            <button className="btn-close" onClick={() => setShowAddItemModal(false)}></button>
                        </div>
                        <div className="card-body p-4 pt-0">
                            <form onSubmit={handleAddItemSubmit}>
                                <div className="mb-3">
                                    <label className="form-label small fw-bold">Item Name</label>
                                    <input type="text" name="itemName" className="form-control bg-light border-0" required value={newItem.itemName} onChange={handleAddItemChange} />
                                </div>
                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label small fw-bold">SKU Code</label>
                                        <input type="text" name="skuCode" className="form-control bg-light border-0" required value={newItem.skuCode} onChange={handleAddItemChange} />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label small fw-bold">Stock Quantity</label>
                                        <input type="number" name="stockQuantity" className="form-control bg-light border-0" required min="0" value={newItem.stockQuantity} onChange={handleAddItemChange} />
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label small fw-bold">Price (₹)</label>
                                    <input type="number" name="currentPrice" className="form-control bg-light border-0" required min="0" step="0.01" value={newItem.currentPrice} onChange={handleAddItemChange} />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label small fw-bold">Description</label>
                                    <textarea name="description" className="form-control bg-light border-0" rows="2" value={newItem.description} onChange={handleAddItemChange}></textarea>
                                </div>
                                <div className="d-grid gap-2 mt-4">
                                    <button type="submit" className="btn btn-dark rounded-pill fw-bold">Add Item</button>
                                    <button type="button" className="btn btn-light rounded-pill" onClick={() => setShowAddItemModal(false)}>Cancel</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Item Modal */}
            {showEditModal && editingItem && (
                <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                    <div className="card shadow-lg border-0" style={{ width: '500px', borderRadius: '1rem' }}>
                        <div className="card-header bg-white fw-bold d-flex justify-content-between align-items-center p-4 border-0">
                            <h5 className="mb-0 fw-bold">Edit Inventory Item</h5>
                            <button className="btn-close" onClick={() => setShowEditModal(false)}></button>
                        </div>
                        <div className="card-body p-4 pt-0">
                            <form onSubmit={handleEditSubmit}>
                                <div className="mb-3">
                                    <label className="form-label small fw-bold">Item Name</label>
                                    <input type="text" name="itemName" className="form-control bg-light border-0" required value={editingItem.itemName} onChange={handleEditChange} />
                                </div>
                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label small fw-bold">SKU Code</label>
                                        <input type="text" name="skuCode" className="form-control bg-light border-0" required value={editingItem.skuCode} onChange={handleEditChange} />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label small fw-bold">Stock Quantity</label>
                                        <input type="number" name="stockQuantity" className="form-control bg-light border-0" required min="0" value={editingItem.stockQuantity} onChange={handleEditChange} />
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label small fw-bold">Price (₹)</label>
                                    <input type="number" name="currentPrice" className="form-control bg-light border-0" required min="0" step="0.01" value={editingItem.currentPrice} onChange={handleEditChange} />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label small fw-bold">Description</label>
                                    <textarea name="description" className="form-control bg-light border-0" rows="2" value={editingItem.description} onChange={handleEditChange}></textarea>
                                </div>
                                <div className="d-grid gap-2 mt-4">
                                    <button type="submit" className="btn btn-primary rounded-pill fw-bold">Save Changes</button>
                                    <button type="button" className="btn btn-light rounded-pill" onClick={() => setShowEditModal(false)}>Cancel</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};



export default ManagerDashboard;
