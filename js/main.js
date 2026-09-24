/* The Shore Box Manilva — Home */
(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.add("js");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* Header: hides on scroll down, reappears on scroll up ------------------ */
  var header = document.getElementById("site-header");
  var navToggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  var lastY = window.scrollY;
  var ticking = false;

  function onScroll() {
    var y = window.scrollY;
    var menuOpen = nav.classList.contains("is-open");
    header.classList.toggle("is-compact", y > 40);
    if (!menuOpen) {
      if (y > lastY && y > header.offsetHeight) {
        header.classList.add("is-hidden");
      } else if (y < lastY) {
        header.classList.remove("is-hidden");
      }
    }
    lastY = y;
    ticking = false;
  }
  window.addEventListener("scroll", function () {
    if (!ticking) {
      window.requestAnimationFrame(onScroll);
      ticking = true;
    }
  }, { passive: true });
  onScroll();

  /* Mobile menu ------------------------------------------------------------ */
  function closeMenu() {
    nav.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
  }
  navToggle.addEventListener("click", function () {
    var open = !nav.classList.contains("is-open");
    nav.classList.toggle("is-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
  });
  nav.addEventListener("click", function (e) {
    if (e.target.closest("a")) closeMenu();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeMenu();
  });

  /* Actions without a destination yet --------------------------------------
     TODO: connect "BOOK NOW", "Rent your unit NOW" and the legal links. */
  document.addEventListener("click", function (e) {
    var el = e.target.closest("a[data-todo]");
    if (el) e.preventDefault();
  });

  /* Contact form -----------------------------------------------------------
     TODO: send the form (no backend yet, no confirmation message). */
  var form = document.getElementById("contact-form");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
  });

  /* Services carousel -------------------------------------------------------
     One slide per service. On desktop each slide shows every service, with the
     order rotated so a different one leads each slide; on mobile each slide
     shows one service. New services only need to be added to the HTML list. */
  var carousel = document.querySelector("[data-carousel]");
  if (carousel) {
    var viewport = carousel.querySelector(".carousel__viewport");
    var source = carousel.querySelector(".carousel__source");
    var dotsWrap = carousel.querySelector(".carousel__dots");
    var items = Array.prototype.slice.call(source.children);
    var desktop = window.matchMedia("(min-width: 768px)");
    var AUTOPLAY_MS = 6000;
    var track, slides = [], dots = [], current = 0, timer = null, built = false;

    function build() {
      var perView = desktop.matches ? Math.min(3, items.length) : 1;
      viewport.innerHTML = "";
      dotsWrap.innerHTML = "";
      track = document.createElement("div");
      track.className = "carousel__track";
      slides = [];
      dots = [];

      items.forEach(function (_, i) {
        var slide = document.createElement("ul");
        slide.className = "carousel__slide";
        slide.setAttribute("role", "group");
        slide.setAttribute("aria-roledescription", "slide");
        slide.setAttribute("aria-label", (i + 1) + " of " + items.length);
        for (var k = 0; k < perView; k++) {
          var clone = items[(i + k) % items.length].cloneNode(true);
          // Only the first slide of the first build animates in (staggered)
          if (built || i !== 0) {
            clone.removeAttribute("data-reveal");
          } else {
            clone.style.setProperty("--delay", k * 120 + "ms");
          }
          if (i !== 0) {
            var img = clone.querySelector("img");
            if (img) img.setAttribute("loading", "lazy");
          }
          slide.appendChild(clone);
        }
        track.appendChild(slide);
        slides.push(slide);

        var dot = document.createElement("button");
        dot.type = "button";
        dot.className = "carousel__dot";
        dot.setAttribute("role", "tab");
        dot.setAttribute("aria-label", "Slide " + (i + 1));
        dot.addEventListener("click", function () { goTo(i); restart(); });
        dotsWrap.appendChild(dot);
        dots.push(dot);
      });

      viewport.appendChild(track);
      built = true;
      goTo(Math.min(current, slides.length - 1), true);
    }

    function goTo(i, instant) {
      current = (i + slides.length) % slides.length;
      if (instant) track.style.transition = "none";
      track.style.transform = "translateX(" + (-100 * current) + "%)";
      if (instant) {
        void track.offsetWidth;
        track.style.transition = "";
      }
      slides.forEach(function (s, k) {
        s.setAttribute("aria-hidden", String(k !== current));
        s.inert = k !== current;
      });
      dots.forEach(function (d, k) { d.setAttribute("aria-selected", String(k === current)); });
    }

    function stop() { clearInterval(timer); timer = null; }
    function start() {
      if (reduceMotion.matches || slides.length < 2) return;
      stop();
      timer = setInterval(function () { goTo(current + 1); }, AUTOPLAY_MS);
    }
    function restart() { stop(); start(); }

    // Swipe
    var startX = null;
    viewport.addEventListener("pointerdown", function (e) { startX = e.clientX; });
    viewport.addEventListener("pointerup", function (e) {
      if (startX === null) return;
      var dx = e.clientX - startX;
      if (Math.abs(dx) > 40) { goTo(current + (dx < 0 ? 1 : -1)); restart(); }
      startX = null;
    });

    carousel.addEventListener("mouseenter", stop);
    carousel.addEventListener("mouseleave", start);
    carousel.addEventListener("focusin", stop);
    carousel.addEventListener("focusout", start);

    build();
    start();
    desktop.addEventListener("change", function () {
      build();
      restart();
    });
  }

  /* Reveal on scroll ------------------------------------------------------- */
  var STAGGER = 120;
  function setStagger(selector) {
    document.querySelectorAll(selector).forEach(function (group) {
      Array.prototype.forEach.call(group.querySelectorAll(":scope > [data-reveal]"), function (el, i) {
        el.style.setProperty("--delay", i * STAGGER + "ms");
      });
    });
  }
  setStagger(".features__list, .steps, .size-cards");

  var revealEls = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window && !reduceMotion.matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* FAQ accordion ---------------------------------------------------------- */
  document.querySelectorAll(".faq__q").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var item = btn.closest(".faq__item");
      var open = btn.getAttribute("aria-expanded") !== "true";
      btn.setAttribute("aria-expanded", String(open));
      item.classList.toggle("is-open", open);
    });
  });

  /* Calculator (example data only) -----------------------------------------
     TODO: calculation logic and conversion factors are still to be defined.
     The counters change their own value; "Suggested space" stays as example. */
  document.querySelectorAll(".counter").forEach(function (counter) {
    var out = counter.querySelector("output");
    counter.addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-step]");
      if (!btn) return;
      var value = Math.max(0, parseInt(out.textContent, 10) + parseInt(btn.dataset.step, 10));
      out.textContent = value;
    });
  });
  // TODO: "By home size" view is still to be defined; tabs only switch state.
  var tabs = document.querySelectorAll(".calculator__tabs .tab");
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      tabs.forEach(function (t) {
        t.classList.toggle("is-active", t === tab);
        t.setAttribute("aria-selected", String(t === tab));
      });
    });
  });

  /* Cookie notice + Google Maps ------------------------------------------- */
  var COOKIE_KEY = "tsb-cookie-consent";
  var MAP_SRC = "https://www.google.com/maps?q=Av.+Vel%C3%A1zquez+5,+29692+San+Luis+de+Sabinillas,+M%C3%A1laga&z=15&output=embed";
  var cookieBox = document.getElementById("cookie");
  var mapPlaceholder = document.getElementById("map-placeholder");

  function readConsent() {
    try { return localStorage.getItem(COOKIE_KEY); } catch (e) { return null; }
  }
  function saveConsent(value) {
    try { localStorage.setItem(COOKIE_KEY, value); } catch (e) { /* storage unavailable */ }
  }
  function loadMap() {
    if (!mapPlaceholder || !mapPlaceholder.parentNode) return;
    var iframe = document.createElement("iframe");
    iframe.src = MAP_SRC;
    iframe.title = "Map showing The Shore Box at Av. Velázquez, 5, San Luis de Sabinillas";
    iframe.loading = "lazy";
    iframe.referrerPolicy = "no-referrer-when-downgrade";
    iframe.allowFullscreen = true;
    mapPlaceholder.parentNode.replaceChild(iframe, mapPlaceholder);
  }
  function hideCookieBox() {
    if (cookieBox.hidden) return;
    cookieBox.classList.add("is-leaving");
    setTimeout(function () { cookieBox.hidden = true; }, reduceMotion.matches ? 0 : 500);
  }

  var consent = readConsent();
  if (consent === "accepted") {
    loadMap();
  } else if (consent !== "rejected") {
    cookieBox.hidden = false;
  }

  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-cookie-accept]")) {
      saveConsent("accepted");
      loadMap();
      hideCookieBox();
    } else if (e.target.closest("[data-cookie-reject]")) {
      saveConsent("rejected");
      hideCookieBox();
    }
  });
})();
