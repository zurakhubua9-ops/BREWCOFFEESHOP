"use strict";

/* VIDEO PLAYBACK */

const mobileScreen = window.matchMedia("(max-width: 640px)");
const reducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
);

const players = [];

function createPlayer(videoId, buttonId, messageId) {
  const video = document.getElementById(videoId);
  const button = document.getElementById(buttonId);
  const message = document.getElementById(messageId);

  let wanted = false;
  let pending = false;
  let sourceVersion = 0;
  let intentVersion = 0;

  const player = {
    video,
    visible: false,
    userPaused: false,
    manual: false,
    failed: false
  };

  players.push(player);

  video.muted = true;
  video.defaultMuted = true;
  button.hidden = false;

  function showMessage(text) {
    message.textContent = text;
    message.hidden = !text;
  }

  function updateButton() {
    const paused = video.paused;

    button.textContent = paused
      ? "Play video ▶"
      : "Pause Ⅱ";

    button.setAttribute(
      "aria-label",
      paused
        ? "Play background video"
        : "Pause background video"
    );
  }

  function shouldPlay() {
    return (
      player.visible &&
      !document.hidden &&
      !document.querySelector("dialog[open]") &&
      !player.userPaused &&
      !player.failed &&
      (!reducedMotion.matches || player.manual)
    );
  }

  async function requestPlay() {
    if (pending || !wanted || !video.paused) return;

    pending = true;

    const version = sourceVersion;
    const intent = intentVersion;

    video.muted = true;
    showMessage("");

    try {
      await video.play();

      if (!wanted || !shouldPlay()) {
        video.pause();
      }
    } catch (error) {
      if (version !== sourceVersion || !wanted) return;

      if (error.name === "NotAllowedError") {
        showMessage("Press Play to start the video.");
      } else if (error.name !== "AbortError") {
        showMessage(
          "Video unavailable. Check the file in your assets folder."
        );
      }
    } finally {
      pending = false;
      updateButton();

      if (
        (version !== sourceVersion || intent !== intentVersion) &&
        wanted &&
        shouldPlay()
      ) {
        requestPlay();
      }
    }
  }

  player.sync = function () {
    const nextWanted = shouldPlay();

    if (nextWanted !== wanted) {
      intentVersion += 1;
    }

    wanted = nextWanted;

    if (wanted) {
      requestPlay();
    } else {
      video.pause();
      updateButton();
    }
  };

  player.setSource = function (source, poster) {
    video.poster = poster;

    if (video.getAttribute("src") === source) return;

    sourceVersion += 1;
    wanted = false;

    video.pause();
    player.failed = false;
    showMessage("");

    video.setAttribute("src", source);
    video.load();
    player.sync();
  };

  button.addEventListener("click", () => {
    if (video.paused) {
      player.failed = false;
      player.userPaused = false;
      player.manual = true;

      if (video.error) {
        video.load();
      }

      player.sync();
    } else {
      player.userPaused = true;
      player.manual = false;
      player.sync();
    }
  });

  video.addEventListener("play", () => {
    showMessage("");
    updateButton();
  });

  video.addEventListener("pause", updateButton);

  video.addEventListener("loadeddata", () => {
    player.failed = false;
    player.sync();
  });

  video.addEventListener("error", () => {
    player.failed = true;
    wanted = false;

    const code = video.error?.code;

    showMessage(
      code === 3 || code === 4
        ? "Video cannot be loaded. Check its file path and MP4 format."
        : "Video loading failed. Check the file in your assets folder."
    );

    updateButton();
  });

  updateButton();
  return player;
}

const heroPlayer = createPlayer(
  "hero-video",
  "hero-control",
  "hero-message"
);

const ritualPlayer = createPlayer(
  "ritual-video",
  "ritual-control",
  "ritual-message"
);

function updateHeroSource() {
  const mobile = mobileScreen.matches;

  heroPlayer.setSource(
    mobile
      ? "assets/latte-art.mp4"
      : "assets/hero-espresso.mp4",
    mobile
      ? "assets/latte.jpg"
      : "assets/espresso.jpg"
  );
}

