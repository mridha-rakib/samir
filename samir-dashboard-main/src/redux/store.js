import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import authReducer from "./features/auth/authSlice";
import { baseApi } from "./baseUrl";

const appReducer = combineReducers({
  auth: authReducer,

  [baseApi.reducerPath]: baseApi.reducer,
});

const rootReducer = (state, action) => {
  if (action.type === "auth/logout") {
    if (typeof window !== "undefined") {
      localStorage.clear();
    }
    state = undefined;
  }
  return appReducer(state, action);
};

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth"],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat([baseApi.middleware]),
});

export const persistor = persistStore(store);
