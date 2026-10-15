// Admin authentication helpers.
// Loaded ONLY by admin/index.html — never by the public portfolio.
(() => {
  const svc = () => window.PortfolioService;

  async function signIn(email, password) {
    const { data, error } = await svc().client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }
  async function signOut() {
    const { error } = await svc().client.auth.signOut();
    if (error) throw error;
  }
  async function getSession() {
    const { data } = await svc().client.auth.getSession();
    return data.session;
  }

  // Auto-fill the login form from env.js so the admin can
  // sign in with one click.  Visitors who stumble upon the
  // admin URL without env.js see a normal blank login form.
  function autofillLoginForm() {
    const priv = window.__PRIVATE_ENV__;
    if (!priv || !priv.ADMIN_EMAIL || priv.ADMIN_EMAIL === "REPLACE_ME") return;
    const emailEl    = document.getElementById("loginEmail");
    const passwordEl = document.getElementById("loginPassword");
    if (emailEl)    emailEl.value    = priv.ADMIN_EMAIL;
    if (passwordEl) passwordEl.value = priv.ADMIN_PASSWORD || "";
  }

  window.PortfolioAuth = { signIn, signOut, getSession, autofillLoginForm };
})();