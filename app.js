const state = {
  user: JSON.parse(localStorage.getItem("tripsmart:user") || "null"),
  destinations: [],
  selectedId: null,
  selected: null,
  trips: [],
  page: "home",
  season: "All",
  query: "",
  days: 3,
  travelMode: "train",
  latestTrip: null,
  toast: ""
};

const app = document.querySelector("#app");

const icon = {
  home: "Home",
  explore: "Explore",
  plan: "Plan",
  map: "Map",
  profile: "Me"
};

function money(value) {
  return `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;
}

function initials(name = "Traveller") {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "content-type": "application/json", ...(options.headers || {}) },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}

function setToast(message) {
  state.toast = message;
  render();
  setTimeout(() => {
    state.toast = "";
    render();
  }, 2800);
}

async function boot() {
  if (!state.user) return renderAuth();
  await loadDestinations();
  await loadTrips();
  render();
}

async function loadDestinations() {
  const data = await api(`/api/destinations?userId=${encodeURIComponent(state.user.id)}`);
  state.destinations = data.destinations;
  if (!state.selectedId && data.destinations[0]) state.selectedId = data.destinations[0].id;
}

async function loadSelected(id = state.selectedId) {
  if (!id) return;
  state.selectedId = id;
  const data = await api(`/api/destinations/${id}?userId=${encodeURIComponent(state.user.id)}`);
  state.selected = data.destination;
}

async function loadTrips() {
  const data = await api(`/api/users/${state.user.id}/trips`);
  state.trips = data.trips;
}

function go(page) {
  state.page = page;
  render();
}

function renderAuth() {
  app.innerHTML = `
    <main class="auth-page">
      <section class="auth-card">
        <div class="auth-visual">
          <img src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80" alt="Mountain travel">
          <div>
            <p class="eyebrow">Smart travel buddy</p>
            <h2>Plan less. Experience more.</h2>
            <p class="muted">TripSmart stores your plans, estimates budgets, books stays, and keeps your favorite places ready.</p>
          </div>
        </div>
        <form class="auth-form" id="authForm">
          <p class="eyebrow">TripSmart</p>
          <h1>Welcome back</h1>
          <p class="muted">Use demo@tripsmart.in with password demo123, or create a new account.</p>
          <div class="tabs">
            <button class="tab active" type="button" data-mode="login">Sign in</button>
            <button class="tab" type="button" data-mode="register">Register</button>
          </div>
          <div id="nameField" class="field" hidden>
            <label>Full name</label>
            <input name="name" placeholder="Deeksha Bauskar">
          </div>
          <div class="field">
            <label>Email address</label>
            <input name="email" type="email" value="demo@tripsmart.in" required>
          </div>
          <div class="field">
            <label>Password</label>
            <input name="password" type="password" value="demo123" required>
          </div>
          <button class="btn" type="submit">Continue</button>
          <button class="btn secondary" type="button" id="guestBtn" style="margin-top:10px">Continue as guest</button>
          <p class="muted" style="font-size:12px">Your data is saved locally in SQLite on this machine.</p>
        </form>
      </section>
    </main>
  `;

  let mode = "login";
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      mode = tab.dataset.mode;
      document.querySelectorAll(".tab").forEach((item) => item.classList.toggle("active", item === tab));
      document.querySelector("#nameField").hidden = mode !== "register";
      document.querySelector(".auth-form h1").textContent = mode === "login" ? "Welcome back" : "Create your account";
    });
  });

  document.querySelector("#guestBtn").addEventListener("click", async () => {
    const data = await api("/api/guest", { method: "POST" });
    state.user = data.user;
    localStorage.setItem("tripsmart:user", JSON.stringify(state.user));
    await boot();
  });

  document.querySelector("#authForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const data = await api(mode === "login" ? "/api/login" : "/api/register", { method: "POST", body: form });
      state.user = data.user;
      localStorage.setItem("tripsmart:user", JSON.stringify(state.user));
      await boot();
    } catch (error) {
      setToast(error.message);
    }
  });
}

function shell(content) {
  const navItems = [
    ["home", icon.home],
    ["explore", icon.explore],
    ["planner", icon.plan],
    ["navigate", icon.map],
    ["profile", icon.profile]
  ];

  app.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand">
          <div class="brand-mark">TS</div>
          <div>
            <h1>TripSmart</h1>
            <p>Travel buddy dashboard</p>
          </div>
        </div>
        <nav class="nav">
          ${navItems.map(([page, label]) => `<button class="${state.page === page ? "active" : ""}" data-page="${page}">${label}</button>`).join("")}
        </nav>
        <div class="profile">
          <div class="profile-row">
            <div class="avatar">${initials(state.user.name)}</div>
            <div>
              <strong>${state.user.name}</strong>
              <p>${state.user.email}</p>
            </div>
          </div>
          <button class="btn ghost" id="logoutBtn" style="width:100%;margin-top:12px">Sign out</button>
        </div>
      </aside>
      <main class="workspace">
        <header class="topbar">
          <div>
            <div class="eyebrow">Good evening</div>
            <strong>Where should we make memories next?</strong>
          </div>
          <label class="search">
            <span>Search</span>
            <input id="searchInput" value="${escapeHtml(state.query)}" placeholder="City, season, vibe">
          </label>
        </header>
        <div class="content">${content}</div>
      </main>
      <nav class="mobile-nav">
        ${navItems.map(([page, label]) => `<button class="${state.page === page ? "active" : ""}" data-page="${page}">${label}</button>`).join("")}
      </nav>
      ${state.toast ? `<div class="toast">${escapeHtml(state.toast)}</div>` : ""}
    </div>
  `;

  document.querySelectorAll("[data-page]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (button.dataset.page === "explore" && !state.selected) await loadSelected();
      if (button.dataset.page === "navigate" && !state.selected) await loadSelected();
      go(button.dataset.page);
    });
  });
  document.querySelector("#logoutBtn")?.addEventListener("click", () => {
    localStorage.removeItem("tripsmart:user");
    location.reload();
  });
  document.querySelector("#searchInput")?.addEventListener("input", (event) => {
    state.query = event.target.value;
    const grid = document.querySelector("#destinationsGrid");
    if (grid) {
      grid.innerHTML = filteredDestinations().map(destinationCard).join("") || `<div class="empty">No destinations match your search.</div>`;
      bindCardActions();
    }
  });
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}

