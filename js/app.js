/* ============================================================
   APP — tabs, modal helper, sign-in flow, boot sequence
   ============================================================ */

const App = {
  init() {
    Store.init();
    this.bindTabs();
    Store.onChange(() => this.renderAll());
    this.renderAll();
  },

  bindTabs() {
    document.querySelectorAll(".tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
        btn.classList.add("active");
        document.getElementById("view-" + btn.dataset.tab).classList.add("active");
      });
    });
  },

  renderAll() {
    Meals.render();
    Recipes.render();
    Grocery.render();
    Finance.render();
    this.updateMascot();
  },

  updateSyncBadge(isSynced) {
    const dot = document.querySelector("#syncStatus .dot");
    const text = document.getElementById("syncText");
    if (isSynced) {
      dot.classList.add("synced");
      text.textContent = "Synced";
    } else {
      dot.classList.remove("synced");
      text.textContent = "Local only";
    }
  },

  updateMascot() {
    // small delight: mascot mood shifts based on today's meals + budget health
    const mascot = document.getElementById("mascot");
    const todayKey = Meals.dateKey(new Date());
    const today = Store.state.meals[todayKey];
    const mealsPlanned = today && (today.breakfast || today.lunch || today.dinner);
    mascot.textContent = mealsPlanned ? "🍑" : "🌱";
  },

  // ---------- Modal helpers ----------
  openModal(html) {
    document.getElementById("modal").innerHTML = html;
    document.getElementById("modalBackdrop").classList.add("open");
  },
  closeModal() {
    document.getElementById("modalBackdrop").classList.remove("open");
  },

  // ---------- Sign-in flow (only shown if Firebase is configured) ----------
  showSignIn() {
    this.openModal(`
      <h3>Welcome back 🍑</h3>
      <p class="sub" style="margin-bottom:10px;">Sign in to sync your meals & money across devices.</p>
      <label>Email</label>
      <input type="email" id="authEmail" placeholder="you@email.com" />
      <label>Password</label>
      <input type="password" id="authPassword" placeholder="At least 6 characters" />
      <p id="authError" style="color:#E07A6F; font-size:12px; margin-top:8px;"></p>
      <div class="modal-actions">
        <button class="btn-ghost" id="authSignUp">Create account</button>
        <button class="btn-primary" id="authSignIn">Sign in</button>
      </div>
    `);
    document.getElementById("authSignIn").onclick = () => this._doAuth("signIn");
    document.getElementById("authSignUp").onclick = () => this._doAuth("signUp");
  },

  async _doAuth(mode) {
    const email = document.getElementById("authEmail").value.trim();
    const password = document.getElementById("authPassword").value;
    const errEl = document.getElementById("authError");
    if (!email || password.length < 6) {
      errEl.textContent = "Enter a valid email and a password of 6+ characters.";
      return;
    }
    try {
      await Store[mode](email, password);
      this.closeModal();
    } catch (e) {
      errEl.textContent = e.message;
    }
  }
};

document.getElementById("modalBackdrop").addEventListener("click", (e) => {
  if (e.target.id === "modalBackdrop") App.closeModal();
});

window.App = App; // expose globally so store.js can call App.showSignIn()
window.addEventListener("DOMContentLoaded", () => App.init());
