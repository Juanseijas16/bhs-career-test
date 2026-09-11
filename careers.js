/* ============================================================
   MOTOR DE VACANTES (Google Sheets -> HTML)
   Lee la hoja publicada como CSV y construye el listado y las
   páginas de detalle. No requiere servidor ni autenticación.
   ============================================================ */
(function (global) {
  'use strict';

  function getCsvUrl() {
    return (global.CAREERS_CONFIG && global.CAREERS_CONFIG.csvUrl || '').trim();
  }

  /* ====== Contenido por región (fijo en el código, se elige según la
     ubicación de la vacante). India -> estos beneficios y contactos;
     cualquier otra ubicación -> el bloque estándar (Alemania). ====== */
  // Packs de beneficios por defecto (fallback del código). Se pueden sobreescribir
  // desde la pestaña "Beneficios" de la hoja (columnas: set, icon, text_de, text_en).
  const DEFAULT_BENEFITS = {
    '4': [
      { icon: 'vorteil-hidden-champion.png', de: 'Arbeiten bei einem Hidden Champion', en: 'Working for a hidden champion' },
      { icon: 'vorteil-gebaeude.png', de: 'Modernste Montage- und Verwaltungsgebäude (Lifecycle Building)', en: 'State-of-the-art assembly and office building (Lifecycle Building)' },
      { icon: 'vorteil-entwicklung.png', de: 'Individuelle berufliche Entwicklungsmöglichkeiten', en: 'Individual career development opportunities' },
      { icon: 'vorteil-familie.png', de: 'Familienfreundliches und familiengeführtes Unternehmen mit dem Flair eines Global Players', en: 'Family-friendly and family-run company with the flair of a global player' }
    ],
    'india': [
      { icon: 'vorteil-gebaeude.png', de: 'Best office infrastructure and medical facilities ensuring well-being of our employees.', en: 'Best office infrastructure and medical facilities ensuring well-being of our employees.' },
      { icon: 'vorteil-familie.png', de: 'Thriving in a dynamic, family friendly environment ensuring work-life balance', en: 'Thriving in a dynamic, family friendly environment ensuring work-life balance' },
      { icon: 'vorteil-entwicklung.png', de: 'Foster individual expertise and empowering teamwork in driving success', en: 'Foster individual expertise and empowering teamwork in driving success' },
      { icon: 'vorteil-hidden-champion.png', de: 'Grow with global player ensuring career development with a defined path of growth', en: 'Grow with global player ensuring career development with a defined path of growth' }
    ]
  };
  DEFAULT_BENEFITS['6'] = DEFAULT_BENEFITS['4'].concat([
    { icon: 'vorteil-uebernahme.png', de: 'i. d. R. unbefristete Übernahme nach Abschluss der Ausbildung', en: 'As a rule, permanent employment after completing your training' },
    { icon: 'vorteil-schulungszentrum.png', de: 'Modernste praktische und theoretische Ausbildung im standorteigenen Schulungszentrum', en: 'State-of-the-art practical and theoretical training in our on-site training center' }
  ]);
  // src de imagen: admite nombre de archivo (images/...) o URL completa (para editar fotos desde la hoja).
  function imgSrc(p) { p = (p || '').trim(); return /^https?:\/\//i.test(p) ? p : 'images/' + p; }
  const CONTACT_SETS = {
    standard: [
      { name: 'Julia Müller', title: 'HR Business Partner', phone: '+49 9605 919 - 663', photo: 'contact-julia-mueller.jpg' }
    ],
    india: [
      { name: 'Mihika Shirodkar', title: 'HR Business Partner', phone: '', email: 'MShirodkar@bhs-world.com', photo: 'contact-mihika.png' },
      { name: 'Rivka Pawar', title: 'HR Business Partner', phone: '', email: 'RPawar@bhs-world.com', photo: 'contact-rivka.png' }
    ],
    trainees: [
      { name: 'Lisa Gebert-Hofmann', title: 'HR Business Partner Trainees & Talents', phone: '+49 9605 919 - 9707', photo: 'contact-lisa-gebert-hofmann.jpg' }
    ]
  };
  function isIndiaLocation(loc) {
    return /india|pune|,\s*in\b/i.test(loc || '');
  }

  /* --- Parser CSV (RFC 4180): admite comillas, comas y saltos
         de línea dentro de una celda, y comillas dobles escapadas. --- */
  function parseCSV(text) {
    const rows = [];
    let row = [], field = '', i = 0, inQuotes = false;
    while (i < text.length) {
      const c = text[i];
      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
          inQuotes = false; i++; continue;
        }
        field += c; i++; continue;
      }
      if (c === '"') { inQuotes = true; i++; continue; }
      if (c === ',') { row.push(field); field = ''; i++; continue; }
      if (c === '\r') { i++; continue; }
      if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; i++; continue; }
      field += c; i++;
    }
    if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
    return rows;
  }

  function rowsToObjects(rows) {
    if (!rows.length) return [];
    const headers = rows[0].map(h => h.trim());
    const out = [];
    for (let r = 1; r < rows.length; r++) {
      const cells = rows[r];
      if (cells.length === 1 && cells[0].trim() === '') continue;
      const obj = {};
      headers.forEach((h, idx) => { obj[h] = (cells[idx] != null ? cells[idx] : '').trim(); });
      out.push(obj);
    }
    return out;
  }

  let _cache = null;
  async function fetchRows() {
    const url = getCsvUrl();
    if (!url) return null;
    if (_cache) return _cache;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    let text = await res.text();
    if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1); // quitar BOM si Google lo antepone
    _cache = rowsToObjects(parseCSV(text));
    return _cache;
  }

  // Carga opcional de contactos desde una segunda pestaña de la hoja.
  function getContactsCsvUrl() {
    return (global.CAREERS_CONFIG && global.CAREERS_CONFIG.contactsCsvUrl || '').trim();
  }
  let _contactCache = null;
  async function loadContactSets() {
    const url = getContactsCsvUrl();
    if (!url) return null;
    if (_contactCache) return _contactCache;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    let text = await res.text();
    if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
    const map = {};
    rowsToObjects(parseCSV(text)).forEach(r => {
      const set = (r.set || '').trim().toLowerCase();
      if (!set || !(r.name || '').trim()) return;
      (map[set] = map[set] || []).push({
        name: (r.name || '').trim(), title: (r.title || '').trim(),
        email: (r.email || '').trim(), phone: (r.phone || '').trim(), photo: (r.photo || '').trim()
      });
    });
    _contactCache = map;
    return map;
  }

  // Carga opcional de beneficios desde la pestaña "Beneficios" de la hoja.
  let _benefitCache = null;
  async function loadBenefitSets() {
    const url = (global.CAREERS_CONFIG && global.CAREERS_CONFIG.benefitsCsvUrl || '').trim();
    if (!url) return null;
    if (_benefitCache) return _benefitCache;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    let text = await res.text();
    if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
    const map = {};
    rowsToObjects(parseCSV(text)).forEach(r => {
      const set = (r.set || '').trim().toLowerCase();
      if (!set) return;
      (map[set] = map[set] || []).push({
        icon: (r.icon || '').trim(),
        de: (r.text_de || r.text || '').trim(),
        en: (r.text_en || r.text || '').trim()
      });
    });
    _benefitCache = map;
    return map;
  }

  function isActive(v) {
    const s = (v || '').toString().trim().toLowerCase();
    return s === '' || ['true', '1', 'ja', 'yes', 'si', 'sí', 'x'].indexOf(s) !== -1;
  }
  function pick(o, base, lang) { return o[base + '_' + lang] || o[base + '_de'] || o[base] || ''; }
  function splitLines(v) { return (v || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean); }
  function esc(s) { return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function setText(id, t) { const el = document.getElementById(id); if (el) el.textContent = t; }

  function detailHref(o, lang) {
    const url = (lang === 'en' ? o.detail_url_en : o.detail_url_de) || o.detail_url || '';
    if (url) return url;
    const page = lang === 'en' ? 'job-en.html' : 'job.html';
    return page + '?id=' + encodeURIComponent(o.id || '');
  }

  function toListJob(o, lang) {
    return {
      title: pick(o, 'title', lang),
      location: o.location || '',
      href: detailHref(o, lang),
      level: pick(o, 'level', lang),
      time: pick(o, 'time', lang),
      contract: pick(o, 'contract', lang),
      dept: pick(o, 'dept', lang)
    };
  }

  /* Devuelve las vacantes de la hoja para el idioma dado.
     null  -> no hay hoja configurada (usar las vacantes fijas)
     []    -> hoja configurada pero sin filas para ese idioma */
  async function loadJobs(lang) {
    const rows = await fetchRows();
    if (!rows) return null;
    return rows
      .filter(r => isActive(r.active) && (r['title_' + lang] || '').trim())
      .map(r => toListJob(r, lang));
  }

  async function loadDetail(id, lang) {
    const rows = await fetchRows();
    if (!rows) return null;
    const o = rows.find(r => (r.id || '') === id);
    if (!o) return null;
    return {
      title: pick(o, 'title', lang),
      location: o.location || '',
      email: (o.email || 'recruiting@bhs-world.com').trim(),
      benefits: (o.benefits || '').trim(),
      benefitsCustom: splitLines(o['benefits_' + lang] || o['benefits_de'] || ''),
      contactSet: (o.contacts || '').trim(),
      intro: splitLines(pick(o, 'intro', lang)),
      tasks: splitLines(pick(o, 'tasks', lang)),
      profile: splitLines(pick(o, 'profile', lang)),
      offer: splitLines(pick(o, 'offer', lang))
    };
  }

  /* Rellena una página de detalle (job.html / job-en.html) a
     partir del parámetro ?id= de la URL. */
  async function renderDetail(lang) {
    const back = lang === 'en' ? 'index-en.html' : 'index.html';
    const id = new URLSearchParams(location.search).get('id') || '';
    let d = null;
    try { d = await loadDetail(id, lang); } catch (e) { /* ignore */ }
    if (!d) { location.replace(back); return; }

    document.title = d.title + (lang === 'en' ? ' - Careers at BHS Corrugated' : ' - Karriere bei BHS Corrugated');
    setText('crumbTitle', d.title);
    setText('jobTitle', d.title);
    setText('jobMeta', d.location);

    // RRHH (ticket Selina): las vacantes de estudiantes/aprendices (Werkstudent,
    // Ausbildung, Duales Studium, Schüler, Praktikum) usan trato informal "du" en
    // los títulos de sección alemanes; el resto mantiene el formal "Sie".
    const informalDE = /^(Werkstudent|Berufsausbildung|Ausbildung|Duales Studium|Sch(ü|ue)ler|Praktik)/i.test(d.title || '') || /ausbildung@/i.test(d.email || '');
    const L = lang === 'en'
      ? { tasks: 'Your future responsibilities include', profile: 'Your professional and personal profile', offer: 'We offer you' }
      : (informalDE
          ? { tasks: 'Zu deinen zukünftigen Verantwortungen gehören', profile: 'Dein fachliches und persönliches Profil', offer: 'Wir bieten dir' }
          : { tasks: 'Zu Ihren zukünftigen Verantwortungen gehören', profile: 'Ihr fachliches und persönliches Profil', offer: 'Wir bieten Ihnen' });
    const section = (h, inner) => '<section class="job-section"><h2>' + esc(h) + '</h2>' + inner + '</section>';
    const ul = items => '<ul>' + items.map(i => '<li>' + esc(i) + '</li>').join('') + '</ul>';

    let html = '';
    if (d.intro.length) html += section('BHS Corrugated', d.intro.map(p => '<p>' + esc(p) + '</p>').join(''));
    if (d.tasks.length) html += section(L.tasks, ul(d.tasks));
    if (d.profile.length) html += section(L.profile, ul(d.profile));
    if (d.offer.length) {
      // La frase de cierre ("Bitte nutzen Sie..." / "Please use our career site...")
      // debe ir como PÁRRAFO aparte, no como viñeta (petición de RRHH, ticket Julia).
      const isClosing = s => /^(Bitte nutzen Sie|Please use our career site)/i.test(s);
      const offerBullets = d.offer.filter(s => !isClosing(s));
      const offerNotes = d.offer.filter(isClosing);
      let offerInner = offerBullets.length ? ul(offerBullets) : '';
      offerInner += offerNotes.map(p => '<p>' + esc(p) + '</p>').join('');
      html += section(L.offer, offerInner);
    }
    const body = document.getElementById('jobBody');
    if (body) body.innerHTML = html;

    // Región según la UBICACIÓN de la vacante.
    const region = isIndiaLocation(d.location) ? 'india' : 'de';

    // --- Beneficios: pack según la columna 'benefits' (4 / 6 / india).
    //     Si está vacío, se elige por la ubicación (India -> india, resto -> 4). ---
    let pack = (d.benefits || '').trim().toLowerCase();
    if (!pack) pack = (region === 'india') ? 'india' : '4';
    let benefitSets = DEFAULT_BENEFITS;
    try { const ov = await loadBenefitSets(); if (ov) benefitSets = Object.assign({}, DEFAULT_BENEFITS, ov); } catch (e) { /* usa los del código */ }
    const benefitItems = benefitSets[pack] || DEFAULT_BENEFITS['4'];
    (function () {
      const tbl = document.getElementById('benefitsTable');
      const lst = document.getElementById('benefitsList');
      if (lst) lst.style.display = 'none';
      if (tbl) {
        tbl.style.display = '';
        tbl.innerHTML = benefitItems.map(b => {
          const t = (lang === 'en' ? (b.en || b.de) : (b.de || b.en));
          return '<tr><td style="width:44px;"><div class="benefit-icon-box"><img src="' + imgSrc(b.icon) + '" alt=""></div></td>' +
            '<td class="benefit-text">' + esc(t) + '</td></tr>';
        }).join('');
      }
    })();

    // --- Contactos: set según la columna 'contacts' (standard / india / trainees).
    //     Si está vacío, se elige por la ubicación (India -> india, resto -> standard). ---
    let cset = (d.contactSet || '').trim().toLowerCase();
    if (!cset) cset = (region === 'india') ? 'india' : 'standard';
    let sets = CONTACT_SETS;
    try { const ov = await loadContactSets(); if (ov) sets = Object.assign({}, CONTACT_SETS, ov); } catch (e) { /* usa los del código */ }
    const contacts = sets[cset] || sets.standard || CONTACT_SETS.standard;
    if (contacts) {
      const ct = document.getElementById('contactTable');
      if (ct) {
        ct.innerHTML = '<tr>' + contacts.map(c => {
          const photoCell = c.photo
            ? '<td style="width:60px;"><img class="contact-photo" src="' + imgSrc(c.photo) + '" alt="' + esc(c.name) + '"></td>'
            : '';
          let info = '';
          if (c.name) info += '<p class="name">' + esc(c.name) + '</p>';
          if (c.title) info += '<p class="title">' + esc(c.title) + '</p>';
          if (c.phone) info += '<p class="phone">' + esc(c.phone) + '</p>';
          if (c.email) info += '<p class="phone"><a href="mailto:' + esc(c.email) + '">' + esc(c.email) + '</a></p>';
          return photoCell + '<td class="contact-info">' + info + '</td>';
        }).join('') + '</tr>';
      }
    }

    const subject = (lang === 'en' ? 'Application: ' : 'Bewerbung: ') + d.title;
    const text = lang === 'en'
      ? 'Dear Sir or Madam,\n\nI am writing to apply for the position "' + d.title + '" at the ' + d.location + ' location.\n\nPlease find my resume and relevant documents attached to this email.\n\nBest regards'
      : 'Sehr geehrte Damen und Herren,\n\nhiermit bewerbe ich mich auf die Position "' + d.title + '" am Standort ' + d.location + '.\n\nMeinen Lebenslauf sowie relevante Unterlagen füge ich dieser E-Mail als Anhang bei.\n\nMit freundlichen Grüßen';
    const mailto = 'mailto:' + d.email + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(text);
    ['applyTop', 'applyBottom'].forEach(n => { const a = document.getElementById(n); if (a) a.href = mailto; });
  }

  global.CareersData = { loadJobs, loadDetail, renderDetail, loadContactSets, loadBenefitSets, parseCSV, rowsToObjects };
})(window);