function filteredDestinations() {
  const query = state.query.toLowerCase().trim();
  return state.destinations.filter((d) => {
    const season = state.season === "All" || d.season === state.season;
    const text = `${d.city} ${d.season} ${d.tagline}`.toLowerCase().includes(query);
    return season && text;
  });
}

function render() {
  if (!state.user) return renderAuth();
  const pages = {
    home: renderHome,
    explore: renderExplore,
    detail: renderDetail,
    planner: renderPlanner,
    navigate: renderNavigate,
    profile: renderProfile
  };
  shell((pages[state.page] || renderHome)());
  bindCommon();
}

function renderHome() {
  const hero = state.destinations[0];
  const saved = state.destinations.filter((d) => d.saved).length;
  return `
    <section class="hero">
      <img src="${hero?.image || ""}" alt="Travel destination">
      <div class="hero-copy">
        <p class="eyebrow">Fully connected travel app</p>
        <h2>Your intelligent travel companion</h2>
        <p>Discover seasonal destinations, estimate costs, generate day-wise itineraries, book stays, save favorites, write reviews, and keep everything stored in the database.</p>
        <div class="actions">
          <button class="btn" data-action="start">Explore destinations</button>
          <button class="btn secondary" data-page="planner">Build a trip</button>
        </div>
      </div>
    </section>
    <section class="stats">
      <div class="stat"><strong>${state.destinations.length}</strong><span>Destinations</span></div>
      <div class="stat"><strong>${state.trips.length}</strong><span>Saved trips</span></div>
      <div class="stat"><strong>${saved}</strong><span>Favorites</span></div>
      <div class="stat"><strong>4.7</strong><span>Avg rating</span></div>
    </section>
    <div class="section-head">
      <div><p class="eyebrow">Season picks</p><h2 class="section-title">Best places right now</h2></div>
      <button class="btn ghost" data-page="explore">View all</button>
    </div>
    <div class="grid three">${state.destinations.slice(0, 3).map(destinationCard).join("")}</div>
  `;
}

