package database

import (
	"database/sql"
	"time"

	"real-time-forum/structs"
)

func UpdateChatTime(u1, u2 int, db *sql.DB) error {
	now := time.Now()

	chats, err := FindChatsBetween(u1, u2, db)
	if err != nil {
		return err
	}

	if len(chats) == 0 {
		_, err = db.Exec(AddChat, u1, u2, now.UnixMilli())
		if err != nil {
			return err
		}
	} else {
		_, err = db.Exec(UpdateChat, now.UnixMilli(), chats[0].User_one, chats[0].User_two)
		if err != nil {
			return err

		}
	}

	return nil
}

func ConvertRowToChat(rows *sql.Rows) ([]structs.Chat, error) {
	var chats []structs.Chat

	defer rows.Close()
	for rows.Next() {
		var c structs.Chat

		err := rows.Scan(&c.User_one, &c.User_two, &c.Time)
		if err != nil {
			break
		}

		chats = append(chats, c)
	}

	return chats, nil
}

func FindUserChats(path string, uid int) ([]structs.Chat, error) {
	var q *sql.Rows

	db, err := OpenDB(path)
	if err != nil {
		return []structs.Chat{}, err
	}

	defer db.Close()

	q, err = db.Query(GetUserChats, uid, uid)
	if err != nil {
		return []structs.Chat{}, err
	}

	users, err := ConvertRowToChat(q)
	if err != nil {
		return []structs.Chat{}, err
	}

	return users, nil
}

func FindChatsBetween(u1, u2 int, db *sql.DB) ([]structs.Chat, error) {
	var q *sql.Rows

	q, err := db.Query(GetChatBetween, u1, u2, u2, u1)
	if err != nil {
		return []structs.Chat{}, err
	}

	users, err := ConvertRowToChat(q)
	if err != nil {
		return []structs.Chat{}, err
	}

	return users, nil
}