updateHeroSource();

mobileScreen.addEventListener("change", updateHeroSource);

if ("IntersectionObserver" in window) {
  const videoObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const player = entry.target.id === "home"
          ? heroPlayer
          : ritualPlayer;

        player.visible = entry.isIntersecting;
        player.sync();
      });
    },
    { threshold: 0.05 }
  );

  videoObserver.observe(document.getElementById("home"));
  videoObserver.observe(document.getElementById("ritual"));
} else {
  heroPlayer.visible = true;
  ritualPlayer.visible = true;

  heroPlayer.sync();
  ritualPlayer.sync();
}

document.addEventListener("visibilitychange", () => {
  players.forEach((player) => player.sync());
});

reducedMotion.addEventListener("change", () => {
  players.forEach((player) => {
    player.manual = false;
    player.sync();
  });
});

/* PRODUCT DATA — SAMPLE PRICES AND VOLUMES */

const products = [
  {
    id: "espresso",
    name: "Espresso",
    category: "hot",
    image: "assets/espresso.jpg",
    description:
      "A concentrated shot with a rich aroma and a bold finish.",
    variants: [
      { label: "Single", volume: "30 ml", price: 5 },
      { label: "Double", volume: "60 ml", price: 7 }
    ]
  },
  {
    id: "latte",
    name: "Caffè Latte",
    category: "hot",
    image: "assets/latte.jpg",
    description:
      "Espresso, steamed milk, and a soft, silky layer of foam.",
    variants: [
      { label: "S", volume: "240 ml", price: 5 },
      { label: "M", volume: "350 ml", price: 7 },
      { label: "L", volume: "480 ml", price: 8 }
    ]
  },
  {
    id: "iced-latte",
    name: "Iced Latte",
    category: "cold",
    image: "assets/iced-latte.jpg",
    description:
      "Espresso, chilled milk, and ice. Your favourite, on the cool side.",
    variants: [
      { label: "S", volume: "240 ml", price: 7 },
      { label: "M", volume: "350 ml", price: 9 },
      { label: "L", volume: "480 ml", price: 10 }
    ]
  },
  {
    id: "croissant",
    name: "Butter Croissant",
    category: "food",
    image: "assets/croissant.jpg",
    description:
      "Golden, flaky layers with a buttery centre. Better with coffee.",
    variants: [
      { label: "One piece", volume: "", price: 7 }
    ]
  },
  {
    id: "brownie",
    name: "Chocolate Brownie",
    category: "food",
    image: "assets/brownie.jpg",
    description:
      "A rich chocolate treat for a well-deserved little pause.",
    variants: [
      { label: "One serving", volume: "", price: 9 }
    ]
  }
];

const categories = {
  hot: "HOT COFFEE",
  cold: "ICED & COLD",
  food: "SOMETHING SWEET"
};

const sizeNames = {
  S: "Small",
  M: "Medium",
  L: "Large"
};

const chosenSizes = new Map();

const grid = document.getElementById("product-grid");
const search = document.getElementById("menu-search");
const filters = document.querySelectorAll("[data-filter]");
const resultsStatus = document.getElementById("results-status");

let activeFilter = "all";

function getSize(product) {
  return chosenSizes.get(product.id) ?? 0;
}

function priceText(price) {
  return `${price} ₾`;
}

function describeVariant(variant) {
  return [
    sizeNames[variant.label] || variant.label,
    variant.volume,
    `${variant.price} GEL`
  ].filter(Boolean).join(", ");
}

