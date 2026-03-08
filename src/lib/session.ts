const SESSION_KEY = "namekura_session_id";

export function getSessionId() {
  const existing = window.localStorage.getItem(SESSION_KEY);

  if (existing) {
    return existing;
  }

  const created = crypto.randomUUID();
  window.localStorage.setItem(SESSION_KEY, created);
  return created;
}
