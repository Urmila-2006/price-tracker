import axios from 'axios';

export function getApiErrorMessage(error: any): string {
  if (!axios.isAxiosError(error)) {
    return error?.message || 'An unexpected error occurred.';
  }

  if (!error.response) {
    if (error.code === 'ECONNABORTED') {
      return 'The request timed out. Please try again.';
    }
    return 'Unable to connect to the server. Please try again.';
  }

  const status = error.response.status;
  const data = error.response.data;

  // Handle FastAPI validation error format (422 Unprocessable Entity)
  if (status === 422 && data?.detail && Array.isArray(data.detail)) {
    // Extract the first validation error message
    const firstError = data.detail[0];
    if (firstError.msg && firstError.loc) {
      // e.g., "value is not a valid email address"
      const field = firstError.loc[firstError.loc.length - 1];
      return `${field}: ${firstError.msg}`;
    }
    return 'Validation error. Please check your inputs.';
  }

  // Handle standard FastAPI detail string
  if (data?.detail && typeof data.detail === 'string') {
    return data.detail;
  }

  // Fallbacks for specific HTTP status codes if no specific detail is provided
  switch (status) {
    case 400:
      return 'Bad request. Please check your data.';
    case 401:
      return 'Unauthorized. Please log in again.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 409:
      return 'A conflict occurred, such as a duplicate entry.';
    case 500:
      return 'An internal server error occurred. Please try again later.';
    case 503:
      return 'The registration service is temporarily unavailable. Please try again.';
    default:
      return `Server error (${status}). Please try again.`;
  }
}
