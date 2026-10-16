const header = document.querySelector("#header");
const menuToggle = document.querySelector(".navbar__toggle");
const menu = document.querySelector("#navbar-menu");
const mobileBreakpoint = window.matchMedia("(max-width: 900px)");

if (header) {
    function updateHeader() {
        header.classList.toggle("is-scrolled", window.scrollY > 20);
    }

    window.addEventListener("scroll", updateHeader, { passive: true });
    updateHeader();
}

if (header && menuToggle && menu) {
    const dropdowns = [...menu.querySelectorAll(".navbar__dropdown")];

    function setDropdown(dropdown, isOpen) {
        const toggle = dropdown.querySelector(".navbar__dropdown-toggle");
        const submenu = dropdown.querySelector(".navbar__submenu");

        toggle.setAttribute("aria-expanded", String(isOpen));
        submenu.hidden = !isOpen;
    }

    function closeDropdowns(except = null) {
        dropdowns.forEach((dropdown) => {
            if (dropdown !== except) {
                setDropdown(dropdown, false);
            }
        });
    }

    function setMenuOpen(isOpen) {
        header.classList.toggle("is-menu-open", isOpen);

        menuToggle.setAttribute("aria-expanded", String(isOpen));
        menuToggle.setAttribute(
            "aria-label",
            isOpen ? "Fechar menu" : "Abrir menu"
        );

        if (!isOpen) {
            closeDropdowns();
        }
    }

    menuToggle.addEventListener("click", () => {
        const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
        setMenuOpen(!isOpen);
    });

    dropdowns.forEach((dropdown) => {
        const toggle = dropdown.querySelector(".navbar__dropdown-toggle");
        let closeTimer;

        function openDropdown() {
            window.clearTimeout(closeTimer);
            closeDropdowns(dropdown);
            setDropdown(dropdown, true);
        }

        dropdown.addEventListener("pointerenter", (event) => {
            if (event.pointerType !== "mouse" || mobileBreakpoint.matches) return;

            openDropdown();
        });

        dropdown.addEventListener("pointerleave", (event) => {
            if (event.pointerType !== "mouse" || mobileBreakpoint.matches) return;

            window.clearTimeout(closeTimer);

            closeTimer = window.setTimeout(() => {
                const focusedElement = document.activeElement;
                const hasKeyboardFocus =
                    dropdown.contains(focusedElement) &&
                    focusedElement.matches(":focus-visible");

                if (!hasKeyboardFocus) {
                    setDropdown(dropdown, false);
                }
            }, 180);
        });

        toggle.addEventListener("click", (event) => {
            window.clearTimeout(closeTimer);

            if (
                !mobileBreakpoint.matches &&
                event.pointerType === "mouse"
            ) {
                openDropdown();
                return;
            }

            const isOpen = toggle.getAttribute("aria-expanded") === "true";

            closeDropdowns(dropdown);
            setDropdown(dropdown, !isOpen);
        });

        dropdown.addEventListener("focusout", (event) => {
            if (!dropdown.contains(event.relatedTarget)) {
                window.clearTimeout(closeTimer);
                setDropdown(dropdown, false);
            }
        });
    });

    header.addEventListener("click", (event) => {
        if (event.target.closest("a")) {
            setMenuOpen(false);
        }
    });

    document.addEventListener("click", (event) => {
        if (!event.target.closest(".navbar__dropdown")) {
            closeDropdowns();
        }

        if (!header.contains(event.target)) {
            setMenuOpen(false);
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;

        const openDropdown = dropdowns.find((dropdown) => {
            const toggle = dropdown.querySelector(".navbar__dropdown-toggle");
            return toggle.getAttribute("aria-expanded") === "true";
        });

        if (openDropdown) {
            setDropdown(openDropdown, false);
            openDropdown.querySelector(".navbar__dropdown-toggle").focus();
            return;
        }

        if (menuToggle.getAttribute("aria-expanded") === "true") {
            setMenuOpen(false);
            menuToggle.focus();
        }
    });

    mobileBreakpoint.addEventListener("change", () => {
        setMenuOpen(false);
    });
}

const hero = document.querySelector(".hero--slider");

if (hero) {
    const slides = [...hero.querySelectorAll(".hero__slide")];

    const images = [
        "imgs/slide-1.jpg",
        "imgs/slide-2.jpg",
        "imgs/slide-3.jpg",
        "imgs/slide-4.jpg"
    ];

    const interval = 5000;
    const swipeThreshold = 50;

    let currentIndex = 0;
    let timer;
    let gesture = null;
    let suppressClickUntil = 0;

    hero.querySelector(".hero__controls")?.remove();

    slides.forEach((slide, index) => {
        const image = slide.querySelector(".hero__image");

        if (image && images[index]) {
            image.src = images[index];
            image.draggable = false;
        }
    });

    function stopTimer() {
        window.clearTimeout(timer);
    }

    function restartTimer() {
        stopTimer();

        if (document.hidden || gesture || slides.length < 2) return;

        timer = window.setTimeout(() => {
            showSlide(currentIndex + 1);
        }, interval);
    }

    function showSlide(index) {
        if (!slides.length) return;

        currentIndex = (index + slides.length) % slides.length;

        slides.forEach((slide, slideIndex) => {
            const isActive = slideIndex === currentIndex;

            slide.classList.toggle("is-active", isActive);
            slide.setAttribute("aria-hidden", String(!isActive));
            slide.inert = !isActive;
        });

        restartTimer();
    }

    function resetGesture() {
        gesture = null;
        hero.classList.remove("is-dragging");
        restartTimer();
    }

    hero.addEventListener("pointerdown", (event) => {
        if (!event.isPrimary || event.button !== 0 || gesture) return;

        gesture = {
            id: event.pointerId,
            x: event.clientX,
            y: event.clientY
        };

        hero.classList.add("is-dragging");
        stopTimer();
    });

    window.addEventListener("pointerup", (event) => {
        if (!gesture || event.pointerId !== gesture.id) return;

        const distanceX = event.clientX - gesture.x;
        const distanceY = event.clientY - gesture.y;

        const isSwipe =
            Math.abs(distanceX) >= swipeThreshold &&
            Math.abs(distanceX) > Math.abs(distanceY) * 1.2;

        gesture = null;
        hero.classList.remove("is-dragging");

        if (isSwipe) {
            suppressClickUntil = Date.now() + 400;
            showSlide(currentIndex + (distanceX < 0 ? 1 : -1));
        } else {
            restartTimer();
        }
    });

    window.addEventListener("pointercancel", (event) => {
        if (gesture && event.pointerId === gesture.id) {
            resetGesture();
        }
    });

    window.addEventListener("blur", resetGesture);

    hero.addEventListener("dragstart", (event) => {
        event.preventDefault();
    });

    hero.addEventListener("click", (event) => {
        if (Date.now() < suppressClickUntil) {
            event.preventDefault();
            event.stopPropagation();
        }
    }, true);

    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            gesture = null;
            hero.classList.remove("is-dragging");
            stopTimer();
        } else {
            restartTimer();
        }
    });

    showSlide(0);
}

