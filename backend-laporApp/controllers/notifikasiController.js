import connection from "../database.js"

// GET semua notifikasi milik sendiri
export async function getNotifikasiSaya(req, res) {
    try {
        const [notifikasi] = await connection.query(
            "SELECT * FROM notifikasi WHERE id_users = ? ORDER BY tanggal DESC",
            [req.user.id]
        )
        res.json({ 
            data: notifikasi 
        })

    } catch (error) {
        res.status(500).json({ 
            message: error.message 
        })
    }
}

// GET jumlah notifikasi belum dibaca (untuk badge lonceng)
export async function getJumlahUnread(req, res) {
    try {
        const [result] = await connection.query(
            "SELECT COUNT(*) as total FROM notifikasi WHERE id_users = ? AND is_read = FALSE",
            [req.user.id]
        )
        res.json({ 
            total_unread: result[0].total 
        })

    } catch (error) {
        res.status(500).json({ 
            message: error.message 
        })
    }
}

// Tandai satu notifikasi sudah dibaca
export async function readNotifikasi(req, res) {
    try {
        const { id } = req.params

        const [existing] = await connection.query(
            "SELECT * FROM notifikasi WHERE id_notifikasi = ? AND id_users = ?",
            [id, req.user.id]
        )
        if (!existing.length) {
            return res.status(404).json({ 
                message: "Notifikasi tidak ditemukan" 
            })
        }

        await connection.query(
            "UPDATE notifikasi SET is_read = TRUE WHERE id_notifikasi = ?",
            [id]
        )

        res.json({ 
            message: "Notifikasi sudah dibaca" 
        })

    } catch (error) {
        res.status(500).json({ 
            message: error.message 
        })
    }
}

// Tandai semua notifikasi sudah dibaca (otomatis saat buka halaman notifikasi)
export async function readAllNotifikasi(req, res) {
    try {
        await connection.query(
            "UPDATE notifikasi SET is_read = TRUE WHERE id_users = ?",
            [req.user.id]
        )
        res.json({ 
            message: "Semua notifikasi sudah dibaca" 
        })

    } catch (error) {
        res.status(500).json({ 
            message: error.message 
        })
    }
}

// Hapus satu notifikasi permanen (klik X)
export async function deleteNotifikasi(req, res) {
    try {
        const { id } = req.params

        const [existing] = await connection.query(
            "SELECT * FROM notifikasi WHERE id_notifikasi = ? AND id_users = ?",
            [id, req.user.id]
        )
        if (!existing.length) {
            return res.status(404).json({ 
                message: "Notifikasi tidak ditemukan" 
            })
        }

        await connection.query(
            "DELETE FROM notifikasi WHERE id_notifikasi = ?", [id]
        )

        res.json({ 
            message: "Notifikasi berhasil dihapus" 
        })

    } catch (error) {
        res.status(500).json({ 
            message: error.message 
        })
    }
}

// Hapus semua notifikasi permanen
export async function deleteAllNotifikasi(req, res) {
    try {
        await connection.query(
            "DELETE FROM notifikasi WHERE id_users = ?",
            [req.user.id]
        )
        res.json({ 
            message: "Semua notifikasi berhasil dihapus" 
        })

    } catch (error) {
        res.status(500).json({ 
            message: error.message 
        })
    }
}