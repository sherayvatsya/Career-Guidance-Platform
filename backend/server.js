import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:http";
import { Server } from "socket.io";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, ".env") });
const WEB_INDEX_PATH = resolve(__dirname, "..", "index.html");

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || true,
    credentials: true,
  },
});
const PORT = Number(process.env.PORT || 4000);
const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-env";
const DB_PATH = process.env.DB_PATH || "./data/nexusai.json";
const KNOWLEDGE_DB_PATH = process.env.KNOWLEDGE_DB_PATH || "./data/mentor_knowledge.json";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY?.trim();

if (!ANTHROPIC_API_KEY) {
  console.warn("Warning: ANTHROPIC_API_KEY is not set. Backend will use local knowledge base fallback for AI Mentor responses.");
}

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || true,
    credentials: false,
  })
);
app.use(express.json({ limit: "2mb" }));
app.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

const nowIso = () => new Date().toISOString();
const normalizeUsername = (value) => String(value || "").trim().toLowerCase();
const stripPassword = (user) => ({ id: user.id, username: user.username, name: user.name });
const signToken = (user) => jwt.sign({ sub: user.id, username: user.username, name: user.name }, JWT_SECRET, { expiresIn: "7d" });

let dbState = { users: [], profiles: {}, mentorChats: {} };
let writeQueue = Promise.resolve();
let mentorKnowledge = [];

const MENTORS = [
  { id: "alex", name: "Alex Kumar", expertise: "AI Strategy", rating: 4.9, profile: "AI career mentor with 10+ years helping students land top roles.", avatar: "🧠" },
  { id: "sana", name: "Sana Patel", expertise: "Product Management", rating: 4.8, profile: "Ex-Stripe product lead focused on career growth and role fit.", avatar: "🚀" },
  { id: "marcus", name: "Marcus Lee", expertise: "UX & Design", rating: 4.7, profile: "Design mentor for students moving into product and UX roles.", avatar: "🎨" },
  { id: "nina", name: "Nina Nair", expertise: "Cybersecurity", rating: 4.8, profile: "Security strategist who helps learners build real-world cyber portfolios.", avatar: "🛡️" },
];

const mentorStatus = new Map(MENTORS.map((mentor) => [mentor.id, Math.random() > 0.15]));
const userSockets = new Map();

const userMentorRoom = (userId, mentorId) => `mentor:${mentorId}:user:${userId}`;

const getMentorChat = (userId, mentorId) => {
  const userIdKey = String(userId);
  const mentorIdKey = String(mentorId);
  const userChats = dbState.mentorChats[userIdKey] || {};
  return Array.isArray(userChats[mentorIdKey]) ? [...userChats[mentorIdKey]] : [];
};

const appendMentorChat = (userId, mentorId, message) => {
  const userIdKey = String(userId);
  const mentorIdKey = String(mentorId);
  dbState.mentorChats[userIdKey] ??= {};
  dbState.mentorChats[userIdKey][mentorIdKey] ??= [];
  dbState.mentorChats[userIdKey][mentorIdKey].push(message);
  return dbState.mentorChats[userIdKey][mentorIdKey];
};

const formatMentorMessage = (sender, text) => ({ sender, text, timestamp: nowIso() });

const createMentorReply = (mentorId, userMessage) => {
  const mentor = MENTORS.find((m) => m.id === mentorId);
  const base = mentor ? `As ${mentor.expertise} mentor,` : "As your mentor,";
  const lower = String(userMessage || "").toLowerCase();
  if (lower.includes("resume") || lower.includes("cv")) {
    return `${base} I recommend focusing on your core strengths, tailoring your resume to your target role, and adding one strong project that shows impact.`;
  }
  if (lower.includes("interview")) {
    return `${base} practice problem-solving with mock interviews, explain your projects clearly, and prepare one story for each common behavioral question.`;
  }
  if (lower.includes("skills")) {
    return `${base} prioritize the skills most used in your desired roles, then build a small project that ties them together.`;
  }
  return `${base} keep your learning consistent, get feedback early, and I can help with next steps once you share your current goals.`;
};

const getAvailableMentors = () =>
  MENTORS.map((mentor) => ({
    ...mentor,
    online: Boolean(mentorStatus.get(mentor.id)),
  }));

