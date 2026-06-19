import jwt from "jsonwebtoken"

export function jwtMiddleware(req, res, next) {
    const authHeader = req.headers["authorization"]

    if (!authHeader) {
        return res.status(401).json({ 
            message: "Unauthorized" 
        })
    }

    if (!authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ 
            message: "Format token tidak valid" 
        })
    }

    const tokenTrimmed = authHeader.split(" ")[1]

    jwt.verify(tokenTrimmed, "supersecret", (err, decoded) => {
        if (err) {
            return res.status(401).json({ 
                message: "Unauthorized" 
            })
        }

        req.user = decoded
        next()
    })
}

export function requireAdmin(req, res, next) {
    const role = req.user?.role
    if (role !== "admin" && role !== "super admin") {
        return res.status(403).json({ 
            message: "Akses ditolak. Hanya admin yang dapat mengakses." 
        })
    }
    next()
}