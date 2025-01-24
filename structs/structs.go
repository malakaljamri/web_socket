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
	Id          int    `json:"id"`
	Sender_id   int    `json:"sender_id"`
	Receiver_id int    `json:"receiver_id"`
	Content     string `json:"content"`
	Date        string `json:"date"`
	Msg_type    string `json:"msg_type"`
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