/**
 * Margaritas Grill — site interactions
 *
 * Progressive enhancement only: the page is fully usable without this file.
 * Every feature guards for the presence of its elements so the script can be
 * shared safely between the homepage and the careers page.
 */
(function () {
  "use strict";

  var reduceMotionQuery = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  );

  function prefersReducedMotion() {
    return reduceMotionQuery.matches;
  }

  var root = document.documentElement;
  root.classList.add("js");

  /* ----------------------------------------------------------------------
   * Cinematic intro
   * -------------------------------------------------------------------- */
  function initIntro() {
    var intro = document.getElementById("intro");
    if (!intro) return;

    var dismissed = false;

    function dismiss() {
      if (dismissed) return;
      dismissed = true;
      intro.classList.add("is-dismissed");

      // Re-align to a hash target once the overlay is gone.
      if (window.location.hash) {
        var target = safeGetElement(window.location.hash);
        if (target) {
          window.setTimeout(function () {
            target.scrollIntoView({
              behavior: prefersReducedMotion() ? "auto" : "smooth",
            });
          }, 60);
        }
      }
    }

    if (prefersReducedMotion()) {
      dismiss();
      return;
    }

    var hasHash = !!window.location.hash;
    var seen = false;
    try {
      seen = window.sessionStorage.getItem("mg-intro-seen") === "1";
    } catch (error) {
      seen = false;
    }

    // Returning visitors or deep links get a short intro; first-timers get the
    // full cinematic hold.
    var hold = hasHash ? 250 : seen ? 900 : 2400;

    try {
      window.sessionStorage.setItem("mg-intro-seen", "1");
    } catch (error) {
      /* storage unavailable — non-fatal */
    }

    window.setTimeout(dismiss, hold);

    // Safety net: never trap the visitor behind the overlay.
    window.setTimeout(dismiss, 4200);
  }

  function safeGetElement(hash) {
    if (!hash || hash.length < 2) return null;
    try {
      return document.getElementById(decodeURIComponent(hash.slice(1)));
    } catch (error) {
      return null;
    }
  }

  /* ----------------------------------------------------------------------
   * Theme switch (homepage only)
   * -------------------------------------------------------------------- */
  function initTheme() {
    var isHome = document.body.classList.contains("home-page");
    if (!isHome) return;

    var toggle = document.querySelector("[data-theme-toggle]");
    var storageKey = "mg-theme";

    function apply(theme) {
      var warm = theme === "warm";
      document.body.classList.toggle("theme-warm", warm);
      if (toggle) {
        toggle.setAttribute("aria-pressed", String(warm));
        toggle.setAttribute(
          "aria-label",
          warm ? "Switch to midnight lighting" : "Switch to warm lighting",
        );
      }
      var meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", warm ? "#17110c" : "#0a0a0a");
    }

    var stored = null;
    try {
      stored = window.localStorage.getItem(storageKey);
    } catch (error) {
      stored = null;
    }

    apply(stored === "warm" ? "warm" : "night");

    if (!toggle) return;

    toggle.addEventListener("click", function () {
      var warm = !document.body.classList.contains("theme-warm");
      apply(warm ? "warm" : "night");
      try {
        window.localStorage.setItem(storageKey, warm ? "warm" : "night");
      } catch (error) {
        /* storage unavailable — non-fatal */
      }
    });
  }

  /* ----------------------------------------------------------------------
   * Header state + active section
   * -------------------------------------------------------------------- */
  function initHeader() {
    var header = document.querySelector("[data-header]");
    if (!header) return;

    function onScroll() {
      header.classList.toggle("header--scrolled", window.scrollY > 40);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  function initActiveSection() {
    if (!document.body.classList.contains("home-page")) return;
    if (!("IntersectionObserver" in window)) return;

    var links = Array.prototype.slice.call(
      document.querySelectorAll('.nav a[href^="#"]'),
    );
    if (!links.length) return;

    var map = {};
    var sections = [];
    links.forEach(function (link) {
      var id = link.getAttribute("href").slice(1);
      var section = document.getElementById(id);
      if (section) {
        map[id] = link;
        sections.push(section);
      }
    });

    function setActive(id) {
      links.forEach(function (link) {
        var isActive = link.getAttribute("href") === "#" + id;
        if (isActive) {
          link.setAttribute("aria-current", "true");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    }

    var visible = {};
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          visible[entry.target.id] = entry.isIntersecting
            ? entry.intersectionRatio
            : 0;
        });

        var bestId = null;
        var bestRatio = 0;
        Object.keys(visible).forEach(function (id) {
          if (visible[id] > bestRatio) {
            bestRatio = visible[id];
            bestId = id;
          }
        });

        if (bestId) setActive(bestId);
      },
      { threshold: [0.25, 0.5, 0.75], rootMargin: "-45% 0px -45% 0px" },
    );

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

  /* ----------------------------------------------------------------------
   * Mobile navigation overlay (homepage only)
   * -------------------------------------------------------------------- */
  function initMobileNav() {
    var header = document.querySelector("[data-header]");
    var toggle = document.querySelector("[data-nav-toggle]");
    var nav = document.getElementById("primary-nav");
    if (!header || !toggle || !nav) return;

    function setOpen(open) {
      header.classList.toggle("nav-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
      document.body.classList.toggle("no-scroll", open);
    }

    toggle.addEventListener("click", function () {
      setOpen(!header.classList.contains("nav-open"));
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setOpen(false);
      });
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && header.classList.contains("nav-open")) {
        setOpen(false);
        toggle.focus();
      }
    });

    document.addEventListener("click", function (event) {
      if (!header.classList.contains("nav-open")) return;
      if (nav.contains(event.target) || toggle.contains(event.target)) return;
      setOpen(false);
    });

    // Reset when returning to desktop width.
    window.matchMedia("(min-width: 821px)").addEventListener("change", function (event) {
      if (event.matches) setOpen(false);
    });
  }

  /* ----------------------------------------------------------------------
   * Scroll reveal (staggered children)
   * -------------------------------------------------------------------- */
  function initReveal() {
    var items = Array.prototype.slice.call(
      document.querySelectorAll("[data-reveal]"),
    );
    var hero = document.querySelector(".hero");

    function revealHero() {
      if (hero) hero.classList.add("is-revealed");
    }

    if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
      items.forEach(function (item) {
        item.classList.add("is-visible");
      });
      revealHero();
      return;
    }

    // Hero content animates in on load, just after the intro.
    window.setTimeout(revealHero, 120);

    var roots = Array.prototype.slice.call(
      document.querySelectorAll("[data-reveal-root]"),
    );

    function revealGroup(container) {
      var groupItems = Array.prototype.slice.call(
        container.querySelectorAll("[data-reveal]"),
      );
      groupItems.forEach(function (item, index) {
        window.setTimeout(function () {
          item.classList.add("is-visible");
        }, index * 90);
      });
    }

    var observer = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          revealGroup(entry.target);
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -8% 0px" },
    );

    if (roots.length) {
      roots.forEach(function (rootEl) {
        observer.observe(rootEl);
      });
    }

    // Reveal any stray items that are not inside a reveal root.
    items.forEach(function (item) {
      if (!item.closest("[data-reveal-root]")) {
        item.classList.add("is-visible");
      }
    });
  }

  /* ----------------------------------------------------------------------
   * About video controls
   * -------------------------------------------------------------------- */
  function initVideo() {
    var frame = document.querySelector("[data-video]");
    if (!frame) return;

    var video = frame.querySelector("[data-video-el]");
    var playPause = frame.querySelector("[data-video-playpause]");
    var replay = frame.querySelector("[data-video-replay]");
    if (!video) return;

    function syncPlayState() {
      var playing = !video.paused && !video.ended;
      if (playPause) {
        playPause.setAttribute("aria-pressed", String(playing));
        playPause.setAttribute("aria-label", playing ? "Pause video" : "Play video");
      }
    }

    // Never autoplay under reduced motion.
    if (prefersReducedMotion()) {
      video.removeAttribute("autoplay");
      video.pause();
    }

    if (playPause) {
      playPause.addEventListener("click", function () {
        if (video.paused || video.ended) {
          var attempt = video.play();
          if (attempt && typeof attempt.catch === "function") {
            attempt.catch(function () {});
          }
        } else {
          video.pause();
        }
      });
    }

    if (replay) {
      replay.addEventListener("click", function () {
        video.currentTime = 0;
        var attempt = video.play();
        if (attempt && typeof attempt.catch === "function") {
          attempt.catch(function () {});
        }
      });
    }

    video.addEventListener("play", syncPlayState);
    video.addEventListener("pause", syncPlayState);
    video.addEventListener("ended", syncPlayState);
    syncPlayState();

    // Pause when far outside the viewport; resume muted playback when back in
    // view (unless the visitor paused it or prefers reduced motion).
    if ("IntersectionObserver" in window) {
      var pausedByUser = false;

      if (playPause) {
        playPause.addEventListener("click", function () {
          pausedByUser = video.paused;
        });
      }

      var viewObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              if (!pausedByUser && !prefersReducedMotion() && video.paused) {
                var attempt = video.play();
                if (attempt && typeof attempt.catch === "function") {
                  attempt.catch(function () {});
                }
              }
            } else if (!video.paused) {
              video.pause();
            }
          });
        },
        { threshold: 0.25 },
      );

      viewObserver.observe(frame);
    }
  }

  /* ----------------------------------------------------------------------
   * Gallery lightbox (native dialog)
   * -------------------------------------------------------------------- */
  function initLightbox() {
    var gallery = document.querySelector("[data-gallery]");
    var dialog = document.querySelector("[data-lightbox]");
    if (!gallery || !dialog || typeof dialog.showModal !== "function") return;

    var triggers = Array.prototype.slice.call(
      gallery.querySelectorAll("[data-gallery-item]"),
    );
    if (!triggers.length) return;

    var image = dialog.querySelector("[data-lightbox-image]");
    var current = dialog.querySelector("[data-lightbox-current]");
    var total = dialog.querySelector("[data-lightbox-total]");
    var closeBtn = dialog.querySelector("[data-lightbox-close]");
    var prevBtn = dialog.querySelector("[data-lightbox-prev]");
    var nextBtn = dialog.querySelector("[data-lightbox-next]");

    var sources = triggers.map(function (trigger) {
      var img = trigger.querySelector("img");
      return {
        src: img ? img.getAttribute("src") : "",
        alt: img ? img.getAttribute("alt") : "",
      };
    });

    var index = 0;
    var lastTrigger = null;

    if (total) total.textContent = String(sources.length);

    function render() {
      var item = sources[index];
      if (image) {
        image.setAttribute("src", item.src);
        image.setAttribute("alt", item.alt);
      }
      if (current) current.textContent = String(index + 1);
    }

    function open(startIndex, trigger) {
      index = startIndex;
      lastTrigger = trigger || null;
      render();
      dialog.showModal();
      document.body.classList.add("no-scroll");
      if (nextBtn) nextBtn.focus();
    }

    function step(delta) {
      index = (index + delta + sources.length) % sources.length;
      render();
    }

    triggers.forEach(function (trigger, i) {
      trigger.addEventListener("click", function () {
        open(i, trigger);
      });
    });

    if (prevBtn) prevBtn.addEventListener("click", function () { step(-1); });
    if (nextBtn) nextBtn.addEventListener("click", function () { step(1); });
    if (closeBtn) closeBtn.addEventListener("click", function () { dialog.close(); });

    dialog.addEventListener("keydown", function (event) {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        step(-1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        step(1);
      }
    });

    // Backdrop click closes (click outside the inner content).
    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) dialog.close();
    });

    dialog.addEventListener("close", function () {
      document.body.classList.remove("no-scroll");
      if (lastTrigger && typeof lastTrigger.focus === "function") {
        lastTrigger.focus();
      }
    });
  }

  /* ----------------------------------------------------------------------
   * Corner menu
   * -------------------------------------------------------------------- */
  function initCornerMenu() {
    var cornerMenu = document.querySelector(".corner-menu");
    var menuButton = cornerMenu && cornerMenu.querySelector(".corner-menu__button");
    var menuPanel = cornerMenu && cornerMenu.querySelector(".corner-menu__panel");
    if (!cornerMenu || !menuButton || !menuPanel) return;

    var links = Array.prototype.slice.call(menuPanel.querySelectorAll("a"));

    function setOpen(open) {
      menuButton.setAttribute("aria-expanded", String(open));
      menuButton.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      menuPanel.classList.toggle("is-open", open);
    }

    menuButton.addEventListener("click", function () {
      setOpen(menuButton.getAttribute("aria-expanded") !== "true");
    });

    links.forEach(function (link) {
      link.addEventListener("click", function () {
        setOpen(false);
      });
    });

    document.addEventListener("click", function (event) {
      if (!cornerMenu.contains(event.target)) setOpen(false);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") return;
      var wasOpen = menuButton.getAttribute("aria-expanded") === "true";
      setOpen(false);
      if (wasOpen) menuButton.focus();
    });
  }

  /* ----------------------------------------------------------------------
   * Reviews carousel
   * -------------------------------------------------------------------- */
  function initReviews() {
    document
      .querySelectorAll(".restaurant-reviews")
      .forEach(function (section) {
        var slides = Array.prototype.slice.call(
          section.querySelectorAll(".review-slide"),
        );
        var previousButton = section.querySelector("[data-review-previous]");
        var nextButton = section.querySelector("[data-review-next]");
        var currentNumber = section.querySelector("[data-review-current]");
        var reviewWindow = section.querySelector(".reviews-window");
        if (!slides.length || !previousButton || !nextButton) return;

        var index = 0;
        var startX = null;

        function show(next) {
          index = (next + slides.length) % slides.length;
          slides.forEach(function (slide, i) {
            var active = i === index;
            slide.classList.toggle("is-active", active);
            slide.setAttribute("aria-hidden", String(!active));
          });
          if (currentNumber) currentNumber.textContent = String(index + 1);
        }

        previousButton.addEventListener("click", function () {
          show(index - 1);
        });
        nextButton.addEventListener("click", function () {
          show(index + 1);
        });

        if (reviewWindow) {
          reviewWindow.addEventListener("keydown", function (event) {
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              show(index - 1);
            } else if (event.key === "ArrowRight") {
              event.preventDefault();
              show(index + 1);
            }
          });

          reviewWindow.addEventListener(
            "touchstart",
            function (event) {
              startX = event.changedTouches[0].clientX;
            },
            { passive: true },
          );

          reviewWindow.addEventListener(
            "touchend",
            function (event) {
              if (startX === null) return;
              var deltaX = event.changedTouches[0].clientX - startX;
              if (Math.abs(deltaX) > 45) {
                show(deltaX < 0 ? index + 1 : index - 1);
              }
              startX = null;
            },
            { passive: true },
          );
        }

        show(0);
      });
  }

  /* ----------------------------------------------------------------------
   * Footer year
   * -------------------------------------------------------------------- */
  function initYear() {
    var yearEls = document.querySelectorAll("[data-year]");
    if (!yearEls.length) return;
    var year = String(new Date().getFullYear());
    yearEls.forEach(function (el) {
      el.textContent = year;
    });
  }

  function init() {
    initIntro();
    initTheme();
    initHeader();
    initActiveSection();
    initMobileNav();
    initReveal();
    initVideo();
    initLightbox();
    initCornerMenu();
    initReviews();
    initYear();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
