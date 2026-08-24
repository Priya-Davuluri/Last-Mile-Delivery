# System Design Document: Last-Mile Delivery Tracker

## 1. Architectural Overview
The Last-Mile Delivery Tracker is a distributed, event-driven logistics platform architected using the MERN stack (MongoDB, Express.js, React, Node.js). The platform decouples order placement, dynamic pricing, intelligent dispatch, and tracking auditability across three distinct user roles: **Customer**, **Delivery Agent**, and **Administrator**.

```
[ Customer / Admin UI ] ──> [ REST API Gateway ] ──> [ Rate Engine ] ──> [ MongoDB ]
                                      │                        │
                                      ▼                        ▼
                            [ Assignment Engine ]    [ Immutable Audit Trail ]
                                      │                        │
                                      ▼                        ▼
                            [ Field Agent Portal ]  [ Notification Service ]
```

---

## 2. Dynamic Rate Calculation Engine
Logistics pricing depends on dimensional density and distance. The Rate Engine computes charges using a deterministic 5-step pipeline:

1. **Volumetric Weight Formulation**:
   $$\text{Volumetric Weight (kg)} = \frac{\text{Length (cm)} \times \text{Breadth (cm)} \times \text{Height (cm)}}{5000}$$
2. **Billable Weight Selection**:
   $$\text{Billable Weight} = \max(\text{Actual Weight}, \text{Volumetric Weight})$$
3. **Zone Relation Classification**:
   - $\text{Intra-Zone}$: $\text{Pickup Zone ID} = \text{Drop Zone ID}$
   - $\text{Inter-Zone}$: $\text{Pickup Zone ID} \neq \text{Drop Zone ID}$
4. **Dynamic Rate Card Lookup**: The engine retrieves the active `RateCard` matching `orderType` (`B2B`/`B2C`) and `rateType` (`intra`/`inter`), applying:
   $$\text{Base Charge} = \max(\text{Billable Weight} \times \text{Rate Per Kg}, \text{Minimum Charge})$$
5. **COD Surcharge & Price Snapshotting**: If `paymentType === 'COD'`, a fixed surcharge is appended. Crucially, all computed rates (`rateApplied`, `codSurchargeApplied`, `totalCharge`) are **snapshotted** directly onto the `Order` document upon creation, preventing historic financial records from mutating when rate cards are updated.

---

## 3. Zone Detection Approach
Geographic delivery territories are modeled through logical `Zone` entities configured with an array of postal codes/localities (`areasCovered`):

- **Origin & Destination Parsing**: On order intake, the system extracts the destination pincode or administrative sector from raw pickup and drop addresses.
- **Relational Mapping**: The engine matches input localities against indexed `areasCovered` arrays in the `Zone` collection.
- **Fail-Safe Fallbacks**: If an address falls outside mapped boundaries, the engine flags it for manual admin zone allocation or applies a default metropolitan corridor rate.

---

## 4. Auto-Assignment & Availability Engine
To minimize dispatch latency and fuel overhead, the dispatch engine executes an automated multi-stage matching algorithm:

```
[ All Agents ] ──> [ Status Filter: 'available' ] ──> [ Zone Coverage Filter ]
                                                              │
                                                              ▼
[ Selected Agent ] <── [ Atomic State Lock ] <── [ Haversine Proximity Sort ]
```

1. **Candidate Pool Filtering**: Queries the `AgentProfile` collection strictly where `availabilityStatus === 'available'`.
2. **Zone Coverage Match**: Selects agents whose `assignedZones` contains the order's `pickupZone`.
3. **Geospatial Proximity (Haversine Distance)**: When live GPS coordinates are broadcast (`lat`, `lng`), great-circle distance to the pickup origin is calculated:
   $$d = 2R \cdot \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos\phi_1\cos\phi_2\sin^2\left(\frac{\Delta\lambda}{2}\right)}\right)$$
   Agents are ranked in ascending distance order.
4. **Reschedule Exclusion**: Excludes the agent ID who previously failed the delivery (`excludeAgentId`).
5. **Atomic State Lock**: Assigns `assignedAgent`, sets `assignmentType = 'auto'`, and updates the agent's status to `on-delivery` in an atomic operation.

---

## 5. Order Lifecycle & Failed Delivery Recovery
Order states follow a strict Finite State Machine (FSM):
$$\text{Pending} \longrightarrow \text{Assigned} \longrightarrow \text{Picked Up} \longrightarrow \text{In Transit} \longrightarrow \text{Out for Delivery} \longrightarrow \text{Delivered} \text{ / } \text{Failed}$$

- **State Transition Guard**: An FSM validator (`validateTransition`) rejects out-of-order state updates.
- **Immutable Audit Trail (`TrackingHistory`)**: Status changes trigger append-only log creation (`order`, `status`, `actor`, `notes`, `timestamp`). Mongoose middleware explicitly throws errors on `updateOne` or `deleteOne` operations.
- **Failed Delivery Recovery**:
  1. If an attempt is unsuccessful, the field agent records a mandatory exception reason (e.g., *Customer unavailable*, *Premises inaccessible*).
  2. The order transitions to `failed`, the agent status resets to `available`, and Nodemailer dispatches an immediate email alert.
  3. The customer portal renders a **Reschedule Delivery** interface allowing the customer to select a future date (tomorrow onwards).
  4. Upon submission, the order status resets to `pending`, and the auto-dispatch engine re-runs, routing the shipment to an alternative field agent.
