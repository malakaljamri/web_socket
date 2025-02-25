package database

import (
	"database/sql"
	"errors"
	"strconv"
	"time"

	"real-time-forum/structs"
)

// Attempts to insert a new comment to the database
func NewComment(path string, c structs.Comment) error {
	//Opens the database
	db, err := OpenDB(path)
	if err != nil {
		return err
	}

	defer db.Close()

	dt := time.Now().Format("Mon, 02 Jan 2006 03:04 PM")

	//Executes the insert statement
	_, err = db.Exec(AddComment, c.Post_id, c.User_id, c.Content, dt)
	if err != nil {
		return err
	}

	return nil
}

// Converts comment table query results to an array of comment structs
func ConvertRowToComment(rows *sql.Rows) ([]structs.Comment, error) {
	var comments []structs.Comment

	//Loops through the rows provided
	for rows.Next() {
		var c structs.Comment

		//Stores the row data in a temporary comment struct
		err := rows.Scan(&c.Id, &c.Post_id, &c.User_id, &c.Content, &c.Date)
		if err != nil {
			break
		}

		//Appends the temporary struct to the array
		comments = append(comments, c)
	}

	return comments, nil
}

// Gets comments from the database based on the passed parameter (id, post_id, user_id)
func FindCommentByParam(path, param, data string) ([]structs.Comment, error) {
	var q *sql.Rows

	//Opens the database
	db, err := OpenDB(path)
	if err != nil {
		return []structs.Comment{}, errors.New("failed to open database")
	}

	defer db.Close()

	//Convert data to an integer
	i, err := strconv.Atoi(data)
	if err != nil {
		return []structs.Comment{}, errors.New("must provide an integer")
	}

	switch param {
	case "id":
		//Searches database by id
		q, err = db.Query(GetCommentById, i)
		if err != nil {
			return []structs.Comment{}, errors.New("could not find id")
		}
	case "post_id":
		//Searches database by post_id
		q, err = db.Query(GetAllPostComment, i)
		if err != nil {
			return []structs.Comment{}, errors.New("could not find post_id")
		}
	case "user_id":
		//Searches database by user_id
		q, err = db.Query(GetAllUserComment, i)
		if err != nil {
			return []structs.Comment{}, errors.New("could not find user_id")
		}
	default:
		//Returns an error if searched by a different parameter
		return []structs.Comment{}, errors.New("cannot search by that parameter")
	}

	//Converts the database rows to an array of comment structs
	comments, err := ConvertRowToComment(q)
	if err != nil {
		return []structs.Comment{}, errors.New("failed to convert")
	}

	return comments, nil
}