function renderExplore() {
  return `
    <div class="section-head">
      <div><p class="eyebrow">Explore</p><h2 class="section-title">Choose your next city</h2></div>
    </div>
    <div class="chips" style="margin-bottom:16px">
      ${["All", "Summer", "Winter", "Monsoon"].map((season) => `<button class="chip ${state.season === season ? "active" : ""}" data-season="${season}">${season}</button>`).join("")}
    </div>
    <div class="grid three" id="destinationsGrid">${filteredDestinations().map(destinationCard).join("") || `<div class="empty">No destinations match your search.</div>`}</div>
  `;
}

function destinationCard(d) {
  return `
    <article class="destination-card">
      <img src="${d.image}" alt="${escapeHtml(d.city)}">
      <div class="card-top">
        <span class="pill">${d.season}</span>
        <button class="save-btn ${d.saved ? "saved" : ""}" data-save="${d.id}" title="Save place">${d.saved ? "♥" : "♡"}</button>
      </div>
      <div class="card-copy">
        <h3>${escapeHtml(d.city)}</h3>
        <p>${escapeHtml(d.tagline)}</p>
        <div class="actions">
          <button class="btn teal" data-open="${d.id}">Open guide</button>
          <span class="pill">Star ${d.rating}</span>
        </div>
      </div>
    </article>
  `;
}

function renderDetail() {
  const d = state.selected;
  if (!d) return `<div class="empty">Select a destination to open its guide.</div>`;
  return `
    <section class="hero">
      <img src="${d.image}" alt="${escapeHtml(d.city)}">
      <div class="hero-copy">
        <p class="eyebrow">${d.season} destination</p>
        <h2>${escapeHtml(d.city)}</h2>
        <p>${escapeHtml(d.overview)}</p>
        <div class="actions">
          <button class="btn" data-page="planner">Plan this trip</button>
          <button class="btn secondary" data-page="navigate">Open navigation</button>
          <button class="btn ghost" data-save="${d.id}">${d.saved ? "Saved" : "Save"}</button>
        </div>
      </div>
    </section>
    <div class="detail-layout">
      <div class="grid">
        <section class="panel">
          <h3>City intelligence</h3>
          <div class="facts">
            <div class="fact"><span>Best time</span><strong>${escapeHtml(d.best_time)}</strong></div>
            <div class="fact"><span>Transport</span><strong>${escapeHtml(d.transport)}</strong></div>
            <div class="fact"><span>Culture</span><strong>${escapeHtml(d.culture)}</strong></div>
            <div class="fact"><span>Safety</span><strong>${escapeHtml(d.safety)}</strong></div>
          </div>
        </section>
        <section class="panel">
          <h3>Top places</h3>
          <div class="list">${d.places.map((p) => `
            <div class="list-item">
              <div class="list-row"><strong>${escapeHtml(p.name)}</strong><span class="pill">${escapeHtml(p.type)}</span></div>
              <p class="muted">${escapeHtml(p.description)}</p>
              <small>${escapeHtml(p.distance)} from center · Star ${p.rating}</small>
            </div>`).join("")}</div>
        </section>
      </div>
      <aside class="grid">
        <section class="panel">
          <h3>Hotels and stays</h3>
          <div class="list">${d.hotels.map((h) => `
            <div class="list-item">
              <div class="list-row"><strong>${escapeHtml(h.name)}</strong><span class="pill">${escapeHtml(h.type)}</span></div>
              <div class="list-row"><span class="price">${money(h.price)}</span><button class="btn" data-book="${h.id}">Book</button></div>
              <small>${escapeHtml(h.distance)} · Star ${h.rating}</small>
            </div>`).join("")}</div>
        </section>
        <section class="panel">
          <h3>Nearby essentials</h3>
          <div class="list">${d.services.map((s) => `
            <div class="list-item">
              <div class="list-row"><strong>${escapeHtml(s.name)}</strong><span class="pill">${escapeHtml(s.type)}</span></div>
              <small>${escapeHtml(s.distance)} away ${s.rating ? `· Star ${s.rating}` : ""}</small>
            </div>`).join("")}</div>
        </section>
      </aside>
    </div>
  `;
}

