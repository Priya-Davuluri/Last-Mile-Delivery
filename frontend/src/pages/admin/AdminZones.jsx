import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Search,
  Tag,
  Shield,
} from 'lucide-react';

const AdminZones = () => {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    areasInput: '',
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchZones = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.getZones();
      if (res.success) {
        setZones(res.zones || []);
      }
    } catch (err) {
      console.error('Error fetching zones:', err);
      setError(err.data?.message || err.message || 'Failed to load zones.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  const showNotification = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleOpenModal = (zone = null) => {
    if (zone) {
      setEditingZone(zone);
      setFormData({
        name: zone.name,
        areasInput: (zone.areasCovered || []).join(', '),
        isActive: zone.isActive !== undefined ? zone.isActive : true,
      });
    } else {
      setEditingZone(null);
      setFormData({
        name: '',
        areasInput: '',
        isActive: true,
      });
    }
    setShowModal(true);
  };

  const handleSaveZone = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsSubmitting(true);
    setError('');

    const processedAreas = formData.areasInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      if (editingZone) {
        const res = await adminService.updateZone(editingZone._id, {
          name: formData.name.trim(),
          areasCovered: processedAreas,
          isActive: formData.isActive,
        });
        if (res.success) {
          showNotification(`Zone "${formData.name}" updated successfully!`);
          setShowModal(false);
          fetchZones();
        }
      } else {
        const res = await adminService.createZone({
          name: formData.name.trim(),
          areasCovered: processedAreas,
          isActive: formData.isActive,
        });
        if (res.success) {
          showNotification(`Zone "${formData.name}" created successfully!`);
          setShowModal(false);
          fetchZones();
        }
      }
    } catch (err) {
      setError(err.data?.message || err.message || 'Error saving zone.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteZone = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete zone "${name}"? This may affect orders mapping to this zone.`)) {
      return;
    }

    try {
      const res = await adminService.deleteZone(id);
      if (res.success) {
        showNotification(`Zone "${name}" deleted.`);
        fetchZones();
      }
    } catch (err) {
      setError(err.data?.message || err.message || 'Failed to delete zone.');
    }
  };

  const filteredZones = zones.filter((z) => {
    const q = searchQuery.toLowerCase();
    const matchesName = z.name.toLowerCase().includes(q);
    const matchesAreas = z.areasCovered?.some((a) => a.toLowerCase().includes(q));
    return matchesName || matchesAreas;
  });

  return (
    <div className="main-content fade-in">
      {/* Header */}
      <div className="flex justify-between items-center mb-6" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div className="flex items-center gap-2">
            <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger)' }}>
              <Shield size={12} /> Admin Config
            </span>
          </div>
          <h1 style={{ marginTop: '0.25rem' }}>Zone & Area Mapping</h1>
          <p>Define operational zones and assign localities and postal pincodes for automatic rate detection.</p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={fetchZones} className="btn btn-secondary btn-sm flex items-center gap-2" disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
          <button onClick={() => handleOpenModal()} className="btn btn-primary btn-sm flex items-center gap-2">
            <Plus size={16} />
            <span>Add New Zone</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div
          className="flex items-center gap-2 mb-4"
          style={{
            background: 'var(--success-bg)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: 'var(--success)',
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <CheckCircle size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div
          className="flex items-center gap-2 mb-4"
          style={{
            background: 'var(--danger-bg)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: 'var(--danger)',
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Search Toolbar */}
      <div className="card mb-6" style={{ padding: '1.25rem' }}>
        <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input
              type="text"
              className="form-control"
              style={{ paddingLeft: '2.2rem', height: '40px', fontSize: '0.85rem' }}
              placeholder="Search by zone name, pincode, or locality..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing {filteredZones.length} of {zones.length} zones
          </div>
        </div>
      </div>

      {/* Zones Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Zone Name</th>
              <th>Covered Areas / Pincodes</th>
              <th>Total Locations</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredZones.map((zone) => (
              <tr key={zone._id}>
                <td>
                  <div className="flex items-center gap-2">
                    <MapPin size={18} style={{ color: 'var(--primary)' }} />
                    <strong style={{ fontSize: '0.95rem' }}>{zone.name}</strong>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', maxWidth: '560px' }}>
                    {zone.areasCovered?.map((area, idx) => (
                      <span
                        key={idx}
                        style={{
                          background: 'var(--bg-surface-elevated)',
                          border: '1px solid var(--border-glass)',
                          padding: '0.2rem 0.55rem',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.75rem',
                          color: /^\d+$/.test(area) ? '#60A5FA' : 'var(--text-main)',
                        }}
                      >
                        {area}
                      </span>
                    ))}
                    {(!zone.areasCovered || zone.areasCovered.length === 0) && (
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>No areas mapped yet</span>
                    )}
                  </div>
                </td>
                <td>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    {zone.areasCovered?.length || 0}
                  </span>
                </td>
                <td>
                  <span className={`badge ${zone.isActive ? 'badge-delivered' : 'badge-pending'}`}>
                    {zone.isActive ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenModal(zone)}
                      className="btn btn-secondary btn-sm flex items-center gap-1"
                    >
                      <Edit2 size={14} /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteZone(zone._id, zone.name)}
                      className="btn btn-danger btn-sm"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filteredZones.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-dim)' }}>
                  No zones match your search query.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ==================================================== */}
      {/* MODAL: CREATE / EDIT ZONE */}
      {/* ==================================================== */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ maxWidth: '540px', width: '90%', padding: '2rem' }}>
            <div className="flex items-center gap-2 mb-2">
              <MapPin size={22} style={{ color: 'var(--primary)' }} />
              <h3>{editingZone ? 'Edit Zone Configuration' : 'Create New Zone'}</h3>
            </div>
            <p style={{ fontSize: '0.85rem', marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
              Specify the zone title and a comma-separated list of pincodes (e.g. 110001) and locality names.
            </p>

            <form onSubmit={handleSaveZone}>
              <div className="form-group">
                <label className="form-label">Zone Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Zone A - Central Business District"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Covered Pincodes & Localities (Comma-separated)</label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  placeholder="110001, 110002, 110003, Connaught Place, Central, CBD, Downtown"
                  value={formData.areasInput}
                  onChange={(e) => setFormData({ ...formData, areasInput: e.target.value })}
                  required
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                  The rate engine matches customer addresses against these strings automatically.
                </span>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  id="zoneActiveToggle"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                <label htmlFor="zoneActiveToggle" style={{ fontSize: '0.9rem', cursor: 'pointer' }}>
                  Zone is active for delivery routing
                </label>
              </div>

              <div className="flex justify-between gap-4 mt-6">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : editingZone ? 'Save Changes' : 'Create Zone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminZones;
