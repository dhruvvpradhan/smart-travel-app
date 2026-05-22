import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync, mkdirSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash, randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const PORT = Number(process.env.PORT || 4173);
const dataDir = join(__dirname, "data");
const publicDir = join(__dirname, "public");

if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(join(dataDir, "tripsmart.sqlite"));
db.exec("PRAGMA foreign_keys = ON");

const destinations = [
  {
    city: "Manali",
    season: "Summer",
    tagline: "Himalayan cafes, cedar forests, snow passes",
    overview: "A high-altitude resort town in Himachal Pradesh with mountain trails, monasteries, and adventure sports.",
    best_time: "May-Jun, Oct-Feb",
    culture: "Tibetan monasteries, Kullu shawls, Himachali food",
    safety: "Tourist friendly. Carry warm clothing and check pass conditions.",
    transport: "Buses, taxis, hired bikes",
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1200&q=80",
    lat: 32.2396,
    lng: 77.1887
  },
  {
    city: "Goa",
    season: "Winter",
    tagline: "Beaches, forts, seafood, music after sunset",
    overview: "India's favorite beach state with Portuguese heritage, nightlife, markets, and slow coastal mornings.",
    best_time: "Nov-Feb",
    culture: "Portuguese churches, seafood, Feni, beach shacks",
    safety: "Generally safe. Avoid isolated beaches late at night.",
    transport: "Scooters, taxis, local buses",
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80",
    lat: 15.2993,
    lng: 74.1240
  },
  {
    city: "Kerala",
    season: "Winter",
    tagline: "Backwaters, tea gardens, Ayurveda, quiet coast",
    overview: "God's Own Country blends lush backwaters, spice routes, beaches, and serene hill stations.",
    best_time: "Sep-Mar",
    culture: "Kathakali, Ayurveda, boat races, coconut cuisine",
    safety: "Very tourist friendly with reliable public transport.",
    transport: "Boats, auto-rickshaws, buses, trains",
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80",
    lat: 10.8505,
    lng: 76.2711
  },
  {
    city: "Leh-Ladakh",
    season: "Summer",
    tagline: "High desert roads, monasteries, blue lakes",
    overview: "A dramatic cold desert for road trips, monasteries, stargazing, and once-in-a-lifetime landscapes.",
    best_time: "May-Sep",
    culture: "Buddhist monasteries, apricot food, mountain festivals",
    safety: "Acclimatize for altitude and hydrate often.",
    transport: "Taxis, bikes, shared jeeps",
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=1200&q=80",
    lat: 34.1526,
    lng: 77.5771
  },
  {
    city: "Rajasthan",
    season: "Winter",
    tagline: "Palaces, desert camps, craft markets",
    overview: "A royal route through forts, lakes, desert safaris, textile bazaars, and slow golden evenings.",
    best_time: "Oct-Mar",
    culture: "Folk music, miniature art, thali meals, historic forts",
    safety: "Safe on main tourist routes. Carry water for desert day trips.",
    transport: "Trains, taxis, buses",
    rating: 4.6,
    image: "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80",
    lat: 27.0238,
    lng: 74.2179
  },
  {
    city: "Coorg",
    season: "Monsoon",
    tagline: "Coffee estates, misty roads, waterfalls",
    overview: "A green hill district in Karnataka known for coffee plantations, forest stays, and monsoon views.",
    best_time: "Jun-Sep, Oct-Mar",
    culture: "Kodava food, coffee estates, local homestays",
    safety: "Safe, but avoid slippery waterfall trails in heavy rain.",
    transport: "Taxis, buses, self-drive cars",
    rating: 4.6,
    image: "https://images.unsplash.com/photo-1603647235398-856b00b2f42b?auto=format&fit=crop&w=1200&q=80",
    lat: 12.3375,
    lng: 75.8069
  }
];

