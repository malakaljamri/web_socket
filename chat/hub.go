package chat

import (
	"encoding/json"

	"real-time-forum/structs"
)

// Hub maintains the set of active clients and broadcasts messages to the
// clients.
type Hub struct {
	// Registered clients.
	clients map[int]*Client

	// Inbound messages from the clients.
	broadcast chan []byte

	// Register requests from the clients.
	register chan *Client

	// Unregister requests from clients.
	unregister chan *Client
}

func NewHub() *Hub {
	return &Hub{
		broadcast:  make(chan []byte),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		clients:    make(map[int]*Client),
	}
}

func (h *Hub) Run() {
	for {
		//used to wait for communication on multiple channels.
		select {
			// The Hub waits for a new client to send itself to the register channel.
		case client := <-h.register:
			h.clients[client.userID] = client

			//slice to save userid uids = [5, 7]
			var uids []int

			for i := range h.clients {
				uids = append(uids, i)
			}

			var msg = structs.OnlineUsers{
				UserIds:  uids,
				Msg_type: "online",
			}

			//The message (msg) is converted into a JSON string 
			//so it can be sent to clients over WebSocket.
			//{"UserIds":[5,7],"Msg_type":"online"}
			sendMsg, err := json.Marshal(msg)
			if err != nil {
				panic(err)
			}

			//c represents each Client object in the clients map.
			for _, c := range h.clients {
				select {
				case c.send <- sendMsg:
				default:
					close(c.send)
					//delete(h.clients, 2)
					delete(h.clients, c.userID)
				}
			}
		case client := <-h.unregister:
			//Checks if the disconnected client (client.userID) exists in the clients map.
			if _, ok := h.clients[client.userID]; ok {
				delete(h.clients, client.userID)

				//contains the userID of every client still connected.
				var uids []int

				for i := range h.clients {
					uids = append(uids, i)
				}

				var msg = structs.OnlineUsers{
					UserIds:  uids,
					Msg_type: "online",
				}

				sendMsg, err := json.Marshal(msg)
				if err != nil {
					panic(err)
				}
				//Loops through all remaining clients in the clients map 
				//and sends them the updated list of online users.
				for _, c := range h.clients {
					select {
						//If the client’s send channel is ready, the message is sent.
					case c.send <- sendMsg:
					default:
						close(c.send)
						delete(h.clients, c.userID)
					}
				}
				close(client.send)
			}
		case message := <-h.broadcast:
			var msg structs.Message
			if err := json.Unmarshal(message, &msg); err != nil {
				panic(err)
			}
		
			sendMsg, err := json.Marshal(msg)
			if err != nil {
				panic(err)
			}
		
			// Handle typing and stop_typing messages
			if msg.Msg_type == "typing" || msg.Msg_type == "stop_typing" {
				for _, client := range h.clients {
					if client.userID == msg.Receiver_id { // Only send to the intended receiver
						select {
						case client.send <- sendMsg:
						default:
							close(client.send)
							delete(h.clients, client.userID)
						}
					}
				}
			} else {
				// Handle regular chat messages
				for _, client := range h.clients {
					if client.userID == msg.Receiver_id { // Send only to the intended receiver
						select {
						case client.send <- sendMsg:
						default:
							close(client.send)
							delete(h.clients, client.userID)
						}
					}
				}
			}
		
		}
	}
}
