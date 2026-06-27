import connection from "../database.js"

// LIHAT SEMUA LAPORAN
export async function getAllLaporan(req, res) {
    try {
        const { id_kategori } = req.query

        let query = `
            SELECT l.*, u.username, u.email, k.nama_kategori
            FROM laporan l
            JOIN users u ON l.id_users = u.id
            JOIN kategori k ON l.id_kategori = k.id_kategori
        `
        let params = []

        if (id_kategori) {
            query += " WHERE l.id_kategori = ?"
            params.push(id_kategori)
        }

        query += " ORDER BY l.created_at DESC"

        const [laporan] = await connection.query(query, params)

        res.json({ 
            data: laporan 
        })

    } catch (error) {
        res.status(500).json({ 
            message: error.message 
        })
    }
}

// LIHAT LAPORAN PER ID
export async function getLaporanById(req, res) {
    try {
        const [laporan] = await connection.query(`
            SELECT l.*, u.username, u.email, u.foto, k.nama_kategori
            FROM laporan l
            JOIN users u ON l.id_users = u.id
            JOIN kategori k ON l.id_kategori = k.id_kategori
            WHERE l.id_laporan = ?
        `, [req.params.id])

        if (!laporan.length) {
            return res.status(404).json({ 
                message: "laporan tidak ditemukan" 
            })
        }

        const [komentar] = await connection.query(`
            SELECT k.*, u.username, u.foto
            FROM komentar k
            JOIN users u ON k.id_users = u.id
            WHERE k.id_laporan = ?
            ORDER BY k.tanggal ASC
        `, [req.params.id])

        res.json({ 
            data: {...laporan[0], komentar
            }
        })

    } catch (error) {
        res.status(500).json({ 
            message: error.message 
        })
    }
}

// LIHAT LAPORAN PUNYA SENDIRI (user)
export async function getLaporanSaya(req, res) {
    try {
        const [laporan] = await connection.query(`
            SELECT l.*, k.nama_kategori
            FROM laporan l
            JOIN kategori k ON l.id_kategori = k.id_kategori
            WHERE l.id_users = ?
            ORDER BY l.created_at DESC
        `, [req.user.id])

        res.json({ 
            data: laporan 
        })

    } catch (error) {
        res.status(500).json({ 
            message: error.message 
        })
    }
}

