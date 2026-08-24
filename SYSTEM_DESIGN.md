# Last-Mile Delivery Tracker — System Architecture & Engineering Design

> **Executive Summary:** A high-throughput, role-partitioned logistics engine designed on the MERN stack (MongoDB, Express.js, React, Node.js). The system orchestrates dynamic rate calculations, intelligent proximity dispatching, finite state machine (FSM) lifecycles, and immutable tracking audit trails.

---

## 1. High-Level System Architecture

The architecture decouples order intake, pricing, dispatch, and tracking through isolated service boundaries:

```
┌─────────────────┐       ┌────────────────────────┐       ┌──────────────────────┐
│  React Frontend │ ───>  │  Express REST Gateway  │ ───>  │    MongoDB Atlas     │
│ (Customer/Agent/│       │ (JWT Auth & Validation)│       │ (Orders/Zones/Users) │
│     Admin)      │       └───────────┬────────────┘       └──────────┬───────────┘
└─────────────────┘                   │                               │
                      ┌───────────────┴───────────────┐               │
                      ▼                               ▼               ▼
           ┌──────────────────────┐       ┌───────────────────────────────┐
           │ Rate Engine Pipeline │       │ Intelligent Dispatch Engine   │
           │ (Volumetric/Surcharge)       │ (Haversine Proximity / Zones) │
           └──────────────────────┘       └───────────────────────────────┘
                      │                               │
                      ▼                               ▼
           ┌──────────────────────┐       ┌───────────────────────────────┐
           │ Notification Service │       │ Immutable Tracking Audit Log  │
           │ (Nodemailer / SMTP)  │       │ (Append-Only Event Ledger)    │
           └──────────────────────┘       └───────────────────────────────┘
```

---

## 2. Dynamic Rate Calculation Engine

Logistics profitability requires pricing based on parcel density rather than physical mass alone. The Rate Engine evaluates shipments via a deterministic pipeline:

```
[ L, B, H (cm) ] ──> Volumetric: (L×B×H)/5000 ──┐
                                                 ├──> Max(Actual, Volumetric) ──> Billable Weight
[ Actual Mass  ] ────────────────────────────────┘                                      │
                                                                                        ▼
[ Pricing Result ] <── + COD Surcharge (if applicable) <── Apply RateCard (Intra/Inter) Floor
```

### Mathematical Formulation
1. **Volumetric Weight**: $\text{Volumetric (kg)} = \frac{L \times B \times H}{5000}$
2. **Billable Weight**: $\text{Billable} = \max(\text{Actual Weight}, \text{Volumetric Weight})$
3. **Zone Relation Classification**:
   - **Intra-Zone** (Local): $\text{Pickup Zone} = \text{Drop Zone}$
   - **Inter-Zone** (Metro/Regional): $\text{Pickup Zone} \neq \text{Drop Zone}$
4. **Rate Application & Floor**:
   $$\text{Base Charge} = \max\left(\text{Billable Weight} \times \text{RateCard.ratePerKg}, \text{RateCard.minCharge}\right)$$
5. **COD Surcharge**: Fixed fee added if `paymentType === 'COD'`.

> [!IMPORTANT]
> **Financial Immutability (Price Snapshotting):** When an order is placed, calculated charges (`rateApplied`, `codSurchargeApplied`, `totalCharge`) are **snapshotted** permanently onto the `Order` record. Subsequent administrative rate card edits will never mutate historic invoices.

---

## 3. Zone Detection & Area Mapping

Territorial boundaries are represented as logical `Zone` documents maintaining an index of supported localities and postal codes (`areasCovered`):

| Address Input | Extraction Technique | Zone Resolution |
|---|---|---|
| *Flat 102, Connaught Place, New Delhi 110001* | Regex & token parsing extracts `110001` & `Connaught Place` | `Zone A (Central Business District)` |
| *Saket City Mall, South Delhi 110017* | Regex & token parsing extracts `110017` & `Saket` | `Zone B (South & Tech Corridor)` |

- **Relation Evaluation**: The engine checks whether origin and destination zones match to assign `intra-zone` vs `inter-zone` tariff tables.
- **Fail-Safe Handler**: Unrecognized postal codes trigger an administrative fallback queue for manual zone assignment.

---

## 4. Intelligent Auto-Assignment & Fleet Modeling

The dispatch engine balances real-time fleet availability with geographic proximity:

```
[ Available Field Fleet ] ──> [ Filter: Zone Coverage Match ]
                                          │
                                          ▼
[ Optimal Agent Selected ] <── [ Sort: Haversine Proximity (km) ] <── [ Exclude Prior Failed Agent ]
```

### Matching Pipeline
1. **Status Filter**: Selects field agents with `availabilityStatus: 'available'`.
2. **Zone Intersection**: Matches agents whose `assignedZones` contains the order's `pickupZone`.
3. **Haversine Distance Optimization**: Calculates distance between the agent's live coordinates and the pickup origin:
   $$d = 2R \cdot \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta\text{lat}}{2}\right) + \cos(\text{lat}_1)\cos(\text{lat}_2)\sin^2\left(\frac{\Delta\text{lng}}{2}\right)}\right)$$
4. **Historical Reschedule Exclusion**: If an attempt was previously failed, the engine explicitly excludes the prior agent (`excludeAgentId`) to avoid duplicate field bottlenecks.
5. **State Lock**: Assigns the agent and updates their availability to `on-delivery`.

---

## 5. Order Lifecycle & Failed Delivery Recovery

Order transitions strictly follow a Finite State Machine (FSM):

$$\text{Pending} \xrightarrow{\text{Dispatch}} \text{Assigned} \xrightarrow{\text{Pickup}} \text{Picked Up} \xrightarrow{\text{Transit}} \text{In Transit} \xrightarrow{\text{Arrival}} \text{Out for Delivery} \xrightarrow{\text{Handover}} \begin{cases} \mathbf{Delivered} \\ \mathbf{Failed} \xrightarrow{\text{Reschedule}} \text{Pending} \end{cases}$$

### Lifecycle State Table
| State | Trigger | Actor | Side Effects |
|---|---|---|---|
| `pending` | Customer places order | Customer | Snapshot pricing; emit order confirmation email. |
| `assigned` | Auto/Manual dispatch | Admin | Lock agent to `on-delivery`; log dispatch timestamp. |
| `picked-up` | Package collected | Agent | Progress stepper; update tracking timeline. |
| `in-transit` | Corridor transit | Agent | Customer notified package is in transit. |
| `out-for-delivery`| Arriving at destination | Agent | Send arrival alert with agent contact info. |
| `delivered` | Recipient handover | Agent | Free agent to `available`; terminal completion. |
| `failed` | Delivery unsuccessful | Agent | Record mandatory failure reason; email reschedule link. |

### Failed Delivery Exception Flow
1. **Mandatory Reason Capture**: The field agent selects a structured reason (*Customer unavailable*, *Incorrect address*, *Premises closed*).
2. **Agent Recovery**: The order transitions to `failed`, and the agent is immediately freed back to `available`.
3. **Customer Self-Service Reschedule**: The customer portal unlocks a date picker (tomorrow onwards) and special instruction input.
4. **Automated Re-Dispatch**: Submitting a reschedule resets the order to `pending` and re-triggers auto-assignment to a new field agent.

> [!TIP]
> **Append-Only Tracking Audit Trail:** All status updates append an immutable record to `TrackingHistory` (`order`, `status`, `actor`, `notes`, `timestamp`). Mongoose database hooks reject update/delete mutations, creating a tamper-proof logistics audit ledger.
