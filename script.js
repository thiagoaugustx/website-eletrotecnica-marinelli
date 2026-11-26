const header = document.querySelector("#header");
const menuToggle = document.querySelector(".navbar__toggle");
const menu = document.querySelector("#navbar-menu");
const mobileBreakpoint = window.matchMedia("(max-width: 1100px)");

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
        "imgs/slide-03.png",
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

/**
 * Botão WhatsApp Flutuante
 * Hospedado em: https://raw.githubusercontent.com/danilocampos/whatsapp-floating-button/main/whatsapp-button.js
 */

(function() {
    // Configurações
    const phoneNumber = window.WHATSAPP_NUMBER || '5521995966620';
    const message = window.WHATSAPP_MESSAGE || '';



    // Carregar CSS
    function loadButtonCSS() {
        if (!document.querySelector('link[href*="whatsapp-button"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://cdn.jsdelivr.net/gh/danilocampos/whatsapp-floating-button@main/whatsapp-button.css';
            document.head.appendChild(link);
        }
    }

    // Criar elemento do botão
    function createButton() {
        const url = message 
            ? `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
            : `https://wa.me/${phoneNumber}`;

        const html = `
            <a href="${url}" id="wa_button" target="_blank" rel="noopener noreferrer" title="Fale conosco no WhatsApp">
                <div class="circlephone" style="transform-origin: center;"></div>
                <div class="circle-fill" style="transform-origin: center;"></div>
                <div class="img-circle" style="transform-origin: center;">
                    <div class="img-circleblock" style="transform-origin: center;">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" style="width:38px;height:38px;display:block;flex-shrink:0;" aria-hidden="true">
                            <path fill="#ffffff" d="M16 0C7.164 0 0 7.163 0 16c0 2.822.736 5.476 2.027 7.789L0 32l8.418-2.004A15.93 15.93 0 0 0 16 32c8.836 0 16-7.163 16-16S24.836 0 16 0zm0 29.333a13.263 13.263 0 0 1-6.747-1.84l-.483-.287-4.998 1.19 1.27-4.847-.317-.499A13.229 13.229 0 0 1 2.667 16C2.667 8.636 8.636 2.667 16 2.667S29.333 8.636 29.333 16 23.364 29.333 16 29.333zm7.27-9.862c-.398-.199-2.355-1.162-2.72-1.294-.365-.133-.631-.199-.897.199-.266.398-1.03 1.294-1.262 1.56-.232.265-.465.298-.863.1-.398-.2-1.681-.619-3.202-1.977-1.183-1.056-1.982-2.36-2.214-2.758-.232-.398-.025-.613.174-.811.179-.178.398-.465.597-.698.199-.232.265-.398.398-.664.133-.265.067-.498-.033-.697-.1-.199-.897-2.162-1.229-2.96-.323-.778-.651-.672-.897-.685-.232-.012-.498-.015-.764-.015s-.697.1-1.063.498c-.365.398-1.394 1.362-1.394 3.324s1.428 3.855 1.627 4.12c.2.266 2.81 4.29 6.808 6.02.951.41 1.693.655 2.272.839.954.304 1.823.261 2.51.158.765-.114 2.355-.963 2.688-1.893.332-.93.332-1.727.232-1.893-.099-.166-.365-.265-.763-.465z"/>
                        </svg>
                    </div>
                </div>
            </a>
        `;

        const div = document.createElement('div');
        div.innerHTML = html;
        return div.firstElementChild;
    }

    // Inicializar
    function init() {
        loadButtonCSS();
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                if (!document.querySelector("#wa_button")) document.body.appendChild(createButton());
            });
        } else {
            document.body.appendChild(createButton());
        }
    }

    // Iniciar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