function searchText(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function renderProducts(announce = false) {
  const query = searchText(search.value.trim());

  const visible = products.filter((product) => {
    const matchesCategory =
      activeFilter === "all" ||
      product.category === activeFilter;

    const text = searchText(
      `${product.name} ${product.description}`
    );

    return matchesCategory && text.includes(query);
  });

  grid.innerHTML = visible.map((product) => {
    const current = getSize(product);
    const variant = product.variants[current];

    return `
      <article class="product" data-product="${product.id}">
        <button
          class="product-open"
          type="button"
          data-open="${product.id}"
          aria-label="View ${product.name} details"
          aria-haspopup="dialog"
          aria-controls="product-dialog"
        >
          <span class="product-image">
            <img
              src="${product.image}"
              alt="${product.name}"
              loading="lazy"
            >

            <span class="product-category">
              ${categories[product.category]}
            </span>

            <span class="product-arrow" aria-hidden="true">↗</span>
          </span>
        </button>

        <div class="product-caption">
          <h3>${product.name}</h3>
          <span class="product-price">
            ${priceText(variant.price)}
          </span>
        </div>

        <p class="product-description">
          ${product.description}
        </p>

        ${
          product.variants.length > 1
            ? `
              <div
                class="quick-sizes"
                role="group"
                aria-label="${product.name} size"
              >
                ${product.variants.map((item, index) => `
                  <button
                    class="quick-size"
                    type="button"
                    data-id="${product.id}"
                    data-size="${index}"
                    aria-label="${describeVariant(item)}"
                    aria-pressed="${index === current}"
                  >
                    ${item.label}
                  </button>
                `).join("")}
              </div>
            `
            : `
              <span class="sample-note">
                ${variant.label}
              </span>
            `
        }
      </article>
    `;
  }).join("");

  document.getElementById("empty-message").hidden =
    visible.length > 0;

  if (announce) {
    resultsStatus.textContent =
      `${visible.length} ` +
      `${visible.length === 1 ? "product" : "products"} found.`;
  }
}

function updateCard(product) {
  const card = grid.querySelector(
    `[data-product="${product.id}"]`
  );

  if (!card) return;

  const current = getSize(product);

  card.querySelector(".product-price").textContent =
    priceText(product.variants[current].price);

  card.querySelectorAll("[data-size]").forEach((button) => {
    button.setAttribute(
      "aria-pressed",
      String(Number(button.dataset.size) === current)
    );
  });
}

function selectCategory(value) {
  activeFilter = value;

  filters.forEach((button) => {
    button.setAttribute(
      "aria-pressed",
      String(button.dataset.filter === value)
    );
  });

  renderProducts(true);
}

filters.forEach((button) => {
  button.addEventListener("click", () => {
    selectCategory(button.dataset.filter);
  });
});

search.addEventListener("input", () => {
  renderProducts(true);
});

document.getElementById("show-treats").addEventListener("click", () => {
  search.value = "";
  selectCategory("food");
});

grid.addEventListener("click", (event) => {
  const sizeButton = event.target.closest("[data-size]");

  if (sizeButton) {
    const product = products.find(
      (item) => item.id === sizeButton.dataset.id
    );

    const index = Number(sizeButton.dataset.size);

    chosenSizes.set(product.id, index);
    updateCard(product);

    resultsStatus.textContent =
      `${product.name}, ${describeVariant(product.variants[index])}.`;

    return;
  }

  const openButton = event.target.closest("[data-open]");

  if (openButton) {
    openProduct(openButton.dataset.open);
  }
});

/* NAVIGATION AND DIALOGS */

const navigation = document.getElementById("navigation");
const navButton = document.getElementById("open-navigation");
const productDialog = document.getElementById("product-dialog");
const imageViewer = document.getElementById("image-viewer");
const viewerImage = document.getElementById("viewer-image");
const sizeOptions = document.getElementById("size-options");

let currentProduct = null;

function syncScrollLock() {
  document.body.classList.toggle(
    "locked",
    navigation.open || productDialog.open || imageViewer.open
  );

  players.forEach((player) => player.sync());
}

navButton.addEventListener("click", () => {
  navigation.showModal();
  navButton.setAttribute("aria-expanded", "true");
  syncScrollLock();
});

document.getElementById("close-navigation").addEventListener(
  "click",
  () => navigation.close()
);

navigation.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", () => {
    navigation.close();
  });
});

navigation.addEventListener("close", () => {
  navButton.setAttribute("aria-expanded", "false");
  syncScrollLock();
});

