import { authApi, type ApiUser } from "./api";
import { getAccessToken, getSessionEpoch, logout, USER_KEY } from "./auth";

/** Cached browser roles are presentation data. Resolve identity at the backend. */
export async function validateManagementSession(): Promise<ApiUser | null> {
  const token = getAccessToken();
  if (!token) return null;
  const epoch = getSessionEpoch();
  const isCurrentSession = () =>
    epoch === getSessionEpoch() && token === getAccessToken();

  try {
    const response = await authApi.getMe();
    if (!isCurrentSession()) return null;
    const user = response.data;
    if (!response.success || !user?.is_active || !["admin", "seller"].includes(user.role)) {
      logout("access_denied");
      return null;
    }
    // Refresh display data without emitting another login event or resetting the session.
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  } catch {
    if (isCurrentSession()) logout("session_validation_failed");
    return null;
  }
}