function renderPlanner() {
  const selected = state.selected || state.destinations.find((d) => d.id === state.selectedId) || state.destinations[0];
  return `
    <div class="detail-layout">
      <section class="panel">
        <p class="eyebrow">Smart planner</p>
        <h3>Generate a persisted trip</h3>
        <div class="field">
          <label>Destination</label>
          <select id="plannerDestination">
            ${state.destinations.map((d) => `<option value="${d.id}" ${selected?.id === d.id ? "selected" : ""}>${escapeHtml(d.city)} · ${d.season}</option>`).join("")}
          </select>
        </div>
        <div class="grid two">
          <div class="field">
            <label>Days</label>
            <input id="plannerDays" type="number" min="1" max="10" value="${state.days}">
          </div>
          <div class="field">
            <label>Travel mode</label>
            <select id="plannerMode">
              ${["flight", "train", "bus", "car"].map((mode) => `<option value="${mode}" ${state.travelMode === mode ? "selected" : ""}>${mode}</option>`).join("")}
            </select>
          </div>
        </div>
        <button class="btn" id="generateTrip">Generate itinerary</button>
        ${state.latestTrip ? renderTripResult(state.latestTrip) : ""}
      </section>
      <section class="panel">
        <h3>Your stored trips</h3>
        <div class="list">${state.trips.map((trip) => `
          <article class="trip-card" style="min-height:190px">
            <img src="${trip.image}" alt="${escapeHtml(trip.city)}">
            <div class="card-copy">
              <h3>${escapeHtml(trip.city)}</h3>
              <p>${trip.days} days · ${escapeHtml(trip.travel_mode)} · ${money(trip.total_cost)}</p>
            </div>
          </article>`).join("") || `<p class="empty">No trips yet. Generate one and it will be saved in SQLite.</p>`}</div>
      </section>
    </div>
  `;
}

function renderTripResult(trip) {
  return `
    <div class="cost-box">
      <div class="list-row"><strong>Total estimate</strong><span class="total">${money(trip.estimate.total)}</span></div>
      <div class="cost-line"><span>Travel</span><strong>${money(trip.estimate.travel)}</strong></div>
      <div class="cost-line"><span>Stay</span><strong>${money(trip.estimate.stay)}</strong></div>
      <div class="cost-line"><span>Food</span><strong>${money(trip.estimate.food)}</strong></div>
      <div class="cost-line"><span>Local transport</span><strong>${money(trip.estimate.local)}</strong></div>
    </div>
    <div class="list">
      ${trip.itinerary.map((day) => `
        <div class="timeline-item">
          <small>Day ${day.day}</small>
          <strong>${escapeHtml(day.title)}</strong>
          <p class="muted">${escapeHtml(day.plan)}</p>
          <small>${escapeHtml(day.note)}</small>
        </div>`).join("")}
    </div>
  `;
}

function renderNavigate() {
  const d = state.selected || state.destinations.find((item) => item.id === state.selectedId) || state.destinations[0];
  return `
    <div class="detail-layout">
      <section class="panel">
        <p class="eyebrow">Live-style navigation</p>
        <h3>${escapeHtml(d?.city || "Destination")} route guidance</h3>
        <div class="map">
          <div class="route"></div>
          <div class="pin start"></div>
          <div class="pin end"></div>
        </div>
      </section>
      <section class="panel">
        <h3>Turn-by-turn</h3>
        <div class="list">
          <div class="timeline-item"><small>Start</small><strong>You are here</strong><p class="muted">GPS locked near your hotel area.</p></div>
          <div class="timeline-item"><small>2.1 km</small><strong>Take the scenic road</strong><p class="muted">Stay on the main road and follow the market signs.</p></div>
          <div class="timeline-item"><small>500 m</small><strong>Turn near city junction</strong><p class="muted">Look for the cafe row and continue left.</p></div>
          <div class="timeline-item"><small>Arrive</small><strong>Destination reached</strong><p class="muted">Save parking location and keep tickets ready.</p></div>
        </div>
      </section>
    </div>
  `;
}

