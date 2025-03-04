import { Box, Typography, useMediaQuery, Container } from "@mui/material";
import Form from "./Form";

const LoginPage = () => {
  const isNonMobileScreens = useMediaQuery("(min-width: 1000px)");

  return (
    <Box
      sx={{
        background: `linear-gradient(
          135deg,
          #1a472a,  /* Dark Green */
          #000080,  /* Navy Blue */
          #87CEEB,  /* Sky Blue */
          #E0FFFF   /* Pale Blue */
        )`,
        backgroundSize: "400% 400%",
        animation: "gradient 15s ease infinite",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
        overflow: "hidden",
        "@keyframes gradient": {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        "&::before": {
          content: '""',
          position: "absolute",
          width: "200%",
          height: "200%",
          top: "-50%",
          left: "-50%",
          background: "radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)",
          animation: "water 15s linear infinite",
        },
        "@keyframes water": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        }
      }}
    >
      {/* Header */}
      <Box
        width="100%"
        p="1rem 6%"
        textAlign="center"
        sx={{
          background: "rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(10px)",
          boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.3)",
          position: "relative",
          zIndex: 1,
        }}
      >
        <Typography
          fontWeight="bold"
          fontSize="32px"
          sx={{
            background: "linear-gradient(45deg, #E0FFFF, #1a472a)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            animation: "textShine 3s ease infinite",
            "@keyframes textShine": {
              "0%": { backgroundPosition: "0% 50%" },
              "50%": { backgroundPosition: "100% 50%" },
              "100%": { backgroundPosition: "0% 50%" },
            },
          }}
        >
          CHUKA CONNECT
        </Typography>
      </Box>

      {/* Welcome Message */}
      <Container maxWidth="md" sx={{ textAlign: "center", my: 4, position: "relative", zIndex: 1 }}>
        <Typography
          variant="h4"
          sx={{
            color: "#E0FFFF",
            textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
            mb: 2,
            opacity: 0,
            animation: "fadeIn 1s ease-out forwards",
            "@keyframes fadeIn": {
              "0%": { opacity: 0, transform: "translateY(20px)" },
              "100%": { opacity: 1, transform: "translateY(0)" }
            }
          }}
        >
          Welcome to Chuka University's Digital Community
        </Typography>
        <Typography
          variant="h6"
          sx={{
            color: "#E0FFFF",
            opacity: 0.9,
            maxWidth: "600px",
            margin: "0 auto",
            animation: "fadeIn 1s ease-out 0.5s forwards",
            opacity: 0,
          }}
        >
          Connect, Collaborate, and Create with fellow students and alumni in our vibrant academic community
        </Typography>
      </Container>

      {/* Form Container */}
      <Box
        width={isNonMobileScreens ? "80%" : "90%"}
        maxWidth="1200px"
        p={isNonMobileScreens ? "2rem" : "1rem"}
        m="2rem auto"
        borderRadius="1.5rem"
        sx={{
          background: "rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
          position: "relative",
          zIndex: 1,
          animation: "slideUp 0.8s ease-out",
          "@keyframes slideUp": {
            "0%": { opacity: 0, transform: "translateY(50px)" },
            "100%": { opacity: 1, transform: "translateY(0)" }
          }
        }}
      >
        <Form />
      </Box>

      {/* Floating Bubbles */}
      <Box
        sx={{
          position: "absolute",
          width: "100%",
          height: "100%",
          top: 0,
          left: 0,
          pointerEvents: "none",
          "& > div": {
            position: "absolute",
            background: "rgba(255, 255, 255, 0.1)",
            borderRadius: "50%",
            animation: "float 8s infinite",
          },
          "& > div:nth-of-type(1)": { width: "60px", height: "60px", left: "10%", animationDelay: "0s" },
          "& > div:nth-of-type(2)": { width: "80px", height: "80px", left: "20%", animationDelay: "2s" },
          "& > div:nth-of-type(3)": { width: "40px", height: "40px", left: "30%", animationDelay: "4s" },
          "& > div:nth-of-type(4)": { width: "70px", height: "70px", left: "40%", animationDelay: "6s" },
          "@keyframes float": {
            "0%": { transform: "translateY(100vh) scale(0)" },
            "100%": { transform: "translateY(-100vh) scale(1)" }
          }
        }}
      >
        <div />
        <div />
        <div />
        <div />
      </Box>
    </Box>
  );
};

export default LoginPage;