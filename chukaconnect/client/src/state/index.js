import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  mode: "light",
  user: null,
  token: null,
  posts: [],
  messages: [],
  notifications: [],
  unreadMessages: 0,
  unreadNotifications: 0,
  conversations: [],
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setMode: (state) => {
      state.mode = state.mode === "light" ? "dark" : "light";
    },
    setLogin: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
    },
    setLogout: (state) => {
      state.user = null;
      state.token = null;
      state.posts = [];
      state.messages = [];
      state.notifications = [];
      state.unreadMessages = 0;
      state.unreadNotifications = 0;
      state.conversations = [];
    },
    setUser: (state, action) => {
      if (action.payload) {
        console.log("Setting user in Redux:", action.payload);
        state.user = action.payload;
      }
    },
    setFriends: (state, action) => {
      if (state.user) {
        state.user.friends = action.payload.friends || [];
      } else {
        console.error("user friends non-existent :(");
      }
    },
    setPosts: (state, action) => {
      const posts = Array.isArray(action.payload.posts) ? action.payload.posts : [];
      state.posts = posts.map(post => ({
        ...post,
        likes: post.likes || new Map(),
        comments: post.comments || []
      }));
    },
    setPost: (state, action) => {
      const updatedPosts = state.posts.map((post) => {
        if (post._id === action.payload.post._id) {
          return {
            ...action.payload.post,
            likes: action.payload.post.likes || new Map(),
            comments: action.payload.post.comments || []
          };
        }
        return post;
      });
      state.posts = updatedPosts;
    },
    setMessages: (state, action) => {
      state.messages = action.payload.messages;
    },
    addMessage: (state, action) => {
      state.messages = [action.payload.message, ...state.messages];
    },
    setNotifications: (state, action) => {
      state.notifications = action.payload.notifications;
    },
    addNotification: (state, action) => {
      state.notifications = [action.payload.notification, ...state.notifications];
      state.unreadNotifications += 1;
    },
    setUnreadCounts: (state, action) => {
      if (action.payload.messages !== undefined) {
        state.unreadMessages = action.payload.messages;
      }
      if (action.payload.notifications !== undefined) {
        state.unreadNotifications = action.payload.notifications;
      }
    },
    markNotificationRead: (state, action) => {
      state.notifications = state.notifications.map((notification) => {
        if (notification._id === action.payload.notificationId) {
          return { ...notification, read: true };
        }
        return notification;
      });
      state.unreadNotifications = Math.max(0, state.unreadNotifications - 1);
    },
    markAllNotificationsRead: (state) => {
      state.notifications = state.notifications.map((notification) => ({
        ...notification,
        read: true,
      }));
      state.unreadNotifications = 0;
    },
    setConversations: (state, action) => {
      state.conversations = action.payload.conversations;
    },
    updateConversation: (state, action) => {
      const { userId, message } = action.payload;
      state.conversations = state.conversations.map((conv) => {
        if (conv.user._id === userId) {
          return { ...conv, lastMessage: message };
        }
        return conv;
      });
    },
  },
});

export const {
  setMode,
  setLogin,
  setLogout,
  setUser,
  setFriends,
  setPosts,
  setPost,
  setMessages,
  addMessage,
  setNotifications,
  addNotification,
  setUnreadCounts,
  markNotificationRead,
  markAllNotificationsRead,
  setConversations,
  updateConversation,
} = authSlice.actions;
export default authSlice.reducer;