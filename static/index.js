console.log("index.js loaded");

import {
    state
} from './state.js';

import {
    postData
} from './utils.js';

import {
    startWS
} from './ws.js';

import {
    getPosts,
    getUsers,
    createPosts
} from './posts.js';

import {
    home
} from './posts.js';

import {
    updateUsers
} from './chat.js';

// Select DOM elements for various sections of the application
const contentWrapper = document.querySelector('.content-wrapper');
const signinContainer = document.querySelector('.signin');
const signupContainer = document.querySelector('.register-container');
const signupNav = document.querySelector('.signup-nav');
const logoutNav = document.querySelector('.logout-nav');

// Event listener for when the DOM content is fully loaded
window.addEventListener('DOMContentLoaded', async function () {
    await getPosts(); // Fetch all posts
    await getUsers(); // Fetch all users

    document.querySelector('.chat-wrapper').style.display = "none"; // Hide chat window initially

    // Fetch the current session to check if the user is logged in
    let sess = postData(`${window.location.origin}/session`);
    sess
        .then((value) => {
            let vals = value.msg.split('|');
            state.currId = parseInt(vals[0]); // Set current user ID
            state.currUsername = vals[1]; // Set current username

            // Update UI to show logged-in state
            signinContainer.style.display = 'none';
            signupNav.style.display = 'none';
            contentWrapper.style.display = 'flex';
            logoutNav.style.display = 'flex';

            document.querySelector('.profile').innerText = state.currUsername; // Display username
            startWS(); // Start WebSocket connection

            createPosts(state.allPosts); // Display all posts
            updateUsers(); // Update user list
        })
        .catch(() => {
            // If no active session, show sign-in and sign-up options
            signinContainer.style.display = 'flex';
            signupNav.style.display = 'flex';
            contentWrapper.style.display = 'none';
            logoutNav.style.display = 'none';
        });
});

// Event listener for toggling between the sign-in and sign-up forms
document.querySelector('#signup-link').addEventListener('click', function () {
    signinContainer.style.display = 'none'; // Hide sign-in form
    signupContainer.style.display = 'flex'; // Show sign-up form
});

document.querySelector('#signin-link').addEventListener('click', function () {
    signupContainer.style.display = 'none'; // Hide sign-up form
    signinContainer.style.display = 'flex'; // Show sign-in form
});

// Event listeners for navigating back to the home page when clicking the logo or back buttons
document.querySelector('.logo').addEventListener('click', home);
document.querySelector('.back').addEventListener('click', home);
document.querySelector('#back-btn').addEventListener('click', home);