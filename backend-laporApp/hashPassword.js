import bcrypt from "bcrypt"

const password = "superadmin123"
const hash = await bcrypt.hash(password, 10)

console.log(hash)

// node hashPassword.js