(() => {
  const viewer = document.querySelector(".document-viewer");

  if (!viewer) return;

  const pdfPath = viewer.dataset.pdf.trim();

  // Exibe o PDF oficial quando um caminho estiver configurado.
  if (pdfPath) {
    const url = new URL(pdfPath, window.location.href);

    const allowedProtocols = ["http:", "https:", "file:"];

    if (!allowedProtocols.includes(url.protocol)) return;

    const frame = viewer.querySelector(".document-frame");
    const demo = viewer.querySelector(".document-demo");
    const note = document.querySelector(".viewer-note");
    const link = document.querySelector(".pdf-link");

    frame.src = url.href;
    frame.hidden = false;

    demo.hidden = true;
    note.hidden = true;

    link.href = url.href;
    link.hidden = false;

    return;
  }

  // Controles da prévia ilustrativa.
  let zoom = 100;

  const sheet = viewer.querySelector(".document-sheet");
  const output = viewer.querySelector("#zoom-value");
  const buttons = viewer.querySelectorAll("[data-zoom]");

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const increment = button.dataset.zoom === "in" ? 10 : -10;

      zoom = Math.max(100, Math.min(160, zoom + increment));

      sheet.style.width = `${zoom}%`;
      output.value = `${zoom}%`;

      buttons.forEach((control) => {
        control.disabled =
          control.dataset.zoom === "out"
            ? zoom === 100
            : zoom === 160;
      });
    });
  });

  viewer.querySelector('[data-zoom="out"]').disabled = true;
})();

lucide.createIcons();

(() => {
    const gallery = document.querySelector(".field-gallery");
    const modal = document.querySelector("#gallery-modal");

    if (!gallery || !modal) return;

    const openButton = gallery.querySelector("[data-open-gallery]");
    const closeButton = modal.querySelector(".gallery-modal__close");
    const previousButton = modal.querySelector("[data-gallery-previous]");
    const nextButton = modal.querySelector("[data-gallery-next]");
    const mainImage = modal.querySelector(".gallery-modal__image");
    const caption = modal.querySelector(".gallery-modal__caption");
    const thumbnails = modal.querySelector(".gallery-modal__thumbnails");
    const imageLinks = [...gallery.querySelectorAll(".field-gallery__grid a")];

    const extraImages = [
        // { src: "imgs/registro-5.jpg", alt: "Descrição da imagem" }
    ];

    const images = [
        ...imageLinks.map((link) => ({
            src: link.getAttribute("href"),
            alt: link.querySelector("img")?.alt || ""
        })),
        ...extraImages
    ];

    let currentIndex = 0;
    let previousFocus = null;
    let previousOverflow = "";
    let startedOnBackdrop = false;

    function showImage(index) {
        if (!images.length) return;

        currentIndex = (index + images.length) % images.length;

        const image = images[currentIndex];

        mainImage.src = image.src;
        mainImage.alt = image.alt;

        caption.textContent =
        `${currentIndex + 1} de ${images.length} — Registro em campo ${currentIndex + 1}`;

        [...thumbnails.children].forEach((button, buttonIndex) => {
            button.setAttribute(
                "aria-pressed",
                String(buttonIndex === currentIndex)
            );
        });

        const activeThumbnail = thumbnails.children[currentIndex];

        if (activeThumbnail) {
            const stripBounds = thumbnails.getBoundingClientRect();
            const thumbnailBounds = activeThumbnail.getBoundingClientRect();

            if (thumbnailBounds.left < stripBounds.left) {
                thumbnails.scrollLeft -= stripBounds.left - thumbnailBounds.left;
            } else if (thumbnailBounds.right > stripBounds.right) {
                thumbnails.scrollLeft += thumbnailBounds.right - stripBounds.right;
            }
        }
    }

    function openGallery(index = 0) {
        if (!images.length || modal.open) return;

        previousFocus = document.activeElement;
        previousOverflow = document.documentElement.style.overflow;

        modal.showModal();
        document.documentElement.style.overflow = "hidden";

        showImage(index);
    }

    thumbnails.replaceChildren();

    images.forEach((image, index) => {
        const button = document.createElement("button");
        const thumbnail = document.createElement("img");

        button.type = "button";
        button.className = "gallery-modal__thumbnail";
        button.setAttribute("aria-label", `Ver imagem ${index + 1}`);
        button.setAttribute("aria-pressed", "false");

        thumbnail.src = image.src;
        thumbnail.alt = "";
        thumbnail.loading = "lazy";

        button.append(thumbnail);
        button.addEventListener("click", () => showImage(index));

        thumbnails.append(button);
    });

    previousButton.disabled = images.length < 2;
    nextButton.disabled = images.length < 2;
    openButton.disabled = images.length === 0;

    openButton.addEventListener("click", () => openGallery());

    imageLinks.forEach((link, index) => {
        link.addEventListener("click", (event) => {
            if (
                event.ctrlKey ||
                event.metaKey ||
                event.shiftKey ||
                event.altKey
            ) {
                return;
            }

            event.preventDefault();
            openGallery(index);
        });
    });

    closeButton.addEventListener("click", () => {
        modal.close();
    });

    previousButton.addEventListener("click", () => {
        showImage(currentIndex - 1);
    });

    nextButton.addEventListener("click", () => {
        showImage(currentIndex + 1);
    });

    modal.addEventListener("keydown", (event) => {
        if (event.key === "ArrowLeft") {
            event.preventDefault();
            showImage(currentIndex - 1);
        } else if (event.key === "ArrowRight") {
            event.preventDefault();
            showImage(currentIndex + 1);
        }
    });

    modal.addEventListener("pointerdown", (event) => {
        startedOnBackdrop = event.target === modal;
    });

    modal.addEventListener("pointercancel", () => {
        startedOnBackdrop = false;
    });

    modal.addEventListener("click", (event) => {
        if (startedOnBackdrop && event.target === modal) {
            modal.close();
        }

        startedOnBackdrop = false;
    });

    modal.addEventListener("close", () => {
        document.documentElement.style.overflow = previousOverflow;
        startedOnBackdrop = false;

        if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
            previousFocus.focus({ preventScroll: true });
        }
    });
})();

