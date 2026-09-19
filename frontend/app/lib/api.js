let csrfToken = null;

export async function fetchCsrfToken() {
  try {
    const res = await fetch('/api/auth/csrf-token', {
      credentials: 'include',
    });
    const data = await res.json();
    if (data.success) {
      csrfToken = data.data.csrfToken;
    }
  } catch (err) {
    console.error('Failed to fetch CSRF token:', err);
  }
}

export async function api(endpoint, options = {}) {
  const {
    method = 'GET',
    body,
    headers = {},
    isFormData = false,
  } = options;

  const config = {
    method,
    credentials: 'include',
    headers: { ...headers },
  };

  if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method.toUpperCase())) {
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }
  }

  if (body) {
    if (isFormData) {
      config.body = body;
    } else {
      config.headers['Content-Type'] = 'application/json';
      config.body = JSON.stringify(body);
    }
  }

  const res = await fetch(`/api${endpoint}`, config);
  const data = await res.json();

  if (!res.ok) {
    const error = new Error(data.message || 'Something went wrong');
    error.status = res.status;
    throw error;
  }

  return data;
}
