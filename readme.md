# 🗨️ Real-Time Forum 

Created by **Malak Aljamri** & **Shahd Yousif**  

## ✨ Features  
- **Registration & Login**:  
- **Posts & Comments**:  
  Create posts with categories, add comments, and view them in real-time.
- **Private Messaging**:  
  Real-time chat with online/offline status, previous messages, and live updates using WebSockets.  

## 📦 Tech Stack  
- **Backend**: Go, SQLite, WebSockets.  
- **Frontend**: HTML, CSS, JS.  

## 🛠️ Installation  
1. Clone the repo:  
   ```bash
   git clone https://github.com/malakaljamri/web_socket.git
   cd web_socket
   ```
   Install dependencies:
   ```bash
   go get github.com/gorilla/websocket github.com/mattn/go-sqlite3 github.com/google/uuid golang.org/x/crypto/bcrypt
   ```
   Run the server:
   ```bash
   go run main.go
   ```
   
