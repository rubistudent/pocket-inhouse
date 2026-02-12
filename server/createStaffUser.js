import mongoose from "mongoose";
import User from "./models/User.js";
import Role from "./models/Role.js"; // Import Role model
import dotenv from "dotenv";

dotenv.config();

const createStaffUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for staff seeding");

        const staffRole = await Role.findOne({ name: "staff" });
        if (!staffRole) {
            console.error("Error: 'staff' role not found. Please run seedRoles.js first.");
            process.exit(1);
        }

        // Check if user already exists
        const email = "staff@pocket.com";
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log(`User ${email} already exists. Skipping creation.`);
            process.exit(0);
        }

        const user = await User.create({
            name: "Staff Member",
            email: email,
            password: "staffpassword",
            role: staffRole._id,
        });

        console.log("Staff User created successfully:");
        console.log({
            id: user._id,
            name: user.name,
            email: user.email,
            role: "staff"
        });

        await mongoose.disconnect();
    } catch (error) {
        console.error("Error seeding staff user:", error);
        process.exit(1);
    }
};

createStaffUser();
