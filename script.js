const header = document.querySelector(".site-header");
const menuToggle = document.querySelector(".menu-toggle");
const mobileMenuLinks = document.querySelectorAll(".mobile-menu a");
const revealItems = document.querySelectorAll(".reveal");
const videoModal = document.querySelector("[data-video-modal]");
const videoFrame = document.querySelector("[data-video-frame]");
const videoTriggers = document.querySelectorAll("[data-video]");
const videoClosers = document.querySelectorAll("[data-video-close]");
const contactForm = document.querySelector(".contact-form");
const feedback = document.querySelector(".form-feedback");
const phoneInput = document.querySelector('input[name="telefone"]');

const mediaDesktop = window.matchMedia("(min-width: 921px)");

const syncBodyScroll = () => {
  const menuOpen = header?.classList.contains("menu-open");
  const videoOpen = Boolean(videoModal && !videoModal.hidden);
  document.body.style.overflow =
    videoOpen || (menuOpen && !mediaDesktop.matches) ? "hidden" : "";
};

const setHeaderState = () => {
  if (!header) return;
  header.classList.toggle("is-scrolled", window.scrollY > 20);
};

const closeMenu = () => {
  if (!menuToggle) return;
  menuToggle.setAttribute("aria-expanded", "false");
  header.classList.remove("menu-open");
  syncBodyScroll();
};

if (menuToggle) {
  menuToggle.addEventListener("click", () => {
    const expanded = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!expanded));
    header.classList.toggle("menu-open", !expanded);
    syncBodyScroll();
  });
}

mobileMenuLinks.forEach((link) => {
  link.addEventListener("click", closeMenu);
});

window.addEventListener("scroll", setHeaderState, { passive: true });
setHeaderState();

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.18,
    rootMargin: "0px 0px -40px 0px",
  }
);

revealItems.forEach((item) => revealObserver.observe(item));

const revealVisibleNow = () => {
  revealItems.forEach((item) => {
    const rect = item.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.92) {
      item.classList.add("is-visible");
    }
  });
};

window.addEventListener("load", revealVisibleNow);
window.addEventListener("resize", revealVisibleNow);
revealVisibleNow();

const openVideo = (url) => {
  if (!videoModal || !videoFrame) return;
  videoFrame.src = url;
  videoModal.hidden = false;
  syncBodyScroll();
};

const closeVideo = () => {
  if (!videoModal || !videoFrame) return;
  videoModal.hidden = true;
  videoFrame.src = "";
  syncBodyScroll();
};

videoTriggers.forEach((trigger) => {
  trigger.addEventListener("click", () => openVideo(trigger.dataset.video));
});

videoClosers.forEach((closer) => {
  closer.addEventListener("click", closeVideo);
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeVideo();
    closeMenu();
  }
});

mediaDesktop.addEventListener("change", () => {
  closeMenu();
});

const formatPhone = (value) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 2) return digits ? `(${digits}` : "";
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}.${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}.${digits.slice(7)}`;
};

if (phoneInput) {
  phoneInput.addEventListener("input", (event) => {
    event.target.value = formatPhone(event.target.value);
  });
}

const emailIsValid = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const phoneIsValid = (value) => value.replace(/\D/g, "").length >= 10;

const validateField = (field) => {
  const wrapper = field.closest(".field, .field-full");
  let valid = field.value.trim() !== "";

  if (valid && field.type === "email") valid = emailIsValid(field.value.trim());
  if (valid && field.name === "telefone") valid = phoneIsValid(field.value);

  wrapper?.classList.toggle("is-invalid", !valid);
  return valid;
};

if (contactForm) {
  const fields = [...contactForm.querySelectorAll("input, textarea, select")];

  fields.forEach((field) => {
    field.addEventListener("blur", () => validateField(field));
    field.addEventListener("input", () => {
      if (field.closest(".is-invalid")) validateField(field);
    });
  });

  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const valid = fields.every((field) => validateField(field));

    if (!valid) {
      feedback.textContent =
        "Confira os campos destacados. O formulario precisa estar completo para prosseguir.";
      return;
    }

    feedback.textContent =
      "Solicitacao validada com sucesso. Sua mensagem esta pronta para envio.";
    contactForm.reset();
    const stateField = contactForm.querySelector('select[name="estado"]');
    if (stateField) stateField.value = "SP";
    if (phoneInput) phoneInput.value = "";
    fields.forEach((field) => field.closest(".field, .field-full")?.classList.remove("is-invalid"));
  });
}
