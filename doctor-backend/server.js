import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
const app = express();

// Dynamic CORS — accept all vercel.app subdomains + localhost
const allowedOrigin = (origin, cb) => {
  cb(null, true);
};

app.use(cors({ origin: allowedOrigin, credentials: true }));

app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_key";

// ----------------- DATABASE -----------------
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/elderEase")
  .then(() => console.log("✅ Doctor DB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

// ----------------- MODELS -----------------
const doctorSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  specialization: String,
  phone: String,
});
const Doctor = mongoose.model("Doctor", doctorSchema);

const patientSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
  name: String,
  age: Number,
  condition: String,
  ongoingTreatment: String,
  lastVisit: Date,
  status: String,
});
const Patient = mongoose.model("Patient", patientSchema);

const appointmentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient" },
  patientName: { type: String, required: true },
  doctor: { type: String, default: "Unassigned" },
  date: { type: String, required: true },
  time: { type: String, required: true },
  reason: { type: String, default: "" },
  status: { type: String, enum: ["pending", "confirmed", "completed", "cancelled"], default: "pending" },
}, { collection: "appointments", timestamps: true });
const Appointment = mongoose.model("Appointment", appointmentSchema);

// ----------------- ROUTES -----------------
app.get("/health", (_req, res) => res.json({ ok: true }));

// Doctor login
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const doctor = await Doctor.findOne({ email });
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    const ok = await bcrypt.compare(password, doctor.password);
    if (!ok) return res.status(401).json({ message: "Invalid password" });

    const token = jwt.sign(
      { id: doctor._id, role: "doctor" },
      JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.json({ status: "ok", token, doctor });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed" });
  }
});

// Get all patients
app.get("/patients", async (_req, res) => {
  const patients = await Patient.find().populate("userId", "-password");
  res.json({ status: "ok", patients });
});

// Recent patients (last 5 by visit)
app.get("/api/patients/recent", async (_req, res) => {
  try {
    const patients = await Patient.find().sort({ lastVisit: -1 }).limit(5);
    res.json({ status: "ok", patients });
  } catch (err) {
    console.error("❌ Recent patients error:", err);
    res.status(500).json({ message: "Could not fetch recent patients" });
  }
});

// Book appointment
app.post("/appointments", async (req, res) => {
  try {
    const { doctorId, patientName, date, time, reason } = req.body;
    if (!doctorId || !patientName || !date || !time) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Use date + time correctly matching patient-backend
    const appointment = new Appointment({
      doctor: doctorId,
      patientName,
      date,
      time,
      reason,
    });

    await appointment.save();
    res.json({ status: "ok", appointment });
  } catch (err) {
    console.error("❌ Appointment error:", err);
    res.status(500).json({ message: "Could not book appointment" });
  }
});

// Get all appointments
app.get("/appointments", async (_req, res) => {
  const appointments = await Appointment.find().populate("doctor", "name email");
  res.json({ status: "ok", appointments });
});

// Today's appointments
app.get("/appointments/today", async (_req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const todayAppointments = await Appointment.find({
      date: today,
    }).populate("doctor", "name email");

    res.json({ status: "ok", appointments: todayAppointments });
  } catch (err) {
    console.error("❌ Today error:", err);
    res.status(500).json({ message: "Could not fetch today's appointments" });
  }
});

// Upcoming appointments (future only)
app.get("/appointments/upcoming", async (_req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const upcomingAppointments = await Appointment.find({
      date: { $gte: today },
    })
      .sort({ date: 1, time: 1 })
      .limit(10)
      .populate("doctor", "name email");

    res.json({ status: "ok", appointments: upcomingAppointments });
  } catch (err) {
    console.error("❌ Upcoming error:", err);
    res.status(500).json({ message: "Could not fetch upcoming appointments" });
  }
});

// Update appointment
app.put("/appointments/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { date, time, status, reason } = req.body;

    let update = { status, reason };
    if (date && time) {
      update.date = date;
      update.time = time;
    }

    const appointment = await Appointment.findByIdAndUpdate(
      id,
      update,
      { new: true, omitUndefined: true }
    );

    if (!appointment) return res.status(404).json({ message: "Appointment not found" });
    res.json({ status: "ok", appointment });
  } catch (err) {
    console.error("❌ Update error:", err);
    res.status(500).json({ message: "Could not update appointment" });
  }
});

// Cancel appointment
app.delete("/appointments/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Appointment.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Appointment not found" });
    res.json({ status: "ok", message: "Appointment cancelled" });
  } catch (err) {
    console.error("❌ Cancel error:", err);
    res.status(500).json({ message: "Could not cancel appointment" });
  }
});

// ----------------- START -----------------
const PORT = process.env.PORT || 5001;

app.listen(PORT, () =>
  console.log(`🚀 Doctor server running on port ${PORT}`)
);
