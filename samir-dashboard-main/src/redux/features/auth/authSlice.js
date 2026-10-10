import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  token: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action) => {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      // console.log('action from authSlice', action);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
    },
    getUser: (state, action) => {
      state.user = action.payload;
    },
  },
});

export const { setUser, logout, getUser } = authSlice.actions;
export default authSlice.reducer;

export const userCurrentTooken = (state) => state.auth.token;
export const userCurrentUser = (state) => state.auth.user;
