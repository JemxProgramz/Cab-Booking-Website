export async function fetchApi(url: string, options: RequestInit = {}) {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!res.ok) {
      let message = 'An error occurred';
      try {
        const errorData = await res.json();
        message = errorData.error || message;
      } catch (e) {
        message = await res.text() || res.statusText;
      }
      throw new Error(message);
    }

    return await res.json();
  } catch (error: any) {
    // If it's a TypeError: Failed to fetch, it's likely a network error
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      throw new Error('Network error: Unable to reach the server. Please check your connection or try again later.');
    }
    throw error;
  }
}
