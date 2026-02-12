import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Role from "../models/Role.js";

const signToken = (user) => jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password || !name) return res.status(400).json({ message: "Missing fields" });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email already registered" });

    // Force every public registration to be a 'customer'
    const roleDoc = await Role.findOne({ name: "customer" });
    if (!roleDoc) return res.status(500).json({ message: "Error: Customer role not found" });

    // Pass plain password; Pre-save hook will hash it
    const user = await User.create({ name, email, password, role: roleDoc._id });
    const token = signToken(user);
    res.json({ message: "Registered", token, user: { id: user._id, name, email, role: "customer" } });
  } catch (err) {
    res.status(500).json({ message: "Server error", err: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Login attempt:", email);

    if (!email || !password) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const user = await User.findOne({ email }).populate("role");
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Use the model method
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = signToken(user);
    res.json({
      message: "Login success",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role.name },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", err: err.message });
  }
};


