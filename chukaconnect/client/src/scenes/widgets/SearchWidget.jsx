import { useState, useEffect, useRef } from "react";
import {
  Box,
  IconButton,
  InputBase,
  Typography,
  useTheme,
  Popper,
  Paper,
  ClickAwayListener,
  CircularProgress,
  Avatar,
  Divider,
} from "@mui/material";
import {
  Search as SearchIcon,
  Person as PersonIcon,
  Article as ArticleIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import FlexBetween from "components/FlexBetween";
import debounce from "lodash/debounce";

const SearchWidget = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState({ users: [], posts: [] });
  const [loading, setLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const token = useSelector((state) => state.token);
  const navigate = useNavigate();

  const theme = useTheme();
  const neutralLight = theme.palette.neutral.light;
  const medium = theme.palette.neutral.medium;
  const main = theme.palette.neutral.main;

  const handleSearchChange = async (value) => {
    setSearchQuery(value);
    if (!value.trim()) {
      setSuggestions({ users: [], posts: [] });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3001/search/suggestions?q=${encodeURIComponent(
          value
        )}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      setSuggestions(data);
    } catch (error) {
      console.error("Failed to get search suggestions:", error);
      setSuggestions({ users: [], posts: [] });
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = debounce(handleSearchChange, 300);

  const handleInputChange = (event) => {
    const value = event.target.value;
    setSearchQuery(value);
    setShowResults(true);
    setAnchorEl(searchRef.current);
    debouncedSearch(value);
  };

  const handleClear = () => {
    setSearchQuery("");
    setSuggestions({ users: [], posts: [] });
    setShowResults(false);
  };

  const handleClickAway = () => {
    setShowResults(false);
  };

  const handleUserClick = (userId) => {
    navigate(`/profile/${userId}`);
    handleClear();
  };

  const handlePostClick = (postId) => {
    navigate(`/posts/${postId}`);
    handleClear();
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    handleClear();
  };

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <Box ref={searchRef} width="100%">
        <FlexBetween
          backgroundColor={neutralLight}
          borderRadius="9px"
          gap="3rem"
          padding="0.1rem 1.5rem"
        >
          <InputBase
            placeholder="Search..."
            value={searchQuery}
            onChange={handleInputChange}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
            sx={{ width: "100%" }}
          />
          {searchQuery && (
            <IconButton onClick={handleClear} size="small">
              <CloseIcon />
            </IconButton>
          )}
          <IconButton onClick={handleSearch}>
            <SearchIcon />
          </IconButton>
        </FlexBetween>

        <Popper
          open={showResults && Boolean(anchorEl)}
          anchorEl={anchorEl}
          placement="bottom-start"
          style={{ width: anchorEl?.offsetWidth, zIndex: 1301 }}
        >
          <Paper
            elevation={3}
            sx={{
              mt: 1,
              maxHeight: "400px",
              overflowY: "auto",
              width: "100%",
            }}
          >
            {loading ? (
              <Box display="flex" justifyContent="center" p={2}>
                <CircularProgress size={20} />
              </Box>
            ) : (
              <Box>
                {suggestions.users.length > 0 && (
                  <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{ p: 1, color: medium }}
                    >
                      People
                    </Typography>
                    {suggestions.users.map((user) => (
                      <FlexBetween
                        key={user._id}
                        sx={{
                          p: 1,
                          cursor: "pointer",
                          "&:hover": {
                            backgroundColor: neutralLight,
                          },
                        }}
                        onClick={() => handleUserClick(user._id)}
                      >
                        <FlexBetween gap="1rem">
                          <Avatar
                            src={`http://localhost:3001/assets/${user.picturePath}`}
                          />
                          <Box>
                            <Typography color={main}>
                              {user.firstName} {user.lastName}
                            </Typography>
                            <Typography variant="body2" color={medium}>
                              {user.occupation}
                            </Typography>
                          </Box>
                        </FlexBetween>
                        <PersonIcon sx={{ color: medium }} />
                      </FlexBetween>
                    ))}
                    {suggestions.posts.length > 0 && <Divider />}
                  </Box>
                )}

                {suggestions.posts.length > 0 && (
                  <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{ p: 1, color: medium }}
                    >
                      Posts
                    </Typography>
                    {suggestions.posts.map((post) => (
                      <FlexBetween
                        key={post._id}
                        sx={{
                          p: 1,
                          cursor: "pointer",
                          "&:hover": {
                            backgroundColor: neutralLight,
                          },
                        }}
                        onClick={() => handlePostClick(post._id)}
                      >
                        <FlexBetween gap="1rem">
                          {post.picturePath && (
                            <Box
                              component="img"
                              src={`http://localhost:3001/assets/${post.picturePath}`}
                              sx={{
                                height: 40,
                                width: 40,
                                objectFit: "cover",
                                borderRadius: "0.5rem",
                              }}
                            />
                          )}
                          <Typography color={main}>
                            {post.description.length > 50
                              ? post.description.substring(0, 50) + "..."
                              : post.description}
                          </Typography>
                        </FlexBetween>
                        <ArticleIcon sx={{ color: medium }} />
                      </FlexBetween>
                    ))}
                  </Box>
                )}

                {searchQuery &&
                  suggestions.users.length === 0 &&
                  suggestions.posts.length === 0 && (
                    <Typography sx={{ p: 2, textAlign: "center" }} color={medium}>
                      No results found
                    </Typography>
                  )}
              </Box>
            )}
          </Paper>
        </Popper>
      </Box>
    </ClickAwayListener>
  );
};

export default SearchWidget;
