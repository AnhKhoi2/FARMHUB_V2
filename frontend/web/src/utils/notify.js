import { toast } from 'react-hot-toast';

export function extractErrorMessage(err) {
  try {
    if (!err) return 'Lỗi không xác định';
    // Axios error with response
    if (err.response && err.response.data) {
      const data = err.response.data;
      // If backend returns structured validation errors
      if (data.message && data.errors && typeof data.errors === 'object') {
        const details = Object.values(data.errors).filter(Boolean).join('; ');
        return details ? `${data.message}: ${details}` : data.message;
      }
      if (data.message) return data.message;
      // Some endpoints return { success:false, error: '...' }
      if (data.error) return data.error;
      // fallback to raw string
      return JSON.stringify(data);
    }

    // Plain error with message
    if (err.message) return err.message;
    return String(err);
  } catch (e) {
    return 'Lỗi không xác định';
  }
}

export function showError(err, opts = {}) {
  const msg = extractErrorMessage(err);
  toast.error(msg, opts);
}

export function showSuccess(msg, opts = {}) {
  toast.success(msg, opts);
}
