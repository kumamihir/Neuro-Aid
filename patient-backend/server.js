import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import twilio from "twilio";
import { createServer } from "http";
import { Server } from "socket.io";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10001;
const MONGO_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/elderEase";
const JWT_SECRET = process.env.JWT_SECRET || "super_secret_key";

let twilioClient = null;
try {
  if (process.env.TWILIO_SID && process.env.TWILIO_AUTH) {
    twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH);
    console.log("✅ Twilio client initialized");
  } else {
    console.warn("⚠ Twilio credentials not found — SMS features disabled");
  }
} catch (err) {
  console.warn("⚠ Twilio init failed:", err.message);
}

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:8080",
      "http://localhost:8090",
      "https://patient-frontend-txxi.vercel.app",
      "https://patient-frontend.vercel.app",
      "https://neuro-desk-portal.vercel.app",
    ],
    credentials: true,
  },
});

app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:8080",
      "http://localhost:8090",
      "https://patient-frontend-txxi.vercel.app",
      "https://patient-frontend.vercel.app",
      "https://neuro-desk-portal.vercel.app",
    ],
    credentials: true,
  })
);

mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

/* SCHEMAS */
const PatientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    age: { type: Number },
    gender: { type: String, enum: ["male", "female", "other"] },
    phone: { type: String, unique: true },
    relativePhone: { type: String, default: "" },
    condition: { type: String, default: "" },
    ongoingTreatment: { type: String, default: "" },
    bloodGroup: { type: String, default: "" },
    profileImage: { type: String, default: "" },
    lastVisit: { type: Date, default: null },
    status: {
      type: String,
      enum: ["critical", "attention", "stable", "new"],
      default: "new",
    },
    subscriptionPlan: {
      type: String,
      enum: ["Basic", "Plus", "Pro"],
      default: "Basic",
    },
    deviceId: { type: String, default: "", sparse: true },
  },
  { collection: "patients" }
);

const AppointmentSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient" },
    patientName: { type: String, required: true },
    doctor: { type: String, default: "Unassigned" },
    date: { type: String, required: true },
    time: { type: String, required: true },
    reason: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending",
    },
  },
  { collection: "appointments", timestamps: true }
);

const GeofenceSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    geofence: { lat: Number, lng: Number },
    currentLocation: { lat: Number, lng: Number },
    lastDeviceUpdate: { type: Date, default: null },
    locationSource: { type: String, enum: ["phone", "device"], default: "phone" },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: "geofences" }
);

const AlertSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    type: { type: String, enum: ["geofence", "sos"], required: true },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: "alerts" }
);

// Reminder schema
const ReminderSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    date: { type: String, required: true }, // 'YYYY-MM-DD'
    time: { type: String, required: true }, // 'HH:mm'
    completed: { type: Boolean, default: false },
  },
  { collection: "reminders", timestamps: true }
);

