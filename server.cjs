const http = require("node:http");
const fs = require("node:fs/promises");
const fsSync = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const root = __dirname;
const dataFile = path.join(root, "data", "site-content.json");
const applicationsFile = path.join(root, "data", "applications.json");
const sessions = new Map();
const loginAttempts = new Map();

loadEnv();
const port = Number(process.env.PORT || 3000);

function loadEnv() {
  const envPath = path.join(root, ".env");
  if (!fsSync.existsSync(envPath)) return;

  const lines = fsSync.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });
  res.end(JSON.stringify(payload));
}

function sendText(res, status, text) {
  res.writeHead(status, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });
  res.end(text);
}

function cleanText(value, fallback = "", max = 1000) {
  if (typeof value !== "string") return fallback;
  return value.trim().slice(0, max);
}

function cleanUrl(value) {
  const url = cleanText(value, "", 2000);
  if (!url) return "";
  const allowed = ["http://", "https://", "mailto:", "index.html", "menu.html", "locations.html", "order.html", "contact.html", "our-story.html", "vacancy.html", "#"];
  if (allowed.some((prefix) => url.startsWith(prefix))) return url;
  if (url.startsWith("assets/")) return url;
  return "";
}

function cleanSlug(value, fallback) {
  return cleanText(value, fallback, 80)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "") || fallback;
}

function cleanPrice(value) {
  const price = cleanText(value, "", 40).replace(/^\?/, "€");
  if (!price) return "";
  return price.startsWith("€") ? price : `€${price}`;
}

function cleanList(value, allowed, max = 20) {
  if (!Array.isArray(value)) return [];
  const allowedSet = new Set(allowed);
  return value.map((item) => cleanText(item, "", 80)).filter((item) => allowedSet.has(item)).slice(0, max);
}

function sanitizeApplication(input) {
  const roles = ["Crew member - Kitchen", "Service - Front", "Runner - Delivery"];
  const days = ["Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag", "Zondag"];
  const pdf = input?.pdf && typeof input.pdf === "object" ? input.pdf : {};
  const pdfName = cleanText(pdf.name, "", 180);
  const pdfData = cleanText(pdf.data, "", 6_000_000);

  return {
    id: cleanText(input?.id, crypto.randomUUID(), 80),
    createdAt: cleanText(input?.createdAt, new Date().toISOString(), 80),
    status: cleanText(input?.status, "nieuw", 40),
    role: roles.includes(input?.role) ? input.role : roles[0],
    name: cleanText(input?.name, "", 160),
    email: cleanText(input?.email, "", 180),
    phone: cleanText(input?.phone, "", 80),
    days: cleanList(input?.days, days, 7),
    availabilityNote: cleanText(input?.availabilityNote, "", 1000),
    experience: cleanText(input?.experience, "", 1600),
    motivation: cleanText(input?.motivation, "", 1600),
    pdf: pdfName && pdfData.startsWith("data:application/pdf;base64,") ? {
      name: pdfName,
      size: Number(pdf.size || 0),
      data: pdfData
    } : null
  };
}

