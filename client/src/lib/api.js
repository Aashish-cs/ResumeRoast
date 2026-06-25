const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";
const TOKEN_KEY = "resumeroast_token";

export const getStoredToken = () => localStorage.getItem(TOKEN_KEY);

export const storeToken = (token) => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
};

export const clearStoredToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

const parseResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
};

export const apiRequest = async (path, options = {}) => {
  const token = options.token ?? getStoredToken();
  const headers = {
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    body:
      options.body && !(options.body instanceof FormData)
        ? JSON.stringify(options.body)
        : options.body
  });

  const data = await parseResponse(response);

  if (!response.ok) {
    const message =
      typeof data === "object" && data?.message ? data.message : "Request failed.";
    const error = new Error(message);
    error.code = data?.code;
    error.details = data;
    throw error;
  }

  return data;
};

export const downloadRewrite = async ({ analysisId, format }) => {
  const token = getStoredToken();
  const response = await fetch(
    `${API_URL}/analyses/${analysisId}/download/${format}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  if (!response.ok) {
    const data = await parseResponse(response);
    throw new Error(data?.message || "Download failed.");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `resumeroast-rewrite.${format}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