// Chat Message schema
const MessageSchema = new mongoose.Schema(
  {
    conversationId: { type: String, required: true, index: true },
    senderId: { type: String, required: true },
    senderName: { type: String, required: true },
    senderRole: { type: String, enum: ["patient", "doctor"], required: true },
    receiverId: { type: String, required: true },
    receiverName: { type: String, default: "" },
    text: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  { collection: "messages", timestamps: true }
);

// Conversation schema
const ConversationSchema = new mongoose.Schema(
  {
    participants: [{ id: String, name: String, role: String }],
    lastMessage: { type: String, default: "" },
    lastMessageAt: { type: Date, default: Date.now },
    patientId: { type: String, required: true },
    doctorId: { type: String, required: true },
  },
  { collection: "conversations", timestamps: true }
);

/* MODELS */
const Patient = mongoose.models.Patient || mongoose.model("Patient", PatientSchema);
const Appointment = mongoose.models.Appointment || mongoose.model("Appointment", AppointmentSchema);
const Geofence = mongoose.models.Geofence || mongoose.model("Geofence", GeofenceSchema);
const Alert = mongoose.models.Alert || mongoose.model("Alert", AlertSchema);
const Reminder = mongoose.models.Reminder || mongoose.model("Reminder", ReminderSchema);
const Message = mongoose.models.Message || mongoose.model("Message", MessageSchema);
const Conversation = mongoose.models.Conversation || mongoose.model("Conversation", ConversationSchema);

/* AUTH HELPERS */
function parseAuthToken(req) {
  const authHeader =
    req.headers.authorization || req.headers["x-access-token"] || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : authHeader;
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

const authMiddleware = (roles = []) => {
  return (req, res, next) => {
    const decoded = parseAuthToken(req);
    if (!decoded)
      return res
        .status(403)
        .json({ status: "error", message: "No token or invalid token" });
    if (roles.length && !roles.includes(decoded.role))
      return res
        .status(403)
        .json({ status: "error", message: "Access denied" });
    req.user = decoded;
    next();
  };
};

/* ROUTES */

app.get("/health", (_req, res) => res.json({ ok: true }));

/* AUTH */
app.post("/signup", async (req, res) => {
  try {
    const { name, email, password, confirmPassword, age, gender, phone, relativePhone } = req.body;

    if (!name || !email || !password || !confirmPassword || !age || !gender || !phone)
      return res.status(400).json({ status: "error", message: "All fields required" });

    if (password !== confirmPassword)
      return res.status(400).json({ status: "error", message: "Passwords do not match" });

    if (password.length < 6)
      return res.status(400).json({ status: "error", message: "Password must be at least 6 characters" });

    const existing = await Patient.findOne({ $or: [{ email }, { phone }] });
    if (existing)
      return res.status(400).json({ status: "error", message: "User with this email or phone exists" });

    const hashed = await bcrypt.hash(password, 10);

    const patient = await Patient.create({
      name,
      email,
      password: hashed,
      age,
      gender,
      phone,
      relativePhone,
      status: "new",
    });

      res.json({
        status: "ok",
        message: "Registered successfully",
        user: {
          id: patient._id,
          name: patient.name,
          email: patient.email,
          age: patient.age,
          gender: patient.gender,
          phone: patient.phone,
          relativePhone: patient.relativePhone,
          subscriptionPlan: patient.subscriptionPlan,
          role: "patient",
        },
      });
  } catch (err) {
    console.error("❌ Signup error:", err);
    res.status(500).json({ status: "error", message: "Server error" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ status: "error", message: "Email and password required" });

    const patient = await Patient.findOne({ email });
    if (!patient) return res.status(404).json({ status: "error", message: "Patient not found" });

    const ok = await bcrypt.compare(password, patient.password);
    if (!ok) return res.status(401).json({ status: "error", message: "Invalid password" });

    const token = jwt.sign({ id: patient._id, name: patient.name, role: "patient" }, JWT_SECRET, { expiresIn: "1h" });

      res.json({
        status: "ok",
        token,
        user: {
          id: patient._id,
          name: patient.name,
          email: patient.email,
          age: patient.age,
          gender: patient.gender,
          phone: patient.phone,
          relativePhone: patient.relativePhone,
          subscriptionPlan: patient.subscriptionPlan,
          role: "patient",
        },
      });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ status: "error", message: "Server error" });
  }
});

/* PROFILE */
app.get("/profile", authMiddleware(["patient"]), async (req, res) => {
  try {
    const patient = await Patient.findById(req.user.id).select("-password");
    if (!patient) return res.status(404).json({ status: "error", message: "Patient not found" });
    res.json({ status: "ok", user: patient });
  } catch {
    res.status(500).json({ status: "error", message: "Server error" });
  }
});

app.put("/profile", authMiddleware(["patient"]), async (req, res) => {
  try {
    const allowedUpdates = ["name", "phone", "age", "gender", "bloodGroup", "profileImage"];
    const updates = {};
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    const patient = await Patient.findByIdAndUpdate(req.user.id, updates, { new: true }).select("-password");
    if (!patient) return res.status(404).json({ status: "error", message: "Patient not found" });
    
    res.json({ status: "ok", message: "Profile updated successfully", user: patient });
  } catch (err) {
    console.error("❌ Profile update error:", err);
    res.status(500).json({ status: "error", message: "Server error" });
  }
});

/* ADMIN */
app.get("/admin/users", async (req, res) => {
  try {
    const users = await Patient.find().select("-password");
    res.json({ status: "ok", users });
  } catch (err) {
    res.status(500).json({ status: "error", message: "Server error" });
  }
});

