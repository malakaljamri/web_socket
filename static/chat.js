console.log("chat.js loaded");

import {
    state
} from './state.js';

import {
    getData,
    debounce
} from './utils.js';

const onlineUsers = document.querySelector('.online-users');
const offlineUsers = document.querySelector('.offline-users');
const log = document.querySelector('.chat');

// Function to create and display the list of users (online and offline)
export function createUsers(userdata, conn) {
    onlineUsers.innerHTML = ''; // Clear online users list
    offlineUsers.innerHTML = ''; // Clear offline users list

    if (userdata == null) {
        return; // Exit if no user data
    }

    // Iterate over each user to create user elements
    userdata.forEach(({ id, username }) => {
        if (id == state.currId) {
            return; // Skip the current user
        }

        var user = document.createElement('div');
        user.className = 'user';
        user.setAttribute('id', 'id' + id); // Set user ID

        // Append user to the appropriate list based on online status
        if (state.online.includes(id)) {
            onlineUsers.appendChild(user);
        } else {
            offlineUsers.appendChild(user);
        }

        var chatusername = document.createElement('p');
        chatusername.innerText = username; // User's username
        user.appendChild(chatusername);

        var msgNotification = document.createElement('div');
        msgNotification.className = 'msg-notification';
        msgNotification.innerText = 1; // Initialize message notification
        user.appendChild(msgNotification);

        // Check for unread messages from the user
        let unreadMsgs = state.unread.filter((u) => {
            return u[0] == id;
        });

        if (unreadMsgs.length != 0 && unreadMsgs[0][1] != 0) {
            const msgNotif = document.getElementById('id' + id).querySelector('.msg-notification');
            msgNotif.style.opacity = '1'; // Show notification
            msgNotif.innerText = unreadMsgs[0][1]; // Set unread count

            document.getElementById('id' + id).style.fontWeight = '900'; // Highlight user
        }

        // Add click event listener to open chat with the user
        user.addEventListener('click', function (e) {
            let resp = getData(`${window.location.origin}/message?receiver=${id}`);
            resp.then((value) => {
                let ridStr = user.getAttribute('id');
                const regex = /id/i;
                const rid = parseInt(ridStr.replace(regex, '')); // Extract receiver ID
                console.log('rid', rid);
                state.counter = 0; // Reset unread counter
                document.getElementById('id' + id).querySelector('.msg-notification').style.opacity = '0'; // Hide notification
                OpenChat(rid, state.conn, value, state.currId); // Open chat window
            });
        });
    });
}

// Function to update the list of online and offline users by fetching the latest data
export async function updateUsers() {
    await getData(`${window.location.origin}/chat?user_id=${state.currId}`)
        .then((value) => {
            var newUsers = [];

            if (value.user_ids != null) {
                // Map user IDs to user objects
                newUsers = value.user_ids.map((i) => {
                    return state.allUsers.find((u) => u.id == i);
                });
            }

            // Filter out users who are not online
            let otherUsers = state.allUsers.filter((x) => !newUsers.includes(x));

            // Combine online and offline users
            state.allUsers = newUsers.concat(otherUsers);

            // Create user elements in the UI
            createUsers(state.allUsers, state.conn);
        })
        .catch((err) => {
            console.log(err); // Log any errors
        });
}

/**
 * Function to append a message to the chat log
 * @param {HTMLElement} container - The container for the message (sender or receiver)
 * @param {HTMLElement} msg - The message content element
 * @param {HTMLElement} date - The timestamp of the message
 */
export function appendLog(container, msg, date) {
    var doScroll = log.scrollTop > log.scrollHeight - log.clientHeight - 1; // Check if scroll is needed
    log.appendChild(container); // Append the container to the chat log
    container.append(msg); // Append the message content
    msg.append(date); // Append the timestamp

    if (doScroll) {
        log.scrollTop = log.scrollHeight - log.clientHeight; // Auto-scroll to bottom
    }
}

/**
 * Function to create and display chat messages in the chat window
 * @param {Array} data - Array of message objects
 * @param {number} currId - Current user's ID
 * @param {boolean} prepend - Whether to prepend messages (for older messages)
 */
