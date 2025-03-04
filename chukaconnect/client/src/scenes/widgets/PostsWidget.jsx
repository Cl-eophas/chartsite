import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setPosts } from "state";
import PostWidget from "./PostWidget";

const PostsWidget = ({ userId, isProfile = false }) => {
  const dispatch = useDispatch();
  const posts = useSelector((state) => state.posts);
  const token = useSelector((state) => state.token);

  const getPosts = async () => {
    try {
      const response = await fetch("http://localhost:3001/posts", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      dispatch(setPosts({ posts: data }));
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  };

  const getUserPosts = async () => {
    try {
      const response = await fetch(
        `http://localhost:3001/posts/${userId}/posts`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      dispatch(setPosts({ posts: data }));
    } catch (error) {
      console.error("Error fetching user posts:", error);
    }
  };

  useEffect(() => {
    if (isProfile) {
      getUserPosts();
    } else {
      getPosts();
    }
  }, [isProfile, userId, token]); // eslint-disable-line react-hooks/exhaustive-deps

  console.log("Current posts state:", posts); 

  return (
    <>
      {Array.isArray(posts) && posts.length > 0 ? (
        posts.map(
          ({
            _id,
            userId,
            firstName,
            lastName,
            caption,
            location,
            picturePath,
            clipPath,
            documentPath,
            audioPath,
            userPicturePath,
            likes,
            comments,
          }) => (
            <PostWidget
              key={_id}
              postId={_id}
              postUserId={userId}
              name={`${firstName} ${lastName}`}
              caption={caption}
              location={location}
              picturePath={picturePath}
              clipPath={clipPath}
              documentPath={documentPath}
              audioPath={audioPath}
              userPicturePath={userPicturePath}
              likes={likes}
              comments={comments}
            />
          )
        )
      ) : (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          {Array.isArray(posts) ? "No posts yet" : "Loading posts..."}
        </div>
      )}
    </>
  );
};

export default PostsWidget;