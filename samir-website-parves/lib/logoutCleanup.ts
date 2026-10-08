import { AppDispatch } from "@/redux/store";
import { logout } from "@/redux/features/authSlice";
import { baseApi } from "@/redux/api/baseApi";

/**
 * Reusable logout helper that dispatches logout, resets RTK query state,
 * and clears localStorage, sessionStorage, cache storage, and cookies.
 */
export const performLogout = (dispatch: AppDispatch) => {
  // 1. Dispatch auth slice logout (clears state user/token and deletes token cookie)
  dispatch(logout());

  // 2. Reset RTK Query cache state completely
  dispatch(baseApi.util.resetApiState());

  // 3. Clear client-side cache and storage systems
  if (typeof window !== "undefined") {
    // Clear Local Storage
    localStorage.clear();

    // Clear Session Storage
    sessionStorage.clear();

    // Clear Cache Storage (Cache API)
    if ("caches" in window) {
      caches.keys().then((names) => {
        names.forEach((name) => {
          caches.delete(name);
        });
      });
    }

    // Clear all cookies
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
  }
};
