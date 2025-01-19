console.log("posts.js loaded");

import {
    state
} from './state.js';

import {
    getData,
    postData
} from './utils.js';

import {
    sendMsg
} from './chat.js';

// Select DOM elements for posts and comments
const postsContainer = document.querySelector('.posts-container');
const createPostContainer = document.querySelector('.create-post-container');
const postContainer = document.querySelector('.post-container');
const commentsContainer = document.querySelector('.comments-container');
const topPanel = document.querySelector('.top-panel');
const newPostNotif = document.querySelector('.new-post-notif-wrapper');

// Fetch all posts from the server and store them in the state.allPosts array
export async function getPosts() {
    await getData(`${window.location.origin}/post`)
        .then((value) => {
            state.allPosts = value; // Assign fetched posts to state.allPosts
        })
        .catch((err) => {
            console.log(err); // Log any errors
        });
}

// Fetch all users from the server and store them in the state.allUsers array
export async function getUsers() {
    await getData(`${window.location.origin}/user`)
        .then((value) => {
            state.allUsers = value; // Assign fetched users to state.allUsers
        })
        .catch((err) => {
            console.log(err); // Log any errors
        });
}

// Fetch comments for a specific post and store them in the state.currComments array
export async function getComments(post_id) {
    await getData(`${window.location.origin}/comment?param=post_id&data=${post_id}`)
        .then((value) => {
            state.currComments = value; // Assign fetched comments to state.currComments
        })
        .catch((err) => {
            console.log(err); // Log any errors
        });
}

/**
 * Function to display a single post in the post view
 * @param {object} postdata - The post data object
 */
export function createPost(postdata) {
    document.querySelector('#title').innerHTML = postdata.title;
    document.querySelector('#username').innerHTML = state.allUsers.find((u) => u.id == postdata.user_id).username;
    document.querySelector('#date').innerHTML = postdata.date.slice(0, -3);
    document.querySelector('.category').innerHTML = postdata.category;
    document.querySelector('.full-content').innerHTML = postdata.content;
    document.getElementById('post-likes').innerHTML = postdata.likes;
    document.getElementById('post-dislikes').innerHTML = postdata.dislikes;
}

/**
 * Function to display comments for a post
 * @param {Array} commentsdata - Array of comment objects
 */
export function createComments(commentsdata) {
    commentsContainer.innerHTML = ''; // Clear existing comments
    if (commentsdata == null) {
        return; // Exit if no comments
    }

    // Iterate over each comment and create DOM elements
    commentsdata.forEach(({ id, post_id, user_id, content, date }) => {
        var commentWrapper = document.createElement('div');
        commentWrapper.className = 'comment-wrapper';
        commentsContainer.appendChild(commentWrapper);

        var comment = document.createElement('div');
        comment.className = 'comment';
        commentWrapper.appendChild(comment);

        var commentUserWrapper = document.createElement('div');
        commentUserWrapper.className = 'comment-user-wrapper';
        comment.appendChild(commentUserWrapper);

        var commentUsername = document.createElement('div');
        commentUsername.className = 'comment-username';
        commentUsername.innerText = state.allUsers.find((u) => u.id == user_id).username; // Commenter's username
        commentUserWrapper.appendChild(commentUsername);

        var commentDate = document.createElement('div');
        commentDate.className = 'comment-date';
        commentDate.innerHTML = date.slice(0, -3); // Comment date
        commentUserWrapper.appendChild(commentDate);

        var commentSpan = document.createElement('div');
        commentSpan.innerHTML = content; // Comment content
        comment.appendChild(commentSpan);
    });
}

/**
 * Function to create and display all posts in the posts container
 * @param {Array} postdata - Array of post objects
 */
