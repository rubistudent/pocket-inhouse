import mongoose from "mongoose";
import dotenv from "dotenv";
import Role from "./models/Role.js";
import User from "./models/User.js";

dotenv.config();

const diagnose = async () => {
    try {
        console.log("Checking Environment Variables...");
        if (!process.env.JWT_SECRET) console.error("❌ JWT_SECRET is missing!");
        else console.log("✅ JWT_SECRET is present.");

        if (!process.env.MONGO_URI) console.error("❌ MONGO_URI is missing!");
        else console.log("✅ MONGO_URI is present.");

        console.log("\nConnecting to DB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Custom DB Connection Successful");

        console.log("\nChecking Roles...");
        const roles = await Role.find({});
        console.log("Roles found:", roles.map(r => r.name));

        const customerRole = await Role.findOne({ name: "customer" });
        if (!customerRole) {
            console.error("❌ 'customer' role NOT found in DB!");
        } else {
            console.log("✅ 'customer' role found:", customerRole._id);
        }

        console.log("\nChecking Validation...");
        try {
            if (customerRole) {
                // Dry run of user creation (rollback transaction if possible, or just don't save)
                // Actually, let's just create a test user and delete it immediately.
                const testEmail = "diagnostic_test_" + Date.now() + "@test.com";
                console.log("Attempting to create test user:", testEmail);
                const user = await User.create({
                    name: "Diagnostic Test",
                    email: testEmail,
                    password: "password123",
                    role: customerRole._id
                });
                console.log("✅ User creation successful:", user._id);
                await User.findByIdAndDelete(user._id);
                console.log("✅ Test user deleted.");
            }
        } catch (err) {
            console.error("❌ User creation failed:", err.message);
            console.error(err);
        }

    } catch (error) {
        console.error("❌ Diagnosis failed:", error);
    } finally {
        await mongoose.disconnect();
    }
};

diagnose();