(() => {
    function initScrollReveal() {
        const section = document.querySelector(".maintenance");
        const reducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        );

        if (
            !section ||
            section.dataset.revealInitialized ||
            reducedMotion.matches ||
            !("IntersectionObserver" in window)
        ) return;

        section.dataset.revealInitialized = "true";

        const elements = [
            ...section.querySelectorAll(`
                .maintenance__photo,
                .maintenance__text,
                .field-gallery__header,
                .field-gallery__grid > li
            `)
        ];

        section.querySelectorAll(".maintenance__text").forEach((text) => {
            text.style.setProperty("--reveal-delay", "100ms");
        });

        section.querySelectorAll(".field-gallery__grid > li").forEach(
            (item, index) => {
                item.style.setProperty(
                    "--reveal-delay",
                    `${Math.min(index * 70, 280)}ms`
                );
            }
        );

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;

                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            });
        }, {
            threshold: 0.08
        });

        elements.forEach((element) => {
            element.classList.add("scroll-reveal");
            observer.observe(element);
        });

        section.addEventListener("focusin", (event) => {
            const element = event.target.closest(".scroll-reveal");

            if (element) {
                element.classList.add("is-visible");
                observer.unobserve(element);
            }
        });

        reducedMotion.addEventListener("change", (event) => {
            if (!event.matches) return;

            observer.disconnect();

            elements.forEach((element) => {
                element.classList.add("is-visible");
            });
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initScrollReveal, {
            once: true
        });
    } else {
        initScrollReveal();
    }
})();