const places = {
  Manali: [
    ["Rohtang Pass", "Nature", "51 km", 4.8, "Snow-capped pass with panoramic Himalayan views."],
    ["Solang Valley", "Adventure", "14 km", 4.6, "Paragliding, skiing, zorbing, and mountain scenery."],
    ["Hadimba Temple", "Heritage", "3 km", 4.5, "Ancient cedar-forest temple with carved wooden details."],
    ["Old Manali", "Culture", "2 km", 4.4, "Cafes, art shops, live music, and riverside lanes."]
  ],
  Goa: [
    ["Baga Beach", "Beach", "16 km", 4.6, "Water sports, shacks, nightlife, and sunset walks."],
    ["Dudhsagar Falls", "Nature", "60 km", 4.8, "Towering waterfall set inside forested hills."],
    ["Fort Aguada", "Heritage", "18 km", 4.5, "Portuguese fort with sea views and a lighthouse."],
    ["Anjuna Flea Market", "Shopping", "18 km", 4.3, "Clothes, jewelry, spices, and handmade finds."]
  ],
  Kerala: [
    ["Alleppey Backwaters", "Nature", "0 km", 4.9, "Houseboat rides through calm canals and villages."],
    ["Munnar Tea Gardens", "Nature", "130 km", 4.8, "Rolling green hills covered in tea plantations."],
    ["Periyar Sanctuary", "Wildlife", "190 km", 4.6, "Forest lake reserve for elephants and birdlife."],
    ["Varkala Beach", "Beach", "50 km", 4.5, "Clifftop beach with cafes and mineral springs."]
  ],
  "Leh-Ladakh": [
    ["Pangong Lake", "Nature", "160 km", 4.9, "Blue high-altitude lake with stark mountain horizons."],
    ["Thiksey Monastery", "Heritage", "19 km", 4.7, "Hilltop monastery with sweeping valley views."],
    ["Nubra Valley", "Nature", "120 km", 4.8, "Sand dunes, monasteries, and dramatic road journeys."],
    ["Leh Market", "Shopping", "1 km", 4.3, "Woolens, apricots, cafes, and local crafts."]
  ],
  Rajasthan: [
    ["Amber Fort", "Heritage", "11 km", 4.8, "Grand fort palace with courtyards and mirror work."],
    ["Jaisalmer Dunes", "Desert", "42 km", 4.7, "Camel rides, campfire music, and golden sunsets."],
    ["City Palace Udaipur", "Heritage", "2 km", 4.6, "Lake-facing palace complex with museums."],
    ["Bapu Bazaar", "Shopping", "3 km", 4.4, "Textiles, juttis, block prints, and souvenirs."]
  ],
  Coorg: [
    ["Abbey Falls", "Nature", "8 km", 4.5, "A lush waterfall surrounded by coffee plantations."],
    ["Raja's Seat", "Viewpoint", "2 km", 4.4, "Valley viewpoint known for misty sunsets."],
    ["Dubare Camp", "Wildlife", "29 km", 4.3, "Riverside elephant camp and rafting point."],
    ["Madikeri Fort", "Heritage", "1 km", 4.2, "Historic fort in the town center."]
  ]
};

const hotels = {
  Manali: [["The Himalayan", "Luxury", 8500, 4.7, "1 km"], ["Snow Valley Resorts", "Resort", 5200, 4.5, "3 km"], ["Zostel Manali", "Hostel", 650, 4.3, "2 km"], ["Apple Orchard Homestay", "Homestay", 1800, 4.6, "4 km"]],
  Goa: [["Taj Exotica", "Luxury", 14000, 4.9, "0.5 km"], ["La Calypso Beach Resort", "Resort", 6500, 4.5, "1.2 km"], ["Jungle Inn Goa", "Budget", 900, 4.2, "3 km"], ["Casa Pereira", "Homestay", 2200, 4.7, "2 km"]],
  Kerala: [["Kumarakom Lake Resort", "Luxury", 18000, 4.9, "1 km"], ["Bamboo Backwaters", "Resort", 7500, 4.6, "2 km"], ["Zostel Alleppey", "Hostel", 550, 4.4, "1.5 km"], ["Coconut Creek Homestay", "Homestay", 2000, 4.8, "3 km"]],
  "Leh-Ladakh": [["The Grand Dragon", "Luxury", 11200, 4.8, "1 km"], ["Nubra Eco Lodge", "Resort", 5600, 4.5, "4 km"], ["Raybo Hostel", "Hostel", 750, 4.3, "2 km"], ["Ladakhi Family Stay", "Homestay", 2100, 4.7, "3 km"]],
  Rajasthan: [["Taj Lake Palace", "Luxury", 22000, 4.9, "0.5 km"], ["Desert Springs Camp", "Resort", 5800, 4.5, "8 km"], ["Moustache Jaipur", "Hostel", 700, 4.3, "2 km"], ["Haveli Heritage Stay", "Homestay", 2600, 4.6, "1 km"]],
  Coorg: [["Evolve Back Coorg", "Luxury", 21000, 4.9, "7 km"], ["Amanvana Spa Resort", "Resort", 8500, 4.6, "5 km"], ["Coorg Backpackers", "Hostel", 650, 4.2, "3 km"], ["Coffee Estate Homestay", "Homestay", 2400, 4.7, "6 km"]]
};

