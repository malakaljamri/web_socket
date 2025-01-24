package structs

type User struct {
	Id        int    `json:"id"`
	Username  string `json:"username"`
	Firstname string `json:"firstname"`
	Surname   string `json:"surname"`
	Gender    string `json:"gender"`
	Email     string `json:"email"`
	DOB       string `json:"dob"`
	Password  string `json:"password"`
}

type Session struct {
	Session_uuid string
	User_id      int
}

type Resp struct {
	Msg string `json:"msg"`
}

type Post struct {
	Id        int    `json:"id"`
	User_id   int    `json:"user_id"`
	Category  string `json:"category"`
	Title     string `json:"title"`
	Content   string `json:"content"`
	Date      string `json:"date"`
	Likes     int    `json:"likes"`
	Dislikes  int    `json:"dislikes"`
}

type OnlineUsers struct {
	UserIds  []int  `json:"user_ids"`
	Msg_type string `json:"msg_type"`
}

type Message struct {
	Id          int    `json:"id"`          // Message ID (optional for typing events)
	Sender_id   int    `json:"sender_id"`   // ID of the sender
	Receiver_id int    `json:"receiver_id"` // ID of the receiver
	Content     string `json:"content"`     // Message content
	Date        string `json:"date"`        // Date of the message
	Msg_type    string `json:"msg_type"`    // Type of message: "msg", "typing", "stop_typing"
	Thread_id   int    `json:"thread_id"`   // Optional: Thread ID for identifying specific threads
}


type Login struct {
	Data     string `json:"emailUsername"`
	Password string `json:"password"`
}

type Comment struct {
	Id       int    `json:"id"`
	Post_id  int    `json:"post_id"`
	User_id  int    `json:"user_id"`
	Content  string `json:"content"`
	Date     string `json:"date"`
}

type Chat struct {
	User_one int
	User_two int
	Time     int
}
