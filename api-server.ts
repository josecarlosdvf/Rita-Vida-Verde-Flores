/**
 * api-server.ts — Express REST API standalone
 * Run with: npx tsx api-server.ts
 * Vite deve ser rodado em paralelo: npx vite --host
 * O vite.config.ts faz proxy de /api/* para este servidor (porta 3010)
 */

import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { readFileSync, writeFileSync } from "fs";
import { createHmac, randomBytes, pbkdf2Sync } from "crypto";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, "data", "db.json");
const JWT_SECRET = process.env.JWT_SECRET || "rita-vida-verde-flores-secret-2024";
const PORT = process.env.PORT || 3010;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || "";
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || process.env.VITE_FACEBOOK_APP_ID || "";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function readDb() {
  const raw = readFileSync(DB_PATH, "utf-8");
  return JSON.parse(raw);
}

function writeDb(data: any) {
  writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
}

function upsertCustomerUser(profile: {
  provider: "google" | "facebook";
  providerUserId: string;
  name: string;
  email?: string;
  pictureUrl?: string;
}) {
  const db = readDb();
  if (!db.customerUsers) db.customerUsers = [];

  const now = new Date().toISOString();
  const idx = db.customerUsers.findIndex(
    (user: any) =>
      (user.provider === profile.provider && user.providerUserId === profile.providerUserId) ||
      (!!profile.email && user.email === profile.email)
  );

  if (idx >= 0) {
    db.customerUsers[idx] = {
      ...db.customerUsers[idx],
      ...profile,
      updatedAt: now,
    };
    writeDb(db);
    return db.customerUsers[idx];
  }

  const user = {
    id: `cust-${randomBytes(4).toString("hex")}`,
    ...profile,
    createdAt: now,
    updatedAt: now,
  };
  db.customerUsers.push(user);
  writeDb(db);
  return user;
}

function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const s = salt || randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, s, 100000, 64, "sha512").toString("hex");
  return { hash: `${s}:${hash}`, salt: s };
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt] = stored.split(":");
  const { hash } = hashPassword(password, salt);
  return hash === stored;
}

