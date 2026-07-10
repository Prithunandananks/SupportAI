import axios from "axios";

export const extractErrorMessage = (err: unknown, defaultMessage = "An error occurred."): string => {
  if (axios.isAxiosError(err)) {
    if (err.response?.data?.detail) {
      const detail = err.response.data.detail;
      if (typeof detail === "string") {
        return detail;
      }
      if (Array.isArray(detail) && detail.length > 0 && detail[0].msg) {
        return detail[0].msg;
      }
    }
    
    // Status based default messages if detail is missing
    const status = err.response?.status;
    if (status === 400) return "Bad Request.";
    if (status === 401) return "Unauthorized. Please log in again.";
    if (status === 403) return "Forbidden. You do not have permission.";
    if (status === 404) return "Endpoint not found.";
    if (status === 413) return "Payload Too Large. The file is too big.";
    if (status === 415) return "Unsupported Media Type.";
    if (status === 422) return "Validation Error. Invalid data.";
    if (status && status >= 500) return "Internal Server Error. Please try again later.";
  }

  if (err instanceof Error) {
    return err.message;
  }
  
  return defaultMessage;
};
