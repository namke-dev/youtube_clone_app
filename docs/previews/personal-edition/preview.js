(() => {
  const data = window.DEV_TUBES_EDITION_PREVIEW;
  const items = new Map(data.items.map(item => [item.id, item]));
  const main = document.getElementById("main");
  const dialog = document.getElementById("source-dialog");
  const dialogContent = document.getElementById("dialog-content");
  const status = document.getElementById("preview-status");
  const state = { edition: "balanced", view: "today", kept: new Set(), skipped: new Set(), query: "", filter: "All", leads: {}, notes: {}, toastTimer: null };
  // Paths reused from the application's existing Material UI icon package.
  const iconPaths = {
    search: "M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z",
    home: "m12 5.69 5 4.5V18h-2v-6H9v6H7v-7.81l5-4.5M12 3 2 12h3v8h6v-6h2v6h6v-8h3L12 3z",
    explore: "M3 3v8h8V3H3zm6 6H5V5h4v4zm-6 4v8h8v-8H3zm6 6H5v-4h4v4zm4-16v8h8V3h-8zm6 6h-4V5h4v4zm-6 4v8h8v-8h-8zm6 6h-4v-4h4v4z",
    library: "M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2zm0 15-5-2.18L7 18V5h10v13z",
    journeys: "M22.47 5.2c-.47-.24-.96-.44-1.47-.61v12.03c-1.14-.41-2.31-.62-3.5-.62-1.9 0-3.78.54-5.5 1.58V5.48C10.38 4.55 8.51 4 6.5 4c-1.79 0-3.48.44-4.97 1.2-.33.16-.53.51-.53.88v12.08c0 .58.47.99 1 .99.16 0 .32-.04.48-.12C3.69 18.4 5.05 18 6.5 18c2.07 0 3.98.82 5.5 2 1.52-1.18 3.43-2 5.5-2 1.45 0 2.81.4 4.02 1.04.16.08.32.12.48.12.52 0 1-.41 1-.99V6.08c0-.37-.2-.72-.53-.88zM10 16.62C8.86 16.21 7.69 16 6.5 16s-2.36.21-3.5.62V6.71C4.11 6.24 5.28 6 6.5 6c1.2 0 2.39.25 3.5.72v9.9zM19 .5l-5 5V15l5-4.5V.5z",
  };
  document.querySelectorAll("[data-dtp-icon]").forEach(el => {el.innerHTML = `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="${iconPaths[el.dataset.dtpIcon]}"></path></svg>`;});
  const escape = value => String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"}[char]));
  const edition = () => data.editions.find(value => value.id === state.edition);
  const leadId = () => state.leads[state.edition] || edition().lead;
  const date = item => item.dateLabel || new Intl.DateTimeFormat("en", {day:"numeric", month:"short", year:"numeric", timeZone:"Asia/Ho_Chi_Minh"}).format(new Date(`${item.date}T00:00:00+07:00`));
  const duration = item => item.kind === "video" ? `${Math.floor(item.seconds / 60)}:${String(item.seconds % 60).padStart(2,"0")} watch` : `~${item.minutes} min read`;
  const selectedIds = () => [...new Set([leadId(), ...edition().signals, ...edition().next])];
  const totalSeconds = ids => ids.reduce((sum, id) => sum + (items.get(id).seconds ?? items.get(id).minutes * 60), 0);
  const meta = item => `<div class="dtp-meta"><span>${escape(item.source)}</span><span aria-hidden="true">·</span><span>${duration(item)}</span></div>`;
  const details = item => `<div class="dtp-meta dated"><span>${escape(date(item))}</span><span aria-hidden="true">·</span><span class="dtp-freshness">${escape(item.freshness)}</span></div>`;
  const image = (item, extra="") => item.image ? `<img src="${escape(item.image)}" alt="${escape(item.alt)}" ${extra}>` : `<div class="dtp-no-image">${escape(item.place)}</div>`;
  const link = (item, className="dtp-inline-link", label) => `<a class="${className}" href="${escape(item.url)}" target="_blank" rel="noopener noreferrer">${label || (item.kind === "video" ? "Watch at TED" : "Read the story")} <span aria-hidden="true">↗</span></a>`;
  const keep = item => `<button class="dtp-text-button dtp-keep" type="button" data-keep="${item.id}" aria-pressed="${state.kept.has(item.id)}" aria-label="${state.kept.has(item.id) ? "Remove" : "Keep"} ${escape(item.title)}">${state.kept.has(item.id) ? "Kept ✓" : "Keep +"}</button>`;
  const info = (item, label="Why this pick?") => `<button class="dtp-text-button" type="button" data-info="${item.id}">${label}</button>`;
  function toast(message) { clearTimeout(state.toastTimer); status.textContent = message; status.classList.add("visible"); state.toastTimer = setTimeout(() => status.classList.remove("visible"), 3500); }
  function showDialog(html) { dialogContent.innerHTML = html; dialog.showModal(); }
  function sourceInfo(id) {
    const item = items.get(id);
    showDialog(`<p class="dtp-small">${escape(item.area)} · ${escape(item.freshness)}</p><h2 id="dialog-heading">${escape(item.title)}</h2><p>${escape(item.reason)}</p><p><strong>Original title</strong><br>${escape(item.originalTitle)}</p><p>${escape(item.source)} · ${escape(date(item))}<br>${duration(item)}${item.kind === "article" ? " · editorial estimate, not a measured duration" : " · TED metadata"}</p>${item.caveat ? `<p class="dtp-caveat">${escape(item.caveat)}</p>` : ""}<p class="dtp-image-credit">${escape(item.credit)}</p>${link(item,"dtp-button dtp-primary", "Open original source")}`);
  }
  function lead(item) {
    const choices = edition().leadAlternatives.filter(id => !selectedIds().includes(id));
    const canRestore = state.leads[state.edition];
    return `<article class="dtp-lead">${item.image ? `<a class="dtp-lead-visual" href="${escape(item.url)}" target="_blank" rel="noopener noreferrer" aria-label="Open ${escape(item.originalTitle)}">${image(item, 'fetchpriority="high"')}</a>` : image(item)}<div class="dtp-lead-content"><div class="dtp-meta"><span>${escape(item.area)}</span><span aria-hidden="true">·</span><span>${escape(item.place)}</span></div><h2>${escape(item.title)}</h2><p>${escape(item.summary)}</p>${details(item)}<div class="dtp-lead-actions">${link(item,"dtp-button dtp-primary",item.kind === "video" ? "Watch this" : "Read this story")}${keep(item)}${choices.length || canRestore ? `<button class="dtp-text-button" type="button" id="swap-lead">Swap pick ↻</button>` : ""}</div><div class="dtp-meta dated"><span>${escape(item.source)}</span><span aria-hidden="true">·</span><span>${duration(item)}</span>${info(item,"Source & context")}</div></div></article>`;
  }
  function signal(item) { return `<article class="dtp-signal"><div class="dtp-meta"><span>${escape(item.source)}</span><span aria-hidden="true">·</span><span>${escape(date(item))}</span></div><h3>${escape(item.title)}</h3><p>${escape(item.summary)}</p><div class="dtp-meta dated"><span class="dtp-freshness">${escape(item.freshness)}</span><span>${duration(item)}</span></div><div class="dtp-signal-bottom">${link(item,"dtp-inline-link","Open source")}${info(item)}</div></article>`; }
  function next(item) { return `<article class="dtp-next">${image(item, 'loading="lazy"')}<div><div class="dtp-meta"><span>${escape(item.area)}</span><span aria-hidden="true">·</span><span>${duration(item)}</span></div><h3>${escape(item.title)}</h3><p>${escape(item.source)} · ${escape(date(item))} · ${escape(item.freshness)}</p><div class="dtp-next-actions">${link(item)}${keep(item)}${info(item,"Context")}</div></div></article>`; }
  function today() {
    const current = edition();
    const ids = selectedIds();
    const videos = ids.filter(id => items.get(id).kind === "video");
    const reading = ids.filter(id => items.get(id).kind === "article").reduce((sum,id) => sum + items.get(id).minutes, 0);
    const videoSeconds = totalSeconds(videos);
    const estimatedMinutes = Math.ceil(totalSeconds(ids) / 60);
    return `<div class="dtp-title-row"><div><h1>Today</h1><p class="dtp-date">Wednesday, 4 November 2026</p></div><div class="dtp-time-total"><strong>~${estimatedMinutes} minutes</strong><span>${Math.floor(videoSeconds/60)}:${String(videoSeconds%60).padStart(2,"0")} video · ~${reading} min reading</span></div></div>
      <p class="dtp-subtitle">${escape(current.subtitle)}</p>
      <div class="dtp-edition-controls" role="group" aria-label="Sample editions">${data.editions.map(value => `<button type="button" data-edition="${value.id}" aria-pressed="${value.id === state.edition}">${value.name}</button>`).join("")}</div>
      <div class="dtp-today-grid">${lead(items.get(leadId()))}<aside class="dtp-brief" aria-labelledby="brief-heading"><h2 id="brief-heading">A little context</h2><p class="dtp-brief-intro">${current.signals.length === 1 ? "One" : "Two"} selected source${current.signals.length === 1 ? "" : "s"}. Follow what interests you.</p>${current.signals.map(id=>signal(items.get(id))).join("")}<div class="dtp-why"><span class="dtp-small">Stay with a question</span><h3>${escape(data.journey.title)}</h3><p>Three pieces that connect the land, the city, and the table.</p><a class="dtp-inline-link" href="#journeys" data-view="journeys">See the journey ↗</a></div></aside></div>
      <div class="dtp-section-heading"><h2>Another perspective</h2><span>${current.next.length} optional ${current.next.length === 1 ? "piece" : "pieces"}</span></div><div class="dtp-next-grid">${current.next.map(id=>next(items.get(id))).join("")}</div>
      <section class="dtp-finish"><div><h2>That’s today’s selection.</h2><p>Keep a thought, go outside, or follow your curiosity a little further.</p></div><button class="dtp-text-button" type="button" id="keep-thought">Keep a thought ↗</button></section>`;
  }
  function card(item) { return `<article class="dtp-explore-card">${image(item,'loading="lazy"')}<div class="dtp-meta"><span>${escape(item.area)}</span><span aria-hidden="true">·</span><span>${duration(item)}</span></div><h2>${escape(item.title)}</h2><p>${escape(item.summary)}</p>${details(item)}<div class="dtp-card-actions">${link(item)}${keep(item)}${info(item,"Details")}</div></article>`; }
  function explore() {
    const filters = ["All", "AI", "World", "Nature", "Culture", "Food"];
    const visible = data.items.filter(item => (state.filter === "All" || item.area.toLowerCase().includes(state.filter.toLowerCase())) && `${item.title} ${item.originalTitle} ${item.area} ${item.source} ${item.place}`.toLowerCase().includes(state.query.toLowerCase()));
    return `<h1>Follow your curiosity.</h1><p class="dtp-intro-text">${state.query ? `Results for “${escape(state.query)}” · ` : ""}${visible.length} of 12 handpicked pieces. Recent updates and older discoveries are labeled separately.</p><div class="dtp-filters" role="group" aria-label="Filter selected pieces">${filters.map(value=>`<button type="button" data-filter="${value}" aria-pressed="${state.filter === value}">${value}</button>`).join("")}</div>${visible.length ? `<div class="dtp-explore-grid">${visible.map(card).join("")}</div>` : `<div class="dtp-empty"><h2>No matching piece in this sample.</h2><p>Try a broader idea, or clear the search to see all 12 sources.</p><button class="dtp-button" type="button" id="clear-search">Clear search</button></div>`}`;
  }
  function journeys() {
    const roles = ["The land", "The city", "The tradition"];
    return `<h1>Stay with a question.</h1><p class="dtp-intro-text">One small journey. No deadlines, required order, or catching up.</p><section class="dtp-journey-intro"><h2>${data.journey.title}</h2><p>${data.journey.description}</p><p>3 pieces · ~${Math.ceil(totalSeconds(data.journey.steps)/60)} minutes with reading estimates · start anywhere</p></section><div>${data.journey.steps.map((id,index) => { const item=items.get(id); return `<article class="dtp-journey-step ${state.skipped.has(id) ? "dtp-step-skipped" : ""}"><span class="dtp-step-index" aria-label="Step ${index+1}">${index+1}</span>${image(item)}<div><div class="dtp-meta"><span>${roles[index]}</span><span aria-hidden="true">·</span><span>${duration(item)}</span><span>${state.skipped.has(id) ? "Skipped" : ""}</span></div><h3>${item.title}</h3><p>${escape(item.reason)}</p></div><div class="dtp-step-controls">${link(item,"dtp-inline-link", item.kind === "video" ? "Watch" : "Read")}<button class="dtp-text-button" type="button" data-skip="${id}">${state.skipped.has(id) ? "Restore step" : "Skip for now"}</button>${keep(item)}</div></article>`; }).join("")}</div><p class="dtp-intro-text">A short collection to test the idea. Viewing a piece will not mark it learned or completed.</p>`;
  }
  function library() { const kept = [...state.kept].map(id=>items.get(id)); return `<h1>Worth coming back to.</h1><p class="dtp-intro-text">${kept.length} kept ${kept.length === 1 ? "piece" : "pieces"}. This preview library stays in this open page; it does not change your account or real saved videos.</p>${kept.length ? `<div class="dtp-explore-grid">${kept.map(card).join("")}</div>` : `<div class="dtp-empty"><h2>Leave room for what stays with you.</h2><p>Keep a piece from an edition or Explore. You can remove it whenever you like.</p><a class="dtp-button" href="#explore" data-view="explore">Explore the selection ↗</a></div>`}${Object.keys(state.notes).length ? `<section class="dtp-journey-intro"><h2>Your thoughts</h2>${Object.entries(state.notes).map(([key,note])=>`<p><strong>${escape(data.editions.find(value=>value.id===key).name)}</strong><br>${escape(note)}</p>`).join("")}</section>` : ""}`; }
  function sources() { return `<h1>Sources, in the open.</h1><p class="dtp-intro-text">12 pieces checked on 4 November 2026. Video lengths come from TED metadata. Reading times are editorial estimates; they are not video durations. These sample editions do not claim complete coverage of the world.</p>${data.items.map(item=>`<article class="dtp-source-row"><div class="dtp-meta"><span>${escape(item.source)}</span><span>${escape(date(item))}</span><span>${duration(item)}</span></div><h2><a class="dtp-inline-link" href="${escape(item.url)}" target="_blank" rel="noopener noreferrer">${escape(item.originalTitle)} ↗</a></h2><p>${escape(item.caveat || item.reason)}</p><p>${escape(item.credit)}</p></article>`).join("")}`; }
  function render() {
    const focused = document.activeElement;
    const focusKey = focused?.dataset.keep ? ["keep", focused.dataset.keep] : focused?.dataset.edition ? ["edition", focused.dataset.edition] : focused?.dataset.filter ? ["filter", focused.dataset.filter] : focused?.dataset.skip ? ["skip", focused.dataset.skip] : null;
    const views = {today,explore,journeys,library,sources};
    main.innerHTML = views[state.view]();
    for (const nav of document.querySelectorAll("[data-view]")) { if(nav.dataset.view === state.view) nav.setAttribute("aria-current","page"); else nav.removeAttribute("aria-current"); }
    document.querySelectorAll(".dtp-kept-count").forEach(el => {el.textContent = state.kept.size ? String(state.kept.size) : "";});
    main.querySelectorAll("img").forEach(img=>img.addEventListener("error",()=> { const fallback=document.createElement("div"); fallback.className="dtp-no-image"; fallback.textContent="Image unavailable · open the original source"; img.replaceWith(fallback); }, {once:true}));
    if(focusKey) main.querySelector(`[data-${focusKey[0]}="${focusKey[1]}"]`)?.focus({preventScroll:true});
  }
  function navigate(view) { state.view = view; render(); window.scrollTo({top:0,behavior:"instant"}); }
  document.addEventListener("click", event => {
    const control=event.target.closest("button,a"); if(!control) return;
    if(control.dataset.view) {event.preventDefault(); navigate(control.dataset.view);}
    if(control.matches(".dtp-brand")) {event.preventDefault();navigate("today");}
    if(control.dataset.edition) {state.edition=control.dataset.edition;render();}
    if(control.dataset.filter) {state.filter=control.dataset.filter;render();}
    if(control.dataset.info) sourceInfo(control.dataset.info);
    if(control.dataset.keep) {const id=control.dataset.keep; const remove=state.kept.has(id); if(remove)state.kept.delete(id);else state.kept.add(id);render();toast(remove ? "Removed from this preview library." : "Kept in this preview library.");}
    if(control.dataset.skip) {const id=control.dataset.skip;if(state.skipped.has(id))state.skipped.delete(id);else state.skipped.add(id);render();}
    if(control.id === "swap-lead") { const current=edition(); const currentId=leadId(); const choices=[current.lead,...current.leadAlternatives]; const nextId=choices[(choices.indexOf(currentId)+1)%choices.length]; state.leads[state.edition]=nextId;render();toast("Only the lead changed. Your other picks stayed in place."); }
    if(control.id === "clear-search") {state.query="";state.filter="All";document.getElementById("preview-search").value="";render();}
    if(control.id === "keep-thought") {showDialog(`<h2 id="dialog-heading">A thought worth keeping.</h2><p>${escape(edition().reflection)}</p><label class="dtp-sr-only" for="thought-note">Your thought</label><textarea class="dtp-note" id="thought-note" maxlength="1500" placeholder="A thought, a question, something to try…">${escape(state.notes[state.edition] || "")}</textarea><button class="dtp-button dtp-primary" type="button" id="save-thought">Keep in this preview</button>`);}
    if(control.id === "save-thought") {const note=document.getElementById("thought-note").value.trim();if(note)state.notes[state.edition]=note;else delete state.notes[state.edition];dialog.close();toast(note ? "Your thought is in the preview library." : "No thought saved.");}
    if(control.id === "about-preview" || control.id === "your-space") {event.preventDefault();showDialog(`<h2 id="dialog-heading">A preview of your daily edition.</h2><p>Try three different selections, swap the lead, explore a subject, or keep a piece. Source links open the real publisher.</p><p>This is a fixed English-language sample for reviewing the direction. It makes no discovery requests and does not change the live Dev Tubes application, your account, or your real library.</p><p>Keep and note actions are temporary in this page. No playback, progress tracking, or cross-device sync is being simulated.</p>`);}
    if(control.id === "toggle-search") {const open=document.querySelector(".dtp-toolbar").classList.toggle("search-open");control.setAttribute("aria-expanded",String(open));control.setAttribute("aria-label",open ? "Close preview search" : "Open preview search");if(open)document.getElementById("preview-search").focus();}
  });
  document.querySelector(".dtp-search").addEventListener("submit", event => {event.preventDefault();state.query=document.getElementById("preview-search").value.trim();state.filter="All";navigate("explore");});
  document.getElementById("close-dialog").addEventListener("click",()=>dialog.close());
  dialog.addEventListener("click",event=>{if(event.target===dialog){const bounds=dialog.getBoundingClientRect();if(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom)dialog.close();}});
  render();
})();
