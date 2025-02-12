package main

import (
	"log"
	"net/http"
	"strconv"

	"real-time-forum/config"
	"real-time-forum/database"
	"real-time-forum/handlers"
	"real-time-forum/private_msg"
)

// the sets up a web server that handles various application endpoints, serves static files, and establishes WebSocket connections.
func main() {
	database.InitDB(config.Path)

	mux := http.NewServeMux()
	hub := private_msg.NewHub()
	go hub.Run()

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
		private_msg.ServeWs(hub, w, r)
	})

	port := strconv.Itoa(config.Port)

	if port == "" || config.Port < 1024 || config.Port > 49151 {
		log.Println("Invalid port number, setting to default 8080")
		port = "8080"
	}

	log.Println("Server is running on http://localhost:" + port)

	if err := http.ListenAndServe(":"+port, mux); err != nil {
		log.Fatal(err)
	}
}
