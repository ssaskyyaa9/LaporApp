import connection from "../database.js"

export async function getStatistikLaporan(req, res) {
    try {
        const userId = req.user.id

        const [[total]] = await connection.query( "SELECT COUNT(*) as total FROM laporan WHERE id_users = ?", [userId] )
        const [[diproses]] = await connection.query( "SELECT COUNT(*) as total FROM laporan WHERE id_users = ? AND status IN ('Menunggu', 'Dikerjakan')", [userId] )
        const [[selesai]] = await connection.query( "SELECT COUNT(*) as total FROM laporan WHERE id_users = ? AND status = 'Selesai'", [userId] )
        const [[ditolak]] = await connection.query( "SELECT COUNT(*) as total FROM laporan WHERE id_users = ? AND status = 'Ditolak'", [userId] )

        res.json({
            message: "berhasil",
            data: {
                total: total.total,
                diproses: diproses.total,
                selesai: selesai.total,
                ditolak: ditolak.total,
            }
        })

    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

// Statistik untuk ADMIN/SUPER ADMIN — semua laporan semua user
export async function getStatistikAdmin(req, res) {
    try {
        const [[total]]    = await connection.query("SELECT COUNT(*) as total FROM laporan")
        const [[menunggu]] = await connection.query("SELECT COUNT(*) as total FROM laporan WHERE status = 'Menunggu'")
        const [[diproses]] = await connection.query("SELECT COUNT(*) as total FROM laporan WHERE status = 'Dikerjakan'")
        const [[selesai]]  = await connection.query("SELECT COUNT(*) as total FROM laporan WHERE status = 'Selesai'")

        res.json({
            message: "berhasil",
            data: {
                total: total.total,
                menunggu: menunggu.total,
                diproses: diproses.total,
                selesai: selesai.total,
            }
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

// Line chart — laporan per hari (filter: 7 atau 30 hari)
export async function getGrafikHarian(req, res) {
    try {
        const hari = parseInt(req.query.hari) || 7

        const [rows] = await connection.query(`
            SELECT 
                DATE(created_at) as tanggal,
                COUNT(*) as total
            FROM laporan
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
            GROUP BY DATE(created_at)
            ORDER BY tanggal ASC
        `, [hari])

        // Isi hari yang kosong dengan 0
        const hasil = []
        for (let i = hari - 1; i >= 0; i--) {
            const tgl = new Date()
            tgl.setDate(tgl.getDate() - i)
            const str = tgl.toISOString().split("T")[0]
            const found = rows.find(r => {
                const d = new Date(r.tanggal)
                return d.toISOString().split("T")[0] === str
            })
            hasil.push({ tanggal: str, total: found ? Number(found.total) : 0 })
        }

        res.json({ message: "berhasil", data: hasil })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

// Pie chart — laporan per kategori
export async function getGrafikKategori(req, res) {
    try {
        const [rows] = await connection.query(`
            SELECT 
                k.nama_kategori,
                COUNT(l.id_laporan) as total
            FROM kategori k
            LEFT JOIN laporan l ON k.id_kategori = l.id_kategori
            GROUP BY k.id_kategori, k.nama_kategori
            ORDER BY total DESC
        `)

        res.json({
            message: "berhasil",
            data: rows.map(r => ({ nama: r.nama_kategori, total: Number(r.total) }))
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}