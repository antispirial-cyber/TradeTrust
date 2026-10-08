import { getAuthToken } from '../api/client';

/**
 * Uploads an evidence file (Image or PDF) to the backend /api/upload.
 * Falls back to Data URL for client-first/offline preview.
 */
export async function uploadEvidenceFile(file) {
  if (!file) return null;

  // 1. Attempt multipart backend upload
  try {
    const formData = new FormData();
    formData.append('file', file);
    const token = getAuthToken();
    const headers = {};
    if (token) {
      headers['Authorization'] = 'Bearer ' + token;
    }

    const res = await fetch('/api/upload', {
      method: 'POST',
      headers,
      body: formData
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data && json.data.url) {
        return json.data.url;
      }
    }
  } catch (err) {
    console.warn('[TradeTrust] Backend upload unavailable, using client fallback:', err);
  }

  // 2. Client fallback: Data URL encoding (works for PDFs and images in browser)
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => resolve(file.name);
    reader.readAsDataURL(file);
  });
}