// CREATE LAPORAN (user)
export async function createLaporan(req, res) {
  const id_user = req.user.id;
  try {
    const { id_kategori, judul, deskripsi, lokasi } = req.body;

    if (!id_kategori || !judul || !deskripsi || !lokasi) {
      return res.status(400).json({ message: "semua field wajib diisi" });
    }

    const { uploadToImageKit } = await import("../middlewares/uploadMiddleware.js");
    const gambar = req.file ? await uploadToImageKit(req.file) : null;

    const [result] = await connection.query(
      `INSERT INTO laporan (id_users, id_kategori, judul, deskripsi, gambar, lokasi)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.id, id_kategori, judul, deskripsi, gambar, lokasi]
    );

    const [admins] = await connection.query(
      "SELECT id FROM users WHERE role IN ('admin', 'super admin')"
    );
    for (const admin of admins) {
      await connection.query(
        "INSERT INTO notifikasi (id_users, id_laporan, pesan, status) VALUES (?, ?, ?, ?)",
        [
          admin.id,
          result.insertId,
          `Laporan baru masuk: "${judul}" menunggu verifikasi.`,
          "Menunggu",
        ]
      );
    }

    res.status(201).json({
      message: "laporan berhasil dibuat",
      data: { id: result.insertId, judul, gambar, deskripsi, lokasi, id_kategori },
      id: result.insertId,
      ok: true,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// UPDATE LAPORAN (hanya milik user sendiri & status masih menunggu)
export async function updateLaporan(req, res) {
    try {
        const [existing] = await connection.query(
            "SELECT * FROM laporan WHERE id_laporan = ?", [req.params.id]
        )

        if (!existing.length) {
            return res.status(404).json({ 
                message: "laporan tidak ditemukan" 
            })
        }

        if (req.user.role !== "user") {
            return res.status(403).json({ 
                message: "akses ditolak" 
            })
        }

        if (existing[0].id_users !== req.user.id) {
            return res.status(403).json({ 
                message: "akses ditolak" 
            })
        }

        if (existing[0].status !== "Menunggu") {
            return res.status(403).json({ 
                message: "laporan tidak bisa diedit karena sudah diverifikasi" 
            })
        }

        const { id_kategori, judul, deskripsi, lokasi } = req.body
        const { uploadToImageKit } = await import("../middlewares/uploadMiddleware.js");
        const gambar = req.file ? await uploadToImageKit(req.file) : existing[0].gambar

        await connection.query(
            `UPDATE laporan 
             SET id_kategori = ?, judul = ?, deskripsi = ?, gambar = ?, lokasi = ?
             WHERE id_laporan = ?`,
            [
                id_kategori  || existing[0].id_kategori,
                judul        || existing[0].judul,
                deskripsi    || existing[0].deskripsi,
                gambar,
                lokasi       || existing[0].lokasi,
                req.params.id
            ]
        )

        res.json({ 
            message: "laporan berhasil di edit",
            ok: true
        })

    } catch (error) {
        res.status(500).json({ 
            message: error.message 
        })
    }
}

// UPDATE STATUS LAPORAN (admin & super admin)
export async function updateStatusLaporan(req, res) {
    try {
        const { status, alasan } = req.body 
        const validStatus = ["Menunggu", "Dikerjakan", "Selesai", "Ditolak"]

        if (!validStatus.includes(status)) {
            return res.status(400).json({ 
                message: "status tidak valid" 
            })
        }

        const [existing] = await connection.query(
            "SELECT * FROM laporan WHERE id_laporan = ?", [req.params.id]
        )

        if (!existing.length) {
            return res.status(404).json({ 
                message: "laporan tidak ditemukan" 
            })
        }

        await connection.query(
            "UPDATE laporan SET status = ? WHERE id_laporan = ?",
            [status, req.params.id]
        )

        let pesanNotifikasi = `Status laporan "${existing[0].judul}" diubah menjadi ${status}`;
        if (status === "Ditolak" && alasan) {
            pesanNotifikasi = `Laporan "${existing[0].judul}" ditolak. Alasan: ${alasan}`;
        }

        await connection.query(
            "INSERT INTO notifikasi (id_users, id_laporan, pesan, status) VALUES (?, ?, ?, ?)",
            [ 
                existing[0].id_users, 
                existing[0].id_laporan,
                pesanNotifikasi, 
                status === "Selesai" ? "Disetujui" : status
            ]
        )

        res.json({ 
            message: `status laporan diubah menjadi ${status}`,
            ok: true
        })

    } catch (error) {
        res.status(500).json({ 
            message: error.message,
            ok: false
        })
    }
}

// DELETE LAPORAN (hanya milik user sendiri & status masih menunggu)
export async function deleteLaporan(req, res) {
    try {
        const [existing] = await connection.query(
            "SELECT * FROM laporan WHERE id_laporan = ?", [req.params.id]
        )

        if (!existing.length) {
            return res.status(404).json({ 
                message: "laporan tidak ditemukan" 
            })
        }

        if (req.user.role !== "user") {
            return res.status(403).json({ 
                message: "akses ditolak" 
            })
        }

        if (existing[0].id_users !== req.user.id) {
            return res.status(403).json({ 
                message: "akses ditolak" 
            })
        }

        if (existing[0].status !== "Menunggu") {
            return res.status(403).json({ 
                message: "laporan tidak bisa dihapus karena sudah diverifikasi" 
            })
        }

        await connection.query("DELETE FROM laporan WHERE id_laporan = ?", [req.params.id])

        res.json({ 
            message: "laporan berhasil dihapus" 
        })

    } catch (error) {
        res.status(500).json({ 
            message: error.message 
        })
    }
}