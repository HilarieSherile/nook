/* ============================================================
   FINANCE — monthly budgets, expense log, savings goal
   ============================================================ */

const Finance = {
  monthOffset: 0,
  defaultCategories: ["Food", "Transport", "Fun", "Bills", "Other"],
  catColors: {
    Food: "#F4A9B8", Transport: "#C9B6E4", Fun: "#F7C873",
    Bills: "#9BC7D9", Other: "#A8C9A1"
  },

  monthKey() {
    const d = new Date();
    d.setMonth(d.getMonth() + this.monthOffset);
    return toLocalDateKey(d).slice(0, 7); // YYYY-MM
  },

  bindOnce() {
    if (this._bound) return;
    this._bound = true;
    document.getElementById("prevMonth").onclick = () => { this.monthOffset--; this.render(); };
    document.getElementById("nextMonth").onclick = () => { this.monthOffset++; this.render(); };
    document.getElementById("addExpenseBtn").onclick = () => this.openExpenseModal();
    document.getElementById("editGoalBtn").onclick = () => this.openGoalModal();
  },

  getBudgets() {
    const key = this.monthKey();
    if (!Store.state.finance.budgets[key]) {
      const budget = {};
      this.defaultCategories.forEach(c => budget[c] = 0);
      Store.state.finance.budgets[key] = budget;
    }
    return Store.state.finance.budgets[key];
  },

  getMonthExpenses() {
    const key = this.monthKey();
    return Store.state.finance.expenses.filter(e => e.date.slice(0, 7) === key);
  },

  render() {
    this.bindOnce();
    const key = this.monthKey();
    const label = new Date(key + "-02").toLocaleDateString(undefined, { month: "long", year: "numeric" });
    document.getElementById("financeMonthLabel").textContent = label;

    // ---- budget sticky cards ----
    const budgets = this.getBudgets();
    const expenses = this.getMonthExpenses();
    const spentByCat = {};
    expenses.forEach(e => spentByCat[e.category] = (spentByCat[e.category] || 0) + e.amount);

    const cardsEl = document.getElementById("budgetCards");
    cardsEl.innerHTML = "";
    Object.keys(budgets).forEach((cat, i) => {
      const spent = spentByCat[cat] || 0;
      const budget = budgets[cat] || 0;
      const pct = budget > 0 ? Math.min(100, (spent / budget) * 100) : (spent > 0 ? 100 : 0);
      const over = budget > 0 && spent > budget;

      const card = document.createElement("div");
      card.className = "sticky-card";
      card.style.setProperty("--tilt", (i % 2 === 0 ? "-1deg" : "1deg"));
      card.innerHTML = `
        <h3>${cat}</h3>
        <div class="sticky-amounts">$${spent.toFixed(0)} of $${budget.toFixed(0)}</div>
        <div class="bar-track"><div class="bar-fill ${over ? "over" : ""}" style="width:${pct}%"></div></div>
      `;
      card.onclick = () => this.openBudgetEditModal(cat, budget);
      cardsEl.appendChild(card);
    });

    // ---- goal card ----
    const goal = Store.state.finance.goal;
    const goalPct = goal.target > 0 ? Math.min(100, (goal.current / goal.target) * 100) : 0;
    document.getElementById("goalCard").innerHTML = `
      <div class="goal-title">${goal.title}</div>
      <div class="goal-amounts">$${goal.current.toFixed(0)} saved of $${goal.target.toFixed(0)} goal</div>
      <div class="bar-track"><div class="bar-fill" style="width:${goalPct}%; background:var(--sage-deep);"></div></div>
    `;

    // ---- expense list ----
    const listEl = document.getElementById("expenseList");
    listEl.innerHTML = "";
    if (!expenses.length) {
      listEl.innerHTML = `<p class="empty-note">No expenses logged this month yet.</p>`;
    }
    [...expenses].sort((a, b) => b.date.localeCompare(a.date)).forEach(exp => {
      const li = document.createElement("li");
      li.innerHTML = `
        <span class="expense-cat-dot" style="background:${this.catColors[exp.category] || "#ccc"}"></span>
        <span class="expense-desc">${exp.desc}<div class="expense-meta">${exp.category} · ${exp.date}</div></span>
        <span class="expense-amt">$${exp.amount.toFixed(2)}</span>
      `;
      li.onclick = () => this.openExpenseModal(exp);
      listEl.appendChild(li);
    });
  },

  openBudgetEditModal(cat, current) {
    App.openModal(`
      <h3>${cat} budget</h3>
      <label>Monthly budget for ${cat}</label>
      <input type="number" id="budgetAmt" value="${current}" step="1" />
      <div class="modal-actions">
        <button class="btn-primary" id="saveBudget">Save</button>
      </div>
    `);
    document.getElementById("saveBudget").onclick = () => {
      const val = parseFloat(document.getElementById("budgetAmt").value) || 0;
      this.getBudgets()[cat] = val;
      Store.save();
      App.closeModal();
    };
  },

  openGoalModal() {
    const goal = Store.state.finance.goal;
    App.openModal(`
      <h3>Savings goal</h3>
      <label>Goal name</label>
      <input type="text" id="goalTitle" value="${goal.title}" />
      <label>Target amount</label>
      <input type="number" id="goalTarget" value="${goal.target}" step="1" />
      <label>Currently saved</label>
      <input type="number" id="goalCurrent" value="${goal.current}" step="1" />
      <div class="modal-actions">
        <button class="btn-primary" id="saveGoal">Save</button>
      </div>
    `);
    document.getElementById("saveGoal").onclick = () => {
      Store.state.finance.goal = {
        title: document.getElementById("goalTitle").value.trim() || "Savings goal",
        target: parseFloat(document.getElementById("goalTarget").value) || 0,
        current: parseFloat(document.getElementById("goalCurrent").value) || 0
      };
      Store.save();
      App.closeModal();
    };
  },

  openExpenseModal(existing) {
    const cats = Object.keys(this.getBudgets());
    const today = toLocalDateKey(new Date());
    App.openModal(`
      <h3>${existing ? "Edit expense" : "Add expense"}</h3>
      <label>Description</label>
      <input type="text" id="expDesc" value="${existing ? existing.desc : ""}" placeholder="e.g. Groceries" />
      <label>Amount</label>
      <input type="number" id="expAmt" value="${existing ? existing.amount : ""}" step="0.01" />
      <label>Category</label>
      <select id="expCat">
        ${cats.map(c => `<option value="${c}" ${existing && existing.category === c ? "selected" : ""}>${c}</option>`).join("")}
      </select>
      <label>Date</label>
      <input type="date" id="expDate" value="${existing ? existing.date : today}" />
      <div class="modal-actions">
        ${existing ? `<button class="btn-ghost" id="deleteExp">Delete</button>` : ""}
        <button class="btn-primary" id="saveExp">Save</button>
      </div>
    `);
    document.getElementById("saveExp").onclick = () => {
      const desc = document.getElementById("expDesc").value.trim();
      const amount = parseFloat(document.getElementById("expAmt").value);
      const category = document.getElementById("expCat").value;
      const date = document.getElementById("expDate").value;
      if (!desc || isNaN(amount) || !date) return;

      if (existing) {
        Object.assign(existing, { desc, amount, category, date });
      } else {
        Store.state.finance.expenses.push({ id: "e_" + Date.now(), desc, amount, category, date });
      }
      Store.save();
      App.closeModal();
    };
    if (existing) {
      document.getElementById("deleteExp").onclick = () => {
        Store.state.finance.expenses = Store.state.finance.expenses.filter(e => e.id !== existing.id);
        Store.save();
        App.closeModal();
      };
    }
  }
};
