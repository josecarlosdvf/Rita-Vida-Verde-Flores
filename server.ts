import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { createHmac, randomBytes, pbkdf2Sync } from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, "data", "db.json");
const JWT_SECRET = process.env.JWT_SECRET || "rita-vida-verde-flores-secret-2024";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function readDb() {
  const raw = readFileSync(DB_PATH, "utf-8");
  return JSON.parse(raw);
}

function writeDb(data: any) {
  writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
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

function nanoid(): string {
  return randomBytes(8).toString("hex");
}

// ─── Server ───────────────────────────────────────────────────────────────────

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // ── Auth ──────────────────────────────────────────────────────────────────

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const db = readDb();
    const user = db.users.find((u: any) => u.email === email);
    if (!user) return res.status(401).json({ error: "Credenciais inválidas" });
    if (user.passwordHash === "BOOTSTRAP_REQUIRED")
      return res.status(403).json({ error: "Execute o Primeiro Acesso antes de fazer login." });
    if (!verifyPassword(password, user.passwordHash))
      return res.status(401).json({ error: "Credenciais inválidas" });
    if (user.status !== "active")
      return res.status(403).json({ error: "Usuário inativo" });
    const token = signToken({ uid: user.id, email: user.email, name: user.name });
    res.json({ token, user: { uid: user.id, email: user.email, name: user.name, login: user.login } });
  });

  app.post("/api/auth/bootstrap", (_req, res) => {
    const db = readDb();
    const user = db.users.find((u: any) => u.email === "admin@floricultura.com");
    if (!user) return res.status(404).json({ error: "Usuário admin não encontrado no banco." });

    if (user.passwordHash !== "BOOTSTRAP_REQUIRED") {
      return res.json({ message: "Sistema já configurado. Use o login normalmente.", alreadyDone: true });
    }

    const { hash } = hashPassword("admin123");
    user.passwordHash = hash;

    if (!db.settings || db.settings.length === 0) {
      db.settings = [{
        id: "main",
        companyName: "Rita Vida Verde Flores",
        whatsappNumber: "11987654321",
        status: "online",
        address: "Av. das Flores, 1234 - Jardim Botânico, São Paulo, SP",
        primaryColor: "#5a7a4a",
        secondaryColor: "#D4A373"
      }];
    }

    writeDb(db);

    const token = signToken({ uid: user.id, email: user.email, name: user.name });
    res.json({
      message: "Primeiro acesso configurado! Use admin@floricultura.com / admin123",
      token,
      user: { uid: user.id, email: user.email, name: user.name, login: user.login }
    });
  });

  app.get("/api/auth/me", authMiddleware, (req: any, res) => {
    const db = readDb();
    const user = db.users.find((u: any) => u.id === req.user.uid);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
    const { passwordHash, ...safeUser } = user;
    res.json(safeUser);
  });

  // ── Generic CRUD ──────────────────────────────────────────────────────────

  const PUBLIC_READ = ["products", "banners", "settings", "reviews"];

  app.get("/api/:collection", (req, res) => {
    const col = req.params.collection;
    const isPublic = PUBLIC_READ.includes(col);
    if (!isPublic) {
      const auth = req.headers.authorization;
      if (!auth?.startsWith("Bearer ") || !verifyToken(auth.slice(7)))
        return res.status(401).json({ error: "Não autenticado" });
    }
    const db = readDb();
    if (!db[col]) return res.status(404).json({ error: "Coleção não encontrada" });
    res.json(db[col]);
  });

  app.get("/api/:collection/:id", (req, res) => {
    const { collection: col, id } = req.params;
    const isPublic = PUBLIC_READ.includes(col);
    if (!isPublic) {
      const auth = req.headers.authorization;
      if (!auth?.startsWith("Bearer ") || !verifyToken(auth.slice(7)))
        return res.status(401).json({ error: "Não autenticado" });
    }
    const db = readDb();
    if (!db[col]) return res.status(404).json({ error: "Coleção não encontrada" });
    const item = db[col].find((i: any) => i.id === id || i.slug === id);
    if (!item) return res.status(404).json({ error: "Item não encontrado" });
    res.json(item);
  });

  app.post("/api/:collection", authMiddleware, (req: any, res) => {
    const col = req.params.collection;
    const db = readDb();
    if (!db[col]) db[col] = [];
    const now = new Date().toISOString();
    const item = { id: nanoid(), ...req.body, createdAt: now, updatedAt: now };
    db[col].push(item);
    writeDb(db);
    res.status(201).json(item);
  });

  // orders are public (customer checkout)
  app.post("/api/orders", (req, res) => {
    const db = readDb();
    const now = new Date().toISOString();
    const item = { id: nanoid(), ...req.body, createdAt: now, updatedAt: now };
    db.orders.push(item);
    writeDb(db);
    res.status(201).json(item);
  });

  app.put("/api/:collection/:id", authMiddleware, (req: any, res) => {
    const { collection: col, id } = req.params;
    const db = readDb();
    if (!db[col]) return res.status(404).json({ error: "Coleção não encontrada" });
    const idx = db[col].findIndex((i: any) => i.id === id);
    if (idx === -1) return res.status(404).json({ error: "Item não encontrado" });
    db[col][idx] = { ...db[col][idx], ...req.body, updatedAt: new Date().toISOString() };
    writeDb(db);
    res.json(db[col][idx]);
  });

  app.delete("/api/:collection/:id", authMiddleware, (req: any, res) => {
    const { collection: col, id } = req.params;
    const db = readDb();
    if (!db[col]) return res.status(404).json({ error: "Coleção não encontrada" });
    const len = db[col].length;
    db[col] = db[col].filter((i: any) => i.id !== id);
    if (db[col].length === len) return res.status(404).json({ error: "Item não encontrado" });
    writeDb(db);
    res.json({ success: true });
  });

  // ── Health ─────────────────────────────────────────────────────────────────
  app.get("/api/health", (_req, res) => res.json({ status: "ok", db: existsSync(DB_PATH) }));

  // ── Vite Dev / Static ──────────────────────────────────────────────────────
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
    console.log(`📦 Banco de dados: ${DB_PATH}`);
  });
}

startServer();