async function readApplications() {
  try {
    const raw = await fs.readFile(applicationsFile, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(sanitizeApplication) : [];
  } catch {
    return [];
  }
}

async function writeApplications(applications) {
  const clean = applications.map(sanitizeApplication);
  const temp = `${applicationsFile}.${Date.now()}.tmp`;
  await fs.mkdir(path.dirname(applicationsFile), { recursive: true });
  await fs.writeFile(temp, `${JSON.stringify(clean, null, 2)}\n`, "utf8");
  await fs.rename(temp, applicationsFile);
  return clean;
}

function sanitizeContent(input) {
  const site = input && typeof input === "object" ? input.site || {} : {};
  const seo = site.seo || {};
  const hero = site.hero || {};
  const footer = site.footer || {};
  const navCta = site.navCta || {};
  const videosSection = site.videosSection || {};

  const locations = Array.isArray(input?.locations) ? input.locations.slice(0, 50).map((location, index) => {
    const name = cleanText(location.name, `Vestiging ${index + 1}`, 120);
    const links = Array.isArray(location.links) ? location.links.slice(0, 12).map((link) => ({
      label: cleanText(link.label, "Bestellen", 80),
      url: cleanUrl(link.url)
    })).filter((link) => link.label && link.url) : [];

    return {
      id: cleanSlug(location.id, cleanSlug(name, `vestiging-${index + 1}`)),
      area: cleanText(location.area, "Amsterdam", 120),
      name,
      address: cleanText(location.address, "", 240),
      note: cleanText(location.note, "Take away and delivery options", 240),
      featured: location.featured === true,
      active: location.active !== false,
      links
    };
  }) : [];

  const videos = Array.isArray(input?.videos) ? input.videos.slice(0, 12).map((video, index) => {
    const title = cleanText(video.title, `Video ${index + 1}`, 120);

    return {
      id: cleanSlug(video.id, cleanSlug(title, `video-${index + 1}`)),
      title,
      caption: cleanText(video.caption, "", 240),
      src: cleanUrl(video.src),
      active: video.active !== false
    };
  }).filter((video) => video.src) : [];

  const menu = Array.isArray(input?.menu) ? input.menu.slice(0, 40).map((category, categoryIndex) => {
    const title = cleanText(category.title, `Categorie ${categoryIndex + 1}`, 120);
    const items = Array.isArray(category.items) ? category.items.slice(0, 80).map((item, itemIndex) => {
      const name = cleanText(item.name, `Menu item ${itemIndex + 1}`, 160);

      return {
        id: cleanSlug(item.id, cleanSlug(name, `item-${categoryIndex + 1}-${itemIndex + 1}`)),
        name,
        description: cleanText(item.description, "", 420),
        price: cleanPrice(item.price),
        featured: item.featured === true,
        active: item.active !== false
      };
    }) : [];

    return {
      id: cleanSlug(category.id, cleanSlug(title, `categorie-${categoryIndex + 1}`)),
      title,
      orderLabel: cleanText(category.orderLabel, `Order ${title}`, 90),
      active: category.active !== false,
      items
    };
  }) : [];

  return {
    site: {
      seo: {
        title: cleanText(seo.title, "Tres Amigos | Mexican Street Food Amsterdam", 180),
        description: cleanText(seo.description, "Tres Amigos Amsterdam. Mexican street food, tacos, burritos, bowls and order links for every location.", 300),
        menuTitle: cleanText(seo.menuTitle, "Menu | Tres Amigos", 180),
        menuDescription: cleanText(seo.menuDescription, "Bekijk het Tres Amigos menu met tacos, burritos, quesadillas, bowls, sides en desserts.", 300),
        image: cleanUrl(seo.image)
      },
      navCta: {
        label: cleanText(navCta.label, "Order Now", 80),
        url: cleanUrl(navCta.url) || "order.html"
      },
      hero: {
        eyebrow: cleanText(hero.eyebrow, "Amsterdam Mexican Street Food", 120),
        title: cleanText(hero.title, "Fresh Mexican street food.", 180),
        intro: cleanText(hero.intro, "", 500),
        primaryLabel: cleanText(hero.primaryLabel, "Order now", 80),
        primaryUrl: cleanUrl(hero.primaryUrl) || "order.html",
        secondaryLabel: cleanText(hero.secondaryLabel, "View menu", 80),
        secondaryUrl: cleanUrl(hero.secondaryUrl) || "menu.html",
        tags: Array.isArray(hero.tags) ? hero.tags.map((tag) => cleanText(tag, "", 40)).filter(Boolean).slice(0, 10) : []
      },
      footer: {
        title: cleanText(footer.title, "Eat like a Mexican", 120),
        intro: cleanText(footer.intro, "", 500),
        email: cleanText(footer.email, "", 180),
        instagramUrl: cleanUrl(footer.instagramUrl),
        tiktokUrl: cleanUrl(footer.tiktokUrl),
        copyright: cleanText(footer.copyright, "© 2026 Tres Amigos.", 160)
      },
      videosSection: {
        eyebrow: cleanText(videosSection.eyebrow, "Sfeer", 80),
        title: cleanText(videosSection.title, "Street food in beweging.", 160),
        intro: cleanText(videosSection.intro, "", 500)
      }
    },
    videos,
    menu,
    locations
  };
}

async function readContent() {
  const raw = await fs.readFile(dataFile, "utf8");
  return sanitizeContent(JSON.parse(raw));
}

async function writeContent(content) {
  const clean = sanitizeContent(content);
  const temp = `${dataFile}.${Date.now()}.tmp`;
  await fs.mkdir(path.dirname(dataFile), { recursive: true });
  await fs.writeFile(temp, `${JSON.stringify(clean, null, 2)}\n`, "utf8");
  await fs.rename(temp, dataFile);
  return clean;
}

async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 8_000_000) throw new Error("Body te groot.");
    chunks.push(chunk);
  }
  const text = Buffer.concat(chunks).toString("utf8");
  return text ? JSON.parse(text) : {};
}

function timingSafeStringEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function passwordMatches(password) {
  const hashConfig = process.env.ADMIN_PASSWORD_HASH || "";
  const passwordConfig = process.env.ADMIN_PASSWORD || "";

  if (hashConfig.includes(":")) {
    const [salt, expected] = hashConfig.split(":");
    const actual = crypto.scryptSync(password, salt, 64).toString("hex");
    return timingSafeStringEqual(actual, expected);
  }

  if (passwordConfig) return timingSafeStringEqual(password, passwordConfig);
  return false;
}

function rateLimitLogin(req) {
  const ip = req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const current = loginAttempts.get(ip) || { count: 0, resetAt: now + 15 * 60_000 };
  if (current.resetAt < now) {
    loginAttempts.set(ip, { count: 1, resetAt: now + 15 * 60_000 });
    return true;
  }
  current.count += 1;
  loginAttempts.set(ip, current);
  return current.count <= 20;
}

function createSession() {
  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, Date.now() + 8 * 60 * 60_000);
  return token;
}

function isAdmin(req) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const expiresAt = sessions.get(token);
  if (!expiresAt || expiresAt < Date.now()) {
    sessions.delete(token);
    return false;
  }
  return true;
}

async function handleApi(req, res, url) {
  if (req.method === "GET" && url.pathname === "/api/content") {
    return sendJson(res, 200, await readContent());
  }

  if (req.method === "POST" && url.pathname === "/api/applications") {
    const application = sanitizeApplication(await readBody(req));
    if (!application.name || !application.email || !application.days.length) {
      return sendJson(res, 400, { message: "Naam, e-mail en minimaal een dag zijn verplicht." });
    }
    const applications = await readApplications();
    applications.unshift(application);
    await writeApplications(applications.slice(0, 500));
    return sendJson(res, 201, { message: "Je sollicitatie is ontvangen.", application: { id: application.id, createdAt: application.createdAt } });
  }

  if (req.method === "POST" && url.pathname === "/api/admin/login") {
    if (!rateLimitLogin(req)) return sendJson(res, 429, { message: "Te veel pogingen. Probeer later opnieuw." });
    const body = await readBody(req);
    const password = cleanText(body.password, "", 500);
    if (!passwordMatches(password)) return sendJson(res, 401, { message: "Login mislukt." });
    return sendJson(res, 200, { token: createSession() });
  }

  if (url.pathname === "/api/admin/content") {
    if (!isAdmin(req)) return sendJson(res, 401, { message: "Login vereist." });
    if (req.method === "GET") return sendJson(res, 200, await readContent());
    if (req.method === "PUT") return sendJson(res, 200, await writeContent(await readBody(req)));
  }

  if (url.pathname === "/api/admin/applications") {
    if (!isAdmin(req)) return sendJson(res, 401, { message: "Login vereist." });
    if (req.method === "GET") return sendJson(res, 200, { applications: await readApplications() });
  }

  return sendJson(res, 404, { message: "API route niet gevonden." });
}

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".mp4": "video/mp4",
    ".mov": "video/quicktime",
    ".webm": "video/webm",
    ".svg": "image/svg+xml"
  }[ext] || "application/octet-stream";
}

async function serveStatic(req, res, url) {
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === "/") pathname = "/index.html";
  if (pathname === "/admin" || pathname === "/admin/") pathname = "/admin/index.html";
  if (pathname.includes("..") || pathname.split("/").some((part) => part.startsWith(".") && part !== "")) {
    return sendText(res, 404, "Niet gevonden.");
  }

  const filePath = path.resolve(root, `.${pathname}`);
  if (!filePath.startsWith(root)) return sendText(res, 404, "Niet gevonden.");

  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) return sendText(res, 404, "Niet gevonden.");
    const body = await fs.readFile(filePath);
    res.writeHead(200, {
      "Content-Type": contentType(filePath),
      "X-Content-Type-Options": "nosniff"
    });
    res.end(body);
  } catch {
    sendText(res, 404, "Niet gevonden.");
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    if (url.pathname.startsWith("/api/")) return await handleApi(req, res, url);
    return await serveStatic(req, res, url);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Serverfout.";
    if ((req.url || "").startsWith("/api/")) return sendJson(res, 500, { message });
    return sendText(res, 500, message);
  }
});

server.listen(port, () => {
  console.log(`Tres Amigos site draait op http://localhost:${port}`);
});
