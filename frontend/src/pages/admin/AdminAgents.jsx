import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { authService } from '../../services/authService';
import {
  Truck,
  Plus,
  Edit2,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Search,
  Shield,
  Phone,
  Mail,
  MapPin,
  ToggleLeft,
  ToggleRight,
  Layers,
} from 'lucide-react';

const AdminAgents = () => {
  const [agents, setAgents] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal State for Create Agent
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    assignedZones: [],
    currentLocation: { lat: 28.6139, lng: 77.2090 },
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal State for Reassigning Zones
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [selectedZoneIds, setSelectedZoneIds] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [agentsRes, zonesRes] = await Promise.all([
        adminService.getAgents(),
        adminService.getZones().catch(() => ({ success: false, zones: [] })),
      ]);

      if (agentsRes.success) setAgents(agentsRes.agents || []);
      if (zonesRes.success) setZones(zonesRes.zones || []);
    } catch (err) {
      console.error('Error fetching agents data:', err);
      setError(err.data?.message || err.message || 'Failed to load delivery agents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showNotification = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleCreateAgent = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const res = await authService.createAgent(formData);
      if (res.success) {
        showNotification(`Delivery agent "${formData.name}" created successfully!`);
        setShowCreateModal(false);
        setFormData({
          name: '',
          email: '',
          phone: '',
          password: '',
          assignedZones: [],
          currentLocation: { lat: 28.6139, lng: 77.2090 },
        });
        fetchData();
      }
    } catch (err) {
      setError(err.data?.message || err.message || 'Failed to create agent.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleAvailability = async (agentId, currentStatus) => {
    const nextStatus = currentStatus === 'available' ? 'unavailable' : 'available';
    try {
      const res = await adminService.updateAgent(agentId, { availabilityStatus: nextStatus });
      if (res.success) {
        showNotification(`Agent availability changed to ${nextStatus}.`);
        fetchData();
      }
    } catch (err) {
      setError(err.data?.message || err.message || 'Failed to update agent status.');
    }
  };

  const handleOpenZoneModal = (agent) => {
    setSelectedAgent(agent);
    setSelectedZoneIds((agent.assignedZones || []).map((z) => z._id));
    setShowZoneModal(true);
  };

  const handleSaveAssignedZones = async (e) => {
    e.preventDefault();
    if (!selectedAgent) return;

    try {
      const res = await adminService.updateAgent(selectedAgent._id, {
        assignedZones: selectedZoneIds,
      });

      if (res.success) {
        showNotification(`Zone assignments updated for ${selectedAgent.user?.name}!`);
        setShowZoneModal(false);
        fetchData();
      }
    } catch (err) {
      setError(err.data?.message || err.message || 'Failed to update zones.');
    }
  };

  const filteredAgents = agents.filter((a) => {
    const q = searchQuery.toLowerCase();
    const nameMatch = a.user?.name?.toLowerCase().includes(q);
    const emailMatch = a.user?.email?.toLowerCase().includes(q);
    const phoneMatch = a.user?.phone?.toLowerCase().includes(q);
    const statusMatch = statusFilter === 'all' || a.availabilityStatus === statusFilter;
    return (nameMatch || emailMatch || phoneMatch) && statusMatch;
  });

  return (
    <div className="main-content fade-in">
      {/* Header */}
      <div className="flex justify-between items-center mb-6" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div className="flex items-center gap-2">
            <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger)' }}>
              <Shield size={12} /> Fleet Management
            </span>
          </div>
          <h1 style={{ marginTop: '0.25rem' }}>Delivery Agents</h1>
          <p>Provision agent accounts, assign operational zones, and monitor fleet availability.</p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={fetchData} className="btn btn-secondary btn-sm flex items-center gap-2" disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary btn-sm flex items-center gap-2">
            <Plus size={16} />
            <span>Add Delivery Agent</span>
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

      {/* Filter Toolbar */}
      <div className="card mb-6" style={{ padding: '1.25rem' }}>
        <div className="flex items-center gap-4" style={{ flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input
              type="text"
              className="form-control"
              style={{ paddingLeft: '2.2rem', height: '40px', fontSize: '0.85rem' }}
              placeholder="Search by agent name, email, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ minWidth: '160px' }}>
            <select
              className="form-select"
              style={{ height: '40px', fontSize: '0.85rem' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
              <option value="on-delivery">On Delivery</option>
            </select>
          </div>

          <div style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing {filteredAgents.length} of {agents.length} agents
          </div>
        </div>
      </div>

      {/* Agents Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Agent Name & Contact</th>
              <th>Assigned Zones</th>
              <th>Availability Status</th>
              <th>Coordinates</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAgents.map((agent) => (
              <tr key={agent._id}>
                <td>
                  <div>
                    <strong style={{ fontSize: '0.95rem' }}>{agent.user?.name || 'Agent'}</strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.15rem' }}>
                      <Mail size={12} /> {agent.user?.email}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Phone size={12} /> {agent.user?.phone}
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', maxWidth: '380px' }}>
                    {agent.assignedZones?.map((z) => (
                      <span
                        key={z._id}
                        style={{
                          background: 'rgba(59, 130, 246, 0.15)',
                          color: '#60A5FA',
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                          padding: '0.2rem 0.55rem',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.75rem',
                        }}
                      >
                        {z.name}
                      </span>
                    ))}
                    {(!agent.assignedZones || agent.assignedZones.length === 0) && (
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>No zones assigned</span>
                    )}
                  </div>
                </td>
                <td>
                  <span
                    className={`badge badge-${
                      agent.availabilityStatus === 'available'
                        ? 'delivered'
                        : agent.availabilityStatus === 'on-delivery'
                        ? 'in-transit'
                        : 'failed'
                    }`}
                  >
                    {agent.availabilityStatus}
                  </span>
                </td>
                <td style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>
                  {agent.currentLocation?.lat ? `${agent.currentLocation.lat}, ${agent.currentLocation.lng}` : 'N/A'}
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleAvailability(agent._id, agent.availabilityStatus)}
                      className={`btn btn-sm ${
                        agent.availabilityStatus === 'available' ? 'btn-secondary' : 'btn-success'
                      }`}
                    >
                      {agent.availabilityStatus === 'available' ? 'Set Unavailable' : 'Set Available'}
                    </button>
                    <button
                      onClick={() => handleOpenZoneModal(agent)}
                      className="btn btn-secondary btn-sm flex items-center gap-1"
                      title="Manage Assigned Zones"
                    >
                      <Layers size={13} /> Zones
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filteredAgents.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-dim)' }}>
                  No delivery agents match the filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ==================================================== */}
      {/* MODAL: CREATE AGENT */}
      {/* ==================================================== */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ maxWidth: '560px', width: '90%', padding: '2rem' }}>
            <div className="flex items-center gap-2 mb-2">
              <Truck size={22} style={{ color: 'var(--primary)' }} />
              <h3>Create Delivery Agent Account</h3>
            </div>
            <p style={{ fontSize: '0.85rem', marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
              Delivery agents do not self-register; provision account credentials here.
            </p>

            <form onSubmit={handleCreateAgent}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Vikram Malhotra"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="agent@lastmile.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    className="form-control"
                    placeholder="+91 9876543210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Initial Password</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Minimum 6 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Assign Initial Zones</label>
                <div style={{ maxHeight: '120px', overflowY: 'auto', background: 'var(--bg-input)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                  {zones.map((zone) => (
                    <label key={zone._id} className="flex items-center gap-2 mb-2" style={{ cursor: 'pointer', fontSize: '0.85rem' }}>
                      <input
                        type="checkbox"
                        checked={formData.assignedZones.includes(zone._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, assignedZones: [...formData.assignedZones, zone._id] });
                          } else {
                            setFormData({ ...formData, assignedZones: formData.assignedZones.filter((zid) => zid !== zone._id) });
                          }
                        }}
                      />
                      <span>{zone.name}</span>
                    </label>
                  ))}
                  {zones.length === 0 && <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>No zones available yet.</p>}
                </div>
              </div>

              <div className="flex justify-between gap-4 mt-6">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Provision Agent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: MANAGE ASSIGNED ZONES */}
      {/* ==================================================== */}
      {showZoneModal && selectedAgent && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ maxWidth: '480px', width: '90%', padding: '2rem' }}>
            <div className="flex items-center gap-2 mb-2">
              <Layers size={22} style={{ color: 'var(--primary)' }} />
              <h3>Assign Zones for {selectedAgent.user?.name}</h3>
            </div>
            <p style={{ fontSize: '0.85rem', marginBottom: '1.25rem', color: 'var(--text-muted)' }}>
              Select all operational delivery zones this agent is permitted to service.
            </p>

            <form onSubmit={handleSaveAssignedZones}>
              <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {zones.map((zone) => (
                  <label
                    key={zone._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      background: selectedZoneIds.includes(zone._id) ? 'var(--bg-hover)' : 'var(--bg-input)',
                      border: selectedZoneIds.includes(zone._id) ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedZoneIds.includes(zone._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedZoneIds([...selectedZoneIds, zone._id]);
                        } else {
                          setSelectedZoneIds(selectedZoneIds.filter((zid) => zid !== zone._id));
                        }
                      }}
                    />
                    <span>{zone.name}</span>
                  </label>
                ))}
              </div>

              <div className="flex justify-between gap-4">
                <button type="button" className="btn btn-secondary" onClick={() => setShowZoneModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Zone Assignments
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAgents;
