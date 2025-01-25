package main

import (
	"log"
	"net/http"
	"strconv"

	"real-time-forum/chat"
	"real-time-forum/config"
	"real-time-forum/database"
	"real-time-forum/handlers"
)

func main() {
	database.InitDB(config.Path)

	mux := http.NewServeMux()
	//where all connected users (clients) can send and receive real-time messages.
	hub := chat.NewHub()
	//It keeps track of who’s inside (connected users),It decides what messages to send to whom
	go hub.Run()

	//not un
	mux.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("./static"))))

	mux.HandleFunc("/", handlers.HomeHandler)
	mux.HandleFunc("/session", handlers.SessionHandler)
	mux.HandleFunc("/login", handlers.LoginHandler)
	mux.HandleFunc("/logout", handlers.LogoutHandler)
	mux.HandleFunc("/register", handlers.RegisterHandler)
	mux.HandleFunc("/user", handlers.UserHandler)
	mux.HandleFunc("/post", handlers.PostHandler)
	mux.HandleFunc("/message", handlers.MessageHandler)
	mux.HandleFunc("/comment", handlers.CommentHandler)
	mux.HandleFunc("/like", handlers.LikeHandler)
	mux.HandleFunc("/chat", handlers.ChatHandler)
	mux.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		chat.ServeWs(hub, w, r)
	})

	port := strconv.Itoa(config.Port)

	if port == "" || config.Port < 1024 || config.Port > 49151 {
		log.Println("Invalid port number, setting to default 8080")
		port = "8080"
	}

	log.Println("Server is running on http://localhost:" + port)

	//The mux (router) ensures each request is handled correctly.
	if err := http.ListenAndServe(":"+port, mux);
	 err != nil {
		log.Fatal(err)
	}
}
