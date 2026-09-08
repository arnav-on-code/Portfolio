(() => {
  const svc=()=>window.PortfolioService;
  async function signIn(email,password){ const {data,error}=await svc().client.auth.signInWithPassword({email,password}); if(error) throw error; return data; }
  async function signOut(){ const {error}=await svc().client.auth.signOut(); if(error) throw error; }
  async function getSession(){ const {data}=await svc().client.auth.getSession(); return data.session; }
  function requireAdmin(){ return getSession().then(s=>{ if(!s) location.href="admin.html"; return s; }); }
  window.PortfolioAuth={signIn,signOut,getSession,requireAdmin};
})();