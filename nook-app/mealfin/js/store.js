/* ============================================================
   STORE — single source of truth for all app data.
   Works local-only (localStorage) out of the box.
   If firebase-config.js has real keys, it also syncs to
   Firestore under users/{uid}/data/main so your phone and
   laptop stay in sync.
   ============================================================ */

const LOCAL_KEY = "nook-app-state-v1";

// Local-timezone-safe date key, e.g. "2026-08-18" — avoids UTC day-shift bugs
function toLocalDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function defaultState() {
  return {
    meals: {},      // { "YYYY-MM-DD": { breakfast:{name,recipeId}, lunch:{...}, dinner:{...} } }
    recipes: [],     // [{id, title, image, ingredients:[{name}], sourceUrl}]
    grocery: [],      // [{id, name, price, checked}]
    finance: {
      goal: { title: "Rainy day fund", target: 1000, current: 0 },
      budgets: {},     // { "YYYY-MM": { "Food": 300, "Fun": 100, ... } }
      expenses: []      // [{id, date, desc, category, amount}]
    }
  };
}

const Store = {
  state: defaultState(),
  _listeners: [],
  _saveTimer: null,
  user: null,
  synced: false,

  init() {
    const cached = localStorage.getItem(LOCAL_KEY);
    if (cached) {
      try { this.state = { ...defaultState(), ...JSON.parse(cached) }; }
      catch (e) { console.warn("Could not parse cached state", e); }
    }

    if (typeof FIREBASE_CONFIGURED !== "undefined" && FIREBASE_CONFIGURED) {
      firebase.initializeApp(firebaseConfig);
      this.auth = firebase.auth();
      this.db = firebase.firestore();

      this.auth.onAuthStateChanged((user) => {
        this.user = user;
        if (user) {
          this._attachRemote(user.uid);
        } else {
          this.synced = false;
          this._notify();
          if (window.App) App.showSignIn();
        }
      });
    } else {
      this._notify();
    }
  },

  _attachRemote(uid) {
    const ref = this.db.collection("users").doc(uid).collection("data").doc("main");
    ref.get().then((doc) => {
      if (doc.exists) {
        this.state = { ...defaultState(), ...doc.data() };
      } else {
        ref.set(this.state);
      }
      this.synced = true;
      this._notify();
      if (window.App) App.updateSyncBadge(true);
    });

    ref.onSnapshot((doc) => {
      if (doc.exists && doc.metadata.hasPendingWrites === false) {
        this.state = { ...defaultState(), ...doc.data() };
        this._notify();
      }
    });

    this._remoteRef = ref;
  },

  save() {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(this.state));
    if (this._remoteRef) {
      clearTimeout(this._saveTimer);
      this._saveTimer = setTimeout(() => {
        this._remoteRef.set(this.state).catch(e => console.warn("Sync failed", e));
      }, 500);
    }
    this._notify();
  },

  onChange(fn) { this._listeners.push(fn); },
  _notify() { this._listeners.forEach(fn => fn(this.state)); },

  // ---- Auth helpers ----
  async signUp(email, password) {
    await this.auth.createUserWithEmailAndPassword(email, password);
  },
  async signIn(email, password) {
    await this.auth.signInWithEmailAndPassword(email, password);
  },
  signOut() { this.auth.signOut(); }
};
