/* ============================================================
   MEALS — weekly planner
   ============================================================ */

const Meals = {
  weekOffset: 0,
  slots: [
    { key: "breakfast", label: "AM", icon: "🍓" },
    { key: "lunch", label: "Noon", icon: "🥪" },
    { key: "dinner", label: "PM", icon: "🍲" }
  ],

  dateKey(d) {
    return toLocalDateKey(d);
  },

  getWeekDates() {
    const now = new Date();
    now.setDate(now.getDate() + this.weekOffset * 7);
    const day = now.getDay(); // 0 = Sun
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((day + 6) % 7));
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      dates.push(d);
    }
    return dates;
  },

  bindNav() {
    document.getElementById("prevWeek").onclick = () => { this.weekOffset--; this.render(); };
    document.getElementById("nextWeek").onclick = () => { this.weekOffset++; this.render(); };
    document.getElementById("todayBtn").onclick = () => { this.weekOffset = 0; this.render(); };
  },

  render() {
    if (!this._bound) { this.bindNav(); this._bound = true; }

    const dates = this.getWeekDates();
    const rangeEl = document.getElementById("weekRange");
    const fmt = (d) => d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    rangeEl.textContent = `${fmt(dates[0])} – ${fmt(dates[6])}`;

    const todayKey = this.dateKey(new Date());
    const grid = document.getElementById("weekGrid");
    grid.innerHTML = "";

    dates.forEach(date => {
      const key = this.dateKey(date);
      const isToday = key === todayKey;
      const dayData = Store.state.meals[key] || {};

      const card = document.createElement("div");
      card.className = "day-card" + (isToday ? " is-today" : "");

      const head = document.createElement("div");
      head.className = "day-card-head";
      head.innerHTML = `
        <span class="day-name">${date.toLocaleDateString(undefined,{weekday:"short"})}</span>
        <span class="day-date">${date.getDate()}</span>
      `;
      card.appendChild(head);

      this.slots.forEach(slot => {
        const meal = dayData[slot.key];
        const el = document.createElement("div");
        el.className = "meal-slot" + (meal ? "" : " empty");
        el.innerHTML = meal
          ? `<span class="meal-slot-icon">${slot.icon}</span><span class="meal-slot-label">${slot.label}</span><span class="meal-slot-name">${meal.name}</span>`
          : `<span class="meal-slot-label">${slot.label}</span> + add`;
        el.onclick = () => this.openSlotModal(key, slot);
        card.appendChild(el);
      });

      grid.appendChild(card);
    });
  },

  openSlotModal(dateKey, slot) {
    const recipes = Store.state.recipes;
    const current = (Store.state.meals[dateKey] || {})[slot.key];

    const options = recipes.map(r => `<option value="${r.id}">${r.title}</option>`).join("");

    App.openModal(`
      <h3>${slot.icon} ${slot.label} — ${dateKey}</h3>
      <label>Quick name (or pick a saved recipe below)</label>
      <input type="text" id="mealName" value="${current ? current.name : ""}" placeholder="e.g. Overnight oats" />
      ${recipes.length ? `
        <label>From your recipe box</label>
        <select id="mealRecipe">
          <option value="">— none —</option>
          ${options}
        </select>
      ` : `<p class="hint">Your recipe box is empty — add recipes from the Recipes tab to pick from here.</p>`}
      <div class="modal-actions">
        ${current ? `<button class="btn-ghost" id="clearMeal">Clear</button>` : ""}
        <button class="btn-primary" id="saveMeal">Save</button>
      </div>
    `);

    const recipeSelect = document.getElementById("mealRecipe");
    if (recipeSelect) {
      if (current && current.recipeId) recipeSelect.value = current.recipeId;
      recipeSelect.onchange = () => {
        const r = recipes.find(r => r.id === recipeSelect.value);
        if (r) document.getElementById("mealName").value = r.title;
      };
    }

    document.getElementById("saveMeal").onclick = () => {
      const name = document.getElementById("mealName").value.trim();
      if (!name) return;
      const recipeId = recipeSelect ? recipeSelect.value || null : null;

      if (!Store.state.meals[dateKey]) Store.state.meals[dateKey] = {};
      Store.state.meals[dateKey][slot.key] = { name, recipeId };
      Store.save();

      // offer to push ingredients to grocery list if a recipe was picked
      if (recipeId) {
        const recipe = recipes.find(r => r.id === recipeId);
        if (recipe && recipe.ingredients && recipe.ingredients.length) {
          Grocery.addFromRecipe(recipe);
        }
      }
      App.closeModal();
    };

    const clearBtn = document.getElementById("clearMeal");
    if (clearBtn) {
      clearBtn.onclick = () => {
        delete Store.state.meals[dateKey][slot.key];
        Store.save();
        App.closeModal();
      };
    }
  }
};
