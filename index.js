import "dotenv/config";
import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import { MongoClient, ObjectId } from "mongodb";

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

const isProd = process.env.NODE_ENV === "production";
const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};

const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ message: "Unauthorized: please log in." });
  }
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res
      .status(401)
      .json({ message: "Unauthorized: your session has expired." });
  }
};

const client = new MongoClient(process.env.MONGODB_URI);

async function start() {
  await client.connect();
  const db = client.db("studiospace");
  const studios = db.collection("studios");
  const bookings = db.collection("bookings");
  const sessions = db.collection("session");
  const users = db.collection("user");

  app.get("/", (req, res) => res.send("StudioSpace API running"));

  // BetterAuth session যাচাই করে JWT cookie দেওয়া
  app.post("/api/auth/token", async (req, res) => {
    const raw =
      req.cookies?.["better-auth.session_token"] ??
      req.cookies?.["__Secure-better-auth.session_token"];
    if (!raw) return res.status(401).json({ message: "Not logged in." });

    const sessionToken = raw.split(".")[0];
    const session = await sessions.findOne({ token: sessionToken });
    if (!session || new Date(session.expiresAt) < new Date()) {
      return res.status(401).json({ message: "Session not found or expired." });
    }

    const uid = String(session.userId);
    const ids = [uid];
    if (ObjectId.isValid(uid)) ids.push(new ObjectId(uid));
    const user = await users.findOne({
      $or: [{ _id: { $in: ids } }, { id: uid }],
    });
    if (!user) return res.status(401).json({ message: "User not found." });

    const token = jwt.sign(
      { email: user.email, name: user.name },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );
    res.cookie("token", token, cookieOptions);
    res.json({ ok: true });
  });

  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("token", { ...cookieOptions, maxAge: undefined });
    res.json({ ok: true });
  });

  // Home: top-rated 6
  app.get("/api/studios/featured", async (req, res) => {
    const data = await studios.find().sort({ rating: -1 }).limit(6).toArray();
    res.json(data);
  });

  // নিজের studio-র তালিকা
  app.get("/api/my-studios", verifyToken, async (req, res) => {
    const email = req.user.email;
    if (!email) return res.status(400).json({ message: "Email is required." });
    const data = await studios
      .find({ ownerEmail: email })
      .sort({ createdAt: -1 })
      .toArray();
    res.json(data);
  });

  // সব studio (category ও search সহ)
  app.get("/api/studios", async (req, res) => {
    const { category, search } = req.query;
    const query = {};
    if (category) query.category = category;
    if (search) query.title = { $regex: search, $options: "i" };
    res.json(await studios.find(query).toArray());
  });

  app.get("/api/studios/:id", async (req, res) => {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid id" });
    }
    const studio = await studios.findOne({ _id: new ObjectId(req.params.id) });
    if (!studio) return res.status(404).json({ message: "Studio not found" });
    res.json(studio);
  });

  // নতুন studio যোগ
  app.post("/api/studios", verifyToken, async (req, res) => {
    const {
      title,
      category,
      hourlyRate,
      securityDeposit,
      maxCapacity,
      location,
      image,
      amenities,
      overview,
    } = req.body;

    const ownerEmail = req.user.email;
    const ownerName = req.user.name;
    const rate = Number(hourlyRate);
    const deposit = Number(securityDeposit);
    const capacity = Number(maxCapacity);

    if (
      !title?.trim() ||
      !category ||
      !location?.trim() ||
      !image ||
      !overview?.trim()
    ) {
      return res
        .status(400)
        .json({ message: "Please fill in all required fields." });
    }
    if (!ownerEmail || !ownerName) {
      return res.status(400).json({ message: "Host information is missing." });
    }
    if (!(rate > 0) || !(deposit >= 0) || !(capacity > 0)) {
      return res
        .status(400)
        .json({ message: "Rate, deposit and capacity must be valid numbers." });
    }

    const doc = {
      title: title.trim(),
      category,
      hourlyRate: rate,
      securityDeposit: deposit,
      maxCapacity: capacity,
      location: location.trim(),
      image,
      amenities: Array.isArray(amenities) ? amenities : [],
      overview: overview.trim(),
      rating: 0,
      ownerName,
      ownerEmail,
      createdAt: new Date(),
    };

    const result = await studios.insertOne(doc);
    res.status(201).json({ insertedId: result.insertedId });
  });

  // studio মুছে ফেলা
  app.delete("/api/studios/:id", verifyToken, async (req, res) => {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid id" });
    }
    const email = req.user.email;
    if (!email) return res.status(400).json({ message: "Email is required." });

    const result = await studios.deleteOne({
      _id: new ObjectId(req.params.id),
      ownerEmail: email,
    });
    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ message: "Studio not found or you are not the owner." });
    }
    res.json({ deleted: true });
  });

  // studio আপডেট
  app.put("/api/studios/:id", verifyToken, async (req, res) => {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const {
      title,
      category,
      hourlyRate,
      securityDeposit,
      maxCapacity,
      location,
      image,
      amenities,
      overview,
    } = req.body;

    const email = req.user.email;

    if (!email) return res.status(400).json({ message: "Email is required." });

    const rate = Number(hourlyRate);
    const deposit = Number(securityDeposit);
    const capacity = Number(maxCapacity);

    if (
      !title?.trim() ||
      !category ||
      !location?.trim() ||
      !image ||
      !overview?.trim()
    ) {
      return res
        .status(400)
        .json({ message: "Please fill in all required fields." });
    }
    if (!(rate > 0) || !(deposit >= 0) || !(capacity > 0)) {
      return res
        .status(400)
        .json({ message: "Rate, deposit and capacity must be valid numbers." });
    }

    const result = await studios.updateOne(
      { _id: new ObjectId(req.params.id), ownerEmail: email },
      {
        $set: {
          title: title.trim(),
          category,
          hourlyRate: rate,
          securityDeposit: deposit,
          maxCapacity: capacity,
          location: location.trim(),
          image,
          amenities: Array.isArray(amenities) ? amenities : [],
          overview: overview.trim(),
          updatedAt: new Date(),
        },
      },
    );

    if (result.matchedCount === 0) {
      return res
        .status(404)
        .json({ message: "Studio not found or you are not the owner." });
    }
    res.json({ updated: true });
  });

  // নতুন booking (double-booking প্রতিরোধসহ)
  app.post("/api/bookings", verifyToken, async (req, res) => {
    const { studioId, date, startTime, endTime } = req.body;
    const userEmail = req.user.email;
    const userName = req.user.name;

    if (!ObjectId.isValid(studioId)) {
      return res.status(400).json({ message: "Invalid studio." });
    }
    if (!userEmail || !userName) {
      return res.status(400).json({ message: "User information is missing." });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "")) {
      return res.status(400).json({ message: "Please choose a valid date." });
    }
    const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (
      !timePattern.test(startTime || "") ||
      !timePattern.test(endTime || "")
    ) {
      return res
        .status(400)
        .json({ message: "Please choose a valid time range." });
    }
    if (endTime <= startTime) {
      return res
        .status(400)
        .json({ message: "End time must be after the start time." });
    }

    const studio = await studios.findOne({ _id: new ObjectId(studioId) });
    if (!studio) return res.status(404).json({ message: "Studio not found." });

    if (studio.ownerEmail === userEmail) {
      return res
        .status(400)
        .json({ message: "You cannot book your own studio." });
    }

    // Challenge 2: Confirmed booking-এর সাথে সময়ের overlap যাচাই
    const conflict = await bookings.findOne({
      studioId,
      date,
      status: "Confirmed",
      startTime: { $lt: endTime },
      endTime: { $gt: startTime },
    });
    if (conflict) {
      return res.status(409).json({
        message: `This studio is already booked from ${conflict.startTime} to ${conflict.endTime} on that date. Please choose another slot.`,
      });
    }

    // দাম server-এ হিসাব হয়, client-এর পাঠানো দাম বিশ্বাস করা হয় না
    const toMinutes = (t) =>
      Number(t.split(":")[0]) * 60 + Number(t.split(":")[1]);
    const hours = (toMinutes(endTime) - toMinutes(startTime)) / 60;
    const totalPrice = Number((hours * studio.hourlyRate).toFixed(2));

    const doc = {
      studioId,
      studioTitle: studio.title,
      studioImage: studio.image,
      studioLocation: studio.location,
      hostEmail: studio.ownerEmail,
      date,
      startTime,
      endTime,
      hours,
      totalPrice,
      securityDeposit: studio.securityDeposit,
      userEmail,
      userName,
      status: "Pending",
      createdAt: new Date(),
    };

    const result = await bookings.insertOne(doc);
    res.status(201).json({ insertedId: result.insertedId });
  });

  // নিজের booking-এর তালিকা
  app.get("/api/my-bookings", verifyToken, async (req, res) => {
    const email = req.user.email;
    if (!email) return res.status(400).json({ message: "Email is required." });
    const data = await bookings
      .find({ userEmail: email })
      .sort({ createdAt: -1 })
      .toArray();
    res.json(data);
  });

  // Pending booking বাতিল
  app.patch("/api/bookings/:id/cancel", verifyToken, async (req, res) => {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid id" });
    }
    const email = req.user.email;
    if (!email) return res.status(400).json({ message: "Email is required." });

    const result = await bookings.updateOne(
      { _id: new ObjectId(req.params.id), userEmail: email, status: "Pending" },
      { $set: { status: "Cancelled", cancelledAt: new Date() } },
    );
    if (result.matchedCount === 0) {
      return res
        .status(404)
        .json({ message: "Only your pending bookings can be cancelled." });
    }
    res.json({ cancelled: true });
  });

  app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
  });
}

start().catch(console.error);
