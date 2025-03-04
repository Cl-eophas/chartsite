import {
  EditOutlined,
  DeleteOutlined,
  AttachFileOutlined,
  GifBoxOutlined,
  ImageOutlined,
  MicOutlined,
  MoreHorizOutlined,
  EmojiEmotionsOutlined,
} from "@mui/icons-material";
import {
  Box,
  Divider,
  Typography,
  InputBase,
  useTheme,
  Button,
  IconButton,
  useMediaQuery,
  Popover,
} from "@mui/material";
import FlexBetween from "components/FlexBetween";
import Dropzone from "react-dropzone";
import UserImage from "components/UserImage";
import WidgetWrapper from "components/WidgetWrapper";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setPosts } from "state";
import EmojiPicker from 'emoji-picker-react';

const MyPostWidget = ({ picturePath }) => {
  const dispatch = useDispatch();
  const [isImage, setIsImage] = useState(false);
  const [isClip, setIsClip] = useState(false);
  const [isDocument, setIsDocument] = useState(false);
  const [isAudio, setIsAudio] = useState(false);
  const [image, setImage] = useState(null);
  const [clip, setClip] = useState(null);
  const [document, setDocument] = useState(null);
  const [audio, setAudio] = useState(null);
  const [caption, setCaption] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const { palette } = useTheme();
  const { _id } = useSelector((state) => state.user);
  const token = useSelector((state) => state.token);
  const isNonMobileScreens = useMediaQuery("(min-width: 1000px)");
  const mediumMain = palette.neutral.mediumMain;
  const medium = palette.neutral.medium;

  const handleEmojiClick = (emojiObject) => {
    setCaption(prevCaption => prevCaption + emojiObject.emoji);
  };

  const handleEmojiButtonClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleEmojiClose = () => {
    setAnchorEl(null);
  };

  const handlePost = async () => {
    const formData = new FormData();
    formData.append("userId", _id);
    formData.append("caption", caption);
    if (image) {
      formData.append("picture", image);
      formData.append("picturePath", image.name);
    }
    if (clip) {
      formData.append("clip", clip);
      formData.append("clipPath", clip.name);
    }
    if (document) {
      formData.append("document", document);
      formData.append("documentPath", document.name);
    }
    if (audio) {
      formData.append("audio", audio);
      formData.append("audioPath", audio.name);
    }

    const response = await fetch(`http://localhost:3001/posts`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const posts = await response.json();
    dispatch(setPosts({ posts }));
    setImage(null);
    setClip(null);
    setDocument(null);
    setAudio(null);
    setCaption("");
  };

  return (
    <WidgetWrapper>
      <FlexBetween gap="1.5rem">
        <UserImage image={picturePath} />
        <Box width="100%" display="flex" alignItems="center">
          <InputBase
            placeholder="What's on your mind..."
            onChange={(e) => setCaption(e.target.value)}
            value={caption}
            sx={{
              width: "100%",
              backgroundColor: palette.neutral.light,
              borderRadius: "2rem",
              padding: "1rem 2rem",
            }}
          />
          <IconButton onClick={handleEmojiButtonClick}>
            <EmojiEmotionsOutlined sx={{ color: mediumMain }} />
          </IconButton>
          <Popover
            open={Boolean(anchorEl)}
            anchorEl={anchorEl}
            onClose={handleEmojiClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <EmojiPicker onEmojiClick={handleEmojiClick} />
          </Popover>
        </Box>
      </FlexBetween>
      {(isImage || isClip || isDocument || isAudio) && (
        <Box
          border={`1px solid ${medium}`}
          borderRadius="5px"
          mt="1rem"
          p="1rem"
        >
          <Dropzone
            acceptedFiles={
              isImage
                ? { "image/*": [".jpg", ".jpeg", ".png"] }
                : isClip
                ? { "video/*": [".mp4", ".avi", ".mov"] }
                : isDocument
                ? {
                    "application/pdf": [".pdf"],
                    "application/msword": [".doc", ".docx"],
                    "text/plain": [".txt"],
                  }
                : { "audio/*": [".mp3", ".wav"] }
            }
            multiple={false}
            onDrop={(acceptedFiles) => {
              if (isImage) setImage(acceptedFiles[0]);
              if (isClip) setClip(acceptedFiles[0]);
              if (isDocument) setDocument(acceptedFiles[0]);
              if (isAudio) setAudio(acceptedFiles[0]);
            }}
          >
            {({ getRootProps, getInputProps }) => (
              <FlexBetween>
                <Box
                  {...getRootProps()}
                  border={`2px dashed ${palette.primary.main}`}
                  p="1rem"
                  width="100%"
                  sx={{ "&:hover": { cursor: "pointer" } }}
                >
                  <input {...getInputProps()} />
                  {!image && !clip && !document && !audio ? (
                    <p>Add {isImage ? "Image" : isClip ? "Clip" : isDocument ? "Document" : "Audio"} Here</p>
                  ) : (
                    <FlexBetween>
                      <Typography>
                        {isImage
                          ? image.name
                          : isClip
                          ? clip.name
                          : isDocument
                          ? document.name
                          : audio.name}
                      </Typography>
                      <EditOutlined />
                    </FlexBetween>
                  )}
                </Box>
                {(image || clip || document || audio) && (
                  <IconButton
                    onClick={() => {
                      setImage(null);
                      setClip(null);
                      setDocument(null);
                      setAudio(null);
                    }}
                    sx={{ width: "15%" }}
                  >
                    <DeleteOutlined />
                  </IconButton>
                )}
              </FlexBetween>
            )}
          </Dropzone>
        </Box>
      )}

      <Divider sx={{ margin: "1.25rem 0" }} />

      <FlexBetween>
        <FlexBetween gap="0.25rem" onClick={() => setIsImage(!isImage)}>
          <ImageOutlined sx={{ color: mediumMain }} />
          <Typography
            color={mediumMain}
            sx={{ "&:hover": { cursor: "pointer", color: medium } }}
          >
            Image
          </Typography>
        </FlexBetween>

        <FlexBetween gap="0.25rem" onClick={() => setIsClip(!isClip)}>
          <GifBoxOutlined sx={{ color: mediumMain }} />
          <Typography
            color={mediumMain}
            sx={{ "&:hover": { cursor: "pointer", color: medium } }}
          >
            Clip
          </Typography>
        </FlexBetween>

        <FlexBetween gap="0.25rem" onClick={() => setIsDocument(!isDocument)}>
          <AttachFileOutlined sx={{ color: mediumMain }} />
          <Typography
            color={mediumMain}
            sx={{ "&:hover": { cursor: "pointer", color: medium } }}
          >
            Document
          </Typography>
        </FlexBetween>

        <FlexBetween gap="0.25rem" onClick={() => setIsAudio(!isAudio)}>
          <MicOutlined sx={{ color: mediumMain }} />
          <Typography
            color={mediumMain}
            sx={{ "&:hover": { cursor: "pointer", color: medium } }}
          >
            Audio
          </Typography>
        </FlexBetween>

        {isNonMobileScreens ? (
          <>
            <FlexBetween gap="0.25rem">
              <MoreHorizOutlined sx={{ color: mediumMain }} />
            </FlexBetween>
          </>
        ) : (
          <FlexBetween gap="0.25rem">
            <MoreHorizOutlined sx={{ color: mediumMain }} />
          </FlexBetween>
        )}

        <Button
          disabled={!caption && !image && !clip && !document && !audio}
          onClick={handlePost}
          sx={{
            color: palette.background.alt,
            backgroundColor: palette.primary.main,
            borderRadius: "3rem",
          }}
        >
          POST
        </Button>
      </FlexBetween>
    </WidgetWrapper>
  );
};

export default MyPostWidget;