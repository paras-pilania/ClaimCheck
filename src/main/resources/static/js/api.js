// All communication with the Spring Boot REST API lives here.
// The browser never sees the Gemini key: it only talks to our own /api endpoints.

export class ApiError extends Error {
  constructor(status, message, details = []) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request(method, path, body) {
  let response;
  try {
    response = await fetch('/api' + path, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    throw new ApiError(0, 'Cannot reach the ClaimCheck server. Is Spring Boot running on port 8080?');
  }
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (e) { /* non-JSON body */ }
  if (!response.ok) {
    throw new ApiError(response.status, (data && data.message) || `Request failed (HTTP ${response.status}).`,
      (data && data.details) || []);
  }
  return data;
}

export const api = {
  listClaims: () => request('GET', '/claims'),
  getClaim: (id) => request('GET', `/claims/${id}`),
  getHistory: (id) => request('GET', `/claims/${id}/history`),
  createClaim: (payload) => request('POST', '/claims', payload),
  resubmitClaim: (id, payload) => request('PUT', `/claims/${id}/resubmission`, payload),
  changeStatus: (id, payload) => request('PATCH', `/claims/${id}/status`, payload),
  extractClaim: (billText) => request('POST', '/ai/extract-claim', { billText }),
};
