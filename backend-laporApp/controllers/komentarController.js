import connection from "../database.js"

// LIHAT KOMENTAR PER LAPORAN
export async function getKomentarByLaporan(req, res) {
    try {
        const { id_laporan } = req.params

        const [laporan] = await connection.query(
            "SELECT id_laporan FROM laporan WHERE id_laporan = ?", [id_laporan]
        )
        if (!laporan.length) {
            return res.status(404).json({ 
                message: "laporan tidak ditemukan" 
            })
        }

        const [komentar] = await connection.query(`
            SELECT 
                k.id_komentar,
                k.id_laporan,
                k.isi_komentar,
                k.tanggal,
                u.id AS id_users,
                u.username,
                u.foto
            FROM komentar k
            JOIN users u ON k.id_users = u.id
            WHERE k.id_laporan = ?
            ORDER BY k.tanggal ASC
        `, [id_laporan])

        res.json({ 
            data: komentar 
        })

    } catch (error) {
        res.status(500).json({ 
            message: error.message 
        })
    }
}

// CREATE KOMENTAR
export async function createKomentar(req, res) {
    try {
        const { id_laporan } = req.params
        const { isi_komentar } = req.body
        const id_users = req.user.id

        if (!isi_komentar) {
            return res.status(400).json({ 
                message: "isi komentar tidak boleh kosong" 
            })
        }

        const [laporan] = await connection.query(
            "SELECT id_laporan, id_users, judul FROM laporan WHERE id_laporan = ?",
            [id_laporan]
        )
        if (!laporan.length) {
            return res.status(404).json({ 
                message: "laporan tidak ditemukan" 
            })
        }

        const [result] = await connection.query(
            "INSERT INTO komentar (id_users, id_laporan, isi_komentar) VALUES (?, ?, ?)",
            [id_users, id_laporan, isi_komentar]
        )

        const pemilikLaporan = laporan[0].id_users
        if (pemilikLaporan !== id_users) {
            await connection.query(
                "INSERT INTO notifikasi (id_users, id_laporan, pesan, tipe) VALUES (?, ?, ?, 'komentar')",
                [pemilikLaporan, id_laporan, `${req.user.username} berkomentar di laporan kamu: "${laporan[0].judul}"`]
            )
        }

        res.status(201).json({
            message: "komentar berhasil ditambahkan",
            id: result.insertId
        })

    } catch (error) {
        res.status(500).json({ 
            message: error.message 
        })
    }
}

// UPDATE KOMENTAR
export async function updateKomentar(req, res) {
    try {
        const { id_komentar } = req.params
        const { isi_komentar } = req.body
        const id_users = req.user.id

        if (!isi_komentar) {
            return res.status(400).json({ 
                message: "isi komentar tidak boleh kosong" 
            })
        }

        const [existing] = await connection.query(
            "SELECT * FROM komentar WHERE id_komentar = ?",
            [id_komentar]
        )
        
        if (!existing.length) {
            return res.status(404).json({ 
                message: "komentar tidak ditemukan" 
            })
        }

        if (existing[0].id_users !== id_users) {
            return res.status(403).json({ 
                message: "kamu tidak berhak mengedit komentar ini" 
            })
        }

        await connection.query(
            "UPDATE komentar SET isi_komentar = ? WHERE id_komentar = ?",
            [isi_komentar, id_komentar]
        )

        res.json({ 
            message: "komentar berhasil diperbarui" 
        })

    } catch (error) {
        res.status(500).json({ 
            message: error.message 
        })
    }
}

// DELETE KOMENTAR
export async function deleteKomentar(req, res) {
    try {
        const { id_komentar } = req.params
        const id_users = req.user.id

        const [existing] = await connection.query(
            "SELECT * FROM komentar WHERE id_komentar = ?",
            [id_komentar]
        )
        if (!existing.length) {
            return res.status(404).json({ 
                message: "komentar tidak ditemukan" 
            })
        }

        if (existing[0].id_users !== id_users) {
            return res.status(403).json({ 
                message: "kamu tidak berhak menghapus komentar ini" 
            })
        }

        await connection.query(
            "DELETE FROM komentar WHERE id_komentar = ?",
            [id_komentar]
        )

        res.json({ 
            message: "komentar berhasil dihapus" 
        })

    } catch (error) {
        res.status(500).json({ 
            message: error.message 
        })
    }
}