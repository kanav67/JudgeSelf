import { pool } from '../config/postgres.js';

type UserData = {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
};

export const getUserById = async (id: string): Promise<UserData | null> => {
    const query = 'SELECT * FROM users WHERE id = $1';
    const values = [id];

    const result = await pool.query(query, values);
    return result.rows[0] || null;
};

export const getUserByUsername = async (username: string): Promise<UserData | null> => {
    const query = 'SELECT * FROM users WHERE username = $1';
    const values = [username];

    const result = await pool.query(query, values);
    return result.rows[0] || null;
};

export const getUserByEmail = async (email: string): Promise<UserData | null> => {
    const query = 'SELECT * FROM users WHERE email = $1';
    const values = [email];

    const result = await pool.query(query, values);
    return result.rows[0] || null;
};

//could use getUserByUsername to check but this is more efficient
export const checkUsernameExists = async (username: string): Promise<boolean> => {
    const query = 'SELECT EXISTS(SELECT 1 FROM users WHERE username = $1) AS exists';
    const values = [username];

    const result = await pool.query(query, values);
    return result.rows[0].exists;
};

export const checkEmailExists = async (email: string): Promise<boolean> => {
    const query = 'SELECT EXISTS(SELECT 1 FROM users WHERE email = $1) AS exists';
    const values = [email];

    const result = await pool.query(query, values);
    return result.rows[0].exists;
};


export const createUser = async (username: string, email: string, passwordHash: string): Promise<UserData> => {
    const query = `
        INSERT INTO users (username, email, password_hash)
        VALUES ($1, $2, $3)
        RETURNING *
    `;
    const values = [username, email, passwordHash];

    const result = await pool.query(query, values);
    return result.rows[0];
}

export const changeUserPassword = async (id: string, newPasswordHash: string) : Promise<UserData> => {
  const query = 'UPDATE users SET password_hash = $1 WHERE id = $2::uuid RETURNING *';
  const values = [newPasswordHash, id];

  const { rows } = await pool.query(query, values);
  return rows[0];
}

export const changeUsername = async (id: string, newUsername: string) : Promise<UserData> => {
  const query = 'UPDATE users SET username = $1 WHERE id = $2::uuid RETURNING *';
  const values = [newUsername, id];

  const { rows } = await pool.query(query, values);
  return rows[0];
}