function CreateMessages(data, currId, prepend = false) {
    if (!data || data.length === 0) {
        state.allMessagesLoaded = true; // No more messages to load
        return;
    }

    // If prepending, reverse the data array to maintain chronological order
    if (prepend) {
        data = data.slice().reverse();
    }

    data.forEach(({ sender_id, content, date }) => {
        var messageContainer = document.createElement('div');
        messageContainer.className = sender_id == currId ? 'sender-container' : 'receiver-container';

        var message = document.createElement('div');
        message.className = sender_id == currId ? 'sender' : 'receiver';
        message.innerText = content;

        var messageDate = document.createElement('div');
        messageDate.className = 'chat-time';
        messageDate.innerText = date.slice(0, -3);

        messageContainer.appendChild(message);
        message.appendChild(messageDate);

        if (prepend) {
            log.insertBefore(messageContainer, log.firstChild);
        } else {
            log.appendChild(messageContainer);
        }
    });

    if (!prepend) {
        // Scroll to bottom only when loading initial messages
        log.scrollTop = log.scrollHeight;
    }
}

/**
 * Function to send a message through the WebSocket connection
 * @param {WebSocket} conn - The WebSocket connection
 * @param {number} rid - Receiver's user ID
 * @param {object} msg - The message object containing the content
 * @param {string} msg_type - The type of message ('msg' or 'post')
 * @returns {boolean} - Returns false if message is not sent
 */
export function sendMsg(conn, rid, msg, msg_type) {
    console.log(rid);
    if (!conn || conn.readyState !== WebSocket.OPEN) {
        alert('WebSocket connection is not open.');
        return false; // If WebSocket connection is not established
    }
    if (!msg.value.trim()) {
        alert('Cannot send empty message.');
        return false; // If message content is empty
    }

    // Create the message data object
    let msgData = {
        id: 0,
        sender_id: state.currId, // Set to current user's ID
        receiver_id: rid,
        content: msg.value.trim(),
        date: '', // Server will assign the date
        msg_type: msg_type,
    };

    // Append the sent message to the chat log
    appendSentMessage(msgData);

    conn.send(JSON.stringify(msgData)); // Send the message through WebSocket
    msg.value = ''; // Clear the input field
    updateUsers(); // Update the user list (e.g., to show online status)
    return false;
}

/**
 * Function to append a sent message to the chat log
 * @param {object} msgData - The message data object
 */
function appendSentMessage(msgData) {
    var messageContainer = document.createElement('div');
    messageContainer.className = 'sender-container';

    var message = document.createElement('div');
    message.className = 'sender';
    message.innerText = msgData.content; // Set message content

    var messageDate = document.createElement('div');
    messageDate.className = 'chat-time';
    messageDate.innerText = 'Sending...'; // Temporary placeholder

    messageContainer.appendChild(message);
    message.appendChild(messageDate);

    let now = new Date();

    let formattedDate = now.toLocaleDateString('en-GB', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });

    let formattedTime = now.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });

    setTimeout(() => {
        messageDate.innerText = `${formattedDate} ${formattedTime}`;
    }, 250);

    log.appendChild(messageContainer);
    log.scrollTop = log.scrollHeight; // Scroll to bottom
}

/**
 * Function to open and display the chat window with a specific user
 * @param {number} rid - Receiver's user ID
 * @param {WebSocket} conn - The WebSocket connection
 * @param {Array} data - Array of existing messages
 * @param {number} currId - Current user's ID
 */
export async function OpenChat(rid, conn, data, currId) {
    state.currentChatUserId = rid; // Set the current chat user ID

    document.getElementById('id' + rid).style.fontWeight = '400'; // Reset font weight for the user

    // Reset unread message count for the user
    for (var i = 0; i < state.unread.length; i++) {
        if (state.unread[i][0] == rid) {
            state.unread[i][1] = 0;
        }
    }

    // Reset the send wrapper to remove any previous event listeners
    let oldElem = document.querySelector('.send-wrapper');
    let newElem = oldElem.cloneNode(true);
    oldElem.parentNode.replaceChild(newElem, oldElem);

    document.querySelector('.chat-user-username').innerText = state.allUsers.find((u) => u.id === rid).username; // Display receiver's username
    document.querySelector('.chat-wrapper').style.display = 'flex'; // Show chat window
    var msg = document.getElementById('chat-input'); // Chat input field

    log.innerHTML = ''; // Clear existing chat messages

    // Reset pagination variables
    state.messageOffset = 0;
    state.allMessagesLoaded = false;
    state.isFetching = false;

    // Load initial messages (last 10)
    await fetchMessages(rid, state.messageLimit, state.messageOffset, false);

    // Event listener for the send button within the chat window
    document.querySelector('#send-btn').addEventListener('click', function () {
        sendMsg(conn, rid, msg, 'msg'); // Send the message
    });

    // Event listener for pressing the Enter key to send a message
    document.querySelector('#chat-input').addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            event.preventDefault(); // Prevent default behavior (like form submission)
            sendMsg(conn, rid, msg, 'msg'); // Send the message
        }
    });

    msg.addEventListener('input', function () {
        sendTypingEvent();
        clearTimeout(state.typingTimeout);
        state.typingTimeout = setTimeout(sendStopTypingEvent, 2000); // 2 seconds
    });

    if (data == null) {
        return; // Exit if there are no existing messages
    }
}

