import { useState, useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  Box,
  Typography,
  useTheme,
  Tab,
  Tabs,
  useMediaQuery,
  CircularProgress,
} from "@mui/material";
import { useSelector } from "react-redux";
import Navbar from "scenes/navbar";
import UserWidget from "scenes/widgets/UserWidget";
import PostWidget from "scenes/widgets/PostWidget";
import AdvertWidget from "scenes/widgets/AdvertWidget";
import FriendListWidget from "scenes/widgets/FriendListWidget";
import SearchWidget from "scenes/widgets/SearchWidget";

const SearchPage = () => {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState({ users: [], posts: [] });
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const isNonMobileScreens = useMediaQuery("(min-width:1000px)");
  const { _id, picturePath } = useSelector((state) => state.user);
  const token = useSelector((state) => state.token);

  const theme = useTheme();
  const neutralLight = theme.palette.neutral.light;
  const background = theme.palette.background.default;

  useEffect(() => {
    // If we have results in location state, use those
    if (location.state?.results) {
      setResults(location.state.results);
      return;
    }

    // If we have a query parameter but no results, fetch them
    if (query) {
      const fetchResults = async () => {
        try {
          setLoading(true);
          setError("");
          const response = await fetch(
            `http://localhost:3001/search?q=${encodeURIComponent(query)}`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (!response.ok) {
            throw new Error("Failed to fetch search results");
          }

          const data = await response.json();
          setResults(data);
        } catch (err) {
          console.error("Search Error:", err);
          setError(err.message || "Failed to fetch search results");
        } finally {
          setLoading(false);
        }
      };

      fetchResults();
    }
  }, [location.state, query, token]);

  const handleTabChange = (event, newValue) => {
    setTab(newValue);
  };

  return (
    <Box>
      <Navbar />
      <Box
        width="100%"
        padding="2rem 6%"
        display={isNonMobileScreens ? "flex" : "block"}
        gap="0.5rem"
        justifyContent="space-between"
      >
        <Box flexBasis={isNonMobileScreens ? "26%" : undefined}>
          <UserWidget userId={_id} picturePath={picturePath} />
          <Box m="2rem 0" />
          <FriendListWidget userId={_id} />
        </Box>
        
        <Box
          flexBasis={isNonMobileScreens ? "42%" : undefined}
          mt={isNonMobileScreens ? undefined : "2rem"}
        >
          <SearchWidget />
          
          {query && (
            <>
              <Typography variant="h4" mb="1rem">
                Search Results for "{query}"
              </Typography>

              {loading ? (
                <Box display="flex" justifyContent="center" p={2}>
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Typography color="error" align="center">
                  {error}
                </Typography>
              ) : (
                <>
                  <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
                    <Tabs 
                      value={tab} 
                      onChange={handleTabChange}
                      sx={{
                        "& .MuiTab-root": {
                          color: theme.palette.neutral.main,
                        },
                        "& .Mui-selected": {
                          color: theme.palette.primary.main,
                        },
                      }}
                    >
                      <Tab label={`All (${results.users.length + results.posts.length})`} />
                      <Tab label={`People (${results.users.length})`} />
                      <Tab label={`Posts (${results.posts.length})`} />
                    </Tabs>
                  </Box>

                  {/* All Results */}
                  {tab === 0 && (
                    <Box>
                      {results.users.length > 0 && (
                        <Box mb={4}>
                          <Typography variant="h6" mb={2}>
                            People
                          </Typography>
                          {results.users.map((user) => (
                            <UserWidget
                              key={user._id}
                              userId={user._id}
                              picturePath={user.picturePath}
                              isSearchResult
                            />
                          ))}
                        </Box>
                      )}
                      {results.posts.length > 0 && (
                        <Box>
                          <Typography variant="h6" mb={2}>
                            Posts
                          </Typography>
                          {results.posts.map((post) => (
                            <PostWidget
                              key={post._id}
                              postId={post._id}
                              postUserId={post.userId}
                              name={`${post.firstName} ${post.lastName}`}
                              description={post.description}
                              location={post.location}
                              picturePath={post.picturePath}
                              userPicturePath={post.userPicturePath}
                              likes={post.likes}
                              comments={post.comments}
                            />
                          ))}
                        </Box>
                      )}
                      {results.users.length === 0 && results.posts.length === 0 && (
                        <Typography align="center" color="textSecondary">
                          No results found
                        </Typography>
                      )}
                    </Box>
                  )}

                  {/* People Results */}
                  {tab === 1 && (
                    <Box>
                      {results.users.length > 0 ? (
                        results.users.map((user) => (
                          <UserWidget
                            key={user._id}
                            userId={user._id}
                            picturePath={user.picturePath}
                            isSearchResult
                          />
                        ))
                      ) : (
                        <Typography align="center" color="textSecondary">
                          No people found
                        </Typography>
                      )}
                    </Box>
                  )}

                  {/* Posts Results */}
                  {tab === 2 && (
                    <Box>
                      {results.posts.length > 0 ? (
                        results.posts.map((post) => (
                          <PostWidget
                            key={post._id}
                            postId={post._id}
                            postUserId={post.userId}
                            name={`${post.firstName} ${post.lastName}`}
                            description={post.description}
                            location={post.location}
                            picturePath={post.picturePath}
                            userPicturePath={post.userPicturePath}
                            likes={post.likes}
                            comments={post.comments}
                          />
                        ))
                      ) : (
                        <Typography align="center" color="textSecondary">
                          No posts found
                        </Typography>
                      )}
                    </Box>
                  )}
                </>
              )}
            </>
          )}

          {!query && (
            <Typography align="center" color="textSecondary">
              Enter a search term to find people and posts
            </Typography>
          )}
        </Box>

        {isNonMobileScreens && (
          <Box flexBasis="26%">
            <AdvertWidget />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default SearchPage;