(() => {
    function initInspections() {
        const section = document.querySelector(".inspections");

        if (!section || section.dataset.initialized) return;

        section.dataset.initialized = "true";

        const reducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        );

        const revealElements = [
            ...section.querySelectorAll("[data-inspection-reveal]")
        ];

        if (
            !reducedMotion.matches &&
            "IntersectionObserver" in window
        ) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;

                    entry.target.classList.add("is-visible");
                    observer.unobserve(entry.target);
                });
            }, {
                threshold: 0.08
            });

            revealElements.forEach((element) => {
                element.classList.add("inspection-reveal");
                observer.observe(element);
            });

            section.addEventListener("focusin", (event) => {
                const element = event.target.closest(
                    "[data-inspection-reveal]"
                );

                if (!element) return;

                element.classList.add("is-visible");
                observer.unobserve(element);
            });

            reducedMotion.addEventListener("change", (event) => {
                if (!event.matches) return;

                observer.disconnect();

                revealElements.forEach((element) => {
                    element.classList.add("is-visible");
                });
            });
        }

        const modal = section.querySelector("#inspection-dialog");
        const openButton = section.querySelector("[data-inspection-open]");
        const links = [
            ...section.querySelectorAll(".inspection-gallery__grid a")
        ];

        if (!modal || !links.length) return;

        const image = modal.querySelector(".inspection-dialog__image");
        const caption = modal.querySelector(".inspection-dialog__caption");
        const thumbnails = modal.querySelector(
            ".inspection-dialog__thumbnails"
        );

        const photos = links.map((link) => ({
            src: link.href,
            alt: link.querySelector("img").alt
        }));

        let currentIndex = 0;
        let previousFocus = null;
        let previousOverflow = "";
        let startedOnBackdrop = false;

        const thumbnailButtons = photos.map((photo, index) => {
            const button = document.createElement("button");
            const thumbnail = document.createElement("img");

            button.type = "button";
            button.className = "inspection-dialog__thumbnail";
            button.setAttribute("aria-label", `Ver imagem ${index + 1}`);
            button.setAttribute("aria-pressed", "false");

            thumbnail.src = photo.src;
            thumbnail.alt = "";
            thumbnail.loading = "lazy";

            button.append(thumbnail);
            button.addEventListener("click", () => showImage(index));
            thumbnails.append(button);

            return button;
        });

        function showImage(index) {
            currentIndex = (index + photos.length) % photos.length;

            const photo = photos[currentIndex];

            image.src = photo.src;
            image.alt = photo.alt;

            caption.textContent =
                `${currentIndex + 1} de ${photos.length} — ${photo.alt}`;

            thumbnailButtons.forEach((button, buttonIndex) => {
                button.setAttribute(
                    "aria-pressed",
                    String(buttonIndex === currentIndex)
                );
            });
        }

        function openGallery(index = 0) {
            if (modal.open) return;

            previousFocus = document.activeElement;
            previousOverflow = document.documentElement.style.overflow;

            showImage(index);
            modal.showModal();

            document.documentElement.style.overflow = "hidden";
        }

        openButton?.addEventListener("click", () => openGallery());

        links.forEach((link, index) => {
            link.setAttribute("aria-haspopup", "dialog");
            link.setAttribute("aria-controls", modal.id);

            link.addEventListener("click", (event) => {
                if (
                    event.ctrlKey ||
                    event.metaKey ||
                    event.shiftKey ||
                    event.altKey
                ) return;

                event.preventDefault();
                openGallery(index);
            });
        });

        modal.querySelector(".inspection-dialog__close")
            .addEventListener("click", () => modal.close());

        modal.querySelector("[data-inspection-previous]")
            .addEventListener("click", () => showImage(currentIndex - 1));

        modal.querySelector("[data-inspection-next]")
            .addEventListener("click", () => showImage(currentIndex + 1));

        modal.addEventListener("keydown", (event) => {
            if (event.key === "ArrowLeft") {
                event.preventDefault();
                showImage(currentIndex - 1);
            }

            if (event.key === "ArrowRight") {
                event.preventDefault();
                showImage(currentIndex + 1);
            }
        });

        modal.addEventListener("pointerdown", (event) => {
            startedOnBackdrop = event.target === modal;
        });

        modal.addEventListener("pointercancel", () => {
            startedOnBackdrop = false;
        });

        modal.addEventListener("click", (event) => {
            if (startedOnBackdrop && event.target === modal) {
                modal.close();
            }

            startedOnBackdrop = false;
        });

        modal.addEventListener("close", () => {
            document.documentElement.style.overflow = previousOverflow;
            startedOnBackdrop = false;

            if (
                previousFocus instanceof HTMLElement &&
                previousFocus.isConnected
            ) {
                previousFocus.focus({ preventScroll: true });
            }
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initInspections, {
            once: true
        });
    } else {
        initInspections();
    }
})();


/* INTEGRAÇÃO DO FORMULÁRIO TRABALHE CONOSCO */