export async function createPosts(postdata) {
    postsContainer.innerHTML = ''; // Clear existing posts

    if (postdata == null) {
        return; // Exit if no posts
    }

    // Iterate over each post sequentially to maintain order
    for (const { id, user_id, category, title, content, date, likes, dislikes } of postdata) {
        await getComments(id); // Fetch comments for the post

        var post = document.createElement('div');
        post.className = 'post';
        post.setAttribute('id', id); // Set post ID
        postsContainer.appendChild(post);

        var posttitle = document.createElement('div');
        posttitle.className = 'title';
        posttitle.innerText = title; // Post title
        post.appendChild(posttitle);

        var author = document.createElement('div');
        author.className = 'author';
        post.append(author);

        var user = document.createElement('div');
        user.className = 'post-username';
        user.innerHTML = state.allUsers.find((u) => u.id === user_id).username; // Author's username
        author.appendChild(user);

        var postdate = document.createElement('div');
        postdate.className = 'date';
        postdate.innerText = date.slice(0, -3); // Post date
        author.appendChild(postdate);

        var postcontent = document.createElement('div');
        postcontent.className = 'post-body';
        postcontent.innerText = content; // Post content
        post.append(postcontent);

        var commentsWrapper = document.createElement('div');
        commentsWrapper.className = 'comments-wrapper';
        post.appendChild(commentsWrapper);

        var likesDislikesWrapper = document.createElement('div');
        likesDislikesWrapper.className = 'likes-dislikes-wrapper';
        commentsWrapper.appendChild(likesDislikesWrapper);

        var likesWrapper = document.createElement('div');
        likesWrapper.className = 'likes-wrapper';
        likesDislikesWrapper.appendChild(likesWrapper);

        var likesImg = document.createElement('img');
        likesImg.src = './static/assets/like.svg'; // Like icon
        likesWrapper.appendChild(likesImg);

        var postlikes = document.createElement('div');
        postlikes.className = 'likes';
        postlikes.innerText = likes; // Number of likes
        likesWrapper.appendChild(postlikes);

        var dislikesWrapper = document.createElement('div');
        dislikesWrapper.className = 'likes-wrapper dislike';
        likesDislikesWrapper.appendChild(dislikesWrapper);

        var dislikesImg = document.createElement('img');
        dislikesImg.src = './static/assets/dislike.svg'; // Dislike icon
        dislikesWrapper.appendChild(dislikesImg);

        var postdislikes = document.createElement('div');
        postdislikes.className = 'dislike';
        postdislikes.innerText = dislikes; // Number of dislikes
        dislikesWrapper.appendChild(postdislikes);

        var comments = document.createElement('div');
        comments.className = 'comments';
        commentsWrapper.appendChild(comments);

        var comment = document.createElement('div');
        comment.className = 'comment';
        comment.innerText = state.currComments == null ? '0 Comments' : state.currComments.length + ' Comments'; // Number of comments
        comments.appendChild(comment);

        // Add click event listener to the post to view its details
        post.addEventListener('click', async function (e) {
            state.currPost = parseInt(this.getAttribute('id')); // Set current post ID

            await getComments(state.currPost); // Fetch comments for the post

            createPost(state.allPosts.find((p) => p.id === state.currPost)); // Display post details
            createComments(state.currComments); // Display comments
            document.getElementById('post-comments').innerHTML =
                state.currComments == null ? '0 Comments' : state.currComments.length + ' Comments';

            // Update UI to show the post view
            postsContainer.style.display = 'none';
            postContainer.style.display = 'flex';
            topPanel.style.display = 'none';
        });
    }
}

/**
 * Event listener for category selection change to filter posts
 */
document.getElementById('categories').onchange = function () {
    let val = document.getElementById('categories').value;

    if (val == 'all') {
        createPosts(state.allPosts); // Show all posts if "All posts" is selected
        return;
    }

    // Filter posts based on selected category
    state.filteredPosts = state.allPosts.filter((i) => {
        return i.category == val;
    });
    createPosts(state.filteredPosts); // Display filtered posts
};

// Event listener for the like button to increment likes
document.getElementById('like-btn').addEventListener('click', () => {
    let resp = postData(`${window.location.origin}/like?post_id=${state.currPost}&col=likes`);
    resp.then((value) => {
        let vals = value.msg.split('|');
        document.getElementById('post-likes').innerHTML = parseInt(vals[0]); // Update likes count
        document.getElementById('post-dislikes').innerHTML = parseInt(vals[1]); // Update dislikes count
    });
});

