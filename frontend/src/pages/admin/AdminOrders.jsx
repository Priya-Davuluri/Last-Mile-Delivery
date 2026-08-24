import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { orderService } from '../../services/orderService';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import StatusBadge from '../../components/StatusBadge';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import {
  Package,
  Search,
  Filter,
  RefreshCw,
  Zap,
  UserCheck,
  ExternalLink,
  Shield,
  Truck,
  PlusCircle,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  MapPin,
  DollarSign,
} from 'lucide-react';

const AdminOrders = () => {
  const { user } = useAuth();
  const { showEmailNotification } = useNotification();

  const [orders, setOrders] = useState([]);
  const [zones, setZones] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [zoneFilter, setZoneFilter] = useState('all');
  const [agentFilter, setAgentFilter] = useState('all');
  const [orderTypeFilter, setOrderTypeFilter] = useState('all');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Manual Assign Modal State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningOrder, setAssigningOrder] = useState(null);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [eligibleAgents, setEligibleAgents] = useState([]);
  const [isAssigning, setIsAssigning] = useState(false);

  // Status Override Modal State
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideOrder, setOverrideOrder] = useState(null);
  const [overrideStatus, setOverrideStatus] = useState('delivered');
  const [overrideNotes, setOverrideNotes] = useState('');
  const [isOverriding, setIsOverriding] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [ordersRes, zonesRes, agentsRes] = await Promise.all([
        orderService.getAllOrders(),
        adminService.getZones().catch(() => ({ success: false, zones: [] })),
        adminService.getAgents().catch(() => ({ success: false, agents: [] })),
      ]);

      if (ordersRes.success) setOrders(ordersRes.orders || []);
      if (zonesRes.success) setZones(zonesRes.zones || []);
      if (agentsRes.success) setAgents(agentsRes.agents || []);
    } catch (err) {
      console.error('Error fetching admin orders data:', err);
      setError(err.data?.message || err.message || 'Failed to load delivery orders.');
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

  // 1. Auto-Assign
  const handleAutoAssign = async (orderId) => {
    try {
      const res = await orderService.autoAssign(orderId);
      if (res.success) {
        showNotification(
          `Auto-assigned successfully to ${res.assignedAgent?.user?.name || 'delivery agent'}!`
        );
        showEmailNotification(res.order?.customer?.email, 'ASSIGNED');
        fetchData();
      }
    } catch (err) {
      setError(err.data?.message || err.message || 'Auto-assignment failed. No available agents found.');
    }
  };

  // 2. Open Manual Assignment Modal
  const handleOpenAssignModal = async (order) => {
    setAssigningOrder(order);
    setSelectedAgentId(order.assignedAgent?._id || '');
    setShowAssignModal(true);

    try {
      const res = await orderService.getEligibleAgents(order._id);
      if (res.success && res.agents) {
        setEligibleAgents(res.agents);
        if (!order.assignedAgent && res.agents.length > 0) {
          setSelectedAgentId(res.agents[0]._id);
        }
      }
    } catch (err) {
      console.error('Error fetching eligible agents:', err);
    }
  };

  // 3. Confirm Manual Assignment
  const handleConfirmAssign = async (e) => {
    e.preventDefault();
    if (!selectedAgentId || !assigningOrder) return;

    setIsAssigning(true);
    try {
      const res = await orderService.manualAssign(assigningOrder._id, selectedAgentId);
      if (res.success) {
        showNotification('Agent assigned successfully via manual dispatch!');
        showEmailNotification(assigningOrder.customer?.email, 'ASSIGNED');
        setShowAssignModal(false);
        fetchData();
      }
    } catch (err) {
      setError(err.data?.message || err.message || 'Manual assignment failed.');
    } finally {
      setIsAssigning(false);
    }
  };

  // 4. Open Override Modal
  const handleOpenOverrideModal = (order) => {
    setOverrideOrder(order);
    setOverrideStatus(order.status);
    setOverrideNotes('');
    setShowOverrideModal(true);
  };

  // 5. Confirm Status Override
  const handleConfirmOverride = async (e) => {
    e.preventDefault();
    if (!overrideNotes.trim() || !overrideOrder) {
      setError('Administrative justification is mandatory for status override.');
      return;
    }

    setIsOverriding(true);
    try {
      const res = await orderService.overrideStatus(overrideOrder._id, {
        status: overrideStatus,
        notes: overrideNotes.trim(),
      });
      if (res.success) {
        showNotification(`Order status overridden to '${overrideStatus}'!`);
        showEmailNotification(overrideOrder.customer?.email, overrideStatus.toUpperCase());
        setShowOverrideModal(false);
        fetchData();
      }
    } catch (err) {
      setError(err.data?.message || err.message || 'Status override failed.');
    } finally {
      setIsOverriding(false);
    }
  };

  // Filtered Orders Logic
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        order._id?.toLowerCase().includes(q) ||
        order.customer?.name?.toLowerCase().includes(q) ||
        order.customer?.email?.toLowerCase().includes(q) ||
        order.customer?.phone?.toLowerCase().includes(q) ||
        order.pickupAddress?.toLowerCase().includes(q) ||
        order.dropAddress?.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

      const matchesZone =
        zoneFilter === 'all' ||
        order.pickupZone?._id === zoneFilter ||
        order.dropZone?._id === zoneFilter ||
        order.pickupZone?.name === zoneFilter;

      const matchesAgent =
        agentFilter === 'all' ||
        (agentFilter === 'unassigned' && !order.assignedAgent) ||
        order.assignedAgent?._id === agentFilter ||
        order.assignedAgent?.user?._id === agentFilter;

      const matchesType = orderTypeFilter === 'all' || order.orderType === orderTypeFilter;

      return matchesSearch && matchesStatus && matchesZone && matchesAgent && matchesType;
    });
  }, [orders, searchQuery, statusFilter, zoneFilter, agentFilter, orderTypeFilter]);

  // Pagination Slice
  const totalPages = Math.ceil(filteredOrders.length / pageSize) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, zoneFilter, agentFilter, orderTypeFilter, pageSize]);

  return (
    <div className="main-content fade-in">
      {/* Header */}
      <div className="flex justify-between items-center mb-6" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div className="flex items-center gap-2">
            <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger)' }}>
              <Shield size={12} /> Dispatch Control
            </span>
          </div>
          <h1 style={{ marginTop: '0.25rem' }}>All Delivery Orders</h1>
          <p>Filter, search, auto-dispatch, and manage the full logistics lifecycle.</p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={fetchData} className="btn btn-secondary btn-sm flex items-center gap-2" disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
          <Link to="/admin/create-order" className="btn btn-primary btn-sm flex items-center gap-2">
            <PlusCircle size={16} />
            <span>Create Order (On Behalf)</span>
          </Link>
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

      {/* Filter Toolbar Card */}
      <div className="card mb-6" style={{ padding: '1.25rem' }}>
        <div className="grid-4 mb-3" style={{ gap: '0.75rem' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', gridColumn: 'span 2' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input
              type="text"
              className="form-control"
              style={{ paddingLeft: '2.2rem', height: '38px', fontSize: '0.85rem' }}
              placeholder="Search by Order ID, customer name, phone, address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              className="form-select"
              style={{ height: '38px', fontSize: '0.85rem' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending Dispatch</option>
              <option value="assigned">Agent Assigned</option>
              <option value="picked-up">Picked Up</option>
              <option value="in-transit">In Transit</option>
              <option value="out-for-delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="failed">Failed / Needs Reschedule</option>
            </select>
          </div>

          {/* Zone Filter */}
          <div>
            <select
              className="form-select"
              style={{ height: '38px', fontSize: '0.85rem' }}
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
            >
              <option value="all">All Zones</option>
              {zones.map((z) => (
                <option key={z._id} value={z._id}>
                  {z.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Secondary Filter Row */}
        <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: '0.75rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
          <div className="flex items-center gap-3" style={{ flexWrap: 'wrap' }}>
            {/* Agent Filter */}
            <select
              className="form-select"
              style={{ width: '180px', height: '34px', fontSize: '0.8rem' }}
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
            >
              <option value="all">All Agents</option>
              <option value="unassigned">Unassigned Only</option>
              {agents.map((ag) => (
                <option key={ag._id} value={ag._id}>
                  {ag.user?.name}
                </option>
              ))}
            </select>

            {/* Order Type Filter */}
            <select
              className="form-select"
              style={{ width: '130px', height: '34px', fontSize: '0.8rem' }}
              value={orderTypeFilter}
              onChange={(e) => setOrderTypeFilter(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="B2C">B2C</option>
              <option value="B2B">B2B</option>
            </select>

            {(searchQuery || statusFilter !== 'all' || zoneFilter !== 'all' || agentFilter !== 'all' || orderTypeFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setZoneFilter('all');
                  setAgentFilter('all');
                  setOrderTypeFilter('all');
                }}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.75rem', height: '34px' }}
              >
                Reset Filters
              </button>
            )}
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Showing <strong>{paginatedOrders.length}</strong> of <strong>{filteredOrders.length}</strong> filtered orders (Total: {orders.length})
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Order ID & Date</th>
              <th>Customer</th>
              <th>Route (Pickup ➔ Drop)</th>
              <th>Weight & Price</th>
              <th>Assigned Agent</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedOrders.map((order) => (
              <tr key={order._id}>
                <td>
                  <Link
                    to={`/admin/orders/${order._id}`}
                    style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--primary)' }}
                    title="View Order Details & Dispatch"
                  >
                    #{order._id.substring(order._id.length - 6)}
                  </Link>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    {formatDateTime(order.createdAt)}
                  </div>
                </td>
                <td>
                  <strong>{order.customer?.name || 'Customer'}</strong>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.customer?.email}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{order.customer?.phone}</div>
                </td>
                <td>
                  <div style={{ maxWidth: '280px' }}>
                    <div style={{ fontSize: '0.8rem' }}>
                      <span style={{ color: 'var(--primary)', fontWeight: 600 }}>[Pickup]</span> {order.pickupZone?.name || 'Zone'}
                    </div>
                    <div style={{ fontSize: '0.8rem', marginTop: '0.15rem' }}>
                      <span style={{ color: 'var(--accent)', fontWeight: 600 }}>[Drop]</span> {order.dropZone?.name || 'Zone'}
                    </div>
                  </div>
                </td>
                <td>
                  <div>
                    <strong>{formatCurrency(order.totalCharge)}</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginLeft: '0.3rem' }}>
                      ({order.paymentType})
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    Billable: {order.billableWeight} kg ({order.orderType})
                  </div>
                </td>
                <td>
                  {order.assignedAgent?.user ? (
                    <div>
                      <div className="flex items-center gap-1">
                        <Truck size={14} style={{ color: 'var(--primary)' }} />
                        <strong style={{ fontSize: '0.85rem' }}>{order.assignedAgent.user.name}</strong>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        Via {order.assignmentType || 'manual'} dispatch
                      </div>
                    </div>
                  ) : (
                    <span style={{ color: 'var(--status-pending)', fontSize: '0.8rem', fontStyle: 'italic' }}>
                      Unassigned
                    </span>
                  )}
                </td>
                <td>
                  <StatusBadge status={order.status} size="sm" />
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    {order.status === 'pending' || order.status === 'failed' ? (
                      <>
                        <button
                          onClick={() => handleAutoAssign(order._id)}
                          className="btn btn-primary btn-sm flex items-center gap-1"
                          title="Auto-Assign Nearest Available Agent"
                        >
                          <Zap size={13} /> Auto
                        </button>
                        <button
                          onClick={() => handleOpenAssignModal(order)}
                          className="btn btn-secondary btn-sm flex items-center gap-1"
                          title="Manual Agent Selection"
                        >
                          <UserCheck size={13} /> Assign
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleOpenAssignModal(order)}
                        className="btn btn-secondary btn-sm flex items-center gap-1"
                        title="Reassign Agent"
                      >
                        <UserCheck size={13} /> Reassign
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenOverrideModal(order)}
                      className="btn btn-secondary btn-sm flex items-center gap-1"
                      title="Administrative Status Override"
                    >
                      <Shield size={13} style={{ color: 'var(--danger)' }} /> Override
                    </button>
                    <Link
                      to={`/admin/orders/${order._id}`}
                      className="btn btn-secondary btn-sm"
                      title="View Full Order Detail & Timeline"
                    >
                      <ExternalLink size={13} />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}

            {paginatedOrders.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-dim)' }}>
                  No delivery orders match the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-4" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div className="flex items-center gap-2" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <span>Rows per page:</span>
          <select
            className="form-select"
            style={{ width: '70px', height: '32px', fontSize: '0.8rem', padding: '0 0.5rem' }}
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginRight: '0.5rem' }}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="btn btn-secondary btn-sm"
            disabled={currentPage === 1}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="btn btn-secondary btn-sm"
            disabled={currentPage === totalPages}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* ==================================================== */}
      {/* MODAL: MANUAL AGENT ASSIGNMENT */}
      {/* ==================================================== */}
      {showAssignModal && assigningOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ maxWidth: '520px', width: '90%', padding: '2rem' }}>
            <div className="flex items-center gap-2 mb-2">
              <UserCheck size={22} style={{ color: 'var(--primary)' }} />
              <h3>Assign Agent to Order #{assigningOrder._id.substring(assigningOrder._id.length - 6)}</h3>
            </div>
            <p style={{ fontSize: '0.85rem', marginBottom: '1.25rem', color: 'var(--text-muted)' }}>
              Pickup: <strong>{assigningOrder.pickupZone?.name || 'Pickup Zone'}</strong> ➔ Drop: <strong>{assigningOrder.dropZone?.name || 'Drop Zone'}</strong>
            </p>

            <form onSubmit={handleConfirmAssign}>
              <div className="form-group">
                <label className="form-label">Select Agent</label>
                <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {eligibleAgents.map((agent) => (
                    <label
                      key={agent._id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        background: selectedAgentId === agent._id ? 'var(--bg-hover)' : 'var(--bg-input)',
                        border: selectedAgentId === agent._id ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="agentSelection"
                          value={agent._id}
                          checked={selectedAgentId === agent._id}
                          onChange={() => setSelectedAgentId(agent._id)}
                        />
                        <div>
                          <strong style={{ fontSize: '0.9rem' }}>{agent.user?.name}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Status: <span style={{ color: agent.availabilityStatus === 'available' ? 'var(--success)' : 'var(--warning)' }}>{agent.availabilityStatus}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        {agent.servesPickupZone ? (
                          <span className="badge badge-delivered" style={{ fontSize: '0.7rem' }}>Zone Match</span>
                        ) : (
                          <span className="badge badge-pending" style={{ fontSize: '0.7rem' }}>Other Zone</span>
                        )}
                      </div>
                    </label>
                  ))}

                  {eligibleAgents.length === 0 && (
                    <p style={{ color: 'var(--text-dim)', textAlign: 'center', padding: '1rem' }}>
                      No agents found. Add agents in the Delivery Agents panel first.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-between gap-4 mt-6">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAssignModal(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!selectedAgentId || isAssigning}
                >
                  {isAssigning ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: ADMIN STATUS OVERRIDE */}
      {/* ==================================================== */}
      {showOverrideModal && overrideOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ maxWidth: '520px', width: '90%', padding: '2rem' }}>
            <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--danger)' }}>
              <Shield size={24} />
              <h3>Admin Status Override</h3>
            </div>
            <p style={{ fontSize: '0.85rem', marginBottom: '1.25rem', color: 'var(--text-muted)' }}>
              Force override status for order #{overrideOrder._id.substring(overrideOrder._id.length - 6)}.
            </p>

            <form onSubmit={handleConfirmOverride}>
              <div className="form-group">
                <label className="form-label">New Target Status</label>
                <select
                  className="form-select"
                  value={overrideStatus}
                  onChange={(e) => setOverrideStatus(e.target.value)}
                  required
                >
                  <option value="pending">pending (Reset to Queue)</option>
                  <option value="assigned">assigned</option>
                  <option value="picked-up">picked-up</option>
                  <option value="in-transit">in-transit</option>
                  <option value="out-for-delivery">out-for-delivery</option>
                  <option value="delivered">delivered (Force Complete)</option>
                  <option value="failed">failed (Mark Failed)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Administrative Reason / Justification</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="e.g. Customer confirmed delivery via support, or manual dispatch override"
                  value={overrideNotes}
                  onChange={(e) => setOverrideNotes(e.target.value)}
                  required
                />
              </div>

              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.75rem',
                  fontSize: '0.8rem',
                  color: '#FCA5A5',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                }}
              >
                <Shield size={16} style={{ color: 'var(--danger)', flexShrink: 0, marginTop: '2px' }} />
                <span>
                  <strong>Audit Warning:</strong> This override is permanently audited in Tracking History with actor <code>admin:{user?.id || user?._id}</code>.
                </span>
              </div>

              <div className="flex justify-between gap-4 mt-6">
                <button type="button" className="btn btn-secondary" onClick={() => setShowOverrideModal(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-danger"
                  disabled={isOverriding}
                >
                  {isOverriding ? 'Applying...' : 'Confirm Status Override'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