(() => {
  const API_URL =
    "https://marinelli-formularios-api.thiagoacdesouza.workers.dev/api/formularios";

  const LIMITE_PDF = 5 * 1024 * 1024;

  function initRecruitmentForm() {
    const form = document.querySelector("#recruitment-form");

    if (!form || form.dataset.apiInitialized === "true") return;

    form.dataset.apiInitialized = "true";

    const fieldset = form.querySelector("fieldset");
    const status = form.querySelector("#recruitment-status");
    const label = form.querySelector("[data-submit-label]");


    function mostrarStatus(texto, tipo) {
    if (!status) return;

    status.textContent = texto;
    status.dataset.type = tipo;
    status.hidden = false;

    if (tipo === "success" || tipo === "error") {
        window.MarinelliFeedback?.show(tipo, texto);
    }
    }


    function lerBase64(arquivo) {
      return new Promise((resolve, reject) => {
        const leitor = new FileReader();

        leitor.onerror = () => {
          reject(new Error("Não foi possível ler o currículo."));
        };

        leitor.onload = () => {
          const conteudo = String(leitor.result || "");
          const separador = conteudo.indexOf(",");

          if (separador < 0) {
            reject(new Error("Não foi possível converter o currículo."));
            return;
          }

          resolve(conteudo.slice(separador + 1));
        };

        leitor.readAsDataURL(arquivo);
      });
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (fieldset?.disabled || !form.reportValidity()) return;

      const dadosFormulario = new FormData(form);

      const valor = (nome) =>
        String(dadosFormulario.get(nome) || "").trim();

      const arquivo = dadosFormulario.get("resume");
      const token = valor("cf-turnstile-response");

      if (!(arquivo instanceof File) || !arquivo.name) {
        mostrarStatus("Selecione seu currículo em PDF.", "error");
        return;
      }

      if (
        !/\.pdf$/i.test(arquivo.name) ||
        (arquivo.type && arquivo.type !== "application/pdf")
      ) {
        mostrarStatus("O currículo precisa estar em formato PDF.", "error");
        return;
      }

      if (arquivo.size === 0 || arquivo.size > LIMITE_PDF) {
        mostrarStatus(
          "O currículo deve ter até 5 MB e não pode estar vazio.",
          "error"
        );
        return;
      }

      if (!token) {
        mostrarStatus(
          "Conclua a verificação de segurança antes de enviar.",
          "error"
        );
        return;
      }

      if (fieldset) fieldset.disabled = true;
      if (label) label.textContent = "Enviando...";

      mostrarStatus("Enviando candidatura e currículo...", "info");

      try {
        const resumeBase64 = await lerBase64(arquivo);

        const payload = {
          tipo: "candidatura",
          name: valor("name"),
          email: valor("email"),
          phone: valor("phone"),
          city: valor("city"),
          state: valor("state"),
          area: valor("area"),
          message: valor("message"),
          resumeBase64,
          turnstileToken: token
        };

        const resposta = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        const resultado = await resposta.json();

        if (!resposta.ok || resultado.sucesso !== true) {
          throw new Error(
            resultado.mensagem || "Não foi possível concluir o envio."
          );
        }

        form.reset();

        mostrarStatus(
          "Candidatura e currículo enviados com sucesso!",
          "success"
        );

      } catch (erro) {
        console.error("Erro ao enviar candidatura:", erro);

        mostrarStatus(
          "Não foi possível confirmar o envio. Verifique com a empresa antes de tentar novamente.",
          "error"
        );

      } finally {
        if (fieldset) fieldset.disabled = false;
        if (label) label.textContent = "Enviar currículo";

        if (
          window.turnstile &&
          typeof window.turnstile.reset === "function"
        ) {
          window.turnstile.reset();
        }
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initRecruitmentForm,
      { once: true }
    );
  } else {
    initRecruitmentForm();
  }
})();






/* INTEGRAÇÃO DO FORMULÁRIO CONTATO */

(() => {
    const API_URL =
        "https://marinelli-formularios-api.thiagoacdesouza.workers.dev/api/formularios";

    function initContactForm() {
        const form = document.querySelector("#contact-form");

        if (!form || form.dataset.apiInitialized === "true") return;

        form.dataset.apiInitialized = "true";

        const fieldset = form.querySelector("fieldset");
        const status = form.querySelector("#contact-status");
        const label = form.querySelector("[data-contact-submit-label]");


        function mostrarStatus(mensagem, tipo) {
        if (!status) return;

        status.textContent = mensagem;
        status.dataset.type = tipo;
        status.hidden = false;

        if (tipo === "success" || tipo === "error") {
            window.MarinelliFeedback?.show(tipo, mensagem);
        }
        }


        form.addEventListener("submit", async (event) => {
            event.preventDefault();

            if (fieldset?.disabled || !form.reportValidity()) return;

            const formData = new FormData(form);

            const valor = (nome) =>
                String(formData.get(nome) || "").trim();

            const token = valor("cf-turnstile-response");

            if (!token) {
                mostrarStatus(
                    "Conclua a verificação de segurança antes de enviar.",
                    "error"
                );
                return;
            }

            const dados = {
                tipo: "contato",
                name: valor("name"),
                email: valor("email"),
                phone: valor("phone"),
                company: valor("company"),
                subject: valor("subject"),
                message: valor("message"),
                turnstileToken: token
            };

            if (fieldset) fieldset.disabled = true;
            if (label) label.textContent = "Enviando...";

            mostrarStatus("Enviando sua mensagem...", "info");

            try {
                const resposta = await fetch(API_URL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(dados)
                });

                const resultado = await resposta.json();

                if (!resposta.ok || resultado.sucesso !== true) {
                    throw new Error(
                        resultado.mensagem ||
                        "Não foi possível concluir o envio."
                    );
                }

                form.reset();

                mostrarStatus(
                    "Mensagem enviada com sucesso! Nossa equipe entrará em contato em breve.",
                    "success"
                );

            } catch (erro) {
                console.error("Erro no formulário de contato:", erro);

                mostrarStatus(
                    "Não foi possível confirmar o envio. Se o problema persistir, fale conosco pelo WhatsApp.",
                    "error"
                );

            } finally {
                if (fieldset) fieldset.disabled = false;
                if (label) label.textContent = "Enviar mensagem";

                if (
                    window.turnstile &&
                    typeof window.turnstile.reset === "function"
                ) {
                    window.turnstile.reset();
                }
            }
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initContactForm, {
            once: true
        });
    } else {
        initContactForm();
    }
})();


/* MODAL DE FEEDBACK — MARINELLI */


/* =========================================
   MODAL DE FEEDBACK — ELETROTÉCNICA MARINELLI
========================================= */

(() => {
  const dialog = document.createElement("dialog");

  dialog.id = "marinelli-feedback";
  dialog.className = "marinelli-feedback";

  dialog.setAttribute(
    "aria-labelledby",
    "marinelli-feedback-title"
  );

  dialog.setAttribute(
    "aria-describedby",
    "marinelli-feedback-message"
  );

  dialog.innerHTML = `
    <div class="marinelli-feedback__content">

      <!-- CABEÇALHO -->
      <div class="marinelli-feedback__header">
        <img
          class="marinelli-feedback__logo"
          src="imgs/logo-branca.png"
          alt="Eletrotécnica Marinelli"
        >

        <button
          class="marinelli-feedback__close"
          type="button"
          aria-label="Fechar aviso"
        >
          &times;
        </button>
      </div>

      <!-- CONTEÚDO -->
      <div class="marinelli-feedback__body">

        <div
          class="marinelli-feedback__icon"
          aria-hidden="true"
        >
          ✓
        </div>

        <h2 id="marinelli-feedback-title"></h2>

        <p
          class="marinelli-feedback__message"
          id="marinelli-feedback-message"
        ></p>

        <p class="marinelli-feedback__submessage"></p>

      </div>

      <!-- RODAPÉ -->
      <div class="marinelli-feedback__footer">
        <button
          class="marinelli-feedback__button"
          type="button"
        >
          Entendi
        </button>
      </div>

    </div>
  `;

  document.body.appendChild(dialog);

  // ELEMENTOS DO MODAL
  const titulo = dialog.querySelector(
    "#marinelli-feedback-title"
  );

  const mensagem = dialog.querySelector(
    "#marinelli-feedback-message"
  );

  const submensagem = dialog.querySelector(
    ".marinelli-feedback__submessage"
  );

  const simbolo = dialog.querySelector(
    ".marinelli-feedback__icon"
  );

  const botao = dialog.querySelector(
    ".marinelli-feedback__button"
  );

  const botaoFechar = dialog.querySelector(
    ".marinelli-feedback__close"
  );

  // FECHAMENTO
  function fecharModal() {
    if (dialog.open) {
      dialog.close();
    }
  }

  botao.addEventListener("click", fecharModal);
  botaoFechar.addEventListener("click", fecharModal);

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      fecharModal();
    }
  });

  // CONTROLE DE FEEDBACK
  window.MarinelliFeedback = {
    show(tipo, texto) {
      const sucesso = tipo === "success";

      dialog.dataset.type = sucesso
        ? "success"
        : "error";

      // ÍCONE
      simbolo.textContent = sucesso ? "✓" : "!";

      // TÍTULO
      titulo.textContent = sucesso
        ? "Enviado com sucesso!"
        : "Não foi possível concluir o envio";

      // MENSAGEM PRINCIPAL
      mensagem.textContent = sucesso
        ? "Recebemos suas informações com sucesso."
        : (
            texto ||
            "Não foi possível confirmar o envio."
          );

      // MENSAGEM COMPLEMENTAR
      submensagem.textContent = sucesso
        ? "Nossa equipe dará continuidade ao atendimento."
        : "Caso o problema persista, entre em contato com nossa equipe através do whatsapp.";

      // EXIBIÇÃO
      if (!dialog.open) {
        dialog.showModal();
      }

      botao.focus();
    }
  };
})();