const services = [
  ["Spice Garden Restaurant", "Restaurant", "200 m", 4.5],
  ["SBI ATM", "ATM", "350 m", null],
  ["City Medical Centre", "Hospital", "800 m", 4.6],
  ["Tourist Police Post", "Police", "500 m", null],
  ["Main Bus Stand", "Transport", "1.2 km", null],
  ["Hilltop Brew Cafe", "Cafe", "100 m", 4.8]
];

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS destinations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  city TEXT UNIQUE NOT NULL,
  season TEXT NOT NULL,
  tagline TEXT NOT NULL,
  overview TEXT NOT NULL,
  best_time TEXT NOT NULL,
  culture TEXT NOT NULL,
  safety TEXT NOT NULL,
  transport TEXT NOT NULL,
  rating REAL NOT NULL,
  image TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS places (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  destination_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  distance TEXT NOT NULL,
  rating REAL NOT NULL,
  description TEXT NOT NULL,
  FOREIGN KEY(destination_id) REFERENCES destinations(id)
);
CREATE TABLE IF NOT EXISTS hotels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  destination_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  price INTEGER NOT NULL,
  rating REAL NOT NULL,
  distance TEXT NOT NULL,
  FOREIGN KEY(destination_id) REFERENCES destinations(id)
);
CREATE TABLE IF NOT EXISTS nearby_services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  destination_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  distance TEXT NOT NULL,
  rating REAL,
  FOREIGN KEY(destination_id) REFERENCES destinations(id)
);
CREATE TABLE IF NOT EXISTS saved_places (
  user_id TEXT NOT NULL,
  destination_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(user_id, destination_id),
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(destination_id) REFERENCES destinations(id)
);
CREATE TABLE IF NOT EXISTS trips (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  destination_id INTEGER NOT NULL,
  days INTEGER NOT NULL,
  travel_mode TEXT NOT NULL,
  total_cost INTEGER NOT NULL,
  itinerary TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(destination_id) REFERENCES destinations(id)
);
CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  hotel_id INTEGER NOT NULL,
  nights INTEGER NOT NULL,
  total_price INTEGER NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(hotel_id) REFERENCES hotels(id)
);
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  destination_id INTEGER NOT NULL,
  rating INTEGER NOT NULL,
  text TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(destination_id) REFERENCES destinations(id)
);
`);

function seed() {
  const count = db.prepare("SELECT COUNT(*) AS count FROM destinations").get().count;
  if (count) return;

  const addDestination = db.prepare(`INSERT INTO destinations
    (city, season, tagline, overview, best_time, culture, safety, transport, rating, image, lat, lng)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const addPlace = db.prepare(`INSERT INTO places (destination_id, name, type, distance, rating, description) VALUES (?, ?, ?, ?, ?, ?)`);
  const addHotel = db.prepare(`INSERT INTO hotels (destination_id, name, type, price, rating, distance) VALUES (?, ?, ?, ?, ?, ?)`);
  const addService = db.prepare(`INSERT INTO nearby_services (destination_id, name, type, distance, rating) VALUES (?, ?, ?, ?, ?)`);

  for (const d of destinations) {
    const info = addDestination.run(d.city, d.season, d.tagline, d.overview, d.best_time, d.culture, d.safety, d.transport, d.rating, d.image, d.lat, d.lng);
    const id = Number(info.lastInsertRowid);
    for (const p of places[d.city]) addPlace.run(id, ...p);
    for (const h of hotels[d.city]) addHotel.run(id, ...h);
    for (const s of services) addService.run(id, ...s);
  }

  const demoId = randomUUID();
  db.prepare("INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)").run(
    demoId,
    "Demo Traveller",
    "demo@tripsmart.in",
    hashPassword("demo123")
  );
  const goa = db.prepare("SELECT id FROM destinations WHERE city = ?").get("Goa").id;
  const kerala = db.prepare("SELECT id FROM destinations WHERE city = ?").get("Kerala").id;
  db.prepare("INSERT INTO saved_places (user_id, destination_id) VALUES (?, ?)").run(demoId, goa);
  db.prepare("INSERT INTO saved_places (user_id, destination_id) VALUES (?, ?)").run(demoId, kerala);
}

seed();

function hashPassword(password) {
  return createHash("sha256").update(String(password)).digest("hex");
}

function json(res, status, data) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

async function body(req) {
  let raw = "";
  for await (const chunk of req) raw += chunk;
  return raw ? JSON.parse(raw) : {};
}

