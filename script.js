/**
 * Margaritas Grill site interactions
 * - Hides the header while scrolling down and restores it when scrolling up
 *   or shortly after scrolling stops
 * - Replays section entrance animations as sections re-enter the viewport
 * - Controls the top-left business menu
 * - Controls the manual review carousel
 */
(function () {
  "use strict";

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  function initHeaderScroll() {
    const header = document.querySelector(".header");
    const cornerMenu = document.querySelector(".corner-menu");

    if (!header) return;

    let previousScrollY = Math.max(window.scrollY, 0);
    let stoppedScrollingTimer;

    function setTucked(isTucked) {
      header.classList.toggle("is-tucked", isTucked);
      cornerMenu?.classList.toggle("is-tucked", isTucked);
    }

    window.addEventListener(
      "scroll",
      function () {
        const currentScrollY = Math.max(window.scrollY, 0);
        const scrollDifference = currentScrollY - previousScrollY;

        header.classList.toggle("header--scrolled", currentScrollY > 50);
        window.clearTimeout(stoppedScrollingTimer);

        if (currentScrollY < 80 || scrollDifference < -2) {
          setTucked(false);
        } else if (scrollDifference > 2) {
          setTucked(true);
        }

        previousScrollY = currentScrollY;

        stoppedScrollingTimer = window.setTimeout(function () {
          setTucked(false);
        }, 600);
      },
      { passive: true },
    );
  }

  function initRevealAnimations() {
    const revealTargets = [
      [document.querySelector(".hero"), "hero--show"],
      [document.querySelector(".about"), "about--show"],
      [document.querySelector(".location"), "location--show"],
    ].filter(function (item) {
      return item[0] !== null;
    });

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      revealTargets.forEach(function ([element, visibleClass]) {
        element.classList.add(visibleClass);
      });

      return;
    }

    revealTargets.forEach(function ([element, visibleClass]) {
      const observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            entry.target.classList.toggle(
              visibleClass,
              entry.isIntersecting,
            );
          });
        },
        { threshold: 0.3 },
      );

      observer.observe(element);
    });
  }

  function initCornerMenu() {
    const cornerMenu = document.querySelector(".corner-menu");
    const menuButton = cornerMenu?.querySelector(
      ".corner-menu__button",
    );
    const menuPanel = cornerMenu?.querySelector(
      ".corner-menu__panel",
    );

    if (!cornerMenu || !menuButton || !menuPanel) return;

    function setMenuOpen(isOpen) {
      menuButton.setAttribute(
        "aria-expanded",
        String(isOpen),
      );

      menuButton.setAttribute(
        "aria-label",
        isOpen ? "Close menu" : "Open menu",
      );

      menuPanel.classList.toggle("is-open", isOpen);
    }

    menuButton.addEventListener("click", function () {
      const isOpen =
        menuButton.getAttribute("aria-expanded") === "true";

      setMenuOpen(!isOpen);
    });

    menuPanel.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setMenuOpen(false);
      });
    });

    document.addEventListener("click", function (event) {
      if (!cornerMenu.contains(event.target)) {
        setMenuOpen(false);
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") return;

      const wasOpen =
        menuButton.getAttribute("aria-expanded") === "true";

      setMenuOpen(false);

      if (wasOpen) {
        menuButton.focus();
      }
    });
  }

  function initReviewSliders() {
    document
      .querySelectorAll(".restaurant-reviews")
      .forEach(function (section) {
        const track = section.querySelector(".reviews-track");

        const slides = Array.from(
          section.querySelectorAll(".review-slide"),
        );

        const previousButton = section.querySelector(
          "[data-review-previous]",
        );

        const nextButton = section.querySelector(
          "[data-review-next]",
        );

        const currentNumber = section.querySelector(
          "[data-review-current]",
        );

        const reviewWindow = section.querySelector(
          ".reviews-window",
        );

        if (
          !track ||
          !slides.length ||
          !previousButton ||
          !nextButton
        ) {
          return;
        }

        let currentIndex = 0;

        function showReview(index) {
          currentIndex =
            (index + slides.length) % slides.length;

          track.dataset.activeIndex = String(currentIndex);

          slides.forEach(function (slide, slideIndex) {
            slide.setAttribute(
              "aria-hidden",
              String(slideIndex !== currentIndex),
            );
          });

          if (currentNumber) {
            currentNumber.textContent =
              String(currentIndex + 1);
          }
        }

        previousButton.addEventListener(
          "click",
          function () {
            showReview(currentIndex - 1);
          },
        );

        nextButton.addEventListener(
          "click",
          function () {
            showReview(currentIndex + 1);
          },
        );

        reviewWindow?.addEventListener(
          "keydown",
          function (event) {
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              showReview(currentIndex - 1);
            } else if (event.key === "ArrowRight") {
              event.preventDefault();
              showReview(currentIndex + 1);
            }
          },
        );

        showReview(0);
      });
  }

  initHeaderScroll();
  initRevealAnimations();
  initCornerMenu();
  initReviewSliders();
})();