/* ============================================================
   GROCERY — list with remembered prices, running cost estimate
   ============================================================ */

const Grocery = {
  bindOnce() {
    if (this._bound) return;
    this._bound = true;

    document.getElementById("groceryAddBtn").onclick = () => this.addManual();
    document.getElementById("groceryAddInput").addEventListener("keydown", (e) => {
      if (e.key === "Enter") this.addManual();
    });
    document.getElementById("clearChecked").onclick = () => {
      Store.state.grocery = Store.state.grocery.filter(i => !i.checked);
      Store.save();
    };
  },

  // remembers the last price you entered for an item name, case-insensitive
  rememberedPrice(name) {
    const match = [...Store.state.grocery].reverse().find(
      i => i.name.toLowerCase() === name.toLowerCase() && i.price
    );
    return match ? match.price : null;
  },

  addManual() {
    const nameInput = document.getElementById("groceryAddInput");
    const priceInput = document.getElementById("groceryAddPrice");
    const name = nameInput.value.trim();
    if (!name) return;
    let price = parseFloat(priceInput.value);
    if (isNaN(price)) price = this.rememberedPrice(name) || 0;

    Store.state.grocery.push({ id: "g_" + Date.now() + Math.random(), name, price, checked: false });
    Store.save();
    nameInput.value = "";
    priceInput.value = "";
  },

  addFromRecipe(recipe) {
    recipe.ingredients.forEach(ing => {
      const exists = Store.state.grocery.some(
        g => g.name.toLowerCase() === ing.name.toLowerCase() && !g.checked
      );
      if (!exists) {
        const price = this.rememberedPrice(ing.name) || 0;
        Store.state.grocery.push({
          id: "g_" + Date.now() + Math.random(),
          name: ing.name,
          price,
          checked: false
        });
      }
    });
    Store.save();
  },

  render() {
    this.bindOnce();
    const list = Store.state.grocery;
    const el = document.getElementById("groceryList");
    el.innerHTML = "";

    if (!list.length) {
      el.innerHTML = `<p class="empty-note">Your list is empty — add items above, or pull ingredients in from a recipe.</p>`;
    }

    list.forEach(item => {
      const li = document.createElement("li");
      li.className = item.checked ? "checked" : "";
      li.innerHTML = `
        <span class="grocery-check ${item.checked ? "checked" : ""}"></span>
        <span class="grocery-item-name">${item.name}</span>
        <span class="grocery-item-price">$${(item.price || 0).toFixed(2)}</span>
        <button class="grocery-remove">✕</button>
      `;
      li.querySelector(".grocery-check").onclick = () => {
        item.checked = !item.checked;
        Store.save();
      };
      li.querySelector(".grocery-remove").onclick = () => {
        Store.state.grocery = Store.state.grocery.filter(g => g.id !== item.id);
        Store.save();
      };
      el.appendChild(li);
    });

    const total = list.filter(i => !i.checked).reduce((s, i) => s + (i.price || 0), 0);
    document.getElementById("groceryTotal").textContent = "$" + total.toFixed(2);
  }
};