app.put("/admin/users/:id/plan", async (req, res) => {
  try {
    const { plan } = req.body;
    if (!["Basic", "Plus", "Pro"].includes(plan)) {
      return res.status(400).json({ status: "error", message: "Invalid plan" });
    }
    const user = await Patient.findByIdAndUpdate(req.params.id, { subscriptionPlan: plan }, { new: true }).select("-password");
    res.json({ status: "ok", user });
  } catch (err) {
    res.status(500).json({ status: "error", message: "Server error" });
  }
});

/* APPOINTMENTS */

// GET appointments (optionally filtered by auth token)
app.get("/appointments", async (req, res) => handleGetAppointments(req, res));
app.get("/api/appointments", async (req, res) => handleGetAppointments(req, res));

async function handleGetAppointments(req, res) {
  try {
    const decoded = parseAuthToken(req);
    let query = {};
    if (decoded?.id) {
      query = { patientId: decoded.id };
    }
    const appointments = await Appointment.find(query).sort({ date: 1, time: 1 });
    res.json({ status: "ok", appointments });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
}

// DELETE appointment
app.delete("/appointments/:id", async (req, res) => {
  try {
    const result = await Appointment.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ status: "error", message: "Appointment not found" });
    res.json({ status: "ok", message: "Appointment deleted" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

app.post("/appointments", async (req, res) => handleCreateAppointment(req, res));
app.post("/api/appointments", async (req, res) => handleCreateAppointment(req, res));

async function handleCreateAppointment(req, res) {
  try {
    const decoded = parseAuthToken(req);
    const { doctor, date, time, reason, username, patientName } = req.body;

    if (!date || !time)
      return res.status(400).json({ status: "error", message: "Date and time required" });

    const finalPatientName = patientName || username || (decoded?.name ?? null);
    const patientId = decoded?.id ?? null;

    if (!finalPatientName)
      return res.status(400).json({ status: "error", message: "Patient name is required" });

    const appointment = await Appointment.create({
      patientId,
      patientName: finalPatientName,
      doctor: doctor || "Unassigned",
      date,
      time,
      reason: reason || "",
    });

    res.json({ status: "ok", message: "Appointment booked", appointment });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
}

/* GEOFENCE */
app.post("/api/geofence/set", authMiddleware(["patient"]), async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const patientId = req.user.id;

    if (!lat || !lng)
      return res.status(400).json({ status: "error", message: "Lat/Lng required" });

    const geofence = await Geofence.findOneAndUpdate(
      { patientId },
      { geofence: { lat, lng } },
      { new: true, upsert: true }
    );

    res.json({ status: "ok", message: "Geofence set", geofence });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

app.get("/api/geofence/get", authMiddleware(["patient"]), async (req, res) => {
  try {
    const patientId = req.user.id;
    const geofenceData = await Geofence.findOne({ patientId });
    if (!geofenceData) {
      return res.json({ status: "ok", geofence: null });
    }
    res.json({ status: "ok", geofence: geofenceData.geofence });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

app.post("/api/geofence/update-location", authMiddleware(["patient"]), async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const patientId = req.user.id;

    if (!lat || !lng)
      return res.status(400).json({ status: "error", message: "Lat/Lng required" });

    const geofenceData = await Geofence.findOneAndUpdate(
      { patientId },
      { currentLocation: { lat, lng } },
      { new: true, upsert: true }
    );

    if (!geofenceData?.geofence) {
      return res.json({ status: "ok", message: "No geofence set yet" });
    }

    const { geofence } = geofenceData;

    const withinGeofence =
      Math.abs(lat - geofence.lat) < 0.01 &&
      Math.abs(lng - geofence.lng) < 0.01;

    if (!withinGeofence) {
      await Alert.create({
        patientId,
        type: "geofence",
        message: "⚠ Patient has left the geofenced area!",
      });
    }

    res.json({ status: "ok", withinGeofence, geofence: geofenceData.geofence });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

/* GPS DEVICE TRACKING */

// Helper for distance calculation (Haversine)
function getDistanceInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Register/link a GPS device to a patient
app.post("/api/device/register", async (req, res) => {
  try {
    const { patientId, deviceId } = req.body;
    if (!patientId || !deviceId)
      return res.status(400).json({ status: "error", message: "patientId and deviceId required" });

    const patient = await Patient.findByIdAndUpdate(
      patientId,
      { deviceId },
      { new: true }
    ).select("-password");

    if (!patient)
      return res.status(404).json({ status: "error", message: "Patient not found" });

    res.json({ status: "ok", message: "Device registered", patient });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Accept location from external GPS device (no JWT needed, uses deviceId)
app.post("/api/device/location", async (req, res) => {
  try {
    const { deviceId, lat, lng, timestamp } = req.body;

    if (!deviceId || lat == null || lng == null)
      return res.status(400).json({ status: "error", message: "deviceId, lat, lng required" });

    // Find patient by deviceId
    const patient = await Patient.findOne({ deviceId });
    if (!patient)
      return res.status(404).json({ status: "error", message: "Unknown device" });

    // Update location in geofence collection
    const geofenceData = await Geofence.findOneAndUpdate(
      { patientId: patient._id },
      {
        currentLocation: { lat, lng },
        lastDeviceUpdate: new Date(timestamp || Date.now()),
        locationSource: "device",
      },
      { new: true, upsert: true }
    );

    let withinGeofence = true;
    let distance = 0;

    if (geofenceData?.geofence) {
      distance = getDistanceInMeters(lat, lng, geofenceData.geofence.lat, geofenceData.geofence.lng);
      withinGeofence = distance <= 200;

      if (!withinGeofence) {
        await Alert.create({
          patientId: patient._id,
          type: "geofence",
          message: `⚠ Patient ${patient.name} has left the safe zone! (GPS Device — ${distance.toFixed(0)}m away)`,
        });
        // Real-time alert via Socket.IO
        io.emit("geofence_alert", {
          patientId: patient._id,
          patientName: patient.name,
          lat,
          lng,
          distance: Math.round(distance),
          timestamp: new Date().toISOString(),
        });
      }
    }

    res.json({
      status: "ok",
      withinGeofence,
      distance: Math.round(distance),
      geofence: geofenceData?.geofence || null,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Get device tracking status for a patient
app.get("/api/device/status/:patientId", async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.patientId).select("-password");
    if (!patient)
      return res.status(404).json({ status: "error", message: "Patient not found" });

    const geofenceData = await Geofence.findOne({ patientId: patient._id });

    res.json({
      status: "ok",
      patient: { id: patient._id, name: patient.name, deviceId: patient.deviceId },
      tracking: geofenceData
        ? {
            currentLocation: geofenceData.currentLocation,
            geofence: geofenceData.geofence,
            lastDeviceUpdate: geofenceData.lastDeviceUpdate,
            locationSource: geofenceData.locationSource,
          }
        : null,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// List all patients (for device simulator dropdown)
app.get("/api/device/patients", async (_req, res) => {
  try {
    const patients = await Patient.find().select("name email phone deviceId subscriptionPlan");
    res.json({ status: "ok", patients });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

/* ALERTS */
app.get("/api/alerts", authMiddleware(["patient", "doctor"]), async (req, res) => {
  try {
    const query = req.user.role === "patient" ? { patientId: req.user.id } : {};
    const alerts = await Alert.find(query).sort({ createdAt: -1 }).populate("patientId", "name email phone relativePhone");
    res.json({ status: "ok", alerts });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

/* TWILIO ALERTS */
app.post("/api/alerts/send-sms", authMiddleware(["patient"]), async (req, res) => {
  try {
    if (!twilioClient) {
      return res.status(503).json({ status: "error", message: "SMS service not configured" });
    }

    const patient = await Patient.findById(req.user.id);
    if (!patient?.relativePhone) {
      return res.status(400).json({ status: "error", message: "Relative phone not set" });
    }

    const message = await twilioClient.messages.create({
      body: `🚨 Alert: ${patient.name} is outside the designated safe zone. Please check on them immediately.`,
      from: process.env.TWILIO_PHONE,
      to: patient.relativePhone,
    });

    res.json({ status: "ok", sid: message.sid });
  } catch (err) {
    console.error("❌ SMS Error:", err);
    res.status(500).json({ status: "error", message: err.message });
  }
});

/* REMINDERS */

// Create reminder
app.post("/api/reminders", authMiddleware(["patient"]), async (req, res) => {
  try {
    const { title, description, date, time } = req.body;
    if (!title || !date || !time)
      return res.status(400).json({ status: "error", message: "Title, date and time required" });

    const reminder = await Reminder.create({
      patientId: req.user.id,
      title,
      description,
      date,
      time,
      completed: false,
    });

    res.json({ status: "ok", reminder });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Get reminders for patient
app.get("/api/reminders", authMiddleware(["patient"]), async (req, res) => {
  try {
    const reminders = await Reminder.find({ patientId: req.user.id }).sort({ date: 1, time: 1 });
    res.json({ status: "ok", reminders });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Update reminder (e.g., mark completed)
app.put("/api/reminders/:id", authMiddleware(["patient"]), async (req, res) => {
  try {
    const reminderId = req.params.id;
    const updates = req.body;

    const reminder = await Reminder.findOneAndUpdate(
      { _id: reminderId, patientId: req.user.id },
      updates,
      { new: true }
    );

    if (!reminder) {
      return res.status(404).json({ status: "error", message: "Reminder not found" });
    }

    res.json({ status: "ok", reminder });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Delete reminder
app.delete("/api/reminders/:id", authMiddleware(["patient"]), async (req, res) => {
  try {
    const reminderId = req.params.id;

    const reminder = await Reminder.findOneAndDelete({ _id: reminderId, patientId: req.user.id });

    if (!reminder) {
      return res.status(404).json({ status: "error", message: "Reminder not found" });
    }

    res.json({ status: "ok", message: "Reminder deleted" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

/* CHAT API ROUTES */

// Get or create conversation
app.post("/api/conversations", async (req, res) => {
  try {
    const { patientId, patientName, doctorId, doctorName } = req.body;
    if (!patientId || !doctorId) {
      return res.status(400).json({ status: "error", message: "patientId and doctorId required" });
    }

    let conversation = await Conversation.findOne({ patientId, doctorId });
    if (!conversation) {
      conversation = await Conversation.create({
        patientId,
        doctorId,
        participants: [
          { id: patientId, name: patientName || "Patient", role: "patient" },
          { id: doctorId, name: doctorName || "Doctor", role: "doctor" },
        ],
      });
    }
    res.json({ status: "ok", conversation });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Get conversations for a user (patient or doctor)
app.get("/api/conversations", async (req, res) => {
  try {
    const { userId, role } = req.query;
    if (!userId) return res.status(400).json({ status: "error", message: "userId required" });

    const query = role === "doctor" ? { doctorId: userId } : { patientId: userId };
    const conversations = await Conversation.find(query).sort({ lastMessageAt: -1 });
    res.json({ status: "ok", conversations });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Get messages for a conversation
app.get("/api/messages/:conversationId", async (req, res) => {
  try {
    const messages = await Message.find({ conversationId: req.params.conversationId }).sort({ createdAt: 1 });
    res.json({ status: "ok", messages });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Send message (REST fallback)
app.post("/api/messages", async (req, res) => {
  try {
    const { conversationId, senderId, senderName, senderRole, receiverId, receiverName, text } = req.body;
    if (!conversationId || !senderId || !text) {
      return res.status(400).json({ status: "error", message: "Missing fields" });
    }

    const message = await Message.create({
      conversationId, senderId, senderName, senderRole, receiverId, receiverName: receiverName || "", text,
    });

    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: text,
      lastMessageAt: new Date(),
    });

    io.to(conversationId).emit("new_message", message);
    res.json({ status: "ok", message });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Mark messages as read
app.put("/api/messages/read/:conversationId", async (req, res) => {
  try {
    const { userId } = req.body;
    await Message.updateMany(
      { conversationId: req.params.conversationId, receiverId: userId, read: false },
      { read: true }
    );
    res.json({ status: "ok" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Get all patients (for doctor to start conversations)
app.get("/api/chat/patients", async (_req, res) => {
  try {
    const patients = await Patient.find().select("name email phone subscriptionPlan status");
    res.json({ status: "ok", patients });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Get only Plus/Pro patients (for doctor dashboard)
app.get("/api/doctor/patients", async (req, res) => {
  try {
    const patients = await Patient.find({
      subscriptionPlan: { $in: ["Plus", "Pro"] }
    }).select("-password").sort({ lastVisit: -1 });
    res.json({ status: "ok", patients });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Doctor dashboard stats
app.get("/api/doctor/stats", async (req, res) => {
  try {
    const premiumPatients = await Patient.countDocuments({
      subscriptionPlan: { $in: ["Plus", "Pro"] }
    });
    const plusCount = await Patient.countDocuments({ subscriptionPlan: "Plus" });
    const proCount = await Patient.countDocuments({ subscriptionPlan: "Pro" });

    // Today's appointments
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const todayAppts = await Appointment.countDocuments({
      date: {
        $gte: start.toISOString().split("T")[0],
        $lte: end.toISOString().split("T")[0],
      }
    });

    // Unread messages for doctor
    const { doctorId } = req.query;
    let unreadCount = 0;
    if (doctorId) {
      unreadCount = await Message.countDocuments({ receiverId: doctorId, read: false });
    }

    // Total appointments
    const totalAppointments = await Appointment.countDocuments();

    res.json({
      status: "ok",
      stats: {
        premiumPatients,
        plusCount,
        proCount,
        todayAppointments: todayAppts,
        totalAppointments,
        unreadMessages: unreadCount,
      }
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Recent premium patients (last 5)
app.get("/api/doctor/patients/recent", async (_req, res) => {
  try {
    const patients = await Patient.find({
      subscriptionPlan: { $in: ["Plus", "Pro"] }
    }).select("-password").sort({ updatedAt: -1 }).limit(5);
    res.json({ status: "ok", patients });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

/* SOCKET.IO */
const onlineUsers = new Map(); // userId -> socketId

io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);

  // User comes online
  socket.on("user_online", ({ userId, role }) => {
    onlineUsers.set(userId, socket.id);
    io.emit("online_users", Array.from(onlineUsers.keys()));
    console.log(`✅ ${role} ${userId} is online`);
  });

  // Join a conversation room
  socket.on("join_conversation", (conversationId) => {
    socket.join(conversationId);
    console.log(`📨 Socket ${socket.id} joined room ${conversationId}`);
  });

  // Leave conversation room
  socket.on("leave_conversation", (conversationId) => {
    socket.leave(conversationId);
  });

  // Send message via socket
  socket.on("send_message", async (data) => {
    try {
      const { conversationId, senderId, senderName, senderRole, receiverId, receiverName, text } = data;

      const message = await Message.create({
        conversationId, senderId, senderName, senderRole, receiverId, receiverName: receiverName || "", text,
      });

      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: text,
        lastMessageAt: new Date(),
      });

      // Emit to everyone in the conversation room
      io.to(conversationId).emit("new_message", message);

      // Also notify receiver if they're online but not in the room
      const receiverSocket = onlineUsers.get(receiverId);
      if (receiverSocket) {
        io.to(receiverSocket).emit("message_notification", {
          conversationId,
          senderName,
          text,
        });
      }
    } catch (err) {
      console.error("❌ Socket send_message error:", err);
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  // Typing indicators
  socket.on("typing", ({ conversationId, userId, userName }) => {
    socket.to(conversationId).emit("user_typing", { userId, userName });
  });

  socket.on("stop_typing", ({ conversationId, userId }) => {
    socket.to(conversationId).emit("user_stop_typing", { userId });
  });

  // Disconnect
  socket.on("disconnect", () => {
    for (const [userId, sid] of onlineUsers.entries()) {
      if (sid === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }
    io.emit("online_users", Array.from(onlineUsers.keys()));
    console.log("❌ Socket disconnected:", socket.id);
  });
});

const KEEP_ALIVE_URL = process.env.BACKEND_URL || `http://localhost:${PORT}`;

setInterval(() => {
  fetch(`${KEEP_ALIVE_URL}/health`)
    .then((res) => {
      if (res.ok) console.log("⏳ Keep-alive ping successful");
    })
    .catch((err) => console.error("❌ Keep-alive ping failed:", err.message));
}, 10 * 60 * 1000);

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} (with Socket.IO)`);
});