const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "but", "by", "can", "could", "did", "do", "does",
  "for", "from", "get", "has", "have", "how", "i", "if", "in", "into", "is", "it", "its", "me",
  "my", "of", "on", "or", "our", "should", "so", "that", "the", "their", "them", "there", "they",
  "this", "to", "was", "we", "what", "when", "where", "which", "who", "why", "will", "with", "you",
  "your"
]);

async function ensureDbFile() {
  await mkdir(dirname(DB_PATH), { recursive: true });
  try {
    const raw = await readFile(DB_PATH, "utf8");
    const parsed = JSON.parse(raw);
    dbState = {
      users: Array.isArray(parsed?.users) ? parsed.users : [],
      profiles: parsed?.profiles && typeof parsed.profiles === "object" ? parsed.profiles : {},
      mentorChats: parsed?.mentorChats && typeof parsed.mentorChats === "object" ? parsed.mentorChats : {},
    };
  } catch {
    dbState = { users: [], profiles: {} };
    await writeFile(DB_PATH, JSON.stringify(dbState, null, 2), "utf8");
  }
}

function persistDb() {
  writeQueue = writeQueue.then(() => writeFile(DB_PATH, JSON.stringify(dbState, null, 2), "utf8"));
  return writeQueue;
}

async function loadKnowledgeDb() {
  const fullPath = resolve(process.cwd(), KNOWLEDGE_DB_PATH);
  try {
    const raw = await readFile(fullPath, "utf8");
    const parsed = JSON.parse(raw);
    mentorKnowledge = Array.isArray(parsed) ? parsed : [];
  } catch {
    mentorKnowledge = [];
  }
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value) {
  const cleaned = normalizeText(value);
  if (!cleaned) return [];
  return cleaned.split(" ").filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function rankKnowledge(query, limit = 6) {
  const queryTokens = tokenize(query);
  if (!queryTokens.length || !mentorKnowledge.length) return [];

  const scored = mentorKnowledge.map((item) => {
    const haystack = [
      item.topic || "",
      Array.isArray(item.tags) ? item.tags.join(" ") : "",
      item.question || "",
      item.answer || "",
    ].join(" ");
    const hayTokens = new Set(tokenize(haystack));
    let score = 0;
    for (const token of queryTokens) {
      if (hayTokens.has(token)) score += 1;
      if ((item.topic || "").toLowerCase().includes(token)) score += 2;
      if (Array.isArray(item.tags) && item.tags.some((tag) => String(tag).toLowerCase().includes(token))) score += 1;
    }
    if ((item.question || "").toLowerCase().includes(normalizeText(query))) score += 3;
    return { item, score };
  });

  return scored
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((row) => row.item);
}

function buildKnowledgeContext(query, limit = 5) {
  const matches = rankKnowledge(query, limit);
  if (!matches.length) return "No highly relevant local knowledge matches found.";
  return matches
    .map(
      (row, idx) =>
        `${idx + 1}. Topic: ${row.topic}\nQuestion: ${row.question}\nAnswer: ${row.answer}`
    )
    .join("\n\n");
}

function buildFallbackReply(messages) {
  const lastUserMessage =
    [...messages].reverse().find((m) => m?.role === "user" && typeof m.content === "string")?.content || "";
  const matches = rankKnowledge(lastUserMessage, 3);

  if (!matches.length) {
    return "I can help with career planning, skills, interview prep, resumes, networking, and salary strategy. Share your goal, background, and timeline, and I will give you a step-by-step plan.";
  }

  const primary = matches[0]?.answer || "";
  const secondary = matches[1]?.answer || "";
  const extra = matches[2]?.answer || "";

  let reply = primary;
  if (secondary) reply += ` Also consider this: ${secondary}`;
  if (extra) reply += ` One more useful tip: ${extra}`;
  return reply;
}

function sanitizeMessages(messages) {
  return messages
    .filter((m) => m && typeof m.content === "string" && m.content.trim())
    .map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content.trim(),
    }))
    .slice(-12);
}

function authRequired(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
  if (!token) {
    return res.status(401).json({ error: "Missing authentication token." });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.auth = payload;
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired authentication token." });
  }
}

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/", (_req, res) => {
  res.sendFile(WEB_INDEX_PATH);
});

