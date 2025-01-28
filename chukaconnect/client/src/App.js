import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import HomePage from "scenes/homePage";
import LoginPage from "scenes/loginPage";
import ProfilePage from "scenes/profilePage";
import SearchPage from "scenes/searchPage";
import MessagingPage from "scenes/messaging/MessagingPage";
import ResetPasswordPage from "scenes/resetPassword/ResetPasswordPage";
import PostPage from "scenes/postPage";
import ChatPage from "scenes/chatPage";
import { useMemo } from "react";
import { useSelector } from "react-redux";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { createTheme } from "@mui/material/styles";
import { themeSettings } from "./theme";

function App() {
  const mode = useSelector((state) => state.mode);
  const theme = useMemo(() => createTheme(themeSettings(mode)), [mode]);
  const isAuth = Boolean(useSelector((state) => state.token));

  return (
    <div className="app">
      <BrowserRouter future={{ 
        v7_startTransition: true,
        v7_relativeSplatPath: true 
      }}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
            <Route
              path="/home"
              element={isAuth ? <HomePage /> : <Navigate to="/" />}
            />
            <Route
              path="/profile/:userId"
              element={isAuth ? <ProfilePage /> : <Navigate to="/" />}
            />
            <Route
              path="/search"
              element={isAuth ? <SearchPage /> : <Navigate to="/" />}
            />
            <Route
              path="/messages"
              element={isAuth ? <MessagingPage /> : <Navigate to="/" />}
            />
            <Route
              path="/posts/:id"
              element={isAuth ? <PostPage /> : <Navigate to="/" />}
            />
            <Route
              path="/chat"
              element={isAuth ? <ChatPage /> : <Navigate to="/" />}
            />
          </Routes>
        </ThemeProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;