document.querySelectorAll(".servicos").forEach((section) => {
  const track = section.querySelector(".servicos__lista");
  const previous = section.querySelector(".servicos__seta--anterior");
  const next = section.querySelector(".servicos__seta--proxima");
  const toggle = section.querySelector(".servicos__autoplay");

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  // Velocidade da rolagem em pixels por segundo.
  const speed = 35;
  let movimentoAcumulado = 0;

  const cards = [...track.querySelectorAll(".servico")];

  if (!cards.length) return;

  // Ajusta o HTML existente.
  cards.forEach((card) => {
    card.querySelector(".servico__numero")?.remove();

    const content = card.querySelector(".servico__conteudo");
    const icon = content.querySelector(".servico__icone");
    const title = content.querySelector("h3");

    if (!content.querySelector(".servico__cabecalho")) {
      const header = document.createElement("div");
      header.className = "servico__cabecalho";

      content.prepend(header);

      if (icon) header.append(icon);
      if (title) header.append(title);
    }
  });

  let cycleWidth = 0;
  let autoplay = true;
  let dragging = false;
  let touching = false;
  let pointerId = null;
  let lastX = 0;
  let startX = 0;
  let moved = false;
  let suppressClick = false;
  let previousTime = 0;
  let manualUntil = 0;
  let animation = null;

  function createCopies() {
    return cards.map((card) => {
      const copy = card.cloneNode(true);

      copy.dataset.carouselCopy = "";
      copy.setAttribute("aria-hidden", "true");
      copy.removeAttribute("id");

      copy.querySelectorAll("[id]").forEach((element) => {
        element.removeAttribute("id");
      });

      copy.querySelectorAll("a, button, [tabindex]").forEach((element) => {
        element.setAttribute("tabindex", "-1");
      });

      return copy;
    });
  }

  function buildLoop() {
    track.querySelectorAll("[data-carousel-copy]").forEach((copy) => {
      copy.remove();
    });

    // Réplicas antes e depois dos cards originais.
    track.prepend(...createCopies());
    track.append(...createCopies());

    const firstOriginal = cards[0];
    const firstCopy = track.firstElementChild;

    cycleWidth = firstOriginal.offsetLeft - firstCopy.offsetLeft;

    // Em listas curtas, acrescenta cópias para preencher toda a janela.
    if (cycleWidth > 0) {
      const extraSets = Math.ceil(track.clientWidth / cycleWidth);

      for (let index = 0; index < extraSets; index++) {
        track.append(...createCopies());
      }
    }

    track.scrollLeft = cycleWidth;
    animation = null;
  }

  function normalizePosition() {
    if (!cycleWidth) return;

    const current = track.scrollLeft;
    const normalized =
      cycleWidth +
      (((current - cycleWidth) % cycleWidth) + cycleWidth) % cycleWidth;

    if (Math.abs(normalized - current) > 0.5) {
      track.scrollLeft = normalized;

      // Mantém a animação das setas alinhada após atravessar a emenda.
      if (animation) {
        animation.from += normalized - current;
      }
    }
  }

  function updateButton() {
    if (!toggle) return;

    toggle.textContent = autoplay
      ? "Pausar rolagem automática"
      : "Ativar rolagem automática";
  }

  function move(direction) {
    normalizePosition();

    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    const distance = cards[0].getBoundingClientRect().width + gap;

    manualUntil = performance.now() + 1200;

    if (reducedMotion.matches) {
      track.scrollLeft += direction * distance;
      normalizePosition();
      return;
    }

    animation = {
      from: track.scrollLeft,
      distance: direction * distance,
      start: performance.now(),
      duration: 350
    };
  }

  previous?.addEventListener("click", () => move(-1));
  next?.addEventListener("click", () => move(1));

  toggle?.addEventListener("click", () => {
    autoplay = !autoplay;
    updateButton();
  });

  // Arraste com mouse.
  track.addEventListener("pointerdown", (event) => {
    animation = null;
    suppressClick = false;
    manualUntil = performance.now() + 1200;

    if (event.pointerType !== "mouse") {
      touching = true;
      return;
    }

    if (event.button !== 0) return;

    dragging = true;
    moved = false;
    pointerId = event.pointerId;
    startX = event.clientX;
    lastX = event.clientX;
  });

  track.addEventListener("pointermove", (event) => {
    if (!dragging || event.pointerId !== pointerId) return;

    if (!moved && Math.abs(event.clientX - startX) > 5) {
      moved = true;
      track.classList.add("is-dragging");
      track.setPointerCapture(pointerId);
    }

    if (!moved) return;

    event.preventDefault();

    track.scrollLeft -= event.clientX - lastX;
    lastX = event.clientX;

    normalizePosition();
  });

  function finishPointer(event) {
    if (event.pointerType !== "mouse") {
      touching = false;
      manualUntil = performance.now() + 1200;
      return;
    }

    if (!dragging || event.pointerId !== pointerId) return;

    dragging = false;
    suppressClick = moved;

    track.classList.remove("is-dragging");

    if (track.hasPointerCapture(pointerId)) {
      track.releasePointerCapture(pointerId);
    }

    pointerId = null;
    manualUntil = performance.now() + 1200;
  }

  window.addEventListener("pointerup", finishPointer);
  window.addEventListener("pointercancel", finishPointer);

  track.addEventListener("click", (event) => {
    if (!suppressClick) return;

    event.preventDefault();
    event.stopPropagation();
    suppressClick = false;
  }, true);

  track.addEventListener("dragstart", (event) => {
    event.preventDefault();
  });

  // Mantém a continuidade também durante a rolagem nativa no celular.
  track.addEventListener("scroll", normalizePosition, { passive: true });

  track.addEventListener("wheel", () => {
    animation = null;
    manualUntil = performance.now() + 1200;
  }, { passive: true });

  track.addEventListener("keydown", (event) => {
    if (event.target !== track) return;

    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      move(event.key === "ArrowRight" ? 1 : -1);
    }
  });

  function frame(time) {
    const elapsed = previousTime
      ? Math.min((time - previousTime) / 1000, 0.05)
      : 0;

    previousTime = time;

    const keyboardFocus = section.querySelector(":focus-visible");

    if (!document.hidden && !dragging && !touching) {
      if (animation) {
        const progress = Math.min(
          (time - animation.start) / animation.duration,
          1
        );

        const easing = 1 - Math.pow(1 - progress, 3);

        track.scrollLeft =
          animation.from + animation.distance * easing;

        normalizePosition();

        if (progress === 1) animation = null;
      } else if (
        autoplay &&
        !keyboardFocus &&
        time >= manualUntil
      ) {
        movimentoAcumulado += speed * elapsed;

        if (movimentoAcumulado >= 1) {
        const pixels = Math.floor(movimentoAcumulado);

        track.scrollLeft += pixels;
        movimentoAcumulado -= pixels;

        normalizePosition();
}
      }
    }

    requestAnimationFrame(frame);
  }

  reducedMotion.addEventListener("change", () => {
    if (reducedMotion.matches) {
      autoplay = false;
      animation = null;
    }

    updateButton();
  });

  let resizeTimer;

  const observer = new ResizeObserver(() => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(buildLoop, 100);
  });

  buildLoop();
  updateButton();
  observer.observe(track);
  requestAnimationFrame(frame);
});