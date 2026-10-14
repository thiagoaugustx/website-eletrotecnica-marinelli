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