function publicUser(user) {
  if (!user) return null;
  return { id: user.id, name: user.name, email: user.email };
}

function destinationList(userId = "") {
  return db.prepare(`
    SELECT d.*,
      EXISTS(SELECT 1 FROM saved_places sp WHERE sp.destination_id = d.id AND sp.user_id = ?) AS saved
    FROM destinations d
    ORDER BY d.rating DESC, d.city ASC
  `).all(userId);
}

function fullDestination(id, userId = "") {
  const destination = db.prepare(`
    SELECT d.*,
      EXISTS(SELECT 1 FROM saved_places sp WHERE sp.destination_id = d.id AND sp.user_id = ?) AS saved
    FROM destinations d WHERE d.id = ?
  `).get(userId, id);
  if (!destination) return null;
  return {
    ...destination,
    places: db.prepare("SELECT * FROM places WHERE destination_id = ? ORDER BY rating DESC").all(id),
    hotels: db.prepare("SELECT * FROM hotels WHERE destination_id = ? ORDER BY price ASC").all(id),
    services: db.prepare("SELECT * FROM nearby_services WHERE destination_id = ? ORDER BY type ASC").all(id),
    reviews: db.prepare(`
      SELECT r.*, u.name AS user_name
      FROM reviews r JOIN users u ON u.id = r.user_id
      WHERE r.destination_id = ?
      ORDER BY r.created_at DESC
    `).all(id)
  };
}

function estimateTrip(destination, days, travelMode) {
  const travelCosts = { flight: 6000, train: 1800, bus: 900, car: 3600 };
  const baseTravel = travelCosts[travelMode] || travelCosts.train;
  const hotel = db.prepare("SELECT * FROM hotels WHERE destination_id = ? ORDER BY price ASC LIMIT 1").get(destination.id);
  const food = 800 * days;
  const stay = (hotel?.price || 1800) * days;
  const local = 450 * days;
  return { travel: baseTravel, stay, food, local, total: baseTravel + stay + food + local };
}

function makeItinerary(destinationId, days) {
  const rows = db.prepare("SELECT name, type FROM places WHERE destination_id = ? ORDER BY rating DESC").all(destinationId);
  return Array.from({ length: days }, (_, i) => {
    const first = rows[(i * 2) % rows.length];
    const second = rows[(i * 2 + 1) % rows.length];
    const plan = [first?.name, second?.name].filter(Boolean).join(" + ");
    return {
      day: i + 1,
      title: i === 0 ? "Arrival and local rhythm" : i === days - 1 ? "Slow morning and souvenirs" : "Signature experiences",
      plan,
      note: i === 0 ? "Keep it easy after travel and explore nearby food spots." : "Start early, carry water, and save sunset for photos."
    };
  });
}

