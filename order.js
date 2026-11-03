"use strict";
(() => {
  const key = "brew-bag-v1";
  const savedKey = "brew-order-v1";
  const dialog = document.getElementById("bag-dialog");
  const status = document.getElementById("bag-status");
  let bag = readBag();
  function readBag() {
    try {
      const data = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(data) ? data.filter(item => item &&
        products.some(p => p.id === item.id && p.variants[item.variant]) &&
        Number.isInteger(item.variant) && Number.isInteger(item.quantity) &&
        item.quantity > 0 && item.quantity <= 99) : [];
    } catch { return []; }
  }
  function persist(next) {
    try { localStorage.setItem(key, JSON.stringify(next)); bag = next; render(); return true; }
    catch { status.textContent = "Storage is unavailable. Your bag has not been saved."; return false; }
  }
  function details(item) {
    const product = products.find(p => p.id === item.id);
    return { product, variant: product.variants[item.variant] };
  }
  function total() { return bag.reduce((sum, item) => sum + details(item).variant.price * item.quantity, 0); }
  function render() {
    document.getElementById("bag-count").textContent = bag.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById("bag-total").textContent = priceText(total());
    document.getElementById("save-order").disabled = !bag.length;
    const root = document.getElementById("bag-items");
    root.replaceChildren();
    if (!bag.length) { root.textContent = "Your bag is empty. Explore the menu and add a favourite."; }
    bag.forEach((item, index) => {
      const { product, variant } = details(item);
      const row = document.createElement("div"); row.className = "bag-row";
      const info = document.createElement("div");
      const name = document.createElement("strong"); name.textContent = product.name;
      const note = document.createElement("small"); note.textContent = variant.label + " · " + priceText(variant.price * item.quantity);
      info.append(name, note);
      const quantity = document.createElement("div"); quantity.className = "bag-quantity";
      for (const delta of [-1, 1]) {
        const button = document.createElement("button"); button.type = "button";
        button.textContent = delta < 0 ? "−" : "+";
        button.setAttribute("aria-label", (delta < 0 ? "Decrease " : "Increase ") + product.name + " quantity");
        button.disabled = delta > 0 && item.quantity >= 99;
        button.addEventListener("click", () => {
          const next = bag.map(entry => ({...entry})); next[index].quantity += delta;
          if (persist(next.filter(entry => entry.quantity > 0))) {
            status.textContent = "Bag updated.";
            const buttons = root.querySelectorAll(".bag-quantity button");
            buttons[Math.min(index * 2 + (delta > 0 ? 1 : 0), buttons.length - 1)]?.focus();
          }
        });
        if (delta > 0) { const count = document.createElement("span"); count.textContent = item.quantity; quantity.append(count); }
        quantity.append(button);
      }
      row.append(info, quantity); root.append(row);
    });
  }
  function syncLock() { document.body.classList.toggle("locked", !!document.querySelector("dialog[open]")); players.forEach(player => player.sync()); }
  function openBag() { render(); dialog.showModal(); syncLock(); }
  document.getElementById("open-bag").addEventListener("click", openBag);
  document.getElementById("close-bag").addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", syncLock);
  document.getElementById("add-to-bag").addEventListener("click", () => {
    if (!currentProduct) return;
    bag = readBag();
    const next = bag.map(item => ({...item}));
    const variant = getSize(currentProduct);
    const item = next.find(item => item.id === currentProduct.id && item.variant === variant);
    if (item && item.quantity >= 99) { productDialog.close(); openBag(); status.textContent = "Maximum quantity is 99 per item."; return; }
    if (item) item.quantity++; else next.push({ id: currentProduct.id, variant, quantity: 1 });
    productDialog.close(); openBag();
    if (persist(next)) status.textContent = currentProduct.name + " added to your bag.";
  });
  function showSaved() {
    try {
      const record = JSON.parse(localStorage.getItem(savedKey) || "null");
      const valid = record && typeof record.summary === "string" && record.summary.length < 20000;
      document.getElementById("saved-order").hidden = !valid;
      document.getElementById("saved-order-text").textContent = valid ? record.summary : "";
    } catch { document.getElementById("saved-order").hidden = true; }
  }
  document.getElementById("save-order").addEventListener("click", () => {
    if (!bag.length) return;
    const summary = ["BREW · ORDER SUMMARY", "Reference: BR-" + crypto.randomUUID(),
      ...bag.map(item => { const {product, variant} = details(item); return item.quantity + " × " + product.name + " / " + variant.label + " — " + priceText(variant.price * item.quantity); }),
      "Total: " + priceText(total()), "", "Saved locally. Not sent to a café. No payment taken."].join("\n");
    try {
      localStorage.setItem(savedKey, JSON.stringify({summary}));
      showSaved(); status.textContent = "Order summary saved on this device. Your bag is ready for further edits.";
    } catch { status.textContent = "Could not save your summary. Your bag is unchanged."; }
  });
  document.getElementById("download-order").addEventListener("click", () => {
    const text = document.getElementById("saved-order-text").textContent;
    const url = URL.createObjectURL(new Blob([text], {type:"text/plain;charset=utf-8"}));
    const link = document.createElement("a"); link.href = url; link.download = "brew-order.txt"; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  document.getElementById("delete-order").addEventListener("click", () => {
    try { localStorage.removeItem(savedKey); showSaved(); status.textContent = "Saved summary deleted."; }
    catch { status.textContent = "Could not delete the saved summary."; }
  });
  window.addEventListener("storage", () => { bag = readBag(); render(); showSaved(); });
  render(); showSaved();
})();