// Event listener for the dislike button to increment dislikes
document.getElementById('dislike-btn').addEventListener('click', () => {
    let resp = postData(`${window.location.origin}/like?post_id=${state.currPost}&col=dislikes`);
    resp.then((value) => {
        let vals = value.msg.split('|');
        document.getElementById('post-likes').innerHTML = parseInt(vals[0]); // Update likes count
        document.getElementById('post-dislikes').innerHTML = parseInt(vals[1]); // Update dislikes count
    });
});

/**
 * Event listener for the "New Post" button to show the post creation form
 */
document.querySelector('.new-post-btn').addEventListener('click', function () {
    postsContainer.style.display = 'none'; // Hide posts list
    postContainer.style.display = 'none'; // Hide individual post view
    createPostContainer.style.display = 'flex'; // Show create post form
    topPanel.style.display = 'none'; // Hide top panel
    document.querySelector('#create-post-title').value = ''; // Clear title field
    document.querySelector('#create-post-body').value = ''; // Clear body field
});

/**
 * Event listener for the "Create Post" button to submit a new post
 */
document.querySelector('.create-post-btn').addEventListener('click', function () {
    const title = document.querySelector('#create-post-title').value.trim(); // Get post title and remove whitespace
    const body = document.querySelector('#create-post-body').value.trim(); // Get post body and remove whitespace
    const category = document.querySelector('#create-post-categories').value; // Get post category
    
    // Validate empty fields
    if (!title || !body) {
        alert('Please fill in both title and content fields before creating a post.');
        return;
    }

    let data = {
        id: 0,
        user_id: state.currId, // Set to current user ID
        category: category,
        title: title,
        content: body,
        date: '', // Backend should set the date
        likes: 0,
        dislikes: 0,
    };

    var msg;
    // Send new post data to the server
    let resp = postData(`${window.location.origin}/post`, data);
    resp.then(async (value) => {
        msg = value.msg;

        await getPosts(); // Refresh posts
        createPosts(state.allPosts); // Re-render posts

        sendMsg(state.conn, 0, { value: 'New Post' }, 'post'); // Notify via WebSocket about the new post

        // Reset UI to show the updated posts list
        createPostContainer.style.display = 'none';
        postsContainer.style.display = 'flex';
        topPanel.style.display = 'flex';
    });
});

/**
 * Function to send a comment to the server
 */
export function sendComment() {
    let comment = document.querySelector('#comment-input').value; // Get comment text
    if (comment == '') return;
    let commentsdata = {
        id: 0,
        post_id: state.currPost,
        user_id: state.currId,
        content: comment,
        date: '',
    };

    // Send comment data to the server
    let resp = postData(`${window.location.origin}/comment`, commentsdata);
    resp.then(async () => {
        document.querySelector('#comment-input').value = ''; // Clear comment input

        await getComments(state.currPost); // Refresh comments
        document.getElementById('post-comments').innerHTML =
            state.currComments == null ? '0 Comments' : state.currComments.length + ' Comments';
        createComments(state.currComments); // Re-render comments
    });
}

/**
 * Event listeners for sending comments via button click or Enter key
 */
document.querySelector('.send-comment-btn').addEventListener('click', sendComment);
document.querySelector('#comment-input').addEventListener('keydown', function (event) {
    if (event.keyCode === 13) {
        sendComment();
    }
});

/**
 * Function to navigate back to the home page and display all posts
 */
export async function home() {
    let selectCategories = document.getElementById('categories');
    selectCategories.selectedIndex = 0; // Reset category selection

    await getPosts(); // Fetch all posts
    createPosts(state.allPosts); // Display all posts

    // Reset UI to show the posts list
    createPostContainer.style.display = 'none';
    postContainer.style.display = 'none';
    postsContainer.style.display = 'flex';
    topPanel.style.display = 'flex';
    newPostNotif.style.display = 'none';
}

/**
 * Event listener for clicking on the new post notification to refresh the posts list
 */
newPostNotif.addEventListener('click', async function () {
    await getPosts(); // Fetch all posts
    createPosts(state.allPosts); // Re-render posts
    newPostNotif.style.display = 'none'; // Hide notification
    window.scrollTo(0, 0); // Scroll to top of the page
});