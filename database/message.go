package database

import (
	"database/sql"
	"errors"
	"strconv"

	"real-time-forum/structs"
)

// Attempts to insert a new message into the database
func NewMessage(path string, m structs.Message) error {
	//Opens the database
	db, err := OpenDB(path)
	if err != nil {
		return err
	}

	defer db.Close()

	//Executes the insert statement
	_, err = db.Exec(AddMessage, m.Sender_id, m.Receiver_id, m.Content, m.Date)
	if err != nil {
		return err
	}

	err = UpdateChatTime(m.Sender_id, m.Receiver_id, db)
	if err != nil {
		return err
	}

	return nil
}

// Converts message table query results into an array of message structs
func ConvertRowToMessage(rows *sql.Rows) ([]structs.Message, error) {
	var messages []structs.Message

	//Loops through the rows provided
	for rows.Next() {
		var m structs.Message

		//Stores the row data in a temporary message struct
		err := rows.Scan(&m.Id, &m.Sender_id, &m.Receiver_id, &m.Content, &m.Date)
		if err != nil {
			break
		}

		//Appends the temporary struct to the array
		messages = append(messages, m)
	}

	return messages, nil
}

// Finds chat messages between users with pagination
func FindChatMessages(path, sender, receiver string, limit, offset int) ([]structs.Message, error) {
	//Opens the database
	db, err := OpenDB(path)
	if err != nil {
		return []structs.Message{}, errors.New("failed to open database")
	}

	defer db.Close()

	//Converts sender and receiver ids to integers
	s, err := strconv.Atoi(sender)
	if err != nil {
		return []structs.Message{}, errors.New("sender id must be an integer")
	}

	r, err := strconv.Atoi(receiver)
	if err != nil {
		return []structs.Message{}, errors.New("receiver id must be an integer")
	}

	//Searches database for messages between the two users with limit and offset
	q, err := db.Query(GetAllChatMessage, s, r, r, s, limit, offset)
	if err != nil {
		return []structs.Message{}, errors.New("could not find chat messages")
	}

	//Converts rows to an array of message structs
	messages, err := ConvertRowToMessage(q)
	if err != nil {
		return []structs.Message{}, errors.New("failed to convert")
	}

	return messages, nil
}
