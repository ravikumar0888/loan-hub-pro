const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getAuthToken = (): string | null => localStorage.getItem('auth_token');

/**
 * Opens a blank tab synchronously (so browsers don't treat it as a popup),
 * then fetches the resource with the auth header and navigates the tab to
 * an object URL for it. Use for any PDF/file that used to be a plain
 * window.open(staticUrl) call.
 */
export async function openAuthenticatedFile(relativePath: string): Promise<void> {
  const tab = window.open('', '_blank');
  const token = getAuthToken();

  const isUpload = relativePath.startsWith('/uploads/');
  const endpoint = isUpload ? '/files/upload' : '/files/pdf';

  try {
    const response = await fetch(`${API_URL}${endpoint}?path=${encodeURIComponent(relativePath)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!response.ok) {
      if (tab) tab.close();
      throw new Error('Failed to load file');
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    if (tab) {
      tab.location.href = blobUrl;
    }
  } catch (error) {
    if (tab) tab.close();
    throw error;
  }
}

/**
 * Same pattern, but for endpoints that stream the PDF directly
 * (e.g. GET /invoices/:id/download) rather than a static /pdfs path.
 */
export async function openAuthenticatedEndpoint(endpointPath: string): Promise<void> {
  const tab = window.open('', '_blank');
  const token = getAuthToken();

  try {
    const response = await fetch(`${API_URL}${endpointPath}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!response.ok) {
      if (tab) tab.close();
      throw new Error('Failed to load file');
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    if (tab) {
      tab.location.href = blobUrl;
    }
  } catch (error) {
    if (tab) tab.close();
    throw error;
  }
}
