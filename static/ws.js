console.log("ws.js loaded");

import {
    state
} from './state.js';

import {
    updateUsers,
    appendLog,
    handleTypingEvent,
    handleStopTypingEvent
} from './chat.js';

import {
    getUsers
} from './posts.js';

// Initialize and manage the WebSocket connection
export function startWS() {
    if (window['WebSocket']) {
        // Check if WebSockets are supported
        state.conn = new WebSocket('ws://' + document.location.host + '/ws'); // Create a new WebSocket connection
        state.conn.onclose = function (evt) {
            // Handle WebSocket close event if needed
        };

        // Handle incoming WebSocket messages
        state.conn.onmessage = async function (evt) {
            let newMsg = JSON.parse(evt.data); // Parse incoming message
            console.log(newMsg);

            if (newMsg.msg_type == 'msg') {
                // Handle incoming chat message
                var senderContainer = document.createElement('div');
                senderContainer.className = newMsg.sender_id == state.currId ? 'sender-container' : 'receiver-container';

                var sender = document.createElement('div');
                sender.className = newMsg.sender_id == state.currId ? 'sender' : 'receiver';
                sender.innerText = newMsg.content; // Set message content

                var date = document.createElement('div');
                date.className = 'chat-time';
                date.innerText = newMsg.date.slice(0, -3); // Format date

                appendLog(senderContainer, sender, date); // Append message to chat log

                if (newMsg.sender_id == state.currId) {
                    return; // Ignore messages sent by the current user
                }

                // Check for unread messages
                let unreadMsgs = state.unread.filter((u) => {
                    let id = newMsg.sender_id;
                    return u[0] == id;
                });

                // If chat window is not open, increment unread message count
                if (document.querySelector('.chat-wrapper').style.display == 'none') {
                    if (unreadMsgs.length == 0) {
                        state.unread.push([newMsg.sender_id, 1]);
                    } else {
                        unreadMsgs[0][1] += 1;
                    }
                }

                updateUsers(); // Refresh user list to show updated statuses
            } else if (newMsg.msg_type == 'online') {
                // Handle updates to online user statuses
                state.online = newMsg.user_ids;
                await getUsers(); // Refresh user data

                updateUsers(); // Update UI with new user statuses
            } else if (newMsg.msg_type == 'post') {
                // Handle new post notifications
                document.querySelector('.new-post-notif-wrapper').style.display = 'flex'; // Show new post notification
            } else if (newMsg.msg_type == 'typing') {
                handleTypingEvent(newMsg);
            } else if (newMsg.msg_type == 'stop_typing') {
                handleStopTypingEvent(newMsg);
            }
        };
    } else {
        // If WebSockets are not supported, notify the user
        var item = document.createElement("div");
        item.innerHTML = "<b>Your browser does not support WebSockets.</b>";
        appendLog(item);
    }
}

//  Function to close the WebSocket connection gracefully
export function closeWS() {
    if (state.conn && state.conn.readyState === WebSocket.OPEN) {
        state.conn.close(); // Close the WebSocket connection
    }
}