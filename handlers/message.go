package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"real-time-forum/config"
	"real-time-forum/database"
	"real-time-forum/structs"
)

func MessageHandler(w http.ResponseWriter, r *http.Request) {
	//Prevents the endpoint being called by other url paths
	if r.URL.Path != "/message" {
		http.Error(w, "404 not found.", http.StatusNotFound)
		return
	}

	//Checks whether it is a POST or GET request
	switch r.Method {
	case "GET":
		cookie, err := r.Cookie("session")
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		foundVal := cookie.Value

		curr, err := database.CurrentUser(config.Path, foundVal)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		s := strconv.Itoa(curr.Id)

		//Grabs the receiver id and pagination parameters from the url
		receiver := r.URL.Query().Get("receiver")
		limitStr := r.URL.Query().Get("limit")
		offsetStr := r.URL.Query().Get("offset")

		//Makes sure receiver is provided
		if receiver == "" {
			http.Error(w, "400 bad request", http.StatusBadRequest)
			return
		}

		//Set default limit and offset
		limit := 10
		offset := 0

		if limitStr != "" {
			l, err := strconv.Atoi(limitStr)
			if err == nil && l > 0 {
				limit = l
			}
		}

		if offsetStr != "" {
			o, err := strconv.Atoi(offsetStr)
			if err == nil && o >= 0 {
				offset = o
			}
		}

		//Gets the messages from the database with pagination
		messages, err := database.FindChatMessages(config.Path, s, receiver, limit, offset)
		if err != nil {
			http.Error(w, "500 internal server error", http.StatusInternalServerError)
			return
		}

		//Marshals the array of message structs to a json object
		resp, err := json.Marshal(messages)
		if err != nil {
			http.Error(w, "500 internal server error", http.StatusInternalServerError)
			return
		}

		//Writes the json object to the frontend
		w.WriteHeader(http.StatusOK)
		w.Write(resp)
	case "POST":
		var newMessage structs.Message

		//Decodes the request body into the message struct
		//Returns a bad request if there's an error
		err := json.NewDecoder(r.Body).Decode(&newMessage)
		if err != nil {
			http.Error(w, "400 bad request.", http.StatusBadRequest)
			return
		}

		//Attemps to add the new message to the database
		err = database.NewMessage(config.Path, newMessage)
		if err != nil {
			http.Error(w, "500 internal server error.", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"msg":"Message sent successfully"}`))
	default:
		//Prevents the use of other request types
		http.Error(w, "405 method not allowed", http.StatusMethodNotAllowed)
		return
	}
}
