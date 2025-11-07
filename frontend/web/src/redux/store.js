import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
  devTools: import.meta.env.MODE !== "production",

});
//sử dụng redux devtools sử dụng state bất cứ nơi đâu trong app