function renderProfile() {
  return `
    <div class="grid two">
      <section class="panel">
        <p class="eyebrow">Profile</p>
        <h3>${escapeHtml(state.user.name)}</h3>
        <p class="muted">${escapeHtml(state.user.email)}</p>
        <div class="stats" style="grid-template-columns:repeat(3,1fr)">
          <div class="stat"><strong>${state.trips.length}</strong><span>Trips</span></div>
          <div class="stat"><strong>${state.destinations.filter((d) => d.saved).length}</strong><span>Saved</span></div>
          <div class="stat"><strong>${state.destinations.length}</strong><span>Guides</span></div>
        </div>
        <button class="btn ghost" id="logoutBtn2">Sign out</button>
      </section>
      <section class="panel">
        <h3>Review a destination</h3>
        <form id="reviewForm">
          <div class="field"><label>Destination</label><select name="destinationId">${state.destinations.map((d) => `<option value="${d.id}">${escapeHtml(d.city)}</option>`).join("")}</select></div>
          <div class="field"><label>Rating</label><select name="rating">${[5, 4, 3, 2, 1].map((r) => `<option>${r}</option>`).join("")}</select></div>
          <div class="field"><label>Review</label><textarea name="text" required placeholder="Share what helped you most"></textarea></div>
          <button class="btn">Save review</button>
        </form>
      </section>
    </div>
  `;
}

function bindCommon() {
  document.querySelector("[data-action='start']")?.addEventListener("click", () => go("explore"));
  document.querySelectorAll("[data-season]").forEach((button) => {
    button.addEventListener("click", () => {
      state.season = button.dataset.season;
      render();
    });
  });
  bindCardActions();
  document.querySelectorAll("[data-book]").forEach((button) => {
    button.addEventListener("click", async () => {
      const data = await api("/api/bookings", { method: "POST", body: { userId: state.user.id, hotelId: Number(button.dataset.book), nights: state.days } });
      setToast(`${data.booking.hotel.name} booked. Total ${money(data.booking.totalPrice)}.`);
    });
  });
  document.querySelector("#generateTrip")?.addEventListener("click", async () => {
    state.selectedId = Number(document.querySelector("#plannerDestination").value);
    state.days = Number(document.querySelector("#plannerDays").value);
    state.travelMode = document.querySelector("#plannerMode").value;
    const data = await api("/api/trips", { method: "POST", body: { userId: state.user.id, destinationId: state.selectedId, days: state.days, travelMode: state.travelMode } });
    state.latestTrip = data.trip;
    await loadSelected(state.selectedId);
    await loadTrips();
    setToast("Trip generated and saved.");
  });
  document.querySelector("#reviewForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = Object.fromEntries(new FormData(event.currentTarget));
    await api("/api/reviews", { method: "POST", body: { ...form, userId: state.user.id } });
    event.currentTarget.reset();
    setToast("Review saved to the database.");
  });
  document.querySelector("#logoutBtn2")?.addEventListener("click", () => {
    localStorage.removeItem("tripsmart:user");
    location.reload();
  });
}

function bindCardActions() {
  document.querySelectorAll("[data-open]").forEach((button) => {
    button.addEventListener("click", async () => {
      await loadSelected(Number(button.dataset.open));
      go("detail");
    });
  });
  document.querySelectorAll("[data-save]").forEach((button) => {
    button.addEventListener("click", async (event) => {
      event.stopPropagation();
      const data = await api("/api/saved", { method: "POST", body: { userId: state.user.id, destinationId: Number(button.dataset.save) } });
      await loadDestinations();
      if (state.selected?.id === Number(button.dataset.save)) await loadSelected(state.selected.id);
      setToast(data.saved ? "Saved to your favorites." : "Removed from favorites.");
    });
  });
}

boot().catch((error) => {
  app.innerHTML = `<main class="auth-page"><section class="panel"><h1>TripSmart could not start</h1><p class="muted">${escapeHtml(error.message)}</p></section></main>`;
});
