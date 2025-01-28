import { Box } from "@mui/material";
import { styled } from "@mui/system";

const WidgetWrapper = styled(Box)(({ theme }) => ({
  padding: "1.5rem 1.5rem 0.75rem 1.5rem",
  backgroundColor: theme.palette.background.alt,
  borderRadius: "0.75rem",
  height: "fit-content",
  position: "relative",
  transition: "none", // Disable transitions to prevent resize observer issues
  "& > *": {
    position: "relative",
    zIndex: 1
  }
}));

export default WidgetWrapper;