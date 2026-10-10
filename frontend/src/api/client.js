const TOKEN_KEY = 'tradetrust_token';
const USER_KEY = 'tradetrust_user';

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

export function clearAuthSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem('tradetrust_current_user');
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('tradetrust_session_expired'));
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

        if (res.status === 401) {
      clearAuthSession();
    }

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

/**
 * Uploads a file to /api/upload.
 */
export async function uploadFile(file) {
  if (!file) {
    throw new Error('No file provided');
  }

  const formData = new FormData();
  formData.append('file', file);

  const token = getAuthToken();
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch('/api/upload', {
    method: 'POST',
    headers,
    body: formData
  });

  if (res.status === 401) {
    clearAuthSession();
    throw new Error('Session expired. Please log in again.');
  }

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

  if (!res.ok || !data.success) {
    throw new Error(data?.message || 'File upload failed');
  }

  return data.data; // { url, filename, originalName }
}

/**
 * Opens a proof document in a new tab.
 */
export function openProofDocument(proofPath, fileName = 'dispute_proof') {
  if (!proofPath) return;

  if (proofPath.startsWith('data:')) {
    try {
      const parts = proofPath.split(',');
      const mimeMatch = parts[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
      const byteString = atob(parts[1]);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mime });
      const blobUrl = URL.createObjectURL(blob);
      const newWin = window.open(blobUrl, '_blank');
      if (!newWin) {
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = fileName;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
      return;
    } catch (err) {
      console.error('[TradeTrust] Error converting data URL to blob:', err);
    }
  }

  window.open(proofPath, '_blank');
}

/**
 * Formats byte size into human readable string (KB, MB).
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
