package database

import (
	"database/sql"
	"errors"
	"strconv"
	"time"

	"real-time-forum/structs"
)

// Attempts to insert a new post into the database
func NewPost(path string, p structs.Post, u structs.User) error {
	//Opens the database
	db, err := OpenDB(path)
	if err != nil {
		return err
	}

	defer db.Close()

	dt := time.Now().Format("Mon, 02 Jan 2006 03:04 PM")

	//Executes the insert statement
	_, err = db.Exec(AddPost, u.Id, p.Category, p.Title, p.Content, dt, p.Likes, p.Dislikes)
	if err != nil {
		return err
	}

	return nil
}

// Converts post table query results into an array of post structs
func ConvertRowToPost(rows *sql.Rows) ([]structs.Post, error) {
	var posts []structs.Post

	//Loops through the rows provided
	for rows.Next() {
		var p structs.Post

		//Stores the row data in a temporary post struct
		err := rows.Scan(&p.Id, &p.User_id, &p.Category, &p.Title, &p.Content, &p.Date, &p.Likes, &p.Dislikes)
		if err != nil {
			break
		}

		//Appends the temporary struct to the array
		posts = append(posts, p)
	}

	return posts, nil
}

// Gets all posts from the database
func FindAllPosts(path string) ([]structs.Post, error) {
	//Opens the database
	db, err := OpenDB(path)
	if err != nil {
		return []structs.Post{}, errors.New("failed to open database")
	}

	defer db.Close()

	//Finds all the users
	rows, err := db.Query(GetAllPost)
	if err != nil {
		return []structs.Post{}, errors.New("failed to find posts")
	}

	//Convert the rows to an array of users
	posts, err := ConvertRowToPost(rows)
	if err != nil {
		return []structs.Post{}, errors.New("failed to convert")
	}

	return posts, nil
}

// Gets posts from the database based on the passed parameter (id, user_id, category)
func FindPostByParam(path, parameter, data string) ([]structs.Post, error) {
	var q *sql.Rows

	//Opens the database
	db, err := OpenDB(path)
	if err != nil {
		return []structs.Post{}, errors.New("failed to open database")
	}

	defer db.Close()

	//Checks which parameter to search the database by
	switch parameter {
	case "id":
		//Converts the data to an integer
		i, err := strconv.Atoi(data)
		if err != nil {
			return []structs.Post{}, errors.New("id must be an integer")
		}

		//Searches the database by id
		q, err = db.Query(GetPostById, i)
		if err != nil {
			return []structs.Post{}, errors.New("could not find id")
		}
	case "user_id":
		//Searches the database by user_id
		q, err = db.Query(GetAllPostByUser, data)
		if err != nil {
			return []structs.Post{}, errors.New("could not find any posts by that user")
		}
	case "category":
		//Searches the database by category
		q, err = db.Query(GetAllPostByCategory, data)
		if err != nil {
			return []structs.Post{}, errors.New("could not find any posts with that category")
		}
	default:
		//Returns an error if searched by a different parameter
		return []structs.Post{}, errors.New("cannot search by that parameter")
	}

	//Converts the database rows to an array of post structs
	posts, err := ConvertRowToPost(q)
	if err != nil {
		return []structs.Post{}, errors.New("failed to convert")
	}

	return posts, nil
}
