import express from "express"
import { getAllUsers, getUserById, createUser, updateUser, deleteUser, verifikasiUser } from "../controllers/userController.js"

const userRouter = express.Router()

userRouter.get("/", getAllUsers)
userRouter.get("/:id", getUserById)
userRouter.post("/", createUser)
userRouter.put("/:id", updateUser)
userRouter.delete("/:id", deleteUser)
userRouter.patch("/:id/verifikasi", verifikasiUser)

export default userRouter