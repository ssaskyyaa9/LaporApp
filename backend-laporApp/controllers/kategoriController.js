import connection from "../database.js"

// GET SEMUA KATEGORI
export async function getAllKategori(req, res) {
    try {
        const [kategori] = await connection.query(
            "SELECT * FROM kategori"
        )

        res.json({
            data: kategori
        })

    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
}

// GET KATEGORI BY ID
export async function getKategoriById(req, res) {
    try {
        const [kategori] = await connection.query(
            "SELECT * FROM kategori WHERE id_kategori = ?", [req.params.id]
        )

        if (!kategori.length) {
            return res.status(404).json({
                message: "kategori tidak ditemukan"
            })
        }

        res.json({
            data: kategori[0]
        })

    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
}