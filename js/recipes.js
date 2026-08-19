/* ============================================================
   RECIPES — saved recipe box + search (TheMealDB, free, no key)
   ============================================================ */

const Recipes = {
  searchCache: [],

  bindOnce() {
    if (this._bound) return;
    this._bound = true;

    document.getElementById("apiHint").textContent =
      "Search pulls from TheMealDB, a free public recipe database — no account needed.";

    document.querySelectorAll(".recipe-tabs .chip").forEach(chip => {
      chip.addEventListener("click", () => {
        document.querySelectorAll(".recipe-tabs .chip").forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        const tab = chip.dataset.recipeTab;
        document.getElementById("savedRecipes").style.display = tab === "saved" ? "grid" : "none";
        document.getElementById("searchResults").style.display = tab === "results" ? "grid" : "none";
      });
    });

    document.getElementById("recipeSearchBtn").onclick = () => this.doSearch();
    document.getElementById("recipeSearch").addEventListener("keydown", (e) => {
      if (e.key === "Enter") this.doSearch();
    });

    document.getElementById("addManualRecipe").onclick = () => this.openManualModal();
  },

  async doSearch() {
    const q = document.getElementById("recipeSearch").value.trim();
    if (!q) return;
    const resultsEl = document.getElementById("searchResults");
    resultsEl.innerHTML = `<p class="empty-note">Searching…</p>`;
    document.querySelectorAll(".recipe-tabs .chip").forEach(c => c.classList.remove("active"));
    document.querySelector('[data-recipe-tab="results"]').classList.add("active");
    document.getElementById("savedRecipes").style.display = "none";
    resultsEl.style.display = "grid";

    try {
      const res = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(q)}`);
      const data = await res.json();
      this.searchCache = data.meals || [];
      this.renderResults();
    } catch (e) {
      resultsEl.innerHTML = `<p class="empty-note">Couldn't reach the recipe search right now. Check your connection and try again.</p>`;
    }
  },

  renderResults() {
    const resultsEl = document.getElementById("searchResults");
    if (!this.searchCache.length) {
      resultsEl.innerHTML = `<p class="empty-note">No recipes found — try a different search.</p>`;
      return;
    }
    resultsEl.innerHTML = "";
    this.searchCache.forEach(meal => {
      const card = document.createElement("div");
      card.className = "recipe-card";
      card.innerHTML = `
        <img src="${meal.strMealThumb}" alt="${meal.strMeal}" />
        <div class="recipe-card-body">
          <div class="recipe-card-title">${meal.strMeal}</div>
          <div class="recipe-card-sub">${meal.strArea || ""} ${meal.strCategory ? "· " + meal.strCategory : ""}</div>
        </div>
      `;
      card.onclick = () => this.previewApiRecipe(meal);
      resultsEl.appendChild(card);
    });
  },

  extractIngredients(meal) {
    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
      const name = meal[`strIngredient${i}`];
      const measure = meal[`strMeasure${i}`];
      if (name && name.trim()) {
        ingredients.push({ name: name.trim(), amount: (measure || "").trim() });
      }
    }
    return ingredients;
  },

  previewApiRecipe(meal) {
    const ingredients = this.extractIngredients(meal);
    App.openModal(`
      <h3>${meal.strMeal}</h3>
      <img src="${meal.strMealThumb}" style="width:100%;border-radius:14px;margin-bottom:10px;" />
      <label>Ingredients</label>
      <ul style="margin:0; padding-left:18px; font-size:13px; color:var(--text-soft);">
        ${ingredients.map(i => `<li>${i.amount} ${i.name}</li>`).join("")}
      </ul>
      <div class="modal-actions">
        <button class="btn-primary" id="saveApiRecipe">Save to my box</button>
      </div>
    `);
    document.getElementById("saveApiRecipe").onclick = () => {
      const recipe = {
        id: "r_" + Date.now(),
        title: meal.strMeal,
        image: meal.strMealThumb,
        ingredients,
        sourceUrl: meal.strSource || meal.strYoutube || ""
      };
      Store.state.recipes.push(recipe);
      Store.save();
      App.closeModal();
    };
  },

  openManualModal() {
    App.openModal(`
      <h3>Add your own recipe</h3>
      <label>Title</label>
      <input type="text" id="manTitle" placeholder="e.g. Mom's fried rice" />
      <label>Ingredients (one per line)</label>
      <textarea id="manIngredients" rows="6" placeholder="2 eggs&#10;1 cup rice&#10;soy sauce"></textarea>
      <div class="modal-actions">
        <button class="btn-primary" id="saveManual">Save</button>
      </div>
    `);
    document.getElementById("saveManual").onclick = () => {
      const title = document.getElementById("manTitle").value.trim();
      const lines = document.getElementById("manIngredients").value.split("\n").map(l => l.trim()).filter(Boolean);
      if (!title) return;
      Store.state.recipes.push({
        id: "r_" + Date.now(),
        title,
        image: "",
        ingredients: lines.map(name => ({ name, amount: "" })),
        sourceUrl: ""
      });
      Store.save();
      App.closeModal();
    };
  },

  render() {
    this.bindOnce();
    const saved = Store.state.recipes;
    const el = document.getElementById("savedRecipes");
    if (!saved.length) {
      el.innerHTML = `<p class="empty-note">No recipes saved yet — search above or add your own.</p>`;
      return;
    }
    el.innerHTML = "";
    saved.forEach(r => {
      const card = document.createElement("div");
      card.className = "recipe-card";
      card.innerHTML = `
        ${r.image ? `<img src="${r.image}" alt="${r.title}" />` : `<div style="height:80px;display:flex;align-items:center;justify-content:center;font-size:28px;background:var(--bg-alt);">📝</div>`}
        <div class="recipe-card-body">
          <div class="recipe-card-title">${r.title}</div>
          <div class="recipe-card-sub">${r.ingredients.length} ingredients</div>
        </div>
      `;
      card.onclick = () => this.openSavedModal(r);
      el.appendChild(card);
    });
  },

  openSavedModal(r) {
    App.openModal(`
      <h3>${r.title}</h3>
      ${r.image ? `<img src="${r.image}" style="width:100%;border-radius:14px;margin-bottom:10px;" />` : ""}
      <label>Ingredients</label>
      <ul style="margin:0; padding-left:18px; font-size:13px; color:var(--text-soft);">
        ${r.ingredients.map(i => `<li>${i.amount ? i.amount + " " : ""}${i.name}</li>`).join("")}
      </ul>
      <div class="modal-actions">
        <button class="btn-ghost" id="deleteRecipe">Delete</button>
        <button class="btn-primary" id="addToGroceryFromModal">Add ingredients to grocery list</button>
      </div>
    `);
    document.getElementById("addToGroceryFromModal").onclick = () => {
      Grocery.addFromRecipe(r);
      App.closeModal();
    };
    document.getElementById("deleteRecipe").onclick = () => {
      Store.state.recipes = Store.state.recipes.filter(x => x.id !== r.id);
      Store.save();
      App.closeModal();
    };
  }
};
