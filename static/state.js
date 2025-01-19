console.log("state.js loaded");

export const state = {
    // Initialize counters and state variables
    counter: 0,
    unread: [], // Array to keep track of unread messages

    conn: null, // WebSocket connection
    currId: 0, // Current user ID
    currUsername: '', // Current user's username
    currPost: 0, // Currently viewed post ID

    allPosts: [], // Array to store all fetched posts
    filteredPosts: [], // Array to store filtered posts based on category

    allUsers: [], // Array to store all fetched users
    online: [], // Array to store IDs of online users

    currComments: [], // Array to store comments for the current post

    currentChatUserId: null, // Current chat user ID
    messageOffset: 0,
    messageLimit: 10,
    allMessagesLoaded: false,
    isFetching: false,
    typingTimeout: null,
};