const TOKEN_KEY = 'tradetrust_token';

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export async function apiClient(endpoint, { method = 'GET', body, headers = {} } = {}) {
  const token = getAuthToken();
  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };

  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  if (body !== undefined) {
    config.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  try {
    const res = await fetch(endpoint, config);
    const contentType = res.headers.get('content-type');
    let data = null;

    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text };
      }
    }

    if (!res.ok) {
      return {
        success: false,
        status: res.status,
        message: data?.error || data?.message || `Request failed with status ${res.status}`,
        data: null
      };
    }

    return {
      success: true,
      status: res.status,
      message: data?.message || 'Success',
      data: data?.data !== undefined ? data.data : data
    };
  } catch (err) {
    console.error(`[apiClient] Network error on ${endpoint}:`, err);
    return {
      success: false,
      message: err.message || 'Network request failed',
      data: null
    };
  }
}
