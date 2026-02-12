import Role from "./models/Role.js";
import connectDB from "./config/db.js";
import dotenv from "dotenv";

dotenv.config();

async function seedRoles() {
  const roles = ["staff", "admin", "customer"];

  for (const roleName of roles) {
    const exists = await Role.findOne({ name: roleName });
    if (!exists) {
      await Role.create({ name: roleName });
      console.log(`Seeded role: ${roleName}`);
    } else {
      console.log(`Role already exists: ${roleName}`);
    }
  }
  process.exit();
}
connectDB().then(() => seedRoles());
