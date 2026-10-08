import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
  profileImage?: string;
  contactNumber?: string;
  country?: string;
  isHotel?: boolean;
  isSubscribed?: boolean;
  isService?: boolean;
}

interface AuthState {
  token: string | null;
  user: User | null;
}

// Client-side helper functions for cookies
const setCookie = (name: string, value: string, days = 7) => {
  if (typeof window === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
};

const getCookie = (name: string): string | null => {
  if (typeof window === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return decodeURIComponent(parts.pop()?.split(";").shift() || "");
  }
  return null;
};

const deleteCookie = (name: string) => {
  if (typeof window === "undefined") return;
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax`;
};

// Helper to decode JWT token client-side without external dependencies
export const decodeToken = (token: string): any => {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

const getInitialUser = () => {
  if (typeof window === "undefined") return null;
  try {
    const userStr = localStorage.getItem("user");
    if (!userStr || userStr === "undefined") return null;
    return JSON.parse(userStr);
  } catch (e) {
    return null;
  }
};

// Initial state
const initialState: AuthState = {
  token: typeof window !== "undefined" ? getCookie("token") : null,
  user: getInitialUser(),
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ token: string; user: Omit<User, "id" | "email" | "role"> & Partial<User> }>
    ) => {
      const { token, user } = action.payload;
      state.token = token;
      
      const decoded = decodeToken(token);
      const fullUser: User = {
        ...user,
        id: decoded?.id || user?.id || "",
        email: decoded?.email || user?.email || "",
        role: decoded?.role || user?.role || "",
        fullName: decoded?.fullName || user?.fullName || "",
      };
      
      state.user = fullUser;
      setCookie("token", token);
      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(fullUser));
      }
    },
    setTokenOnly: (state, action: PayloadAction<{ token: string }>) => {
      const { token } = action.payload;
      state.token = token;
      setCookie("token", token);
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      deleteCookie("token");
      if (typeof window !== "undefined") {
        localStorage.removeItem("user");
      }
    },
  },
});

export const { setCredentials, setTokenOnly, logout } = authSlice.actions;
export default authSlice.reducer;
