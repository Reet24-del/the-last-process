const STORAGE = "last-process-session-v1";
let memoryToken = null;

export function getToken() {
  try {
    return localStorage.getItem(STORAGE) || memoryToken;
  } catch {
    return memoryToken;
  }
}

export function saveToken(token) {
  memoryToken = token;
  try {
    localStorage.setItem(STORAGE, token);
  } catch {
    /* Private browsing can deny storage. */
  }
}

export async function api(path, body, signal) {
  const response = await fetch(`/api/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      "Content-Type": "application/json",
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: signal || AbortSignal.timeout(45000),
  });
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error(
      "The archive is still waking up. Please try again shortly.",
    );
  }
  if (!response.ok) {
    const error = new Error(
      typeof result.detail === "string"
        ? result.detail
        : "The archive could not read that request.",
    );
    error.status = response.status;
    throw error;
  }
  return result;
}
