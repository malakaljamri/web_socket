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
    if (!window['WebSocket']) {
        console.error('WebSocket is not supported by your browser');
        return;
    }

    const connect = () => {
        state.conn = new WebSocket('ws://' + document.location.host + '/ws');
        
        state.conn.onopen = function() {
            console.log('WebSocket connection established');
        };

        state.conn.onclose = function(evt) {
            console.log('WebSocket connection closed');
            // Attempt to reconnect after 2 seconds
            setTimeout(connect, 2000);
        };

        state.conn.onerror = function(evt) {
            console.error('WebSocket error:', evt);
        };

        state.conn.onmessage = async function(evt) {
            try {
                let newMsg = JSON.parse(evt.data);
                console.log('Received message:', newMsg);

                if (newMsg.msg_type == 'msg') {
                    var senderContainer = document.createElement('div');
                    senderContainer.className = newMsg.sender_id == state.currId ? 'sender-container' : 'receiver-container';

                    var message = document.createElement('div');
                    message.className = newMsg.sender_id == state.currId ? 'sender' : 'receiver';

                    // Add username element
                    var username = document.createElement('div');
                    username.className = 'chat-username';
                    if (newMsg.sender_id == state.currId) {
                        username.innerText = state.currUsername || 'You';
                    } else {
                        // Find the sender's username from allUsers
                        const sender = state.allUsers.find(user => user.id === newMsg.sender_id);
                        username.innerText = sender ? sender.username : 'Unknown User';
                    }

                    var messageContent = document.createElement('div');
                    messageContent.className = 'message-content';
                    messageContent.innerText = newMsg.content;

                    var date = document.createElement('div');
                    date.className = 'chat-time';
                    date.innerText = newMsg.date.slice(0, -3);

                    message.appendChild(username);
                    message.appendChild(messageContent);
                    message.appendChild(date);

                    appendLog(senderContainer, message, date);

                    if (newMsg.sender_id == state.currId) {
                        console.log('Message is from current user, skipping notification');
                        return;
                    }

                    const chatWrapper = document.querySelector('.chat-wrapper');
                    console.log('Chat wrapper display:', chatWrapper ? chatWrapper.style.display : 'not found');
                    console.log('Current chat user:', state.currentChatUserId);
                    console.log('Message sender:', newMsg.sender_id);

                    // Show notification if chat is not focused
                    if (!chatWrapper || 
                        chatWrapper.style.display !== 'flex' || 
                        state.currentChatUserId !== newMsg.sender_id) {
                        
                        console.log('Showing notification popup');
                        
                        // Create popup notification
                        const popup = document.createElement('div');
                        popup.className = 'message-popup';
                        popup.style.cssText = `
                            position: fixed;
                            top: 20px;
                            right: 20px;
                            background: #2196F3;
                            color: white;
                            padding: 15px 25px;
                            border-radius: 8px;
                            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                            z-index: 9999;
                            animation: slideIn 0.5s ease-out;
                            pointer-events: none;
                        `;

                        // Get sender's username
                        const sender = state.allUsers.find(u => u.id === newMsg.sender_id);
                        const senderName = sender ? sender.username : 'Someone';
                        console.log('Sender found:', sender);

                        popup.innerHTML = `
                            <div style="font-weight: bold; margin-bottom: 5px;">${senderName}</div>
                            <div>${newMsg.content}</div>
                        `;

                        // Add to document
                        document.body.appendChild(popup);
                        console.log('Popup added to document');

                        // Play notification sound
                        const audio = new Audio('/static/sounds/notification.mp3');
                        audio.volume = 0.5;
                        audio.play().catch(e => console.log('Error playing sound:', e));

                        // Remove after 3 seconds
                        setTimeout(() => {
                            popup.style.animation = 'slideOut 0.5s ease-in';
                            setTimeout(() => {
                                popup.remove();
                                console.log('Popup removed');
                            }, 500);
                        }, 3000);

                        // Update unread count
                        if (state.unread.length == 0) {
                            state.unread.push([newMsg.sender_id, 1]);
                        } else {
                            const unreadMsgs = state.unread.find(u => u[0] == newMsg.sender_id);
                            if (unreadMsgs) {
                                unreadMsgs[1] += 1;
                            } else {
                                state.unread.push([newMsg.sender_id, 1]);
                            }
                        }
                    } else {
                        console.log('Notification conditions not met');
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
            } catch (error) {
                console.error('Error processing message:', error);
            }
        };
    };

    connect();
}

// Helper function to safely send messages
export function sendWSMessage(message) {
    if (!state.conn || state.conn.readyState !== WebSocket.OPEN) {
        console.error('WebSocket connection is not open');
        return false;
    }

    try {
        state.conn.send(message);
        return true;
    } catch (error) {
        console.error('Error sending message:', error);
        return false;
    }
}

export function closeWS() {
    if (state.conn) {
        state.conn.close();
    }
}

// Add styles to head
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    .message-popup {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        max-width: 300px;
        word-wrap: break-word;
    }
`;
document.head.appendChild(style);