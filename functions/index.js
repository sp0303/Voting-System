const functions = require("firebase-functions");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Safe MongoDB connection setup
let isConnected = false;
async function connectMongo() {
  if (!isConnected) {
    try {
      await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log("✅ MongoDB connected");
      isConnected = true;
    } catch (err) {
      console.error("❌ MongoDB connection error:", err);
    }
  }
}

// Call before each request
app.use(async (req, res, next) => {
  await connectMongo();
  if (!invalidPartyEnsured) {
    try {
      await ensureInvalidParty();
      invalidPartyEnsured = true;
    } catch (err) {
      console.error("❌ Failed to ensure invalid party:", err);
    }
  }
  next();
});

const Party = mongoose.model(
  "Party",
  new mongoose.Schema({
    partyId: Number,
    name: String,
    votes: { type: Number, default: 0 },
    invalidVotes: { type: Number, default: 0 },
    duplicateVotes: { type: Number, default: 0 },
    image: String,
  })
);

const Voter = mongoose.model(
  "Voter",
  new mongoose.Schema({
    voterId: String,
    vname: String,
    hasVoted: { type: Boolean, default: false },
    duplicateVoteAttempts: { type: Number, default: 0 },
    invalidVoteAttempts: { type: Number, default: 0 },
  })
);


async function ensureInvalidParty() {
  const invalid = await Party.findOne({ partyId: 999 });
  if (!invalid) {
    await Party.create({
      partyId: 999,
      name: "Invalid / Duplicate Votes",
      votes: 0,
      invalidVotes: 0,
      duplicateVotes: 0,
      image: "",
    });
    console.log("✅ Initialized Invalid / Duplicate Votes party.");
  }
}

let invalidPartyEnsured = false;

// Check voter and get parties
app.post("/api/check-voter", async (req, res) => {
  const { voterId, vname } = req.body;

  const voter = await Voter.findOne({ voterId });
  const allParties = await Party.find({ partyId: { $ne: 999 } }).sort({ partyId: 1 });

  if (!voter) {
    await Party.updateOne({ partyId: 999 }, { $inc: { invalidVotes: 1 } });
    return res.json({
      exists: false,
      alreadyVoted: false,
      message: "Voter not found.",
      parties: allParties,
    });
  }

  if (voter.hasVoted) {
    await Party.updateOne({ partyId: 999 }, { $inc: { duplicateVotes: 1 } });
    await Voter.updateOne({ voterId }, { $inc: { duplicateVoteAttempts: 1 } });
    return res.json({
      exists: true,
      alreadyVoted: true,
      message: "Duplicate voting attempt.",
      parties: allParties,
    });
  }

  if (voter.vname !== vname) {
    await Party.updateOne({ partyId: 999 }, { $inc: { invalidVotes: 1 } });
    await Voter.updateOne({ voterId }, { $inc: { invalidVoteAttempts: 1 } });
    return res.json({
      exists: false,
      alreadyVoted: false,
      message: "Voter name and ID mismatch!",
      parties: allParties,
    });
  }

  return res.json({
    exists: true,
    alreadyVoted: false,
    parties: allParties,
  });
});

// Cast vote
app.post("/api/vote", async (req, res) => {
  const { voterId, partyId, vname } = req.body;

  const party = await Party.findOne({ partyId });
  if (!party) {
    await Party.updateOne({ partyId: 999 }, { $inc: { invalidVotes: 1 } });
    return res.status(400).json({ message: "Invalid party selected.", status: "invalid" });
  }

  let status = "valid";
  let reason = "";
  const voter = await Voter.findOne({ voterId });

  if (!voter) {
    await Party.updateOne({ partyId }, { $inc: { invalidVotes: 1 } });
    status = "invalid";
    reason = "Voter ID not found. Vote recorded as INVALID.";
  } else if (voter.hasVoted) {
    await Party.updateOne({ partyId }, { $inc: { duplicateVotes: 1 } });
    await Voter.updateOne({ voterId }, { $inc: { duplicateVoteAttempts: 1 } });
    status = "duplicate";
    reason = "You already voted. Vote recorded as DUPLICATE.";
  } else if (voter.vname !== vname) {
    await Party.updateOne({ partyId }, { $inc: { invalidVotes: 1 } });
    await Voter.updateOne({ voterId }, { $inc: { invalidVoteAttempts: 1 } });
    status = "invalid";
    reason = "Voter name and ID did not match. Vote recorded as INVALID.";
  } else {
    await Party.updateOne({ partyId }, { $inc: { votes: 1 } });
    voter.hasVoted = true;
    await voter.save();
    reason = `Vote recorded successfully for ${party.name}.`;
  }

  return res.json({ message: reason, status, partyName: party.name });
});

app.get("/api/voters", async (req, res) => {
  try {
    const voters = await Voter.find({}, { _id: 0, __v: 0 });
    res.json({ voters });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching voters." });
  }
});

// Live voter count
app.get("/api/live-voters", async (req, res) => {
  const count = await Voter.countDocuments({ hasVoted: true });
  res.json({ count });
});

// Get stats
app.get("/api/stats", async (req, res) => {
  const password = req.headers["x-stats-password"];
  if (password !== "admin123") {
    return res.status(403).json({ message: "Invalid password." });
  }

  const parties = await Party.find().sort({ votes: -1 });
  const totalVotes = parties.filter(p => p.partyId !== 999).reduce((sum, p) => sum + p.votes, 0);
  const totalInvalidVotes = parties.reduce((sum, p) => sum + (p.invalidVotes || 0), 0);
  const totalDuplicateVotes = parties.reduce((sum, p) => sum + (p.duplicateVotes || 0), 0);
  const totalVoters = await Voter.countDocuments({ hasVoted: true });

  const result = parties
    .filter(p => p.partyId !== 999)
    .map((party, index, arr) => {
      const percentage = totalVotes ? ((party.votes / totalVotes) * 100).toFixed(2) : "0.00";
      const leadMargin = index === 0 ? "0.00" : (((arr[0].votes - party.votes) / totalVotes) * 100).toFixed(2);
      return {
        partyId: party.partyId,
        name: party.name,
        votes: party.votes,
        invalidVotes: party.invalidVotes,
        duplicateVotes: party.duplicateVotes,
        percentage,
        leadMargin,
        image: party.image,
      };
    });

  const duplicateAttemptsByVoter = await Voter.find(
    { duplicateVoteAttempts: { $gt: 0 } },
    { voterId: 1, duplicateVoteAttempts: 1 }
  );

  const invalidAttemptsByVoter = await Voter.find(
    { invalidVoteAttempts: { $gt: 0 } },
    { voterId: 1, invalidVoteAttempts: 1 }
  );

  res.json({
    totalVotes,
    totalInvalidVotes,
    totalDuplicateVotes,
    totalVoters,
    stats: result,
    duplicateAttemptsByVoter,
    invalidAttemptsByVoter,
  });
});

// Export the app as a Firebase Function (2nd Gen)
exports.api = functions.https.onRequest(app);
