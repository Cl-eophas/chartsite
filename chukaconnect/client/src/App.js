import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import HomePage from "scenes/homePage";
import LoginPage from "scenes/loginPage";
import ProfilePage from "scenes/profilePage";
import MessagesPage from "scenes/messagesPage";
import ChatPage from "scenes/chatPage";
import Navbar from "scenes/navbar";
import { useMemo } from "react";
import { useSelector } from "react-redux";
import { CssBaseline, ThemeProvider, Box } from "@mui/material";
import { createTheme } from "@mui/material/styles";
import { themeSettings } from "./theme";

function App() {
  const mode = useSelector((state) => state.mode);
  const theme = useMemo(() => createTheme(themeSettings(mode)), [mode]);
  const isAuth = Boolean(useSelector((state) => state.token));

  return (
    <div className="app">
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route
              path="/*"
              element={
                isAuth ? (
                  <>
                    <Navbar />
                    <Box sx={{ pt: "4rem" }}>
                      <Routes>
                        <Route path="/home" element={<HomePage />} />
                        <Route path="/profile/:userId" element={<ProfilePage />} />
                        <Route path="/messages" element={<MessagesPage />} />
                        <Route path="/messages/:userId" element={<ChatPage />} />
                        <Route path="*" element={<Navigate to="/home" />} />
                      </Routes>
                    </Box>
                  </>
                ) : (
                  <Navigate to="/" />
                )
              }
            />
          </Routes>
        </ThemeProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;