/* Load editable copy from content/site.json; HTML remains the offline fallback. */
(function () {
  const year = document.getElementById("year");
  if (year) {
    year.textContent = new Intl.DateTimeFormat("en-US", { year: "numeric" }).format(new Date());
  }

  function getPath(obj, path) {
    return path.split(".").reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function mailtoHref(email, subject) {
    const q = subject ? `?subject=${encodeURIComponent(subject)}` : "";
    return `mailto:${email}${q}`;
  }

  function applyMailtos(data) {
    const email = data.meta && data.meta.email;
    if (!email) return;
    const subject = (data.meta && data.meta.emailSubject) || "Appointment inquiry";
    document.querySelectorAll("[data-mailto]").forEach((el) => {
      const isPlain = el.textContent && el.textContent.trim() === el.getAttribute("href")?.replace(/^mailto:/, "").split("?")[0];
      if (el.tagName === "A") {
        const wantsSubject = /subject=/i.test(el.getAttribute("href") || "") || el.classList.contains("btn");
        el.setAttribute("href", wantsSubject ? mailtoHref(email, subject) : `mailto:${email}`);
        if (isPlain || el.textContent.trim() === "marcenesmarcus@gmail.com" || /^[\w.+-]+@/.test(el.textContent.trim())) {
          el.textContent = email;
        }
      }
    });
  }

  function applyInstagram(data) {
    const url = data.meta && data.meta.instagramUrl;
    const handle = data.meta && data.meta.instagramHandle;
    document.querySelectorAll("[data-instagram]").forEach((el) => {
      if (url) el.setAttribute("href", url);
      if (handle) el.textContent = `Instagram ${handle}`;
    });
  }

  function applyText(data) {
    document.querySelectorAll("[data-content]").forEach((el) => {
      const value = getPath(data, el.getAttribute("data-content"));
      if (value == null || typeof value === "object") return;
      if (el.tagName === "BLOCKQUOTE") {
        const text = String(value).replace(/^["“]|["”]$/g, "");
        el.textContent = `“${text}”`;
        return;
      }
      el.textContent = String(value);
    });

    document.querySelectorAll("[data-content-alt]").forEach((el) => {
      const value = getPath(data, el.getAttribute("data-content-alt"));
      if (value != null) el.setAttribute("alt", String(value));
    });

    document.querySelectorAll("[data-content-src]").forEach((el) => {
      const value = getPath(data, el.getAttribute("data-content-src"));
      if (value != null) el.setAttribute("src", String(value));
    });

    document.querySelectorAll("[data-content-title]").forEach((el) => {
      const value = getPath(data, el.getAttribute("data-content-title"));
      if (value != null) el.setAttribute("title", String(value));
    });

    if (data.meta) applySeo(data);
  }

  function setMeta(selector, attr, value) {
    if (value == null || value === "") return;
    const el = document.querySelector(selector);
    if (el) el.setAttribute(attr, String(value));
  }

  function absoluteUrl(siteUrl, path) {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;
    const base = String(siteUrl || "").replace(/\/$/, "");
    const rel = String(path).startsWith("/") ? path : `/${path}`;
    return base ? `${base}${rel}` : rel;
  }

  function applySeo(data) {
    const meta = data.meta || {};
    const siteUrl = (meta.siteUrl || "https://conceivingvictory.com").replace(/\/$/, "");
    const pageUrl = `${siteUrl}/`;
    const title = meta.title || document.title;
    const description = meta.description || "";
    const ogTitle = meta.ogTitle || title;
    const ogDescription = meta.ogDescription || description;
    const ogImage = absoluteUrl(siteUrl, meta.ogImage || "/assets/og.jpg");

    if (title) document.title = title;
    setMeta('meta[name="description"]', "content", description);
    setMeta('meta[name="keywords"]', "content", meta.keywords);
    setMeta('link[rel="canonical"]', "href", pageUrl);
    setMeta('link[rel="alternate"][hreflang="en-us"]', "href", pageUrl);
    setMeta('link[rel="alternate"][hreflang="x-default"]', "href", pageUrl);

    setMeta('meta[property="og:url"]', "content", pageUrl);
    setMeta('meta[property="og:title"]', "content", ogTitle);
    setMeta('meta[property="og:description"]', "content", ogDescription);
    setMeta('meta[property="og:image"]', "content", ogImage);
    setMeta('meta[property="og:site_name"]', "content", "Conceiving Victory");

    setMeta('meta[name="twitter:title"]', "content", ogTitle);
    setMeta('meta[name="twitter:description"]', "content", ogDescription);
    setMeta('meta[name="twitter:image"]', "content", ogImage);

    const ld = document.getElementById("structured-data");
    if (!ld) return;

    const sessions = (data.fees && data.fees.sessions) || [];
    const offers = sessions.map((s) => ({
      "@type": "Offer",
      name: s.name,
      description: s.duration ? `${s.duration} session` : undefined,
      price: s.price != null ? String(s.price) : undefined,
      priceCurrency: "USD",
    }));

    const graph = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebSite",
          "@id": `${siteUrl}/#website`,
          url: pageUrl,
          name: "Conceiving Victory",
          description,
          inLanguage: "en-US",
          publisher: { "@id": `${siteUrl}/#practice` },
        },
        {
          "@type": "WebPage",
          "@id": `${siteUrl}/#webpage`,
          url: pageUrl,
          name: title,
          isPartOf: { "@id": `${siteUrl}/#website` },
          about: { "@id": `${siteUrl}/#practice` },
          description,
          inLanguage: "en-US",
        },
        {
          "@type": ["ProfessionalService", "MedicalBusiness", "LocalBusiness"],
          "@id": `${siteUrl}/#practice`,
          name: "Conceiving Victory, Inc.",
          alternateName: "Conceiving Victory",
          description,
          url: pageUrl,
          email: meta.email,
          image: ogImage,
          logo: absoluteUrl(siteUrl, "/assets/logo-sm.png"),
          areaServed: { "@type": "State", "name": meta.areaServed || "California" },
          availableLanguage: ["English"],
          currenciesAccepted: "USD",
          priceRange: "$$",
          foundingDate: meta.founded || "2004",
          sameAs: meta.instagramUrl ? [meta.instagramUrl] : undefined,
          founder: { "@id": `${siteUrl}/#marcene` },
          employee: { "@id": `${siteUrl}/#marcene` },
          contactPoint: {
            "@type": "ContactPoint",
            contactType: "appointments",
            email: meta.email,
            availableLanguage: ["English"],
            areaServed: "US-CA",
          },
          openingHoursSpecification: {
            "@type": "OpeningHoursSpecification",
            description: "By appointment",
          },
          hasOfferCatalog: offers.length
            ? {
                "@type": "OfferCatalog",
                name: "Session fees",
                itemListElement: offers,
              }
            : undefined,
        },
        {
          "@type": "Person",
          "@id": `${siteUrl}/#marcene`,
          name: "Marcene Marcus",
          honorificSuffix: "LCSW",
          jobTitle: "Licensed Clinical Social Worker",
          worksFor: { "@id": `${siteUrl}/#practice` },
          image: absoluteUrl(siteUrl, "/assets/therapist-marcene.jpg"),
          url: `${siteUrl}/#marcene`,
        },
      ],
    };

    ld.textContent = JSON.stringify(graph);
  }

  function renderRailNav(items) {
    const root = document.querySelector('[data-mount="rail.nav"]');
    if (!root || !Array.isArray(items)) return;
    root.innerHTML = items
      .map(
        (item) =>
          `<a href="${escapeHtml(item.href)}"><span class="idx">${escapeHtml(item.index)}</span><span>${escapeHtml(item.label)}</span></a>`
      )
      .join("");
  }

  function renderRequestDetails(details, email) {
    const root = document.querySelector('[data-mount="request.details"]');
    if (!root || !Array.isArray(details)) return;
    root.innerHTML = details
      .map((item) => {
        const value =
          item.value === "email"
            ? `<a data-mailto href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>`
            : escapeHtml(item.value);
        return `<div><dt>${escapeHtml(item.label)}</dt><dd>${value}</dd></div>`;
      })
      .join("");
  }

  function asStringList(items, preferredKeys) {
    if (!Array.isArray(items)) return [];
    return items
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          for (const key of preferredKeys || []) {
            if (item[key]) return String(item[key]);
          }
          const first = Object.values(item)[0];
          return first == null ? "" : String(first);
        }
        return "";
      })
      .filter(Boolean);
  }

  function renderParagraphs(paragraphs, highlightLast) {
    const root = document.querySelector('[data-mount="marcene.paragraphs"]');
    const list = asStringList(paragraphs, ["paragraph", "text"]);
    if (!root || !list.length) return;
    root.innerHTML = list
      .map((text, i) => {
        const last = highlightLast && i === list.length - 1;
        return last ? `<p><strong>${escapeHtml(text)}</strong></p>` : `<p>${escapeHtml(text)}</p>`;
      })
      .join("");
  }

  function renderFacts(facts) {
    const root = document.querySelector('[data-mount="marcene.facts"]');
    if (!root || !Array.isArray(facts)) return;
    root.innerHTML = facts
      .map((f) => `<div><dt>${escapeHtml(f.label)}</dt><dd>${escapeHtml(f.value)}</dd></div>`)
      .join("");
  }

  function renderWorkItems(items) {
    const root = document.querySelector('[data-mount="work.items"]');
    if (!root || !Array.isArray(items)) return;
    root.innerHTML = items
      .map(
        (item) =>
          `<li><strong>${escapeHtml(item.label)}</strong><span>${escapeHtml(item.text)}</span></li>`
      )
      .join("");
  }

  function renderTopics(topics) {
    const root = document.querySelector('[data-mount="work.topics"]');
    const list = asStringList(topics, ["topic", "text", "label"]);
    if (!root || !list.length) return;
    root.innerHTML = list.map((t) => `<li>${escapeHtml(t)}</li>`).join("");
  }

  function renderFees(sessions) {
    const root = document.querySelector('[data-mount="fees.sessions"]');
    if (!root || !Array.isArray(sessions)) return;
    root.innerHTML = sessions
      .map((s) => {
        const price = typeof s.price === "number" ? `$${s.price}` : escapeHtml(s.price);
        return `<tr>
          <th scope="row" class="name">${escapeHtml(s.name)}</th>
          <td>${escapeHtml(s.duration)}</td>
          <td>${price}</td>
        </tr>`;
      })
      .join("");
  }

  function renderReviews(reviews) {
    const root = document.querySelector('[data-mount="words.reviews"]');
    if (!root || !Array.isArray(reviews) || !reviews.length) return;
    const [featured, ...rest] = reviews;
    const featureHtml = `<figure class="words-feature">
      <blockquote>“${escapeHtml(featured.quote)}”</blockquote>
      <figcaption><span class="who">${escapeHtml(featured.name)}</span> · ${escapeHtml(featured.role)}</figcaption>
    </figure>`;
    const moreHtml = rest.length
      ? `<div class="words-more">${rest
          .map(
            (r) => `<figure>
          <blockquote>“${escapeHtml(r.quote)}”</blockquote>
          <figcaption><span class="who">${escapeHtml(r.name)}</span> · ${escapeHtml(r.role)}</figcaption>
        </figure>`
          )
          .join("")}</div>`
      : "";
    root.innerHTML = featureHtml + moreHtml;
  }

  function applyContent(data) {
    applyText(data);
    renderRailNav(data.rail && data.rail.nav);
    renderRequestDetails(data.request && data.request.details, data.meta && data.meta.email);
    renderParagraphs(data.marcene && data.marcene.paragraphs, data.marcene && data.marcene.highlightLast);
    renderFacts(data.marcene && data.marcene.facts);
    renderWorkItems(data.work && data.work.items);
    renderTopics(data.work && data.work.topics);
    renderFees(data.fees && data.fees.sessions);
    renderReviews(data.words && data.words.reviews);
    applyMailtos(data);
    applyInstagram(data);
    setupRailObserver();
  }

  function setupRailObserver() {
    const links = Array.from(document.querySelectorAll(".rail-nav a[href^='#']"));
    const sections = links
      .map((link) => document.querySelector(link.getAttribute("href")))
      .filter(Boolean);

    if (!links.length || !sections.length || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = "#" + entry.target.id;
          links.forEach((link) => {
            if (link.getAttribute("href") === id) link.setAttribute("aria-current", "true");
            else link.removeAttribute("aria-current");
          });
        });
      },
      { rootMargin: "-35% 0px -55% 0px", threshold: 0 }
    );

    sections.forEach((section) => observer.observe(section));
  }

  fetch("content/site.json", { cache: "no-cache" })
    .then((res) => {
      if (!res.ok) throw new Error("content unavailable");
      return res.json();
    })
    .then(applyContent)
    .catch(() => {
      setupRailObserver();
    });
})();
