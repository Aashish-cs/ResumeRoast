const API_URL = import.meta.env.PROD ? "/api" : (import.meta.env.VITE_API_URL || "http://localhost:5001/api");
// Remove tokens left by older releases. Sessions now live in HttpOnly cookies.
localStorage.removeItem("resumeroast_token");

const parseResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
};

export const apiRequest = async (path, options = {}) => {
  const headers = {
    ...(options.headers || {}),
  };

  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers,
    body:
      options.body && !(options.body instanceof FormData)
        ? JSON.stringify(options.body)
        : options.body,
  });

  const data = await parseResponse(response);

  if (!response.ok) {
    const message =
      typeof data === "object" && data?.message
        ? data.message
        : "Request failed.";
    const error = new Error(message);
    error.code = data?.code;
    error.details = data;
    throw error;
  }

  return data;
};

export const downloadRewrite = async ({ analysisId, format }) => {
  const response = await fetch(
    `${API_URL}/analyses/${analysisId}/download/${format}`,
    {
      credentials: "include",
    },
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