/**
 * Function to fetch messages with pagination
 * @param {number} rid - Receiver's user ID
 * @param {number} limit - Number of messages to fetch
 * @param {number} offset - Offset for pagination
 * @param {boolean} prepend - Whether to prepend messages (for older messages)
 */
async function fetchMessages(rid, limit, offset, prepend) {
    try {
        let response = await getData(`${window.location.origin}/message?receiver=${rid}&limit=${limit}&offset=${offset}`);
        CreateMessages(response, state.currId, prepend);
    } catch (error) {
        console.error('Error fetching messages:', error);
    }
}

// Scroll event listener to load more messages when scrolled to top
log.addEventListener(
    'scroll',
    debounce(async function () {
        if (log.scrollTop === 0 && !state.allMessagesLoaded && !state.isFetching && state.currentChatUserId !== null) {
            state.isFetching = true; // Prevent multiple fetches
            state.messageOffset += state.messageLimit; // Update offset

            // Fetch older messages
            await fetchMessages(state.currentChatUserId, state.messageLimit, state.messageOffset, true);

            state.isFetching = false; // Reset fetching flag
        }
    }, 300)
);

document.querySelector('.close-chat').addEventListener('click', function () {
    document.querySelector('.chat-wrapper').style.display = 'none'; // Hide chat window
});

function sendTypingEvent() {
    if (!state.conn || state.conn.readyState !== WebSocket.OPEN) {
        return;
    }

    let typingData = {
        id: 0,
        sender_id: state.currId,
        receiver_id: state.currentChatUserId,
        content: '',
        date: '',
        msg_type: 'typing',
    };

    state.conn.send(JSON.stringify(typingData));
}

function sendStopTypingEvent() {
    if (!state.conn || state.conn.readyState !== WebSocket.OPEN) {
        return;
    }

    let stopTypingData = {
        id: 0,
        sender_id: state.currId,
        receiver_id: state.currentChatUserId,
        content: '',
        date: '',
        msg_type: 'stop_typing',
    };

    state.conn.send(JSON.stringify(stopTypingData));
}

export function handleTypingEvent(newMsg) {
    if (document.querySelector('.chat-wrapper').style.display == 'flex' && state.currentChatUserId == newMsg.sender_id) {
        var chatUsernameElement = document.querySelector('.chat-user-username');
        if (!chatUsernameElement.innerText.includes(' (typing...)')) {
            chatUsernameElement.innerText += ' (typing...)';
        }
    } else {
        var userElement = document.getElementById('id' + newMsg.sender_id);
        if (userElement) {
            var msgNotif = userElement.querySelector('.msg-notification');
            msgNotif.style.opacity = '1';
            msgNotif.innerText = 'typing...';
        }
    }
}

export function handleStopTypingEvent(newMsg) {
    if (document.querySelector('.chat-wrapper').style.display == 'flex' && state.currentChatUserId == newMsg.sender_id) {
        var chatUsernameElement = document.querySelector('.chat-user-username');
        chatUsernameElement.innerText = state.allUsers.find((u) => u.id === state.currentChatUserId).username;
    } else {
        var userElement = document.getElementById('id' + newMsg.sender_id);
        if (userElement) {
            var msgNotif = userElement.querySelector('.msg-notification');
            let unreadMsgs = state.unread.filter((u) => {
                return u[0] == newMsg.sender_id;
            });
            if (unreadMsgs.length != 0 && unreadMsgs[0][1] != 0) {
                msgNotif.innerText = unreadMsgs[0][1];
            } else {
                msgNotif.style.opacity = '0';
                msgNotif.innerText = '';
            }
        }
    }
}