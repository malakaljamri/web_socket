console.log("auth.js loaded");

import {
    state
} from './state.js';

import {
    postData
} from './utils.js';

import {
    getPosts,
    getUsers,
    createPosts
} from './posts.js';

import {
    startWS,
    closeWS
} from './ws.js';

import {
    updateUsers
} from './chat.js';

const signinContainer = document.querySelector('.signin');
const registerContainer = document.querySelector('.register-container');
const contentWrapper = document.querySelector('.content-wrapper');
const signupNav = document.querySelector('.signup-nav');
const logoutNav = document.querySelector('.logout-nav');
const signupBtn = document.querySelector('.signup-btn');

document.querySelector('.signin-btn').addEventListener('click', async function () {
    await getPosts(); // Fetch all posts
    await getUsers(); // Fetch all users

    const emailUsername = document.querySelector('#email-username').value; // Get email or username
    const signinPassword = document.querySelector('#signin-password').value; // Get password

    if (emailUsername == '') {
        alert('Enter email/username');
        return;
    }

    if (signinPassword == '') {
        alert('Enter password');
        return;
    }

    let data = {
        emailUsername: emailUsername,
        password: signinPassword,
    };

    try {
        let resp = await postData(`${window.location.origin}/login`, data);
        let vals = resp.msg.split('|');
        state.currId = parseInt(vals[0]); // Set current user ID
        state.currUsername = vals[1]; // Set current username

        document.querySelector('.profile').innerText = state.currUsername; // Display username

        // Update UI to show logged-in state
        signinContainer.classList.remove('active');
        signinContainer.style.display = 'none'; // Force hide the signin container
        signupNav.style.display = 'none';
        contentWrapper.style.display = 'flex';
        logoutNav.style.display = 'flex';

        // Clear sign-in form fields
        document.querySelector('#email-username').value = '';
        document.querySelector('#signin-password').value = '';

        startWS(); // Start WebSocket connection

        createPosts(state.allPosts); // Display all posts
        updateUsers(); // Update user list

    } catch (error) {
        // alert(error);
        alert('Invalid username or password');
    }
});

document.querySelector('#signup-link').addEventListener('click', function () {
    signinContainer.classList.remove('active'); // Hide sign-in form
    registerContainer.classList.add('active'); // Show registration form
    signupBtn.innerText = 'Sign in'; // Update button text
});

document.querySelector('#signin-link').addEventListener('click', function () {
    signinContainer.classList.add('active'); // Show sign-in form
    registerContainer.classList.remove('active'); // Hide registration form
    signupBtn.innerText = 'Sign up'; // Update button text
});

signupBtn.addEventListener('click', function () {
    if (signupBtn.textContent == 'Sign up') {
        signupBtn.textContent = 'Sign in';
        signinContainer.classList.remove('active'); // Hide sign-in form
        registerContainer.classList.add('active'); // Show registration form
    } else {
        signupBtn.textContent = 'Sign up';
        signinContainer.classList.add('active'); // Show sign-in form
        registerContainer.classList.remove('active'); // Hide registration form
    }
});

document.querySelector('.register-btn').addEventListener('click', function (e) {
    e.preventDefault(); // Prevent form submission

    var msg = '';

    // Get values from registration form fields
    const fname = document.querySelector('#fname').value;
    const lname = document.querySelector('#lname').value;
    const email = document.querySelector('#email').value;
    const username = document.querySelector('#register-username').value;
    const age = document.querySelector('#age').value;
    const gender = document.querySelector('#gender').value;
    const password = document.querySelector('#register-password').value;

    // Validate form fields
    msg += fname == '' ? 'Enter a firstname. ' : '';
    msg += lname == '' ? 'Enter a surname. ' : '';
    msg += email == '' ? 'Enter an email. ' : '';
    msg += username == '' ? 'Enter a username. ' : '';
    msg += age == '' ? 'Enter a DOB. ' : '';
    msg += gender == '' ? 'Enter a gender. ' : '';
    msg += password == '' ? 'Enter a password. ' : '';

    if (msg != '') {
        alert(msg); // Alert user of missing fields
        return;
    }

    // Create data object for registration
    let data = {
        id: 0,
        username: username,
        firstname: fname,
        surname: lname,
        gender: gender,
        email: email,
        dob: age,
        password: password,
    };

    // Send registration request to the server
    let resp = postData(`${window.location.origin}/register`, data);
    resp.then((value) => {
        msg = value.msg;
        alert(msg); // Notify user of registration status

        // Show sign-in form after successful registration
        registerContainer.classList.remove('active');
        signinContainer.classList.add('active');
    });
});

document.querySelector('.logout-btn').addEventListener('click', function () {
    var msg;
    // Send logout request to the server
    let resp = postData(`${window.location.origin}/logout`);
    resp.then((value) => {
        msg = value.msg;
        console.log(msg);

        // Update UI to show the sign-in form
        signinContainer.classList.add('active');
        registerContainer.classList.remove('active');
        contentWrapper.style.display = 'none';
        signupNav.style.display = 'flex';
        logoutNav.style.display = 'none';

        closeWS();
    });
});