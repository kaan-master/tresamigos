(function () {
  const fallbackContentUrl = "data/site-content.json";

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function slugify(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "menu";
  }

  function formatPrice(value) {
    const price = String(value || "").trim().replace(/^\?/, "€");
    if (!price) return "";
    return price.startsWith("€") ? price : `€${price}`;
  }

  function isExternal(url) {
    return /^https?:\/\//i.test(url || "");
  }

  function linkAttrs(url) {
    return isExternal(url) ? ' target="_blank" rel="noopener"' : "";
  }

  function buttonClass(index) {
    return index === 0 ? "btn primary" : "btn alt";
  }

  function orderButtons(links) {
    return `<div class="order-buttons">${(links || []).map((link) => (
      `<a class="shop-link" href="${escapeHtml(link.url)}"${linkAttrs(link.url)}>${escapeHtml(link.label)}</a>`
    )).join("")}</div>`;
  }

  function orderCard(location) {
    return `<article class="order-card in-view">
      <span class="tag">${escapeHtml(location.area)}</span>
      <h3>${escapeHtml(location.name)}</h3>
      <p>${escapeHtml(location.address)}</p>
      ${orderButtons(location.links)}
    </article>`;
  }

  function locationCard(location) {
    return `<article class="location-card in-view">
      <span class="tag">${escapeHtml(location.area)}</span>
      <h3>${escapeHtml(location.name)}</h3>
      <div class="meta">
        <span>${escapeHtml(location.address)}</span>
        <span>${escapeHtml(location.note)}</span>
      </div>
      ${orderButtons(location.links)}
    </article>`;
  }

  function videoCard(video) {
    return `<article class="portrait-video-card in-view">
      <video src="${escapeHtml(video.src)}" muted autoplay loop playsinline preload="metadata"></video>
      <div>
        <h3>${escapeHtml(video.title)}</h3>
        <p>${escapeHtml(video.caption)}</p>
      </div>
    </article>`;
  }

  function heroImageCard() {
    return `<div class="hero-card food-first in-view"><img src="assets/site/restaurant-interior.jpg" alt="Tres Amigos restaurant interior"><div class="image-caption">Four locations in Amsterdam</div></div>`;
  }

  function menuItemCard(item) {
    return `<article class="product-card in-view">
      <div>
        <h3>${escapeHtml(item.name)}</h3>
        <p>${escapeHtml(item.description)}</p>
      </div>
      <strong>${escapeHtml(formatPrice(item.price))}</strong>
    </article>`;
  }

  function applySeo(site) {
    const seo = site.seo || {};
    const isMenuPage = /menu\.html$/i.test(location.pathname);
    const title = isMenuPage ? seo.menuTitle : seo.title;
    const description = isMenuPage ? seo.menuDescription : seo.description;

    if (title) document.title = title;
    if (description) {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", "description");
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", description);
    }
  }

  function applyHero(site) {
    const hero = site.hero || {};
    const copy = document.querySelector(".hero-copy");
    if (!copy) return;

    const eyebrow = copy.querySelector(".eyebrow");
    const title = copy.querySelector("h1");
    const intro = copy.querySelector("p");
    const actions = copy.querySelector(".actions");

    if (eyebrow) eyebrow.textContent = hero.eyebrow || "";
    if (title) title.textContent = hero.title || "";
    if (intro) intro.textContent = hero.intro || "";
    if (actions) {
      const buttons = [
        { label: hero.primaryLabel, url: hero.primaryUrl },
        { label: hero.secondaryLabel, url: hero.secondaryUrl }
      ].filter((button) => button.label && button.url);

      actions.innerHTML = buttons.map((button, index) => (
        `<a class="${buttonClass(index)}" href="${escapeHtml(button.url)}"${linkAttrs(button.url)}>${escapeHtml(button.label)}</a>`
      )).join("");
    }

    const existingTags = copy.querySelector(".hero-tags");
    if (existingTags) existingTags.remove();
    if (Array.isArray(hero.tags) && hero.tags.length) {
      const tagWrap = document.createElement("div");
      tagWrap.className = "hero-tags";
      tagWrap.innerHTML = hero.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");
      copy.appendChild(tagWrap);
    }
  }

  function applyNav(site) {
    const cta = site.navCta || {};
    document.querySelectorAll(".nav-cta").forEach((link) => {
      if (cta.label) link.textContent = cta.label;
      if (cta.url) link.setAttribute("href", cta.url);
    });
  }

  function applyLocations(locations) {
    const activeLocations = locations.filter((location) => location.active !== false);
    const featuredLocations = activeLocations.filter((location) => location.featured).slice(0, 4);
    const previewLocations = featuredLocations.length ? featuredLocations : activeLocations.slice(0, 4);

    document.querySelectorAll(".location-preview").forEach((container) => {
      container.innerHTML = previewLocations.map((location) => (
        `<div><strong>${escapeHtml(location.area)}</strong><span>${escapeHtml(location.address)}</span></div>`
      )).join("");
    });

    document.querySelectorAll(".order-grid").forEach((container) => {
      container.innerHTML = activeLocations.map(orderCard).join("");
    });

    document.querySelectorAll(".locations.four").forEach((container) => {
      container.innerHTML = activeLocations.map(locationCard).join("");
    });
  }

  function applyVideos(site, videos) {
    const mount = document.querySelector(".brand-strip");

    const existing = document.querySelector("[data-cms-videos]");
    if (existing) existing.remove();

    const activeVideos = videos.filter((video) => video.active !== false && video.src);
    if (!activeVideos.length) return;

    const heroVisual = document.querySelector(".hero-grid .portrait-video-grid, .hero-grid .hero-card.food-first");
    if (heroVisual) {
      const heroVideoGrid = `<div class="portrait-video-grid hero-video-grid">
        ${activeVideos.map(videoCard).join("")}
      </div>`;

      if (heroVisual.classList.contains("portrait-video-grid")) {
        heroVisual.outerHTML = heroVideoGrid;
      } else {
        heroVisual.insertAdjacentHTML("afterend", heroVideoGrid);
        heroVisual.remove();
      }
    }

    if (!mount) return;

    const section = document.createElement("section");
    section.className = "section video-section in-view";
    section.setAttribute("data-cms-videos", "");
    section.innerHTML = `<video class="video-section-bg" src="${escapeHtml(activeVideos[0].src)}" muted autoplay loop playsinline preload="metadata" aria-hidden="true"></video>
    <div class="shell video-showcase">
      <div class="video-copy">
        <span class="mini-label">${escapeHtml(site.videosSection?.eyebrow || "Sfeer")}</span>
        <h2 class="section-title">${escapeHtml(site.videosSection?.title || "Street food in beweging.")}</h2>
        <p class="lead">${escapeHtml(site.videosSection?.intro || "")}</p>
      </div>
      ${heroImageCard()}
    </div>`;

    mount.insertAdjacentElement("afterend", section);
  }

  function activeMenu(menu) {
    return (menu || [])
      .filter((category) => category.active !== false)
      .map((category) => ({
        ...category,
        items: (category.items || []).filter((item) => item.active !== false)
      }))
      .filter((category) => category.items.length);
  }

  function applyMenu(menu) {
    const shell = document.querySelector(".menu-page .shell");
    if (!shell) return;

    const categories = activeMenu(menu);
    if (!categories.length) return;

    let tabs = shell.querySelector(".menu-tabs");
    if (!tabs) {
      tabs = document.createElement("div");
      tabs.className = "menu-tabs";
      shell.prepend(tabs);
    }

    tabs.innerHTML = categories.map((category) => {
      const id = category.id || slugify(category.title);
      return `<a href="#${escapeHtml(id)}">${escapeHtml(category.title)}</a>`;
    }).join("");

    shell.querySelectorAll(".menu-section").forEach((section) => section.remove());
    tabs.insertAdjacentHTML("afterend", categories.map((category) => {
      const id = category.id || slugify(category.title);
      const orderLabel = category.orderLabel || `Order ${category.title}`;

      return `<section class="menu-section in-view" id="${escapeHtml(id)}">
        <div class="menu-section-head">
          <h2>${escapeHtml(category.title)}</h2>
          <a class="small-order" href="order.html">${escapeHtml(orderLabel)}</a>
        </div>
        <div class="product-grid">${category.items.map(menuItemCard).join("")}</div>
      </section>`;
    }).join(""));
  }

  function applyMenuShowcase(menu) {
    const list = document.querySelector(".compact-menu-list");
    if (!list) return;

    const allItems = activeMenu(menu).flatMap((category) => (
      category.items.map((item) => ({ ...item, category: category.title }))
    ));
    const highlighted = allItems.filter((item) => item.featured).slice(0, 4);
    const items = highlighted.length ? highlighted : allItems.slice(0, 4);
    if (!items.length) return;

    list.innerHTML = items.map((item) => (
      `<article class="compact-menu-item in-view">
        <img src="assets/site/quesadilla-drinks.webp" alt="${escapeHtml(item.category)}">
        <div>
          <h3>${escapeHtml(item.name)}</h3>
          <p>${escapeHtml(item.description)}</p>
        </div>
        <strong>${escapeHtml(formatPrice(item.price))}</strong>
      </article>`
    )).join("");
  }

  function applyFooter(site, locations) {
    const footer = site.footer || {};
    const activeLocations = locations.filter((location) => location.active !== false);

    document.querySelectorAll(".footer-grid").forEach((grid) => {
      const columns = grid.children;
      const brand = columns[0];
      const locationColumn = columns[1];
      const contact = columns[2];

      if (brand) {
        const title = brand.querySelector("h2");
        const intro = brand.querySelector(".lead");
        if (title) title.textContent = footer.title || "";
        if (intro) intro.textContent = footer.intro || "";
      }

      if (locationColumn) {
        locationColumn.innerHTML = `<h3>Locations</h3>${activeLocations.map((location) => (
          `<p>${escapeHtml(location.address).replace(/, /, "<br>")}</p>`
        )).join("")}`;
      }

      if (contact) {
        const email = footer.email ? `<p><a href="mailto:${escapeHtml(footer.email)}">${escapeHtml(footer.email)}</a></p>` : "";
        const links = [
          { label: "All order links", url: "order.html" },
          { label: "Instagram", url: footer.instagramUrl },
          { label: "TikTok", url: footer.tiktokUrl }
        ].filter((link) => link.url);

        contact.innerHTML = `<h3>Contact</h3>${email}<p>${links.map((link) => (
          `<a href="${escapeHtml(link.url)}"${linkAttrs(link.url)}>${escapeHtml(link.label)}</a>`
        )).join("<br>")}</p>`;
      }
    });

    document.querySelectorAll(".copyright").forEach((item) => {
      item.textContent = footer.copyright || "";
    });
  }

  function markDynamicContent() {
    const selector = ".order-card,.location-card,.location-preview,.footer,.hero-tags,.video-section,.portrait-video-card,.product-card,.compact-menu-item";
    document.querySelectorAll(selector).forEach((item) => item.classList.add("in-view"));
  }

  function applyContent(content) {
    const site = content.site || {};
    const locations = Array.isArray(content.locations) ? content.locations : [];
    const videos = Array.isArray(content.videos) ? content.videos : [];
    const menu = Array.isArray(content.menu) ? content.menu : [];
    applySeo(site);
    applyNav(site);
    applyHero(site);
    applyLocations(locations);
    applyVideos(site, videos);
    applyMenu(menu);
    applyMenuShowcase(menu);
    applyFooter(site, locations);
    markDynamicContent();
    document.dispatchEvent(new CustomEvent("cms:updated"));
  }

  async function loadContent() {
    try {
      const response = await fetch("/api/content", { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error("API content niet beschikbaar.");
      return await response.json();
    } catch {
      const response = await fetch(fallbackContentUrl, { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error("Lokale content niet beschikbaar.");
      return await response.json();
    }
  }

  loadContent().then(applyContent).catch(() => {
    markDynamicContent();
  });
})();
