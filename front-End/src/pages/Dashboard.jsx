import React, { useState, useEffect } from 'react';
import API from '../api';

function Dashboard() {
  const [items, setItems] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newStatus, setNewStatus] = useState('todo');
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState('todo');
  const pageSize = 5; // items per page

  const fetchItems = async () => {
    setLoading(true);
    setError('');
    try {
      let url = `/api/items?page=${page}&limit=${pageSize}`;
      if (statusFilter !== 'all') {
        url += `&status=${statusFilter}`;
      }
      const response = await API.get(url);
      // If API returns { items: [...] }, otherwise assume response data is the list
      const data = response.data;
      const itemsList = data.items || data;
      setItems(itemsList);
      // (If API provides total pages or item count, we could use it for more precise pagination.)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]);

  const handleCreateItem = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setError('Title is required');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await API.post('/api/items', { title: newTitle, description: newDescription, status: newStatus });
      // Reset form
      setNewTitle('');
      setNewDescription('');
      setNewStatus('todo');
      // Refresh list (reset to first page to show newest item)
      setPage(1);
      fetchItems();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create item');
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (item) => {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditDescription(item.description || '');
    setEditStatus(item.status);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditTitle('');
    setEditDescription('');
    setEditStatus('todo');
  };

  const handleUpdateItem = async (itemId) => {
    if (!editTitle.trim()) {
      setError('Title is required');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await API.patch(`/api/items/${itemId}`, { title: editTitle, description: editDescription, status: editStatus });
      setEditingId(null);
      // Refresh list to show the updated item
      fetchItems();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update item');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }
    setError('');
    setLoading(true);
    try {
      await API.delete(`/api/items/${itemId}`);
      // If the last item on the page was deleted, go back one page if possible
      if (items.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        fetchItems();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Dashboard</h2>
      {error && <p className="error">{error}</p>}
      
      {/* Filter by status */}
      <div className="filter-bar">
        <label>Status filter: </label>
        <select 
          value={statusFilter} 
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="all">All</option>
          <option value="todo">Todo</option>
          <option value="doing">Doing</option>
          <option value="done">Done</option>
        </select>
      </div>
      
      {/* Create New Item Form */}
      <form onSubmit={handleCreateItem} style={{ marginBottom: '1rem' }}>
        <h3>Create New Item</h3>
        <div className="form-field">
          <label>Title:</label>
          <input 
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            required 
          />
        </div>
        <div className="form-field">
          <label>Description:</label>
          <textarea 
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
          />
        </div>
        <div className="form-field">
          <label>Status:</label>
          <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
            <option value="todo">Todo</option>
            <option value="doing">Doing</option>
            <option value="done">Done</option>
          </select>
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Adding...' : 'Add Item'}
        </button>
      </form>
      
      {/* Items List */}
      {loading && !editingId && <p>Loading items...</p>}
      {items.map(item => (
        <div key={item.id} className="item-card">
          {editingId === item.id ? (
            /* Edit mode for this item */
            <div>
              <div className="form-field">
                <label>Title:</label>
                <input 
                  type="text" 
                  value={editTitle} 
                  onChange={(e) => setEditTitle(e.target.value)} 
                  required 
                />
              </div>
              <div className="form-field">
                <label>Description:</label>
                <textarea 
                  value={editDescription} 
                  onChange={(e) => setEditDescription(e.target.value)} 
                />
              </div>
              <div className="form-field">
                <label>Status:</label>
                <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                  <option value="todo">Todo</option>
                  <option value="doing">Doing</option>
                  <option value="done">Done</option>
                </select>
              </div>
              <div className="item-actions">
                <button 
                  type="button"
                  onClick={() => handleUpdateItem(item.id)} 
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
                <button 
                  type="button"
                  onClick={cancelEditing} 
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            /* View mode for this item */
            <div>
              <h3>{item.title}</h3>
              <p>Status: {item.status}</p>
              <p>Created: {item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}</p>
              {item.description && <p>Description: {item.description}</p>}
              <div className="item-actions">
                <button 
                  type="button"
                  onClick={() => startEditing(item)} 
                  disabled={loading}
                >
                  Edit
                </button>
                <button 
                  type="button"
                  onClick={() => handleDeleteItem(item.id)} 
                  disabled={loading}
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
      
      {/* Pagination Controls */}
      <div>
        <button 
          type="button"
          onClick={() => setPage(page - 1)} 
          disabled={page <= 1 || loading}
        >
          Prev
        </button>
        <span style={{ margin: '0 1rem' }}>Page {page}</span>
        <button 
          type="button"
          onClick={() => setPage(page + 1)} 
          disabled={items.length < pageSize || loading}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default Dashboard;
