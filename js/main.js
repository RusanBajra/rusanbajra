(() => {
  "use strict";

  const root = document.documentElement;
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* =========================================================
     Theme (dark / light) with persistence
     ========================================================= */
  const themeStore = "portfolio-theme";
  const toggleBtn = document.getElementById("theme-toggle");
  const themeMeta = document.querySelector('meta[name="theme-color"]');

  const applyTheme = (theme) => {
    root.setAttribute("data-theme", theme);
    localStorage.setItem(themeStore, theme);
    if (themeMeta) themeMeta.setAttribute("content", theme === "dark" ? "#131110" : "#f5f1ea");
  };

  const storedTheme = localStorage.getItem(themeStore);
  if (storedTheme) applyTheme(storedTheme);

  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next);
      toggleBtn.setAttribute("aria-pressed", String(next === "dark"));
    });
    toggleBtn.setAttribute("aria-pressed", String(root.getAttribute("data-theme") === "dark"));
  }

  /* =========================================================
     Mobile menu
     ========================================================= */
  const menuToggle = document.getElementById("menu-toggle");
  const siteNav = document.getElementById("site-nav");

  if (menuToggle && siteNav) {
    const closeMenu = () => {
      siteNav.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
    };

    menuToggle.addEventListener("click", () => {
      const open = siteNav.classList.toggle("is-open");
      menuToggle.setAttribute("aria-expanded", String(open));
    });

    siteNav.addEventListener("click", (event) => {
      if (event.target.closest("a")) closeMenu();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && siteNav.classList.contains("is-open")) closeMenu();
    });

    document.addEventListener("click", (event) => {
      if (siteNav.classList.contains("is-open") && !event.target.closest(".site-header")) {
        closeMenu();
      }
    });
  }

  /* =========================================================
     Header shadow + scroll progress + back-to-top
     ========================================================= */
  const header = document.getElementById("site-header");
  const scrollFill = document.getElementById("scroll-fill");
  const backToTop = document.getElementById("back-to-top");

  const onScroll = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;

    header.classList.toggle("is-scrolled", y > 12);
    backToTop.classList.toggle("is-visible", y > 600);

    if (scrollFill && max > 0) {
      scrollFill.style.width = `${Math.min(100, (y / max) * 100)}%`;
    }
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* =========================================================
     Scrollspy
     ========================================================= */
  const navLinks = Array.from(document.querySelectorAll(".site-nav a"));
  const spyMap = new Map();
  navLinks.forEach((link) => spyMap.set(link.getAttribute("href").slice(1), link));

  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((l) => l.classList.remove("is-active"));
        const link = spyMap.get(entry.target.id);
        if (link) link.classList.add("is-active");
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );

  document.querySelectorAll("section[id]").forEach((sec) => spy.observe(sec));

  /* =========================================================
     Scroll reveal + skill bars
     ========================================================= */
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.classList.add("is-inview");
        observer.unobserve(el);
      });
    },
    { threshold: 0.14, rootMargin: "0px 0px -40px 0px" }
  );

  document.querySelectorAll("[data-reveal]").forEach((el) => {
    if (prefersReduced) {
      el.classList.add("is-inview");
      return;
    }
    const delay = Number(el.dataset.delay || 0) * 0.08;
    if (delay) el.style.transitionDelay = `${delay}s`;
    revealObserver.observe(el);
  });

  /* =========================================================
     Toast helper
     ========================================================= */
  const toast = document.getElementById("toast");
  const toastMsg = document.getElementById("toast-msg");
  let toastTimer = null;

  const showToast = (message) => {
    toastMsg.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 3400);
  };

  /* =========================================================
     Confetti (tiny DOM confetti burst)
     ========================================================= */
  const CONFETTI_COLORS = ["#d9480f", "#3355ff", "#127a4b", "#f2ae2e", "#221f1a"];

  const burstConfetti = () => {
    if (prefersReduced) return;
    const origin = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const host = document.createElement("div");
    host.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:180;overflow:hidden;";
    document.body.appendChild(host);

    for (let i = 0; i < 80; i++) {
      const piece = document.createElement("span");
      const size = 6 + Math.random() * 8;
      const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
      const angle = Math.random() * Math.PI * 2;
      const distance = 160 + Math.random() * 380;
      const drift = (Math.random() - 0.5) * 120;
      piece.style.cssText = `
        position:absolute;left:${origin.x}px;top:${origin.y}px;width:${size}px;height:${size * 0.6}px;
        background:${color};border-radius:2px;opacity:1;
        transform:rotate(${Math.random() * 360}deg);
      `;
      host.appendChild(piece);

      piece.animate(
        [
          { transform: "translate(0,0) rotate(0deg)", opacity: 1 },
          {
            transform: `translate(${Math.cos(angle) * distance + drift}px, ${Math.sin(angle) * distance + 500}px) rotate(${720 + Math.random() * 540}deg)`,
            opacity: 0,
          },
        ],
        { duration: 1500 + Math.random() * 900, easing: "cubic-bezier(.15,.6,.35,1)", fill: "forwards" }
      );
    }
    setTimeout(() => host.remove(), 2600);
  };

 /* =========================================================
     Contact form (Fixed with Formspree AJAX submission)
     ========================================================= */
  const contactForm = document.getElementById("contact-form");
  const formStatus = document.getElementById("form-status");

  if (contactForm) {
    contactForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      formStatus.className = "form-status";
      formStatus.textContent = "";

      const name = contactForm.name.value.trim();
      const email = contactForm.email.value.trim();
      const message = contactForm.message.value.trim();

      if (!name) return flagField(contactForm.name, "Please tell me your name.");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return flagField(contactForm.email, "That email doesn’t look right.");
      }
      if (message.length < 10) return flagField(contactForm.message, "Give me a sentence or two — at least 10 characters.");

      const submitBtn = contactForm.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;
      formStatus.textContent = "Sending message...";

      try {
        const response = await fetch(contactForm.action, {
          method: contactForm.method,
          body: new FormData(contactForm),
          headers: {
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          formStatus.classList.add("is-ok");
          formStatus.textContent = "Message sent! I’ll get back to you within a day or two. ✳";
          contactForm.reset();
          burstConfetti();
          showToast("Thanks! Message sent ✓");
        } else {
          const data = await response.json();
          const errorMessage = data?.errors?.[0]?.message || "Failed to send message. Please try again.";
          flagField(contactForm.email, errorMessage);
        }
      } catch (err) {
        formStatus.classList.add("is-error");
        formStatus.textContent = "Network error. Please check your connection and try again.";
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }

  /* =========================================================
     Command palette (Ctrl+K  /  “/”)
     ========================================================= */
  const palette = document.getElementById("palette");
  const paletteInput = document.getElementById("palette-input");
  const paletteResults = document.getElementById("palette-results");
  const paletteHint = document.getElementById("palette-hint");
  const paletteJumps = document.getElementById("palette-jumps");
  const searchTrigger = document.getElementById("search-trigger");

  const sections = [
    { title: "Profile", tag: "Section", href: "#profile" },
    { title: "Skills", tag: "Section", href: "#skills" },
    { title: "Experience", tag: "Section", href: "#experience" },
    { title: "Development", tag: "Section", href: "#development" },
    { title: "Education", tag: "Section", href: "#education" },
    { title: "Contact", tag: "Section", href: "#contact" },
  ];

  const searchAll = sections;

  const closePalette = () => {
    palette.hidden = true;
    palette.classList.remove("is-open");
    searchTrigger.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    if (document.activeElement === paletteInput) paletteInput.blur();
  };

  const openPalette = () => {
    palette.hidden = false;
    requestAnimationFrame(() => {
      palette.classList.add("is-open");
      paletteInput.focus();
      searchTrigger.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
      renderResults("");
    });
  };

  const renderResults = (query) => {
    paletteResults.innerHTML = "";
    const q = query.trim().toLowerCase();

    if (!q) {
      paletteJumps.hidden = false;
      paletteHint.textContent = "Start typing to search the site & sections. Enter opens, Esc closes.";
      return;
    }

    paletteJumps.hidden = true;
    const matches = searchAll
      .filter((item) => `${item.title} ${item.tag}`.toLowerCase().includes(q))
      .slice(0, 9);

    if (matches.length === 0) {
      paletteHint.textContent = `No matches for “${query}”. Try “email” or “hosting”.`;
      return;
    }

    paletteHint.textContent = `${matches.length} result${matches.length === 1 ? "" : "s"} — ↑ ↓ to move, Enter to open.`;
    matches.forEach((item) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = item.href;

      const span = document.createElement("span");
      span.className = "pm-title";
      span.textContent = item.title;

      const tag = document.createElement("span");
      tag.className = "pm-tag";
      tag.textContent = item.tag;

      a.append(span, tag);
      li.appendChild(a);
      paletteResults.appendChild(li);
    });
  };

  if (searchTrigger && paletteInput) {
    searchTrigger.addEventListener("click", openPalette);

    palette.addEventListener("click", (event) => {
      if (event.target === palette) closePalette();
    });

    paletteInput.addEventListener("input", () => renderResults(paletteInput.value));

    paletteInput.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closePalette();
        return;
      }

      const items = Array.from(paletteResults.querySelectorAll("a"));
      if (items.length === 0) return;

      const activeIndex = items.findIndex((el) => el.classList.contains("is-active"));
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        items.forEach((el) => el.classList.remove("is-active"));
        const next =
          event.key === "ArrowDown"
            ? (activeIndex + 1) % items.length
            : (activeIndex - 1 + items.length) % items.length;
        items[next].classList.add("is-active");
        items[next].scrollIntoView({ block: "nearest" });
      }

      if (event.key === "Enter") {
        event.preventDefault();
        const target = items[activeIndex >= 0 ? activeIndex : 0];
        window.location.hash = target.getAttribute("href");
        closePalette();
      }
    });

    document.addEventListener("keydown", (event) => {
      const editing = ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName);

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        palette.hidden ? openPalette() : closePalette();
        return;
      }

      if (palette.hidden && !editing && event.key === "/" && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault();
        openPalette();
      }
    });
  }

  /* =========================================================
     Animated stat counters
     ========================================================= */
  const countUp = (el) => {
    const target = Number(el.dataset.count || 0);

    if (prefersReduced) {
      el.textContent = target.toLocaleString("en-US");
      return;
    }

    const duration = 1400;
    const start = performance.now();

    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(target * eased).toLocaleString("en-US");
      if (t < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  };

  const counterObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        countUp(entry.target);
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.6 }
  );

  document.querySelectorAll("[data-count]").forEach((el) => counterObserver.observe(el));

  /* =========================================================
     Copy email button
     ========================================================= */
  const copyBtn = document.getElementById("copy-email");

  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
      const email = "bajrarusan@gmail.com";
      try {
        await navigator.clipboard.writeText(email);
        copyBtn.textContent = "Copied ✓";
        copyBtn.classList.add("is-copied");
        showToast("Email copied to clipboard");
      } catch {
        showToast("Couldn’t copy — grab it by hand!");
      }
      setTimeout(() => {
        copyBtn.textContent = "Copy";
        copyBtn.classList.remove("is-copied");
      }, 2200);
    });
  }

  /* =========================================================
     Live local time (Kathmandu)
     ========================================================= */
  const localTime = document.getElementById("local-time");

  if (localTime) {
    const fmt = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "Asia/Kathmandu",
    });
    const tick = () => {
      localTime.textContent = fmt.format(new Date());
    };
    tick();
    setInterval(tick, 1000);
  }
})();