function updateDetailPrice() {
  const variant =
    currentProduct.variants[getSize(currentProduct)];

  document.getElementById("detail-price").textContent =
    priceText(variant.price);

  document.getElementById("detail-unit").textContent = [
    sizeNames[variant.label] || variant.label,
    variant.volume
  ].filter(Boolean).join(" · ");
}

function openProduct(id) {
  currentProduct = products.find(
    (product) => product.id === id
  );

  const image = document.getElementById("detail-image");

  image.src = currentProduct.image;
  image.alt = currentProduct.name;

  document.getElementById("detail-name").textContent =
    currentProduct.name;

  document.getElementById("detail-category").textContent =
    categories[currentProduct.category];

  document.getElementById("detail-description").textContent =
    currentProduct.description;

  const hasSizes = currentProduct.variants.length > 1;

  document.getElementById("size-fieldset").hidden = !hasSizes;

  sizeOptions.innerHTML = currentProduct.variants.map(
    (variant, index) => `
      <label class="size-choice">
        <input
          type="radio"
          name="product-size"
          value="${index}"
          aria-label="${describeVariant(variant)}"
          ${index === getSize(currentProduct) ? "checked" : ""}
        >

        <span>
          ${variant.label}
          <small>${variant.volume}</small>
          <small>${priceText(variant.price)}</small>
        </span>
      </label>
    `
  ).join("");

  updateDetailPrice();
  productDialog.showModal();
  productDialog.scrollTop = 0;
  syncScrollLock();
}

sizeOptions.addEventListener("change", (event) => {
  if (!event.target.matches('input[name="product-size"]')) return;

  chosenSizes.set(
    currentProduct.id,
    Number(event.target.value)
  );

  updateDetailPrice();
  updateCard(currentProduct);
});

document.getElementById("close-product").addEventListener(
  "click",
  () => productDialog.close()
);

productDialog.addEventListener("close", () => {
  if (imageViewer.open) imageViewer.close();
  syncScrollLock();
});

productDialog.addEventListener("click", (event) => {
  if (event.target !== productDialog) return;

  const rect = productDialog.getBoundingClientRect();

  const outside =
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom;

  if (outside) productDialog.close();
});

/* ENLARGED PRODUCT PHOTO */

document.getElementById("zoom-product").addEventListener("click", () => {
  const productImage = document.getElementById("detail-image");

  viewerImage.src = productImage.currentSrc || productImage.src;
  viewerImage.alt = productImage.alt;

  imageViewer.showModal();
  syncScrollLock();
});

document.getElementById("close-viewer").addEventListener(
  "click",
  () => imageViewer.close()
);

imageViewer.addEventListener("close", syncScrollLock);

imageViewer.addEventListener("click", (event) => {
  if (event.target === imageViewer) {
    imageViewer.close();
    return;
  }

  if (event.target !== viewerImage) return;

  const rect = viewerImage.getBoundingClientRect();

  if (!viewerImage.naturalWidth || !viewerImage.naturalHeight) return;

  const scale = Math.min(
    rect.width / viewerImage.naturalWidth,
    rect.height / viewerImage.naturalHeight
  );

  const width = viewerImage.naturalWidth * scale;
  const height = viewerImage.naturalHeight * scale;
  const left = rect.left + (rect.width - width) / 2;
  const top = rect.top + (rect.height - height) / 2;

  const outside =
    event.clientX < left ||
    event.clientX > left + width ||
    event.clientY < top ||
    event.clientY > top + height;

  if (outside) imageViewer.close();
});

/* SCROLL ANIMATION */

if ("IntersectionObserver" in window && !reducedMotion.matches) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("reveal-arrive");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  document.querySelectorAll("[data-reveal]").forEach((element) => {
    revealObserver.observe(element);
  });
}

/* STICKY HEADER */

const siteHeader = document.querySelector(".header");

function updateHeader() {
  siteHeader.classList.toggle(
    "is-scrolled",
    window.scrollY > 20
  );
}

window.addEventListener("scroll", updateHeader, { passive: true });
updateHeader();

document.getElementById("year").textContent =
  new Date().getFullYear();

renderProducts();