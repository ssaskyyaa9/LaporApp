import connection from "../database.js"
import bcrypt from "bcrypt"

// GET ALL USERS
export async function getAllUsers(req, res) {
    try {
        const [users] = await connection.query(
            "SELECT id, username, email, role, is_verified, created_at FROM users"
        )

        res.json({
            message: "berhasil",
            data: users
        })

    } catch (error) {
        res.status(500).json({ 
            message: error.message 
        })
    }
}

// GET USER BY ID
export async function getUserById(req, res) {
    try {
        const { id } = req.params
        const [user] = await connection.query(
            "SELECT id, username, email, role, is_verified, created_at FROM users WHERE id = ?", [id]
        )

        if (user.length === 0) {
            return res.status(404).json({ 
                message: "user tidak ditemukan" 
            })
        }

        res.json({
            message: "berhasil",
            data: user[0]
        })

    } catch (error) {
        res.status(500).json({ 
            message: error.message 
        })
    }
}

// CREATE USER
export async function createUser(req, res) {
    const { username, email, password, role } = req.body
    const [existing] = await connection.query(
        "SELECT * FROM users WHERE email = ?", [email]
    )

    if (existing.length > 0) {
        return res.status(400).json({
            message: "email sudah digunakan"
        })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    await connection.query(
        "INSERT INTO users (username, email, password, role, is_verified) VALUES (?, ?, ?, ?, ?)",
        [username, email, hashedPassword, role, "diterima"]
    )

    res.status(201).json({
        message: "user berhasil dibuat"
    })
}

// UPDATE USER
export async function updateUser(req, res) {
    try {
        const { id } = req.params
        const { username, email, role} = req.body

        const [user] = await connection.query(
            "SELECT * FROM users WHERE id = ?", [id]
        )

        if (user.length === 0) {
            return res.status(404).json({ 
                message: "user tidak ditemukan" 
            })
        }

        const newUsername = username || user[0].username
        const newEmail = email || user[0].email
        const newRole = role || user[0].role

        await connection.query(
            `UPDATE users SET username = ?, email = ?, role = ? WHERE id = ?`,
            [newUsername, newEmail, newRole, id]
        )

        res.json({
            message: "user berhasil diupdate"
        })

    } catch (error) {
        res.status(500).json({ 
            message: error.message 
        })
    }
}

// VERIFIKASI USER
export async function verifikasiUser(req, res) {
    try {
        const { id } = req.params
        const { is_verified } = req.body

        if (!["diterima", "ditolak", "menunggu"].includes(is_verified)) {
            return res.status(400).json({ 
                message: "Status tidak valid" 
            })
        }

        const [user] = await connection.query(
            "SELECT * FROM users WHERE id = ?", [id]
        )

        if (!user.length) {
            return res.status(404).json({ 
                message: "User tidak ditemukan" 
            })
        }

        await connection.query(
            "UPDATE users SET is_verified = ? WHERE id = ?",
            [is_verified, id]
        )

        res.json({ 
            message: `berhasil verifikasi akun user status user diubah menjadi ${is_verified}` 
        })

    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

// DELETE USER
export async function deleteUser(req, res) {
    try {
        const { id } = req.params
        const [user] = await connection.query(
            "SELECT * FROM users WHERE id = ?", [id]
        )

        if (user.length === 0) {
            return res.status(404).json({ 
                message: "user tidak ditemukan" 
            })
        }

        await connection.query(
            "DELETE FROM users WHERE id = ?", [id]
        )

        res.json({
            message: "user berhasil dihapus"
        })

    } catch (error) {
        res.status(500).json({ 
            message: error.message 
        })
    }
}

export async function getProfile(req, res) {
    try {
        const userId = req.user.id
        const [user] = await connection.query(
            "SELECT id, username, email, role, foto, created_at FROM users WHERE id = ?", [userId]
        )

        if (!user.length) {
            return res.status(404).json({
                message: "user tidak ditemukan"
            })
        }

        res.status(200).json({
            message: "berhasil akses profile",
            data: user[0]
        })

    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
}

export async function updateProfile(req, res) {
    try {
        console.log("DATA BODY:", req.body);
        console.log("DATA FILE:", req.file);
        
        const userId = req.user.id
        const { username, email, password } = req.body

        const [user] = await connection.query(
            "SELECT * FROM users WHERE id = ?", [userId]
        )

        if (user.length === 0) {
            return res.status(404).json({
                message: "user tidak ditemukan"
            })
        }

        const newUsername = username || user[0].username
        const newEmail = email || user[0].email
        let newFoto = user[0].foto
        if (req.file) {
            const { uploadToImageKit } = await import("../middlewares/uploadMiddleware.js")
            newFoto = await uploadToImageKit(req.file)
        }

        let newPassword = user[0].password
        if (password) {
            newPassword = await bcrypt.hash(password, 10)
        }

        await connection.query(
            `UPDATE users SET username = ?, email = ?, password = ?, foto = ? WHERE id = ?`,
            [newUsername, newEmail, newPassword, newFoto, userId]
        )

        const [updatedUser] = await connection.query(
            "SELECT id, username, email, role, foto, created_at FROM users WHERE id = ?", [userId]
        )

        res.json({
            message: "profile berhasil diupdate",
            data: updatedUser[0]
        })

    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
}