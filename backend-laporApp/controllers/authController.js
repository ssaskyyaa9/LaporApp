import connection from "../database.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

export async function register(req, res) {
    try {
        const { username, email, password } = req.body

        if (!username || !email || !password) {
            return res.status(400).json({
                message: "Semua field wajib diisi."
            })
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

        if (!emailRegex.test(email)) {
            return res.status(400).json({
                message: "Format email tidak valid."
            })
        }

        const [user] = await connection.query(
            "SELECT * FROM users WHERE email = ?", [email]
        )

        if (user.length > 0) {
            return res.status(400).json({
                message: "Email sudah digunakan."
            })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        await connection.query(
            "INSERT INTO users (username, email, password, is_verified) VALUES (?, ?, ?, ?)",
            [username, email, hashedPassword, "menunggu"]
        )

        res.status(201).json({
            message: "Registrasi berhasil! Akun Anda sedang menunggu verifikasi admin."
        })

    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
}

export async function login(req, res) {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({
                message: "Email dan password wajib diisi."
            })
        }

        const [user] = await connection.query(
            "SELECT * FROM users WHERE email = ?", [email]
        )

        if (!user.length) {
            return res.status(400).json({
                message: "Email atau password salah."
            })
        }

        const isPasswordValid = await bcrypt.compare(password, user[0].password)

        if (!isPasswordValid) {
            return res.status(400).json({
                message: "Email atau password salah."
            })
        }

        // Cek verifikasi admin
        if (user[0].is_verified === "menunggu") {
            return res.status(403).json({
                message: "Akun Anda sedang menunggu verifikasi admin. Silakan tunggu."
            })
        }

        if (user[0].is_verified === "ditolak") {
            return res.status(403).json({
                message: "Akun Anda ditolak oleh admin. Hubungi admin untuk informasi lebih lanjut."
            })
        }

        const token = jwt.sign(
            { id: user[0].id, username: user[0].username, role: user[0].role },
            "supersecret"
        )

        res.json({
            message: "Berhasil login.",
            token: token
        })

    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
}