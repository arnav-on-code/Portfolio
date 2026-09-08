/* Backend abstraction: the UI talks to this file instead of scattering Supabase calls. */
(() => {
  const cfg = window.PORTFOLIO_CONFIG || {};
  if (!window.supabase) throw new Error("Supabase SDK did not load.");
  if (!cfg.SUPABASE_URL || cfg.SUPABASE_URL.includes("YOUR-PROJECT") ||
      !cfg.SUPABASE_ANON_KEY || cfg.SUPABASE_ANON_KEY.includes("YOUR_SUPABASE")) {
    console.warn("Configure config.js with your Supabase URL and anon/publishable key.");
  }
  const client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
  const TABLE = "portfolio_documents";
  const PUBLIC_TABLE = "portfolio_public";
  const DOC_ID = "00000000-0000-0000-0000-000000000001";

  const empty = () => ({
    profile: { fullName:"Portfolio Owner", professionalTitle:"Software Developer", tagline:"Building, learning, and shipping.", location:"", availability:true, email:"", phone:"", bio:["Add your bio from Admin → About."], heroDescription:"Add your hero description.", photoUrl:"", resumeUrl:"" },
    about: { heading:"About me", description:"", personalSummary:"", careerInterests:"", currentFocus:"", quickFacts:[] },
    education: [], skills: [], projects: [], certificates: [], achievements: [], goals: [], learning: [], socialProfiles: [],
    siteSettings: { portfolioTitle:"Portfolio", browserTitle:"Portfolio | Software Developer", metaDescription:"Personal portfolio.", accentColor:"#e3b04b", theme:"dark", footerText:"Designed & built with care." },
    contact: { email:"", phone:"", location:"", github:"", linkedin:"", otherLinks:[] }
  });

  async function getDocument(published=false) {
    const { data, error } = await client.from(TABLE).select("*").eq("id", DOC_ID).single();
    if (error) throw error;
    return published ? (data.published_data || empty()) : (data.draft_data || empty());
  }

  async function saveDraft(data) {
    const { error } = await client.from(TABLE).update({ draft_data:data, updated_at:new Date().toISOString() }).eq("id", DOC_ID);
    if (error) throw error;
    return data;
  }
  async function publish(data) {
    const now=new Date().toISOString();
    const { error } = await client.from(TABLE).update({ draft_data:data, published_data:data, published_at:now, updated_at:now }).eq("id", DOC_ID);
    if (error) throw error;
    const pub=await client.from(PUBLIC_TABLE).upsert({id:DOC_ID,published_data:data,published_at:now,updated_at:now});
    if (pub.error) throw pub.error;
    return data;
  }
  async function getPublic() {
    const {data,error}=await client.from(PUBLIC_TABLE).select("published_data").eq("id",DOC_ID).single();
    if(error) throw error; return data.published_data||empty();
  }

  async function uploadFile(file, bucket="portfolio-images", folder="") {
    if (!file) throw new Error("No file selected.");
    const safe = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g,"-");
    const path = `${folder ? folder+"/" : ""}${crypto.randomUUID()}-${safe}`;
    const { error } = await client.storage.from(bucket).upload(path, file, { upsert:false, cacheControl:"31536000" });
    if (error) throw error;
    const { data } = client.storage.from(bucket).getPublicUrl(path);
    return { url:data.publicUrl, path, bucket };
  }
  async function removeFile(bucket, path) {
    if (!path) return;
    const { error } = await client.storage.from(bucket).remove([path]);
    if (error) console.warn("Storage delete failed:", error);
  }
  async function exportBackup() {
    const draft=await getDocument(false), published=await getDocument(true);
    return { version:1, exportedAt:new Date().toISOString(), draft, published };
  }
  async function importBackup(backup) {
    if (!backup?.draft) throw new Error("Invalid backup JSON.");
    await saveDraft(backup.draft);
    return backup.draft;
  }

  window.PortfolioService={client,getPublic,getDocument,saveDraft,publish,uploadFile,removeFile,exportBackup,importBackup,empty};
})();