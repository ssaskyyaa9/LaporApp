import express from "express"
import authRouter from "./routes/authRoute.js"
import userRouter from "./routes/userRoute.js"
import laporanRouter from "./routes/laporanRoute.js"
import komentarRouter from "./routes/komentarRoute.js"
import notifikasiRouter from "./routes/notifikasiRoute.js"
import kategoriRouter from "./routes/kategoriRoute.js"
import { jwtMiddleware } from "./middlewares/authMiddleware.js"
import { roleMiddleware } from "./middlewares/roleMiddleware.js"
import { getProfile, updateProfile } from "./controllers/userController.js"
import statistikRouter from "./routes/statistikRoute.js"
import { upload } from "./middlewares/uploadMiddleware.js"
import cors from "cors";

const app = express()
const port = 5000

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'] }));
app.options('*', cors());
app.use(express.json())
app.use('/uploads', express.static('uploads'))
app.use("/api/auth", authRouter)
app.use("/api/users", jwtMiddleware, roleMiddleware("super admin"), userRouter)
app.get("/api/profile", jwtMiddleware, getProfile)
app.put("/api/profile", jwtMiddleware, upload.single("foto"), updateProfile)
app.use("/api/laporan", jwtMiddleware, laporanRouter)
app.use("/api/komentar", jwtMiddleware, komentarRouter)
app.use("/api/notifikasi", jwtMiddleware, notifikasiRouter)
app.use("/api/kategori", kategoriRouter)
app.use("/api/statistik", jwtMiddleware, statistikRouter)
app.use('/uploads', express.static('uploads'));

export default app;