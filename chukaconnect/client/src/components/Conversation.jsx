import { Box, Typography, useTheme } from "@mui/material";
import FlexBetween from "./FlexBetween";
import UserImage from "./UserImage";
import { formatDistanceToNow } from "date-fns";

const Conversation = ({ conversation, selected, onClick }) => {
  const theme = useTheme();
  
  // Handle both direct user objects and nested user objects
  const user = conversation.user || conversation;
  const lastMessage = conversation.lastMessage;

  if (!user || !user.firstName) return null;

  return (
    <FlexBetween
      onClick={onClick}
      gap="1rem"
      sx={{
        "&:hover": {
          backgroundColor: theme.palette.background.light,
          cursor: "pointer",
        },
        backgroundColor: selected
          ? theme.palette.background.light
          : "transparent",
        borderRadius: "0.75rem",
        padding: "0.75rem",
      }}
    >
      <UserImage image={user.picturePath} size="55px" />
      <Box
        width="100%"
        display="flex"
        flexDirection="column"
        justifyContent="space-between"
      >
        <Box>
          <Typography
            color={theme.palette.neutral.main}
            variant="h5"
            fontWeight="500"
          >
            {`${user.firstName} ${user.lastName}`}
          </Typography>
          {lastMessage && (
            <Typography
              color={theme.palette.neutral.medium}
              fontSize="0.75rem"
              sx={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "200px"
              }}
            >
              {lastMessage.content}
            </Typography>
          )}
        </Box>
        {lastMessage && lastMessage.createdAt && (
          <Typography
            color={theme.palette.neutral.medium}
            fontSize="0.75rem"
            alignSelf="flex-end"
          >
            {formatDistanceToNow(new Date(lastMessage.createdAt), {
              addSuffix: true,
            })}
          </Typography>
        )}
      </Box>
    </FlexBetween>
  );
};

export default Conversation;
