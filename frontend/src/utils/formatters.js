/**
 * Format currency with Rupee symbol
 */
export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
  return `₹${Number(amount).toLocaleString('en-IN')}`;
};

/**
 * Format date & time cleanly
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format short date
 */
export const formatDateOnly = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Format package dimensions
 */
export const formatDimensions = (dimensions) => {
  if (!dimensions) return 'N/A';
  return `${dimensions.length} × ${dimensions.breadth} × ${dimensions.height} cm`;
};
