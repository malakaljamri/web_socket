package database
import (
	"database/sql"
	"errors"
	"strconv"
	"real-time-forum/structs"
	_ "github.com/mattn/go-sqlite3"
)
// Attempts to insert a user into the database, returns an error if it cannot
func NewUser(path string, u structs.User) error {
	// Open database
	db, err := OpenDB(path)
	if err != nil {
		return err
	}
	defer db.Close()
	// Execute the insert statement
	_, err = db.Exec(AddUser, u.Username, u.Firstname, u.Surname, u.Gender, u.Email, u.DOB, u.Password)
	if err != nil {
		return err
	}
	return nil
}
// Converts user table query results into an array of user structs
func ConvertRowToUser(rows *sql.Rows) ([]structs.User, error) {
	var users []structs.User
	// Loops through the rows provided
	for rows.Next() {
		var u structs.User
		// Stores the row data in a temporary user struct
		err := rows.Scan(&u.Id, &u.Username, &u.Firstname, &u.Surname, &u.Gender, &u.Email, &u.DOB, &u.Password)
		if err != nil {
			return nil, err
		}
		// Appends the temporary struct to the array
		users = append(users, u)
	}
	return users, nil
}
// Gets all users from the database
func FindAllUsers(path string) ([]structs.User, error) {
	// Opens the database
	db, err := OpenDB(path)
	if err != nil {
		return []structs.User{}, errors.New("failed to open database")
	}
	defer db.Close()
	// Finds all the users
	rows, err := db.Query(GetAllUser)
	if err != nil {
		return []structs.User{}, errors.New("failed to find users")
	}
	// Convert the rows to an array of users
	users, err := ConvertRowToUser(rows)
	if err != nil {
		return []structs.User{}, errors.New("failed to convert")
	}
	return users, nil
}
// Finds user from the database based on the passed parameter (id, username, email)
func FindUserByParam(path, parameter, data string) (structs.User, error) {
	var q *sql.Rows
	// Open the database
	db, err := OpenDB(path)
	if err != nil {
		return structs.User{}, errors.New("failed to open database")
	}
	defer db.Close()
	// Check which parameter to search the database by
	switch parameter {
	case "id":
		// Convert the data to an integer
		i, err := strconv.Atoi(data)
		if err != nil {
			return structs.User{}, errors.New("id must be an integer")
		}
		// Search the database by id
		q, err = db.Query(GetUserById, i)
		if err != nil {
			return structs.User{}, errors.New("could not find id")
		}
	case "username":
		// Search the database by username
		q, err = db.Query(GetUserByUsername, data)
		if err != nil {
			return structs.User{}, errors.New("could not find username")
		}
	case "email":
		// Search the database by email
		q, err = db.Query(GetUserByEmail, data)
		if err != nil {
			return structs.User{}, errors.New("could not find email")
		}
	default:
		// Return an error if an unsupported parameter is used
		return structs.User{}, errors.New("cannot search by that parameter")
	}
	// Convert the database rows to a slice of users
	users, err := ConvertRowToUser(q)
	if err != nil {
		return structs.User{}, errors.New("failed to convert")
	}
	// Check if the slice is empty
	if len(users) == 0 {
		return structs.User{}, errors.New("no user found")
	}
	return users[0], nil
}
// Finds the currently logged-in user from the cookie
func CurrentUser(path, val string) (structs.User, error) {
	// Open the database
	db, err := OpenDB(path)
	if err != nil {
		return structs.User{}, err
	}
	defer db.Close()
	// Query the database for the session user
	q, err := db.Query(GetSessionUser, val)
	if err != nil {
		return structs.User{}, err
	}
	// Convert the database rows to a slice of users
	users, err := ConvertRowToUser(q)
	if err != nil {
		return structs.User{}, err
	}
	// Check if the slice is empty
	if len(users) == 0 {
		return structs.User{}, errors.New("no user found for the given session")
	}
	return users[0], nil
}