/* =========================================
   REGISTROS EM CAMPO — CARROSSEL CONTÍNUO
========================================= */

(() => {
  const VELOCIDADE = 30; // Pixels por segundo

  function iniciarCarrosseis() {
    document.querySelectorAll(
      ".field-gallery, .inspection-gallery"
    ).forEach((secao) => {

      const lista = secao.querySelector(
        ".field-gallery__grid, .inspection-gallery__grid"
      );

      if (!lista || lista.dataset.continuo === "true") return;

      const originais = [...lista.children].filter(
        (elemento) => elemento.tagName === "LI"
      );

      if (originais.length < 2) return;

      const linksOriginais = originais.map(
        (item) => item.querySelector("a")
      );

      originais.forEach((item) => {
        const imagem = item.querySelector("img");
        if (imagem) imagem.draggable = false;
      });

      lista.dataset.continuo = "true";

      // ESTRUTURA
      const carrossel = document.createElement("div");
      carrossel.className = "campo-carousel";
      carrossel.setAttribute("role", "region");
      carrossel.setAttribute(
        "aria-roledescription",
        "carrossel"
      );
      carrossel.setAttribute(
        "aria-label",
        secao.querySelector("h2")?.textContent.trim() ||
        "Registros em campo"
      );

      const janela = document.createElement("div");
      janela.className = "campo-carousel__janela";

      lista.classList.add("campo-carousel__trilho");

      lista.parentNode.insertBefore(carrossel, lista);
      carrossel.append(janela);
      janela.append(lista);

      // DUPLICAR IMAGENS PARA ROLAGEM INFINITA
      function criarCopias() {
        return originais.map((original, indice) => {
          const copia = original.cloneNode(true);

          copia.classList.remove(
            "scroll-reveal",
            "inspection-reveal",
            "is-visible"
          );

          copia.removeAttribute("data-inspection-reveal");
          copia.setAttribute("aria-hidden", "true");

          const link = copia.querySelector("a");

          if (link) {
            link.tabIndex = -1;

            link.addEventListener("click", (evento) => {
              if (
                evento.ctrlKey ||
                evento.metaKey ||
                evento.shiftKey ||
                evento.altKey
              ) return;

              evento.preventDefault();

              // Usa a galeria ampliada original
              linksOriginais[indice]?.click();
            });
          }

          return copia;
        });
      }

      lista.prepend(...criarCopias());
      lista.append(...criarCopias(), ...criarCopias());

      secao.classList.add("campo-carousel-ativo");

      // SETAS
      function criarSeta(rotulo, classe, simbolo) {
        const botao = document.createElement("button");

        botao.type = "button";
        botao.className = `campo-carousel__seta ${classe}`;
        botao.setAttribute("aria-label", rotulo);
        botao.textContent = simbolo;

        carrossel.append(botao);
        return botao;
      }

      const anterior = criarSeta(
        "Imagem anterior",
        "campo-carousel__seta--anterior",
        "‹"
      );

      const proxima = criarSeta(
        "Próxima imagem",
        "campo-carousel__seta--proxima",
        "›"
      );

      let passo = 0;
      let ciclo = 0;
      let deslocamento = 0;
      let iniciou = false;
      let ultimoTempo = 0;

      let visivel = true;
      let sobre = false;
      let emFoco = false;
      let arrasto = null;
      let bloquearCliqueAte = 0;
      let movimentoManual = null;
      let pausaAte = 0;

      const modal = document.querySelector(
        "#gallery-modal, #inspection-dialog"
      );

      const reduzirMovimento = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      );

      // MOVIMENTO INFINITO SEM SALTOS
      function normalizar() {
        if (!ciclo) return;

        while (deslocamento >= ciclo * 2) {
          deslocamento -= ciclo;
        }

        while (deslocamento < ciclo) {
          deslocamento += ciclo;
        }
      }

      function desenhar() {
        normalizar();

        lista.style.transform =
          `translate3d(${-deslocamento}px, 0, 0)`;
      }

      function medir() {
        const cicloAnterior = ciclo;

        const progresso = cicloAnterior
          ? (deslocamento - cicloAnterior) / cicloAnterior
          : 0;

        const estilo = getComputedStyle(lista);
        const gap = parseFloat(estilo.columnGap) || 0;

        passo = originais[0].getBoundingClientRect().width + gap;
        ciclo = originais.length * passo;

        deslocamento = ciclo * (1 + progresso);

        if (!iniciou) {
          deslocamento = ciclo;
          iniciou = true;
        }

        desenhar();
      }

      // NAVEGAÇÃO MANUAL SUAVE
      function movimentarUmaFoto(direcao) {
        if (movimentoManual) {
          deslocamento += movimentoManual.delta *
            (1 - movimentoManual.progresso);
        }

        movimentoManual = {
          delta: direcao * passo,
          progresso: 0,
          tempo: 0
        };

        pausaAte = performance.now() + 1000;
      }

      anterior.addEventListener("click", () => {
        movimentarUmaFoto(-1);
      });

      proxima.addEventListener("click", () => {
        movimentarUmaFoto(1);
      });

      // PAUSA DURANTE INTERAÇÃO
      carrossel.addEventListener("mouseenter", () => {
        sobre = true;
      });

      carrossel.addEventListener("mouseleave", () => {
        sobre = false;
      });

      carrossel.addEventListener("focusin", () => {
        emFoco = Boolean(
          carrossel.querySelector(":focus-visible")
        );
      });

      carrossel.addEventListener("focusout", () => {
        queueMicrotask(() => {
          emFoco = Boolean(
            carrossel.querySelector(":focus-visible")
          );
        });
      });

      carrossel.addEventListener("pointerdown", () => {
        emFoco = false;
      });

      // ARRASTAR COM MOUSE OU TOQUE
      janela.addEventListener("pointerdown", (evento) => {
        if (
          evento.button !== 0 ||
          evento.target.closest("button")
        ) return;

        arrasto = {
          id: evento.pointerId,
          x: evento.clientX,
          y: evento.clientY,
          anterior: evento.clientX,
          movido: false
        };
      });

      janela.addEventListener("pointermove", (evento) => {
        if (!arrasto || arrasto.id !== evento.pointerId) {
          return;
        }

        const dx = evento.clientX - arrasto.x;
        const dy = evento.clientY - arrasto.y;

        if (
          !arrasto.movido &&
          (Math.abs(dx) < 9 || Math.abs(dx) < Math.abs(dy))
        ) return;

        arrasto.movido = true;

        deslocamento -= evento.clientX - arrasto.anterior;
        arrasto.anterior = evento.clientX;

        desenhar();
      });

      janela.addEventListener("pointerup", (evento) => {
        if (!arrasto || evento.pointerId !== arrasto.id) {
          return;
        }

        if (arrasto.movido) {
          bloquearCliqueAte = performance.now() + 500;
        }

        arrasto = null;
      });

      janela.addEventListener("pointercancel", () => {
        arrasto = null;
      });

      // NÃO ABRIR FOTO ACIDENTALMENTE APÓS ARRASTAR
      janela.addEventListener("click", (evento) => {
        if (performance.now() < bloquearCliqueAte) {
          evento.preventDefault();
          evento.stopPropagation();
        }
      }, true);

      // PAUSAR FORA DA TELA
      if ("IntersectionObserver" in window) {
        new IntersectionObserver((entradas) => {
          visivel = entradas[0].isIntersecting;
        }, {
          threshold: 0.05
        }).observe(carrossel);
      }

      // RECALCULAR NO REDIMENSIONAMENTO
      if ("ResizeObserver" in window) {
        new ResizeObserver(medir).observe(janela);
      } else {
        window.addEventListener("resize", medir);
      }

      // ANIMAÇÃO CONTÍNUA
      function animar(agora) {
        const dt = Math.min(
          agora - (ultimoTempo || agora),
          50
        );

        ultimoTempo = agora;

        const pausado =
          document.hidden ||
          !visivel ||
          sobre ||
          emFoco ||
          reduzirMovimento.matches ||
          modal?.open ||
          agora < pausaAte;

        if (!pausado && !arrasto) {
          deslocamento += VELOCIDADE * dt / 1000;
        }

        // Transição das setas
        if (movimentoManual) {
          const anterior = movimentoManual.progresso;

          movimentoManual.tempo += dt;

          const t = Math.min(
            movimentoManual.tempo / 450,
            1
          );

          const proximo = 1 - Math.pow(1 - t, 3);

          deslocamento += movimentoManual.delta *
            (proximo - anterior);

          movimentoManual.progresso = proximo;

          if (t === 1) {
            movimentoManual = null;
          }
        }

        desenhar();
        requestAnimationFrame(animar);
      }

      medir();
      requestAnimationFrame(animar);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      iniciarCarrosseis,
      { once: true }
    );
  } else {
    iniciarCarrosseis();
  }
})();
