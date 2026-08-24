const { Zone, RateCard } = require('../models');

/**
 * Detects which zone an address belongs to based on admin-configured area strings / pincodes.
 * Case-insensitive regex matching.
 * @param {string} address - Full address string (e.g. "Flat 204, Connaught Place, New Delhi 110001")
 * @param {Array} activeZones - List of active Zone documents
 * @returns {Object|null} Matching zone document or null
 */
const detectZoneFromAddress = (address, activeZones) => {
  if (!address || typeof address !== 'string' || !activeZones || activeZones.length === 0) {
    return null;
  }

  const normalizedAddress = address.toLowerCase();

  let bestMatchZone = null;
  let highestMatchScore = 0;

  for (const zone of activeZones) {
    if (!zone.areasCovered || zone.areasCovered.length === 0) continue;

    for (const area of zone.areasCovered) {
      const areaTrimmed = area.trim().toLowerCase();
      if (!areaTrimmed) continue;

      // Check for pincode (digits) exact boundary match or substring match
      const isDigits = /^\d+$/.test(areaTrimmed);
      let isMatch = false;

      if (isDigits) {
        // Regex word boundary for digits: \b110001\b
        const regex = new RegExp(`\\b${areaTrimmed}\\b`, 'i');
        isMatch = regex.test(normalizedAddress);
      } else {
        // Substring / word match for locality names (e.g., 'Connaught Place', 'Saket')
        isMatch = normalizedAddress.includes(areaTrimmed);
      }

      if (isMatch) {
        // Score based on area string length to prefer more specific matches
        const score = areaTrimmed.length + (isDigits ? 10 : 0);
        if (score > highestMatchScore) {
          highestMatchScore = score;
          bestMatchZone = zone;
        }
      }
    }
  }

  return bestMatchZone;
};

/**
 * Calculates delivery charges strictly adhering to Section 3 of README:
 * 1. Zone detection (pickupZone & dropZone)
 * 2. Volumetric weight = (L × B × H) / 5000
 * 3. Billable weight = max(actualWeight, volumetricWeight)
 * 4. Rate lookup: intra-zone vs inter-zone from active RateCard (B2B/B2C)
 * 5. Base charge = max(billableWeight * ratePerKg, minCharge)
 * 6. COD surcharge = added if paymentType === 'COD'
 * 7. Final charge = baseCharge + codSurcharge
 *
 * @param {Object} params
 * @returns {Promise<Object>} Complete charge breakdown and zone resolution
 */
const calculateRate = async ({
  pickupAddress,
  dropAddress,
  pickupZoneId,
  dropZoneId,
  dimensions, // { length, breadth, height }
  actualWeight, // in kg
  orderType, // 'B2B' | 'B2C'
  paymentType, // 'Prepaid' | 'COD'
}) => {
  // 1. Validation of inputs
  if (!pickupAddress || !dropAddress) {
    throw new Error('Both pickup and drop addresses are required.');
  }

  if (
    !dimensions ||
    dimensions.length <= 0 ||
    dimensions.breadth <= 0 ||
    dimensions.height <= 0
  ) {
    throw new Error('Valid package dimensions (length, breadth, height in cm) are required.');
  }

  const weightNum = parseFloat(actualWeight);
  if (isNaN(weightNum) || weightNum <= 0) {
    throw new Error('Valid actual package weight (in kg) is required.');
  }

  if (!['B2B', 'B2C'].includes(orderType)) {
    throw new Error('Order type must be either B2B or B2C.');
  }

  if (!['Prepaid', 'COD'].includes(paymentType)) {
    throw new Error('Payment type must be either Prepaid or COD.');
  }

  // 2. Fetch all active zones
  const activeZones = await Zone.find({ isActive: true });
  if (!activeZones || activeZones.length === 0) {
    throw new Error('No active zones found in the database. Please configure zones in the Admin Panel.');
  }

  // 3. Resolve Pickup Zone
  let pickupZone = null;
  if (pickupZoneId) {
    pickupZone = activeZones.find((z) => z._id.toString() === pickupZoneId.toString());
  }
  if (!pickupZone) {
    pickupZone = detectZoneFromAddress(pickupAddress, activeZones);
  }
  if (!pickupZone) {
    throw new Error(
      `Could not determine pickup zone for address: "${pickupAddress}". Ensure the locality or pincode is mapped to a zone.`
    );
  }

  // 4. Resolve Drop Zone
  let dropZone = null;
  if (dropZoneId) {
    dropZone = activeZones.find((z) => z._id.toString() === dropZoneId.toString());
  }
  if (!dropZone) {
    dropZone = detectZoneFromAddress(dropAddress, activeZones);
  }
  if (!dropZone) {
    throw new Error(
      `Could not determine drop zone for address: "${dropAddress}". Ensure the locality or pincode is mapped to a zone.`
    );
  }

  // 5. Compute Volumetric Weight: (L × B × H) / 5000
  const l = parseFloat(dimensions.length);
  const b = parseFloat(dimensions.breadth);
  const h = parseFloat(dimensions.height);
  const volumetricWeightRaw = (l * b * h) / 5000;
  const volumetricWeight = parseFloat(volumetricWeightRaw.toFixed(2));

  // 6. Compute Billable Weight: max(actualWeight, volumetricWeight)
  const billableWeight = parseFloat(Math.max(weightNum, volumetricWeight).toFixed(2));

  // 7. Determine Rate Type (intra-zone vs inter-zone)
  const isIntraZone = pickupZone._id.toString() === dropZone._id.toString();
  const rateType = isIntraZone ? 'intra-zone' : 'inter-zone';

  // 8. Lookup active RateCard from database
  const rateCard = await RateCard.findOne({
    orderType,
    rateType,
    isActive: true,
  });

  if (!rateCard) {
    throw new Error(
      `No active rate card configured for Order Type: "${orderType}" and Rate Type: "${rateType}". Please configure it in the Admin Panel.`
    );
  }

  // 9. Compute Base Charge respecting minCharge floor
  const rawBaseCharge = billableWeight * rateCard.ratePerKg;
  const minChargeFloor = rateCard.minCharge || 0;
  const baseCharge = parseFloat(Math.max(rawBaseCharge, minChargeFloor).toFixed(2));

  // 10. Compute COD Surcharge
  const codSurchargeApplied = paymentType === 'COD' ? Number(rateCard.codSurcharge || 0) : 0;

  // 11. Final Charge
  const totalCharge = parseFloat((baseCharge + codSurchargeApplied).toFixed(2));

  return {
    pickupZone: {
      id: pickupZone._id,
      name: pickupZone.name,
    },
    dropZone: {
      id: dropZone._id,
      name: dropZone.name,
    },
    rateType, // 'intra-zone' | 'inter-zone'
    dimensions: { length: l, breadth: b, height: h },
    actualWeight: weightNum,
    volumetricWeight,
    billableWeight,
    orderType,
    paymentType,
    rateCard: {
      id: rateCard._id,
      ratePerKg: rateCard.ratePerKg,
      minCharge: rateCard.minCharge,
      codSurcharge: rateCard.codSurcharge,
    },
    rateApplied: rateCard.ratePerKg,
    baseCharge,
    minChargeApplied: rawBaseCharge < minChargeFloor,
    codSurchargeApplied,
    totalCharge,
  };
};

module.exports = {
  detectZoneFromAddress,
  calculateRate,
};
