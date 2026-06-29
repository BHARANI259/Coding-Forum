import type { AuthUser, CurrentUser, UserRole } from "./api";

const TOKEN_KEY = "kec_auth_token";
const USER_KEY = "kec_auth_user";
const PASSWORD_REDIRECT_KEY = "kec_post_password_redirect";

export function saveAuthUser(user: AuthUser) {
  setAuth(user);
}

export function setAuth(user: AuthUser) {
  if (!hasBrowserStorage()) {
    return;
  }
  window.localStorage.setItem(TOKEN_KEY, user.token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(withoutToken(user)));
}

export function updateStoredUser(user: CurrentUser) {
  if (!hasBrowserStorage()) {
    return;
  }
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getAuthToken() {
  return getToken();
}

export function getToken() {
  if (!hasBrowserStorage()) {
    return null;
  }
  return window.localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): CurrentUser | null {
  return getCurrentUser();
}

export function getCurrentUser(): CurrentUser | null {
  if (!hasBrowserStorage()) {
    return null;
  }
  const value = window.localStorage.getItem(USER_KEY);
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as CurrentUser;
  } catch {
    return null;
  }
}

export function logout() {
  clearAuth();
}

export function clearAuth() {
  if (!hasBrowserStorage()) {
    return;
  }
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  window.localStorage.removeItem(PASSWORD_REDIRECT_KEY);
}

export function setPostPasswordRedirect(path: string) {
  if (!hasBrowserStorage()) {
    return;
  }
  window.localStorage.setItem(PASSWORD_REDIRECT_KEY, path);
}

export function consumePostPasswordRedirect(role: UserRole) {
  if (!hasBrowserStorage()) {
    return dashboardPathForRole(role);
  }
  const stored = window.localStorage.getItem(PASSWORD_REDIRECT_KEY);
  window.localStorage.removeItem(PASSWORD_REDIRECT_KEY);
  return stored ?? dashboardPathForRole(role);
}

export function dashboardPathForRole(role: UserRole) {
  return getDashboardPath(role);
}

export function getDashboardPath(role: UserRole) {
  if (role === "STUDENT") {
    return "/student/dashboard";
  }
  if (role === "FACULTY") {
    return "/faculty/dashboard";
  }
  return "/admin/dashboard";
}

export function loginPathForRole(role: UserRole) {
  return getLoginPath(role);
}

export function getLoginPath(role: UserRole) {
  if (role === "STUDENT") {
    return "/auth/student/login";
  }
  if (role === "FACULTY") {
    return "/auth/faculty/login";
  }
  return "/auth/admin/login";
}

function withoutToken(user: AuthUser): CurrentUser {
  const { token, ...currentUser } = user;
  void token;
  return currentUser;
}

function hasBrowserStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}