async function route(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const method = req.method || "GET";

  try {
    if (url.pathname === "/api/health") return json(res, 200, { ok: true });

    if (url.pathname === "/api/register" && method === "POST") {
      const data = await body(req);
      if (!data.name || !data.email || !data.password) return json(res, 400, { error: "Name, email and password are required." });
      const id = randomUUID();
      try {
        db.prepare("INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)").run(id, data.name.trim(), data.email.trim().toLowerCase(), hashPassword(data.password));
      } catch {
        return json(res, 409, { error: "This email is already registered." });
      }
      return json(res, 201, { user: publicUser(db.prepare("SELECT * FROM users WHERE id = ?").get(id)) });
    }

    if (url.pathname === "/api/login" && method === "POST") {
      const data = await body(req);
      const user = db.prepare("SELECT * FROM users WHERE email = ? AND password_hash = ?").get(String(data.email || "").toLowerCase(), hashPassword(data.password || ""));
      if (!user) return json(res, 401, { error: "Invalid email or password." });
      return json(res, 200, { user: publicUser(user) });
    }

    if (url.pathname === "/api/guest" && method === "POST") {
      return json(res, 200, { user: publicUser(db.prepare("SELECT * FROM users WHERE email = ?").get("demo@tripsmart.in")) });
    }

    if (url.pathname === "/api/destinations" && method === "GET") {
      return json(res, 200, { destinations: destinationList(url.searchParams.get("userId") || "") });
    }

    const destinationMatch = url.pathname.match(/^\/api\/destinations\/(\d+)$/);
    if (destinationMatch && method === "GET") {
      const destination = fullDestination(Number(destinationMatch[1]), url.searchParams.get("userId") || "");
      return destination ? json(res, 200, { destination }) : json(res, 404, { error: "Destination not found." });
    }

    if (url.pathname === "/api/saved" && method === "POST") {
      const data = await body(req);
      const exists = db.prepare("SELECT 1 FROM saved_places WHERE user_id = ? AND destination_id = ?").get(data.userId, data.destinationId);
      if (exists) {
        db.prepare("DELETE FROM saved_places WHERE user_id = ? AND destination_id = ?").run(data.userId, data.destinationId);
        return json(res, 200, { saved: false });
      }
      db.prepare("INSERT INTO saved_places (user_id, destination_id) VALUES (?, ?)").run(data.userId, data.destinationId);
      return json(res, 200, { saved: true });
    }

    if (url.pathname === "/api/trips" && method === "POST") {
      const data = await body(req);
      const destination = db.prepare("SELECT * FROM destinations WHERE id = ?").get(data.destinationId);
      if (!destination) return json(res, 404, { error: "Destination not found." });
      const days = Math.max(1, Math.min(10, Number(data.days || 3)));
      const estimate = estimateTrip(destination, days, data.travelMode || "train");
      const itinerary = makeItinerary(destination.id, days);
      const id = randomUUID();
      db.prepare("INSERT INTO trips (id, user_id, destination_id, days, travel_mode, total_cost, itinerary) VALUES (?, ?, ?, ?, ?, ?, ?)")
        .run(id, data.userId, destination.id, days, data.travelMode || "train", estimate.total, JSON.stringify(itinerary));
      return json(res, 201, { trip: { id, destination, days, travelMode: data.travelMode || "train", estimate, itinerary } });
    }

    const tripsMatch = url.pathname.match(/^\/api\/users\/([^/]+)\/trips$/);
    if (tripsMatch && method === "GET") {
      const trips = db.prepare(`
        SELECT t.*, d.city, d.image, d.season
        FROM trips t JOIN destinations d ON d.id = t.destination_id
        WHERE t.user_id = ?
        ORDER BY t.created_at DESC
      `).all(tripsMatch[1]).map((trip) => ({ ...trip, itinerary: JSON.parse(trip.itinerary) }));
      return json(res, 200, { trips });
    }

    if (url.pathname === "/api/bookings" && method === "POST") {
      const data = await body(req);
      const hotel = db.prepare("SELECT * FROM hotels WHERE id = ?").get(data.hotelId);
      if (!hotel) return json(res, 404, { error: "Hotel not found." });
      const nights = Math.max(1, Math.min(14, Number(data.nights || 1)));
      const id = randomUUID();
      db.prepare("INSERT INTO bookings (id, user_id, hotel_id, nights, total_price, status) VALUES (?, ?, ?, ?, ?, ?)")
        .run(id, data.userId, hotel.id, nights, hotel.price * nights, "confirmed");
      return json(res, 201, { booking: { id, hotel, nights, totalPrice: hotel.price * nights, status: "confirmed" } });
    }

    if (url.pathname === "/api/reviews" && method === "POST") {
      const data = await body(req);
      const id = randomUUID();
      db.prepare("INSERT INTO reviews (id, user_id, destination_id, rating, text) VALUES (?, ?, ?, ?, ?)")
        .run(id, data.userId, data.destinationId, Math.max(1, Math.min(5, Number(data.rating || 5))), String(data.text || "").trim());
      return json(res, 201, { review: db.prepare("SELECT * FROM reviews WHERE id = ?").get(id) });
    }

    return serveStatic(url.pathname, res);
  } catch (error) {
    console.error(error);
    return json(res, 500, { error: "Something went wrong on the server." });
  }
}

async function serveStatic(pathname, res) {
  const safePath = normalize(pathname === "/" ? "/index.html" : pathname).replace(/^(\.\.[/\\])+/, "");
  const fullPath = join(publicDir, safePath);
  if (!fullPath.startsWith(publicDir)) return json(res, 403, { error: "Forbidden" });

  try {
    const file = await readFile(fullPath);
    const type = {
      ".html": "text/html; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".js": "text/javascript; charset=utf-8",
      ".json": "application/json; charset=utf-8",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".svg": "image/svg+xml"
    }[extname(fullPath)] || "application/octet-stream";
    res.writeHead(200, { "content-type": type });
    res.end(file);
  } catch {
    const fallback = await readFile(join(publicDir, "index.html"));
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(fallback);
  }
}

createServer(route).listen(PORT, () => {
  console.log(`TripSmart running at http://localhost:${PORT}`);
});