function signToken(payload: object): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify({ ...payload, iat: Date.now() })).toString("base64url");
  const sig = createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${sig}`;
}

function verifyToken(token: string): any | null {
  try {
    const [header, body, sig] = token.split(".");
    const expected = createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
    if (sig !== expected) return null;
    return JSON.parse(Buffer.from(body, "base64url").toString());
  } catch {
    return null;
  }
}

function authMiddleware(req: any, res: any, next: any) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return res.status(401).json({ error: "Não autenticado" });
  const payload = verifyToken(auth.slice(7));
  if (!payload) return res.status(401).json({ error: "Token inválido" });
  req.user = payload;
  next();
}

// ─── App ──────────────────────────────────────────────────────────────────────

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Health
app.get("/api/health", (_req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

// ─── Auth ─────────────────────────────────────────────────────────────────────

app.post("/api/auth/bootstrap", (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) return res.status(400).json({ error: "email e password obrigatórios" });

  const db = readDb();
  const user = db.users?.find((u: any) => u.email === email);
  if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
  if (user.passwordHash !== "BOOTSTRAP_REQUIRED") return res.status(409).json({ error: "Bootstrap já realizado" });

  const { hash } = hashPassword(password);
  user.passwordHash = hash;
  writeDb(db);

  const token = signToken({ id: user.id, email: user.email, role: user.role });
  res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) return res.status(400).json({ error: "email e password obrigatórios" });

  const db = readDb();
  const user = db.users?.find((u: any) => u.email === email);
  if (!user) return res.status(401).json({ error: "Credenciais inválidas" });
  if (user.passwordHash === "BOOTSTRAP_REQUIRED") return res.status(403).json({ error: "BOOTSTRAP_REQUIRED" });
  if (!verifyPassword(password, user.passwordHash)) return res.status(401).json({ error: "Credenciais inválidas" });

  const token = signToken({ id: user.id, email: user.email, role: user.role });
  res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
});

app.get("/api/auth/me", authMiddleware, (req: any, res) => {
  const db = readDb();
  const user = db.users?.find((u: any) => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
  res.json({ id: user.id, email: user.email, role: user.role });
});

app.post("/api/customer-auth/google", async (req: any, res) => {
  const { credential } = req.body ?? {};
  if (!credential) return res.status(400).json({ error: "credential obrigatório" });

  try {
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
    const payload = await response.json();

    if (!response.ok || !payload?.sub) {
      return res.status(401).json({ error: "Token Google inválido" });
    }

    if (GOOGLE_CLIENT_ID && payload.aud !== GOOGLE_CLIENT_ID) {
      return res.status(401).json({ error: "GOOGLE_CLIENT_ID não confere com o token recebido" });
    }

    const user = upsertCustomerUser({
      provider: "google",
      providerUserId: payload.sub,
      name: payload.name || payload.given_name || "Cliente Google",
      email: payload.email,
      pictureUrl: payload.picture,
    });

    const token = signToken({ id: user.id, email: user.email, name: user.name, role: "customer", provider: "google" });
    res.json({ token, user });
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? "Erro ao autenticar com Google" });
  }
});

app.post("/api/customer-auth/facebook", async (req: any, res) => {
  const { accessToken } = req.body ?? {};
  if (!accessToken) return res.status(400).json({ error: "accessToken obrigatório" });

  try {
    const url = `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${encodeURIComponent(accessToken)}`;
    const response = await fetch(url);
    const payload = await response.json();

    if (!response.ok || !payload?.id) {
      return res.status(401).json({ error: payload?.error?.message || "Token Facebook inválido" });
    }

    if (!FACEBOOK_APP_ID) {
      console.warn("FACEBOOK_APP_ID não definido; validação fica limitada ao token recebido do Facebook.");
    }

    const user = upsertCustomerUser({
      provider: "facebook",
      providerUserId: payload.id,
      name: payload.name || "Cliente Facebook",
      email: payload.email,
      pictureUrl: payload.picture?.data?.url,
    });

    const token = signToken({ id: user.id, email: user.email, name: user.name, role: "customer", provider: "facebook" });
    res.json({ token, user });
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? "Erro ao autenticar com Facebook" });
  }
});

// ─── CRUD ─────────────────────────────────────────────────────────────────────

const PUBLIC_READ = ["products", "banners", "settings", "reviews"];
const PUBLIC_WRITE = ["orders"];

app.get("/api/:collection", (req: any, res) => {
  const { collection } = req.params;
  const isPublic = PUBLIC_READ.includes(collection);
  if (!isPublic) {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) return res.status(401).json({ error: "Não autenticado" });
    const payload = verifyToken(auth.slice(7));
    if (!payload) return res.status(401).json({ error: "Token inválido" });
  }
  const db = readDb();
  res.json(db[collection] ?? []);
});

app.get("/api/:collection/:id", (req: any, res) => {
  const { collection, id } = req.params;
  const isPublic = PUBLIC_READ.includes(collection);
  if (!isPublic) {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) return res.status(401).json({ error: "Não autenticado" });
    const payload = verifyToken(auth.slice(7));
    if (!payload) return res.status(401).json({ error: "Token inválido" });
  }
  const db = readDb();
  const item = (db[collection] ?? []).find((i: any) => i.id === id || i.slug === id);
  if (!item) return res.status(404).json({ error: "Não encontrado" });
  res.json(item);
});

// ─── Gemini AI Endpoints ─────────────────────────────────────────────────

app.post("/api/generate-text", authMiddleware, async (req: any, res) => {
  const { productName, type, context } = req.body ?? {};
  const baseText = productName || context;
  if (!baseText) return res.status(400).json({ error: "productName ou context obrigatório" });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY não configurada" });

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = type === "banner"
      ? `Você é diretor criativo de uma floricultura premium. Com base neste tema: "${baseText}", escreva um prompt visual rico e objetivo para geração de imagem de banner horizontal hero. Inclua estilo, flores principais, atmosfera, paleta, iluminação e composição com espaço para texto promocional. Responda APENAS em JSON válido sem markdown no formato: {"promptText":"..."}`
      : `Você é um especialista em e-commerce de floricultura. Para o produto "${baseText}", gere:
1. Uma descrição de produto atraente com 2-3 frases (destaque qualidades, ocasiões, sentimentos evocados)
2. Um slug para URL (só letras minúsculas, números e hífens, máx 50 chars)

Responda APENAS em JSON válido, sem markdown:
{"description": "...", "slug": "..."}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const text = (response as any).candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const cleaned = text.replace(/```json\n?|```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    if (type === "banner") {
      return res.json({ promptText: parsed.promptText ?? "" });
    }
    res.json({ description: parsed.description ?? "", slug: parsed.slug ?? "" });
  } catch (err: any) {
    console.error("[Gemini text] erro:", err?.message ?? err);
    res.status(500).json({ error: err?.message ?? "Erro ao gerar texto" });
  }
});

app.post("/api/generate-image", authMiddleware, async (req: any, res) => {
  const { productName, promptText, kind } = req.body ?? {};
  const subject = promptText || productName;
  if (!subject) return res.status(400).json({ error: "productName ou promptText obrigatório" });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY não configurada no .env" });

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = kind === "banner"
      ? `Crie uma imagem horizontal premium para banner principal de uma floricultura. Tema: "${subject}". Composição cinematográfica horizontal, elegante, inspiradora, com espaço visual para texto publicitário, iluminação suave, aparência sofisticada, cores naturais, alta definição e estilo de campanha de e-commerce.`
      : `Fotografia profissional de produto para floricultura: "${subject}". Fundo branco limpo, iluminação de estúdio suave, composição quadrada, estilo e-commerce de alta qualidade. Mostre o arranjo ou buquê completo com detalhes vibrantes e cores naturais.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseModalities: ["TEXT", "IMAGE"],
      } as any,
    });

    const parts = (response as any).candidates?.[0]?.content?.parts ?? [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        return res.json({
          imageData: `data:${part.inlineData.mimeType ?? "image/png"};base64,${part.inlineData.data}`,
        });
      }
    }

    res.status(500).json({ error: "Nenhuma imagem foi retornada pelo modelo" });
  } catch (err: any) {
    console.error("[Gemini] erro:", err?.message ?? err);
    res.status(500).json({ error: err?.message ?? "Erro ao gerar imagem" });
  }
});

app.post("/api/:collection", (req: any, res) => {
  const { collection } = req.params;
  const isPublic = PUBLIC_WRITE.includes(collection);
  if (!isPublic) {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) return res.status(401).json({ error: "Não autenticado" });
    const payload = verifyToken(auth.slice(7));
    if (!payload) return res.status(401).json({ error: "Token inválido" });
  }
  const db = readDb();
  if (!db[collection]) db[collection] = [];
  const newItem = {
    id: `${collection.slice(0, 4)}-${randomBytes(4).toString("hex")}`,
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db[collection].push(newItem);
  writeDb(db);
  res.status(201).json(newItem);
});

app.put("/api/:collection/:id", authMiddleware, (req: any, res) => {
  const { collection, id } = req.params;
  const db = readDb();
  if (!db[collection]) return res.status(404).json({ error: "Coleção não encontrada" });
  const idx = db[collection].findIndex((i: any) => i.id === id);
  if (idx === -1) return res.status(404).json({ error: "Não encontrado" });
  db[collection][idx] = { ...db[collection][idx], ...req.body, updatedAt: new Date().toISOString() };
  writeDb(db);
  res.json(db[collection][idx]);
});

app.delete("/api/:collection/:id", authMiddleware, (req: any, res) => {
  const { collection, id } = req.params;
  const db = readDb();
  if (!db[collection]) return res.status(404).json({ error: "Coleção não encontrada" });
  const idx = db[collection].findIndex((i: any) => i.id === id);
  if (idx === -1) return res.status(404).json({ error: "Não encontrado" });
  db[collection].splice(idx, 1);
  writeDb(db);
  res.status(204).send();
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`✅ API Server running at http://localhost:${PORT}`);
  console.log(`   Bootstrap: POST http://localhost:${PORT}/api/auth/bootstrap`);
  console.log(`   Login:     POST http://localhost:${PORT}/api/auth/login`);
});
