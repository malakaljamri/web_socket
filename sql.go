package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"time"

	_ "github.com/mattn/go-sqlite3"
	"golang.org/x/crypto/bcrypt"
)

// The database object for executing queries.
// openDB opens the SQLite database connection
func openDB() (*sql.DB, error) {
	db, err := sql.Open("sqlite3", "./Real-time-forum.db")
	if err != nil {
		return nil, err
	}
	return db, nil
}

// createTables creates the necessary tables in the database
func createTables(db *sql.DB) {
	// Creating users table
	_, err := db.Exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nickname TEXT NOT NULL UNIQUE,
            age INTEGER NOT NULL,
            gender TEXT NOT NULL,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL
        );
    `)
	if err != nil {
		log.Fatal(err)
	}

	// Creating sessions table
	_, err = db.Exec(`
        CREATE TABLE IF NOT EXISTS sessions (
            session_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            created_at DATETIME NOT NULL,
            expires_at DATETIME NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
    `)
	if err != nil {
		log.Fatal(err)
	}

	// Creating online_users table
	_, err = db.Exec(`
        CREATE TABLE IF NOT EXISTS online_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            online_status INTEGER NOT NULL,
            last_seen DATETIME NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
    `)
	if err != nil {
		log.Fatal(err)
	}

	// Creating posts table
	_, err = db.Exec(`
        CREATE TABLE IF NOT EXISTS posts (
            post_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            content TEXT NOT NULL,
            created_at DATETIME NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
    `)
	if err != nil {
		log.Fatal(err)
	}

	// Creating comments table
	_, err = db.Exec(`
        CREATE TABLE IF NOT EXISTS comments (
            comment_id INTEGER PRIMARY KEY AUTOINCREMENT,
            post_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            content TEXT NOT NULL,
            created_at DATETIME NOT NULL,
            FOREIGN KEY (post_id) REFERENCES posts(post_id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
    `)
	if err != nil {
		log.Fatal(err)
	}

	// Creating messages table
	_, err = db.Exec(`
        CREATE TABLE IF NOT EXISTS messages (
            message_id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_id INTEGER NOT NULL,
            receiver_id INTEGER NOT NULL,
            content TEXT NOT NULL,
            created_at DATETIME NOT NULL,
            FOREIGN KEY (sender_id) REFERENCES users(id),
            FOREIGN KEY (receiver_id) REFERENCES users(id)
        );
    `)
	if err != nil {
		log.Fatal(err)
	}
	_, err = db.Exec(`
        CREATE TABLE post_likes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            post_id INTEGER,
            user_id INTEGER,
            FOREIGN KEY (post_id) REFERENCES posts(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
    `)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println("All tables created successfully!")
}

// insertTestData adds test data to the database
func insertTestData(db *sql.DB, nickname, age, gender, firstName, lastName, email, password, title, content, receiverEmail string) {
	_, err := db.Exec(`
        INSERT INTO users (nickname, age, gender, first_name, last_name, email, password) 
        VALUES (?, ?, ?, ?, ?, ?, ?);
    `, nickname, age, gender, firstName, lastName, email, password)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println("User inserted!")

	// Get the user ID for the new user
	var userID int
	err = db.QueryRow("SELECT id FROM users WHERE email = ?", email).Scan(&userID)
	if err != nil {
		log.Fatal(err)
	}

	// Insert post data (using the created userID)
	_, err = db.Exec(`
        INSERT INTO posts (user_id, title, content, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?);
    `, userID, title, content, time.Now().Format("2006-01-02 15:04:05"), time.Now().Format("2006-01-02 15:04:05"))
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println("Post inserted!")

	// Get the post ID for the newly created post
	var postID int
	err = db.QueryRow("SELECT id FROM posts WHERE title = ?", title).Scan(&postID)
	if err != nil {
		log.Fatal(err)
	}

	// Insert message data (sent by the created user to another user)
	var receiverID int
	err = db.QueryRow("SELECT id FROM users WHERE email = ?", receiverEmail).Scan(&receiverID)
	if err != nil {
		log.Fatal(err)
	}

	_, err = db.Exec(`
        INSERT INTO messages (sender_id, receiver_id, content, created_at) 
        VALUES (?, ?, ?, ?);
    `, userID, receiverID, "Hello, this is a test message!", time.Now().Format("2006-01-02 15:04:05"))
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println("Message inserted!")

	// Insert comment on post (using the created user and post)
	_, err = db.Exec(`
        INSERT INTO comments (post_id, user_id, content, created_at) 
        VALUES (?, ?, ?, ?);
    `, postID, userID, "Great post!", time.Now().Format("2006-01-02 15:04:05"))
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println("Comment inserted!")

	// Insert like on post (using the created user and post)
	_, err = db.Exec(`
        INSERT INTO post_likes (post_id, user_id) 
        VALUES (?, ?);
    `, postID, userID)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println("Like inserted!")
}

// HTTP handler function to create a user and a post
func createUserAndPost(w http.ResponseWriter, r *http.Request) {
	// Open the database
	db, err := openDB()
	if err != nil {
		http.Error(w, "Database connection failed", http.StatusInternalServerError)
		return
	}
	defer db.Close()

	// Decode the JSON request body into user data
	var userData struct {
		Nickname  string `json:"nickname"`
		Age       int    `json:"age"`
		Gender    string `json:"gender"`
		FirstName string `json:"first_name"`
		LastName  string `json:"last_name"`
		Email     string `json:"email"`
		Password  string `json:"password"`
		Title     string `json:"title"`
		Content   string `json:"content"`
		Receiver  string `json:"receiver_email"`
	}

	// Decode the request body
	err = json.NewDecoder(r.Body).Decode(&userData)
	if err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}
	ageStr := strconv.Itoa(userData.Age)

	// Correct the function call to pass the string value for age
	insertTestData(db, userData.Nickname, ageStr, userData.Gender, userData.FirstName, userData.LastName, userData.Email, userData.Password, userData.Title, userData.Content, userData.Receiver)

	// Respond to the client
	w.Write([]byte("User and post created successfully!"))
}

// Register handler
func registerUser(w http.ResponseWriter, r *http.Request) {

	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	// If it's an OPTIONS request, just return an OK status
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	// Open database connection
	db, err := openDB()
	if err != nil {
		http.Error(w, "Database connection failed", http.StatusInternalServerError)
		return
	}
	defer db.Close()

	// Parse form data
	err = r.ParseForm()
	if err != nil {
		http.Error(w, "Error parsing form", http.StatusBadRequest)
		return
	}

	nickname := r.FormValue("nickname")
	age := r.FormValue("age")
	gender := r.FormValue("gender")
	firstName := r.FormValue("first_name")
	lastName := r.FormValue("last_name")
	email := r.FormValue("email")
	password := r.FormValue("password")

	// Hash the password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Error hashing password", http.StatusInternalServerError)
		return
	}

	// Insert user into the database
	_, err = db.Exec(`
		INSERT INTO users (nickname, age, gender, first_name, last_name, email, password) 
		VALUES (?, ?, ?, ?, ?, ?, ?);
	`, nickname, age, gender, firstName, lastName, email, hashedPassword)
	if err != nil {
		http.Error(w, "Error inserting user into the database", http.StatusInternalServerError)
		return
	}
	// Redirect to the login page after successful registration
	http.Redirect(w, r, "/login", http.StatusFound)
}

func loginUser(w http.ResponseWriter, r *http.Request) {
	// Open database connection
	db, err := openDB()
	if err != nil {
		http.Error(w, "Database connection failed", http.StatusInternalServerError)
		return
	}
	defer db.Close()

	// Parse form data
	err = r.ParseForm()
	if err != nil {
		http.Error(w, "Error parsing form", http.StatusBadRequest)
		return
	}

	// Get the login credentials from the form
	email := r.FormValue("email")
	password := r.FormValue("password")

	// Query the database for the user by email
	var storedPassword string
	err = db.QueryRow("SELECT password FROM users WHERE email = ?", email).Scan(&storedPassword)
	if err != nil {
		if err == sql.ErrNoRows {
			// No user found with the provided email
			http.Error(w, "Invalid email or password", http.StatusUnauthorized)
		} else {
			// Other database errors
			http.Error(w, "Error querying the database", http.StatusInternalServerError)
		}
		return
	}

	// Compare the provided password with the stored hashed password
	err = bcrypt.CompareHashAndPassword([]byte(storedPassword), []byte(password))
	if err != nil {
		// Invalid password
		http.Error(w, "Invalid email or password", http.StatusUnauthorized)
		return
	}

	// If the password is correct, redirect to the dashboard or home page
	http.Redirect(w, r, "/home", http.StatusFound)
}

// Insert a test user
//     _, err := db.Exec(`
//         INSERT INTO users (nickname, age, gender, first_name, last_name, email, password)
//         VALUES ('Ahmed', 25, 'male', 'Ahmed', 'Ali', 'Ahmed@gmail.com', 'password123');
//     `)
//     if err != nil {
//         log.Fatal(err)
//     }

//     fmt.Println("Test user inserted!")

//     // Insert a test session
//     _, err = db.Exec(`
//         INSERT INTO sessions (user_id, created_at, expires_at)
//         VALUES ((SELECT id FROM users WHERE email = 'Ahmed@gmail.com'), ?, ?);
//     `, time.Now().Format("2006-01-02 15:04:05"), time.Now().Add(24*time.Hour).Format("2006-01-02 15:04:05"))
//     if err != nil {
//         log.Fatal(err)
//     }

//     fmt.Println("Test session inserted!")

//     // Insert a test online user
//     _, err = db.Exec(`
//         INSERT INTO online_users (user_id, online_status, last_seen)
//         VALUES ((SELECT id FROM users WHERE email = 'Ahmed@gmail.com'), 1, ?);
//     `, time.Now().Format("2006-01-02 15:04:05"))
//     if err != nil {
//         log.Fatal(err)
//     }

//     fmt.Println("Test online user inserted!")
// }
// DROP TABLE IF EXISTS users;
// DROP TABLE IF EXISTS posts;
// DROP TABLE IF EXISTS messages;
// DROP TABLE IF EXISTS comments;
// DROP TABLE IF EXISTS online_users;
// DROP TABLE IF EXISTS sessions;

func main() {
	// Open database connection
	db, err := openDB()
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	// Register route
	http.HandleFunc("/register", registerUser)

	// Start the server
	log.Fatal(http.ListenAndServe(":8080", nil))

	// Test the connection
	err = db.Ping()
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println("Connected to SQLite database!")

	// Create tables if they don't exist
	createTables(db)

}