app.post("/api/auth/signup", async (req, res) => {
  const rawName = String(req.body?.name || "").trim();
  const username = normalizeUsername(req.body?.username);
  const password = String(req.body?.password || "");

  if (!rawName || !username || !password) {
    return res.status(400).json({ error: "name, username, and password are required." });
  }
  if (username.length < 3) {
    return res.status(400).json({ error: "username must be at least 3 characters." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "password must be at least 6 characters." });
  }

  try {
    const existing = dbState.users.find((u) => u.username === username);
    if (existing) {
      return res.status(409).json({ error: "username already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const createdAt = nowIso();
    const nextId = dbState.users.reduce((max, u) => Math.max(max, Number(u.id) || 0), 0) + 1;

    const user = {
      id: nextId,
      username,
      name: rawName,
      passwordHash,
      createdAt,
      updatedAt: createdAt,
    };

    dbState.users.push(user);
    await persistDb();

    const token = signToken(user);
    return res.status(201).json({ token, user: stripPassword(user) });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Failed to sign up." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const username = normalizeUsername(req.body?.username);
  const password = String(req.body?.password || "");

  if (!username || !password) {
    return res.status(400).json({ error: "username and password are required." });
  }

  try {
    const user = dbState.users.find((u) => u.username === username);
    if (!user) {
      return res.status(401).json({ error: "Invalid username or password." });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid username or password." });
    }

    const token = signToken(user);
    return res.json({ token, user: stripPassword(user) });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Failed to sign in." });
  }
});

app.get("/api/auth/me", authRequired, async (req, res) => {
  const user = dbState.users.find((u) => u.id === Number(req.auth.sub));
  if (!user) {
    return res.status(401).json({ error: "Session user no longer exists." });
  }
  return res.json({ user: stripPassword(user) });
});

app.get("/api/profile", authRequired, async (req, res) => {
  const userId = Number(req.auth.sub);
  const user = dbState.users.find((u) => u.id === userId);
  if (!user) {
    return res.status(401).json({ error: "Session user no longer exists." });
  }
  const key = String(req.auth.sub);
  const profileRow = dbState.profiles[key] || null;
  return res.json({ profile: profileRow?.data || null, updatedAt: profileRow?.updatedAt || null });
});

app.put("/api/profile", authRequired, async (req, res) => {
  const profile = req.body?.profile;

  if (!profile || typeof profile !== "object" || Array.isArray(profile)) {
    return res.status(400).json({ error: "profile must be an object." });
  }

  try {
    const userId = Number(req.auth.sub);
    const user = dbState.users.find((u) => u.id === userId);
    if (!user) {
      return res.status(401).json({ error: "Session user no longer exists." });
    }
    const key = String(userId);
    const updatedAt = nowIso();

    dbState.profiles[key] = { data: profile, updatedAt };
    const userIndex = dbState.users.findIndex((u) => u.id === userId);
    if (userIndex >= 0) {
      dbState.users[userIndex].updatedAt = updatedAt;
    }

    await persistDb();
    return res.json({ ok: true, updatedAt });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Failed to save profile." });
  }
});

app.get("/api/mentors", authRequired, async (req, res) => {
  return res.json({ mentors: getAvailableMentors() });
});

app.get("/api/mentors/:mentorId/chat", authRequired, async (req, res) => {
  const userId = Number(req.auth.sub);
  const mentorId = String(req.params.mentorId);
  if (!MENTORS.some((mentor) => mentor.id === mentorId)) {
    return res.status(404).json({ error: "Mentor not found." });
  }
  const chat = getMentorChat(userId, mentorId);
  return res.json({ chat });
});

app.post("/api/mentors/:mentorId/chat", authRequired, async (req, res) => {
  const userId = Number(req.auth.sub);
  const mentorId = String(req.params.mentorId);
  const text = String(req.body?.text || "").trim();
  if (!text) {
    return res.status(400).json({ error: "Message text is required." });
  }
  if (!MENTORS.some((mentor) => mentor.id === mentorId)) {
    return res.status(404).json({ error: "Mentor not found." });
  }

  const userMessage = formatMentorMessage("user", text);
  appendMentorChat(userId, mentorId, userMessage);
  await persistDb();

  const mentorReply = formatMentorMessage("mentor", createMentorReply(mentorId, text));
  appendMentorChat(userId, mentorId, mentorReply);
  await persistDb();

  return res.json({ chat: getMentorChat(userId, mentorId), reply: mentorReply });
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (!token) {
    return next(new Error("Missing auth token"));
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    socket.data.user = {
      id: Number(payload.sub),
      username: payload.username,
      name: payload.name,
    };
    return next();
  } catch (err) {
    return next(new Error("Invalid or expired auth token"));
  }
});

io.on("connection", (socket) => {
  const userId = socket.data.user.id;
  userSockets.set(userId, socket);

  socket.on("mentor:join", ({ mentorId }) => {
    const room = userMentorRoom(userId, mentorId);
    socket.join(room);
  });

  socket.on("mentor:message", async ({ mentorId, text }) => {
    const realText = String(text || "").trim();
    if (!realText || !MENTORS.some((mentor) => mentor.id === mentorId)) {
      return;
    }
    const room = userMentorRoom(userId, mentorId);
    const userMessage = formatMentorMessage("user", realText);
    appendMentorChat(userId, mentorId, userMessage);
    await persistDb();
    io.to(room).emit("mentor:message", userMessage);

    const mentorReply = formatMentorMessage("mentor", createMentorReply(mentorId, realText));
    appendMentorChat(userId, mentorId, mentorReply);
    await persistDb();
    setTimeout(() => {
      io.to(room).emit("mentor:message", mentorReply);
    }, 800);
  });

  socket.on("mentor:call-request", ({ mentorId, callType }) => {
    const room = userMentorRoom(userId, mentorId);
    io.to(room).emit("mentor:call-status", {
      mentorId,
      status: "requested",
      callType,
      message: `Call request sent to ${mentorId}.`,
    });
    setTimeout(() => {
      io.to(room).emit("mentor:call-status", {
        mentorId,
        status: "accepted",
        callType,
        message: `${mentorId} is ready to connect.`,
      });
    }, 1200);
  });

  socket.on("mentor:webrtc-offer", ({ mentorId, offer }) => {
    const room = userMentorRoom(userId, mentorId);
    io.to(room).emit("mentor:webrtc-offer", { mentorId, offer });
  });

  socket.on("mentor:webrtc-answer", ({ mentorId, answer }) => {
    const room = userMentorRoom(userId, mentorId);
    io.to(room).emit("mentor:webrtc-answer", { mentorId, answer });
  });

  socket.on("mentor:ice-candidate", ({ mentorId, candidate }) => {
    const room = userMentorRoom(userId, mentorId);
    io.to(room).emit("mentor:ice-candidate", { mentorId, candidate });
  });

  socket.on("disconnect", () => {
    if (userSockets.get(userId) === socket) {
      userSockets.delete(userId);
    }
  });
});

app.post("/api/chat", async (req, res) => {
  const { messages: rawMessages } = req.body || {};

  if (!Array.isArray(rawMessages)) {
    return res.status(400).json({ error: "messages must be an array." });
  }

  const messages = sanitizeMessages(rawMessages);
  if (!messages.length) {
    return res.status(400).json({ error: "messages must contain at least one user message." });
  }

  const lastUserMessage =
    [...messages].reverse().find((m) => m.role === "user")?.content || "";
  const knowledgeContext = buildKnowledgeContext(lastUserMessage, 5);

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.json({
      reply: buildFallbackReply(messages),
      source: "local_knowledge_base",
    });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system:
          "You are NexusAI, an elite AI career mentor for students and professionals. Keep responses concise (3-5 sentences), conversational, and practical with concrete next steps.\n\nUse this local curated knowledge first when relevant:\n" +
          knowledgeContext,
        messages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.json({
        reply: buildFallbackReply(messages),
        source: "local_knowledge_base_fallback",
        warning: "Claude API returned an error; served local knowledge response instead.",
        details: data,
      });
    }

    const reply = data?.content?.find((block) => block.type === "text")?.text || "I couldn't process that. Please try again.";
    return res.json({ reply });
  } catch (error) {
    return res.json({
      reply: buildFallbackReply(messages),
      source: "local_knowledge_base_fallback",
      warning: error.message || "Claude API request failed; served local response instead.",
    });
  }
});

ensureDbFile()
  .then(() => loadKnowledgeDb())
  .then(() => {
    httpServer.listen(PORT, () => {
      console.log(`Backend running at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start backend:", error);
    process.exit(1);
  });
