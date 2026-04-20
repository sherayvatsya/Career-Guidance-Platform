import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, ".env") });

const app = express();
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

const nowIso = () => new Date().toISOString();
const normalizeUsername = (value) => String(value || "").trim().toLowerCase();
const stripPassword = (user) => ({ id: user.id, username: user.username, name: user.name });
const signToken = (user) => jwt.sign({ sub: user.id, username: user.username, name: user.name }, JWT_SECRET, { expiresIn: "7d" });

let dbState = { users: [], profiles: {} };
let writeQueue = Promise.resolve();
let mentorKnowledge = [];

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
    app.listen(PORT, () => {
      console.log(`Backend running at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start backend:", error);
    process.exit(1);
  });
