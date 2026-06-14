(function () {
  const tokenKey = "tres_amigos_admin_token";
  const panelTitles = {
    overview: ["Overzicht", "Tres Amigos beheren"],
    home: ["Home", "Home en knoppen"],
    locations: ["Vestigingen", "Vestigingen en bestelknoppen"],
    videos: ["Video's", "Portrait video's"],
    menu: ["Menu", "Food menu beheren"],
    applications: ["Aanvragen", "Sollicitatie-aanvragen"],
    seo: ["SEO", "Titels en descriptions"],
    footer: ["Footer", "Contact en footer"],
    api: ["API", "API en beheerstructuur"]
  };

  const loginForm = document.querySelector("#login-form");
  const editorForm = document.querySelector("#editor-form");
  const tabs = document.querySelector("#admin-tabs");
  const sidebarActions = document.querySelector("#admin-sidebar-actions");
  const loginMessage = document.querySelector("#login-message");
  const editorMessage = document.querySelector("#editor-message");
  const locationsEditor = document.querySelector("#locations-editor");
  const videosEditor = document.querySelector("#videos-editor");
  const menuEditor = document.querySelector("#menu-editor");
  const applicationsEditor = document.querySelector("#applications-editor");
  const seoEditor = document.querySelector("#seo-editor");
  const locationsSearch = document.querySelector("#locations-search");
  const videosSearch = document.querySelector("#videos-search");
  const menuSearch = document.querySelector("#menu-search");
  const applicationsSearch = document.querySelector("#applications-search");
  const seoSearch = document.querySelector("#seo-search");
  const kpis = document.querySelector("#admin-kpis");
  const panelEyebrow = document.querySelector("#panel-eyebrow");
  const panelTitle = document.querySelector("#panel-title");

  const expanded = {
    locations: new Set(),
    videos: new Set(),
    menu: new Set(),
    applications: new Set(),
    seo: new Set()
  };

  let content = null;
  let applications = [];
  let activeTab = "overview";

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function slugify(value, fallback) {
    return String(value || fallback || "item")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || fallback || "item";
  }

  function itemKey(item, index, fallback) {
    return `${item?.id || fallback}-${index}`;
  }

  function searchValue(input) {
    return String(input?.value || "").trim().toLowerCase();
  }

  function matchesSearch(values, term) {
    if (!term) return true;
    return values.some((value) => String(value || "").toLowerCase().includes(term));
  }

  function getToken() {
    return localStorage.getItem(tokenKey) || "";
  }

  function setToken(token) {
    localStorage.setItem(tokenKey, token);
  }

  function clearToken() {
    localStorage.removeItem(tokenKey);
  }

  async function api(path, options) {
    const headers = new Headers(options?.headers);
    if (options?.body) headers.set("Content-Type", "application/json");
    if (getToken()) headers.set("Authorization", `Bearer ${getToken()}`);
    const response = await fetch(path, { ...options, headers });
    const text = await response.text();
    let data = null;

    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { message: text || "Server gaf geen JSON terug." };
    }

    if (!response.ok) throw new Error(data?.message || "Verzoek mislukt.");
    return data;
  }

  function getByPath(object, path) {
    return path.split(".").reduce((current, key) => current?.[key], object);
  }

  function setByPath(object, path, value) {
    const keys = path.split(".");
    const last = keys.pop();
    const target = keys.reduce((current, key) => {
      current[key] = current[key] || {};
      return current[key];
    }, object);
    target[last] = value;
  }

  function ensureContentShape() {
    content = content || {};
    content.site = content.site || {};
    content.site.seo = content.site.seo || {};
    content.site.hero = content.site.hero || {};
    content.site.navCta = content.site.navCta || {};
    content.site.footer = content.site.footer || {};
    content.site.videosSection = content.site.videosSection || {};
    content.locations = Array.isArray(content.locations) ? content.locations : [];
    content.videos = Array.isArray(content.videos) ? content.videos : [];
    content.menu = Array.isArray(content.menu) ? content.menu : [];
  }

  function fillSiteFields() {
    document.querySelectorAll("[data-site-field]").forEach((field) => {
      const path = field.getAttribute("data-site-field");
      const value = getByPath(content.site, path);
      if (path === "hero.tags") {
        field.value = Array.isArray(value) ? value.join("\n") : "";
      } else {
        field.value = value || "";
      }
    });
  }

  function syncSiteFields() {
    document.querySelectorAll("[data-site-field]").forEach((field) => {
      const path = field.getAttribute("data-site-field");
      const value = field.value;
      setByPath(content.site, path, path === "hero.tags" ? value.split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean) : value);
    });
  }

  function emptyLocation() {
    return {
      id: `vestiging-${Date.now()}`,
      area: "Amsterdam",
      name: "Nieuwe vestiging",
      address: "",
      note: "Take away and delivery options",
      active: true,
      links: [{ label: "Take Away", url: "" }]
    };
  }

  function emptyVideo() {
    return {
      id: `video-${Date.now()}`,
      title: "Nieuwe video",
      caption: "",
      src: "assets/brand/",
      active: true
    };
  }

  function emptyMenuCategory() {
    return {
      id: `categorie-${Date.now()}`,
      title: "Nieuwe categorie",
      orderLabel: "Order",
      active: true,
      items: [emptyMenuItem()]
    };
  }

  function emptyMenuItem() {
    return {
      id: `item-${Date.now()}`,
      name: "Nieuw menu item",
      description: "",
      price: "€0,00",
      active: true
    };
  }

  function linkRow(link, linkIndex) {
    return `<div class="admin-link-row quiet" data-link-index="${linkIndex}">
      <label>Knop tekst<input data-link-field="label" value="${escapeHtml(link.label)}"></label>
      <label>URL<input data-link-field="url" value="${escapeHtml(link.url)}"></label>
      <button class="btn alt" type="button" data-action="remove-link">Verwijderen</button>
    </div>`;
  }

  function locationLeading() {
    return `<span class="admin-accordion-leading" aria-hidden="true">
      <img src="/assets/site/tres-amigos-logo-new.png" alt="">
    </span>`;
  }

  function locationCard(location, index) {
    const key = itemKey(location, index, "location");
    const isOpen = expanded.locations.has(key);

    return `<article class="admin-location-card admin-accordion-item${isOpen ? " open" : ""}" data-location-index="${index}" data-key="${escapeHtml(key)}">
      <button class="admin-accordion-head" type="button" data-action="toggle-location" data-key="${escapeHtml(key)}">
        ${locationLeading()}
        <span class="admin-accordion-copy">
          <strong>${escapeHtml(location.name || "Nieuwe vestiging")}</strong>
          <small>${escapeHtml(location.area || "Amsterdam")} · ${escapeHtml(location.address || "Geen adres ingevuld")}</small>
        </span>
        <em>${location.active !== false ? "Actief" : "Verborgen"}</em>
      </button>
      <div class="admin-accordion-body">
        <div class="admin-grid">
          <label>Actief<select data-location-field="active"><option value="true"${location.active !== false ? " selected" : ""}>Ja</option><option value="false"${location.active === false ? " selected" : ""}>Nee</option></select></label>
          <label>Uitgelicht bij Choose your spot<select data-location-field="featured"><option value="true"${location.featured === true ? " selected" : ""}>Ja</option><option value="false"${location.featured !== true ? " selected" : ""}>Nee</option></select></label>
          <label>Regio / label<input data-location-field="area" value="${escapeHtml(location.area)}"></label>
          <label>Naam<input data-location-field="name" value="${escapeHtml(location.name)}"></label>
          <label class="wide">Adres<input data-location-field="address" value="${escapeHtml(location.address)}"></label>
          <label class="wide">Korte tekst<input data-location-field="note" value="${escapeHtml(location.note)}"></label>
        </div>
        <details class="admin-link-details">
          <summary>
            <span class="admin-link-details-leading" aria-hidden="true">
              <img src="/assets/site/tres-amigos-logo-new.png" alt="">
            </span>
            <span class="admin-link-details-copy">
              <strong>Links aanpassen</strong>
              <small>Bestelknoppen en URLs voor deze vestiging</small>
            </span>
          </summary>
        <div class="admin-link-list">
          ${(location.links || []).map(linkRow).join("")}
        </div>
        </details>
        <div class="admin-inline-actions">
          <button class="btn" type="button" data-action="add-link">Bestelknop toevoegen</button>
          <button class="btn alt" type="button" data-action="remove-location">Vestiging verwijderen</button>
        </div>
      </div>
    </article>`;
  }

  function videoCard(video, index) {
    const key = itemKey(video, index, "video");
    const isOpen = expanded.videos.has(key);

    return `<article class="admin-video-card admin-accordion-item${isOpen ? " open" : ""}" data-video-index="${index}" data-key="${escapeHtml(key)}">
      <button class="admin-accordion-head" type="button" data-action="toggle-video" data-key="${escapeHtml(key)}">
        <span>
          <strong>${escapeHtml(video.title || "Video")}</strong>
          <small>${escapeHtml(video.src || "Geen bestand ingevuld")}</small>
        </span>
        <em>${video.active !== false ? "Actief" : "Verborgen"}</em>
      </button>
      <div class="admin-accordion-body admin-video-body">
        <video src="${escapeHtml(video.src)}" muted playsinline preload="metadata"></video>
        <div class="admin-video-form">
          <div class="admin-grid">
            <label>Actief<select data-video-field="active"><option value="true"${video.active !== false ? " selected" : ""}>Ja</option><option value="false"${video.active === false ? " selected" : ""}>Nee</option></select></label>
            <label>Titel<input data-video-field="title" value="${escapeHtml(video.title)}"></label>
            <label class="wide">Video URL<input data-video-field="src" value="${escapeHtml(video.src)}"></label>
            <label class="wide">Caption<input data-video-field="caption" value="${escapeHtml(video.caption)}"></label>
          </div>
          <div class="admin-inline-actions">
            <button class="btn alt" type="button" data-action="remove-video">Video verwijderen</button>
          </div>
        </div>
      </div>
    </article>`;
  }

  function menuItemRow(item, itemIndex) {
    return `<div class="admin-menu-item" data-menu-item-index="${itemIndex}">
      <div class="admin-grid">
        <label>Actief<select data-menu-item-field="active"><option value="true"${item.active !== false ? " selected" : ""}>Ja</option><option value="false"${item.active === false ? " selected" : ""}>Nee</option></select></label>
        <label>Uitgelicht bij Popular choices<select data-menu-item-field="featured"><option value="true"${item.featured === true ? " selected" : ""}>Ja</option><option value="false"${item.featured !== true ? " selected" : ""}>Nee</option></select></label>
        <label>Prijs<input data-menu-item-field="price" value="${escapeHtml(item.price)}"></label>
        <label class="wide">Naam<input data-menu-item-field="name" value="${escapeHtml(item.name)}"></label>
        <label class="wide">Omschrijving<textarea data-menu-item-field="description">${escapeHtml(item.description)}</textarea></label>
      </div>
      <button class="btn alt" type="button" data-action="remove-menu-item">Menu item verwijderen</button>
    </div>`;
  }

  function menuCategoryCard(category, index) {
    const key = itemKey(category, index, "menu");
    const isOpen = expanded.menu.has(key);
    const activeItems = (category.items || []).filter((item) => item.active !== false).length;

    return `<article class="admin-menu-category admin-accordion-item${isOpen ? " open" : ""}" data-menu-category-index="${index}" data-key="${escapeHtml(key)}">
      <button class="admin-accordion-head" type="button" data-action="toggle-menu-category" data-key="${escapeHtml(key)}">
        <span>
          <strong>${escapeHtml(category.title || "Categorie")}</strong>
          <small>${activeItems} actieve items · ${escapeHtml(category.orderLabel || "Order")}</small>
        </span>
        <em>${category.active !== false ? "Actief" : "Verborgen"}</em>
      </button>
      <div class="admin-accordion-body">
        <div class="admin-grid">
          <label>Actief<select data-menu-category-field="active"><option value="true"${category.active !== false ? " selected" : ""}>Ja</option><option value="false"${category.active === false ? " selected" : ""}>Nee</option></select></label>
          <label>Knoptekst<input data-menu-category-field="orderLabel" value="${escapeHtml(category.orderLabel)}"></label>
          <label class="wide">Categorie naam<input data-menu-category-field="title" value="${escapeHtml(category.title)}"></label>
        </div>
        <div class="admin-menu-items">
          ${(category.items || []).map(menuItemRow).join("")}
        </div>
        <div class="admin-inline-actions">
          <button class="btn" type="button" data-action="add-menu-item">Menu item toevoegen</button>
          <button class="btn alt" type="button" data-action="remove-menu-category">Categorie verwijderen</button>
        </div>
      </div>
    </article>`;
  }

  function seoCard(key, title, fields) {
    const isOpen = expanded.seo.has(key);
    const body = fields.map((field) => {
      const value = getByPath(content.site, field.path) || "";
      if (field.type === "textarea") {
        return `<label class="wide">${escapeHtml(field.label)}<textarea data-site-field="${escapeHtml(field.path)}">${escapeHtml(value)}</textarea></label>`;
      }
      return `<label class="wide">${escapeHtml(field.label)}<input data-site-field="${escapeHtml(field.path)}" value="${escapeHtml(value)}"></label>`;
    }).join("");

    return `<article class="admin-accordion-item${isOpen ? " open" : ""}" data-key="${escapeHtml(key)}">
      <button class="admin-accordion-head" type="button" data-action="toggle-seo" data-key="${escapeHtml(key)}">
        <span>
          <strong>${escapeHtml(title)}</strong>
          <small>${fields.map((field) => field.label).join(", ")}</small>
        </span>
        <em>Bewerken</em>
      </button>
      <div class="admin-accordion-body">
        <div class="admin-grid">${body}</div>
      </div>
    </article>`;
  }

  function renderLocations() {
    const term = searchValue(locationsSearch);
    const items = content.locations
      .map((location, index) => ({ location, index }))
      .filter(({ location }) => matchesSearch([location.name, location.area, location.address, location.note], term));

    locationsEditor.innerHTML = items.length
      ? items.map(({ location, index }) => locationCard(location, index)).join("")
      : `<p class="admin-empty">Geen vestigingen gevonden.</p>`;
  }

  function renderVideos() {
    const term = searchValue(videosSearch);
    const items = content.videos
      .map((video, index) => ({ video, index }))
      .filter(({ video }) => matchesSearch([video.title, video.caption, video.src], term));

    videosEditor.innerHTML = items.length
      ? items.map(({ video, index }) => videoCard(video, index)).join("")
      : `<p class="admin-empty">Geen video's gevonden.</p>`;
  }

  function renderMenu() {
    const term = searchValue(menuSearch);
    const items = content.menu
      .map((category, index) => ({ category, index }))
      .filter(({ category }) => matchesSearch([
        category.title,
        category.orderLabel,
        ...(category.items || []).flatMap((item) => [item.name, item.description, item.price])
      ], term));

    menuEditor.innerHTML = items.length
      ? items.map(({ category, index }) => menuCategoryCard(category, index)).join("")
      : `<p class="admin-empty">Geen menu-items gevonden.</p>`;
  }

  function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString("nl-NL", { dateStyle: "medium", timeStyle: "short" });
  }

  function applicationCard(application, index) {
    const key = itemKey(application, index, "application");
    const isOpen = expanded.applications.has(key);
    const days = (application.days || []).join(", ") || "Geen dagen gekozen";
    const pdfLink = application.pdf?.data
      ? `<a class="btn blue" href="${escapeHtml(application.pdf.data)}" download="${escapeHtml(application.pdf.name || "sollicitatie.pdf")}">PDF downloaden</a>`
      : `<span class="admin-empty">Geen PDF toegevoegd.</span>`;

    return `<article class="admin-accordion-item admin-application-card${isOpen ? " open" : ""}" data-key="${escapeHtml(key)}">
      <button class="admin-accordion-head" type="button" data-action="toggle-application" data-key="${escapeHtml(key)}">
        <span>
          <strong>${escapeHtml(application.name || "Naam onbekend")}</strong>
          <small>${escapeHtml(application.role || "Rol onbekend")} · ${escapeHtml(application.email || "Geen email")} · ${escapeHtml(formatDate(application.createdAt))}</small>
        </span>
        <em>${escapeHtml(application.status || "nieuw")}</em>
      </button>
      <div class="admin-accordion-body">
        <div class="admin-intake-summary">
          <div><span>Rol</span><strong>${escapeHtml(application.role)}</strong><p>${escapeHtml(application.status || "nieuw")}</p></div>
          <div><span>Contact</span><strong>${escapeHtml(application.name)}</strong><p>${escapeHtml(application.email)}${application.phone ? ` · ${escapeHtml(application.phone)}` : ""}</p></div>
          <div><span>Dagen</span><strong>${escapeHtml(days)}</strong><p>${escapeHtml(application.availabilityNote || "Geen extra opmerking")}</p></div>
          <div><span>Ontvangen</span><strong>${escapeHtml(formatDate(application.createdAt))}</strong><p>${application.pdf ? escapeHtml(application.pdf.name) : "Geen PDF"}</p></div>
        </div>
        <div class="admin-application-detail">
          <article><span>Ervaring</span><p>${escapeHtml(application.experience || "Niet ingevuld")}</p></article>
          <article><span>Motivatie</span><p>${escapeHtml(application.motivation || "Niet ingevuld")}</p></article>
        </div>
        <div class="admin-inline-actions">${pdfLink}</div>
      </div>
    </article>`;
  }

  function renderApplications() {
    if (!applicationsEditor) return;
    const term = searchValue(applicationsSearch);
    const items = applications
      .map((application, index) => ({ application, index }))
      .filter(({ application }) => matchesSearch([
        application.name,
        application.email,
        application.phone,
        application.role,
        application.status,
        ...(application.days || [])
      ], term));

    applicationsEditor.innerHTML = items.length
      ? items.map(({ application, index }) => applicationCard(application, index)).join("")
      : `<p class="admin-empty">Nog geen sollicitatie-aanvragen gevonden.</p>`;
  }

  function renderSeo() {
    const cards = [
      {
        key: "seo-general",
        title: "Algemene SEO",
        terms: ["algemeen", "home", "title", "description"],
        fields: [
          { label: "Site title", path: "seo.title" },
          { label: "Site description", path: "seo.description", type: "textarea" },
          { label: "Social image", path: "seo.image" }
        ]
      },
      {
        key: "seo-menu",
        title: "Menu pagina",
        terms: ["menu", "title", "description"],
        fields: [
          { label: "Menu title", path: "seo.menuTitle" },
          { label: "Menu description", path: "seo.menuDescription", type: "textarea" }
        ]
      }
    ];
    const term = searchValue(seoSearch);
    const filtered = cards.filter((card) => matchesSearch([card.title, ...card.terms], term));

    seoEditor.innerHTML = filtered.length
      ? filtered.map((card) => seoCard(card.key, card.title, card.fields)).join("")
      : `<p class="admin-empty">Geen SEO velden gevonden.</p>`;
  }

  function renderKpis() {
    const activeLocations = content.locations.filter((item) => item.active !== false);
    const links = activeLocations.reduce((total, location) => total + (location.links || []).length, 0);
    const activeVideos = content.videos.filter((item) => item.active !== false);
    const menuItems = content.menu.reduce((total, category) => total + (category.items || []).filter((item) => item.active !== false).length, 0);
    const items = [
      ["Vestigingen", activeLocations.length],
      ["Bestelknoppen", links],
      ["Video's", activeVideos.length],
      ["Menu items", menuItems],
      ["Aanvragen", applications.length],
      ["Hero tags", content.site?.hero?.tags?.length || 0],
      ["SEO velden", 5]
    ];
    kpis.innerHTML = items.map(([label, value]) => `<article class="admin-kpi"><span>${label}</span><strong>${value}</strong></article>`).join("");
  }

  function renderAll() {
    renderLocations();
    renderVideos();
    renderMenu();
    renderApplications();
    renderSeo();
    renderKpis();
  }

  function syncLocations() {
    document.querySelectorAll(".admin-location-card").forEach((card) => {
      const index = Number(card.getAttribute("data-location-index"));
      const current = content.locations[index] || emptyLocation();
      const location = { ...current };
      card.querySelectorAll("[data-location-field]").forEach((field) => {
        const key = field.getAttribute("data-location-field");
        location[key] = key === "active" || key === "featured" ? field.value === "true" : field.value;
      });
      location.id = location.id || slugify(location.name, `vestiging-${index + 1}`);
      location.links = Array.from(card.querySelectorAll(".admin-link-row")).map((row) => {
        const link = {};
        row.querySelectorAll("[data-link-field]").forEach((field) => {
          link[field.getAttribute("data-link-field")] = field.value;
        });
        return link;
      });
      content.locations[index] = location;
    });
  }

  function syncVideos() {
    document.querySelectorAll(".admin-video-card").forEach((card) => {
      const index = Number(card.getAttribute("data-video-index"));
      const current = content.videos[index] || emptyVideo();
      const video = { ...current };
      card.querySelectorAll("[data-video-field]").forEach((field) => {
        const key = field.getAttribute("data-video-field");
        video[key] = key === "active" ? field.value === "true" : field.value;
      });
      video.id = video.id || slugify(video.title, `video-${index + 1}`);
      content.videos[index] = video;
    });
  }

  function syncMenu() {
    document.querySelectorAll(".admin-menu-category").forEach((card) => {
      const index = Number(card.getAttribute("data-menu-category-index"));
      const current = content.menu[index] || emptyMenuCategory();
      const category = { ...current };
      card.querySelectorAll("[data-menu-category-field]").forEach((field) => {
        const key = field.getAttribute("data-menu-category-field");
        category[key] = key === "active" ? field.value === "true" : field.value;
      });
      category.id = category.id || slugify(category.title, `categorie-${index + 1}`);
      category.items = Array.from(card.querySelectorAll(".admin-menu-item")).map((row, itemIndex) => {
        const currentItem = current.items?.[itemIndex] || emptyMenuItem();
        const item = { ...currentItem };
        row.querySelectorAll("[data-menu-item-field]").forEach((field) => {
          const key = field.getAttribute("data-menu-item-field");
          item[key] = key === "active" || key === "featured" ? field.value === "true" : field.value;
        });
        item.id = item.id || slugify(item.name, `item-${index + 1}-${itemIndex + 1}`);
        return item;
      });
      content.menu[index] = category;
    });
  }

  function syncAll() {
    if (!content) return;
    syncSiteFields();
    syncLocations();
    syncVideos();
    syncMenu();
  }

  function showTab(tab) {
    activeTab = tab;
    document.querySelectorAll("[data-panel]").forEach((panel) => {
      panel.classList.toggle("active", panel.getAttribute("data-panel") === tab);
    });
    document.querySelectorAll("[data-tab]").forEach((button) => {
      button.classList.toggle("active", button.getAttribute("data-tab") === tab);
    });
    const title = panelTitles[tab] || panelTitles.overview;
    panelEyebrow.textContent = title[0];
    panelTitle.textContent = title[1];
  }

  function showLogin() {
    editorForm.hidden = true;
    tabs.hidden = true;
    sidebarActions.hidden = true;
    loginForm.hidden = false;
  }

  function showEditor() {
    loginForm.hidden = true;
    editorForm.hidden = false;
    tabs.hidden = false;
    sidebarActions.hidden = false;
    renderAll();
    fillSiteFields();
    showTab(activeTab);
  }

  async function loadContent() {
    content = await api("/api/admin/content");
    await loadApplications();
    ensureContentShape();
    showEditor();
  }

  async function loadApplications() {
    const data = await api("/api/admin/applications");
    applications = Array.isArray(data.applications) ? data.applications : [];
  }

  function toggleSet(set, key) {
    if (set.has(key)) set.delete(key);
    else set.add(key);
  }

  function rerenderCurrent() {
    if (activeTab === "locations") renderLocations();
    if (activeTab === "videos") renderVideos();
    if (activeTab === "menu") renderMenu();
    if (activeTab === "applications") renderApplications();
    if (activeTab === "seo") {
      renderSeo();
      fillSiteFields();
    }
    renderKpis();
  }

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    loginMessage.textContent = "";
    try {
      const password = document.querySelector("#admin-password").value;
      const data = await api("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ password })
      });
      setToken(data.token);
      await loadContent();
    } catch (error) {
      loginMessage.textContent = error.message;
    }
  });

  editorForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    editorMessage.textContent = "";
    try {
      syncAll();
      content = await api("/api/admin/content", {
        method: "PUT",
        body: JSON.stringify(content)
      });
      ensureContentShape();
      renderAll();
      fillSiteFields();
      editorMessage.textContent = "Opgeslagen.";
    } catch (error) {
      editorMessage.textContent = error.message;
    }
  });

  [locationsSearch, videosSearch, menuSearch, applicationsSearch, seoSearch].forEach((input) => {
    input?.addEventListener("input", () => {
      syncAll();
      if (input === locationsSearch) renderLocations();
      if (input === videosSearch) renderVideos();
      if (input === menuSearch) renderMenu();
      if (input === applicationsSearch) renderApplications();
      if (input === seoSearch) {
        renderSeo();
        fillSiteFields();
      }
    });
  });

  document.addEventListener("click", (event) => {
    const tabButton = event.target?.closest?.("[data-tab]");
    const actionButton = event.target?.closest?.("[data-action]");

    if (tabButton) {
      if (content) syncAll();
      showTab(tabButton.getAttribute("data-tab"));
      return;
    }

    if (!actionButton) return;
    const action = actionButton.getAttribute("data-action");

    if (action === "logout") {
      clearToken();
      showLogin();
      return;
    }

    if (!content) return;
    syncAll();

    if (action === "toggle-location") {
      toggleSet(expanded.locations, actionButton.getAttribute("data-key"));
      renderLocations();
      return;
    }

    if (action === "toggle-video") {
      toggleSet(expanded.videos, actionButton.getAttribute("data-key"));
      renderVideos();
      return;
    }

    if (action === "toggle-menu-category") {
      toggleSet(expanded.menu, actionButton.getAttribute("data-key"));
      renderMenu();
      return;
    }

    if (action === "toggle-seo") {
      toggleSet(expanded.seo, actionButton.getAttribute("data-key"));
      renderSeo();
      fillSiteFields();
      return;
    }

    if (action === "toggle-application") {
      toggleSet(expanded.applications, actionButton.getAttribute("data-key"));
      renderApplications();
      return;
    }

    if (action === "refresh-applications") {
      loadApplications().then(() => {
        renderApplications();
        renderKpis();
      }).catch((error) => {
        editorMessage.textContent = error.message;
      });
      return;
    }

    if (action === "add-location") {
      const location = emptyLocation();
      content.locations.push(location);
      expanded.locations.add(itemKey(location, content.locations.length - 1, "location"));
      renderLocations();
      renderKpis();
      return;
    }

    if (action === "remove-location") {
      const card = actionButton.closest(".admin-location-card");
      const index = Number(card?.getAttribute("data-location-index"));
      content.locations.splice(index, 1);
      renderLocations();
      renderKpis();
      return;
    }

    if (action === "add-link") {
      const card = actionButton.closest(".admin-location-card");
      const index = Number(card?.getAttribute("data-location-index"));
      content.locations[index].links = content.locations[index].links || [];
      content.locations[index].links.push({ label: "Bestellen", url: "" });
      expanded.locations.add(itemKey(content.locations[index], index, "location"));
      renderLocations();
      renderKpis();
      return;
    }

    if (action === "remove-link") {
      const card = actionButton.closest(".admin-location-card");
      const row = actionButton.closest(".admin-link-row");
      const locationIndex = Number(card?.getAttribute("data-location-index"));
      const linkIndex = Number(row?.getAttribute("data-link-index"));
      content.locations[locationIndex].links.splice(linkIndex, 1);
      expanded.locations.add(itemKey(content.locations[locationIndex], locationIndex, "location"));
      renderLocations();
      renderKpis();
      return;
    }

    if (action === "add-video") {
      const video = emptyVideo();
      content.videos.push(video);
      expanded.videos.add(itemKey(video, content.videos.length - 1, "video"));
      renderVideos();
      renderKpis();
      return;
    }

    if (action === "remove-video") {
      const card = actionButton.closest(".admin-video-card");
      const index = Number(card?.getAttribute("data-video-index"));
      content.videos.splice(index, 1);
      renderVideos();
      renderKpis();
      return;
    }

    if (action === "add-menu-category") {
      const category = emptyMenuCategory();
      content.menu.push(category);
      expanded.menu.add(itemKey(category, content.menu.length - 1, "menu"));
      renderMenu();
      renderKpis();
      return;
    }

    if (action === "remove-menu-category") {
      const card = actionButton.closest(".admin-menu-category");
      const index = Number(card?.getAttribute("data-menu-category-index"));
      content.menu.splice(index, 1);
      renderMenu();
      renderKpis();
      return;
    }

    if (action === "add-menu-item") {
      const card = actionButton.closest(".admin-menu-category");
      const index = Number(card?.getAttribute("data-menu-category-index"));
      content.menu[index].items = content.menu[index].items || [];
      content.menu[index].items.push(emptyMenuItem());
      expanded.menu.add(itemKey(content.menu[index], index, "menu"));
      renderMenu();
      renderKpis();
      return;
    }

    if (action === "remove-menu-item") {
      const card = actionButton.closest(".admin-menu-category");
      const row = actionButton.closest(".admin-menu-item");
      const categoryIndex = Number(card?.getAttribute("data-menu-category-index"));
      const itemIndex = Number(row?.getAttribute("data-menu-item-index"));
      content.menu[categoryIndex].items.splice(itemIndex, 1);
      expanded.menu.add(itemKey(content.menu[categoryIndex], categoryIndex, "menu"));
      renderMenu();
      renderKpis();
    }
  });

  showLogin();
  if (getToken()) {
    loadContent().catch(() => {
      clearToken();
      showLogin();
    });
  }
})();
