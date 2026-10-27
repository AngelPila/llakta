/* Llakta landing: the moving line, the live problem field, the coordinator switches, the open form. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- hero line: speed fixed at 40px a second, whatever the width ---- */
  const tracks = [...document.querySelectorAll('[data-track]')];
  const setTravel = () => {
    const t = tracks[0];
    if (!t) return;
    const half = t.scrollWidth / 2;
    const second = t.querySelectorAll('.track__seg')[1];   // under reduced motion: one whole copy centred, both ends cropped
    const rest = second ? Math.round(innerWidth / 2 - (second.getBoundingClientRect().left - t.getBoundingClientRect().left) - second.offsetWidth / 2) : 0;
    tracks.forEach((el) => {
      el.style.setProperty('--travel', `${Math.max(12, half / 40)}s`);
      el.style.setProperty('--rest', `${rest}px`);
    });
  };
  document.fonts.ready.then(setTravel);
  addEventListener('resize', setTravel);

  /* ---- reveals, once ---- */
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 }) : null;
  const watch = (sel) => document.querySelectorAll(sel).forEach((el) => (io ? io.observe(el) : el.classList.add('is-in')));
  document.querySelectorAll('[data-stagger] > *').forEach((el, i) => el.style.setProperty('--i', i));
  document.querySelectorAll('.chak__bar').forEach((el, i) => el.style.setProperty('--i', [2, 1, 0, 1, 2][i] ?? i));
  watch('[data-reveal]'); watch('[data-stagger]'); watch('.verb'); watch('.foot');

  /* ---- the live thing: the same logic the app uses for the title and the reference photo ---- */
  const FOTOS = [
    { src: 'img/home.jpg', t: 'Minga de limpieza en Piedras', w: ['minga', 'comunidad', 'vecinos', 'juntos', 'trabajo', 'limpieza', 'sembrar'] },
    { src: 'img/puente.jpg', t: 'Puente peatonal en Chetilla', w: ['puente', 'quebrada', 'cruzar', 'río', 'pasarela', 'peatonal'] },
    { src: 'img/agua.jpg', t: 'Reservorio de agua comunitario en Palo Blanco', w: ['agua', 'tanque', 'reservorio', 'potable', 'grifo', 'llave', 'baño', 'lavabo', 'tubería'] },
    { src: 'img/basura.jpg', t: 'Basura junto a un mural en Cuenca', w: ['basura', 'desechos', 'recolección', 'reciclaje', 'fundas', 'contenedor'] },
    { src: 'img/calle.jpg', t: 'Zumbahua centro', w: ['calle', 'camino', 'tierra', 'lodo', 'asfalto', 'bache', 'vía', 'lastre', 'pavimento'] },
    { src: 'img/luz.jpg', t: 'Una calle sin luz de noche', w: ['luz', 'alumbrado', 'lámpara', 'poste', 'oscuro', 'noche', 'foco', 'inseguridad'] },
    { src: 'img/escuela.jpg', t: 'Escuela Simón Bolívar, Otavalo', w: ['escuela', 'colegio', 'niños', 'estudiantes', 'aula', 'educación', 'unidad educativa'] },
    { src: 'img/parque.jpg', t: 'Parque en Riobamba', w: ['parque', 'plaza', 'áreas verdes', 'juegos', 'bancas', 'jardín', 'árboles'] },
    { src: 'img/barrio1.jpg', t: 'Calle Agoyán, Quito', w: ['barrio', 'quito', 'ladera', 'casas', 'ciudad'] },
  ];
  const plain = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const foto = (text) => {
    const t = plain(text);
    let best = null, score = 0;
    for (const f of FOTOS) {
      const n = f.w.filter((w) => t.includes(plain(w))).length;
      if (n > score) { best = f; score = n; }
    }
    return best || FOTOS[8];
  };
  const VERBO = /^(se|no|está|esta|están|estan|hay|hace|lleva|llevan|tiene|tienen|es|son|fue|quedó|quedo|sigue|siguen|nos|me|ya|lo|la|le|desde)$/i;
  const CONECTOR = /^(de|del|la|el|los|las|en|y|a|al|por|para|con|mi|mis|su|sus)$/i;
  const corto = (problema) => {
    const palabras = problema.replace(/\s+/g, ' ').trim().replace(/[.!?,].*$/, '').split(' ').filter(Boolean);
    const out = [];
    for (const w of palabras) {
      if (out.length >= 2 && w === w.toLowerCase() && VERBO.test(w)) break;
      out.push(w);
      if (out.length >= 7) break;
    }
    const resto = palabras.slice(out.length);   // no partir un nombre propio
    for (const w of resto.slice(0, 3)) {
      if (!/^[A-ZÁÉÍÓÚÑ]/.test(out[out.length - 1]) || !/^[A-ZÁÉÍÓÚÑ]/.test(w)) break;
      out.push(w);
    }
    while (out.length > 2 && CONECTOR.test(out[out.length - 1])) out.pop();
    const t = out.join(' ');
    return t.charAt(0).toUpperCase() + t.slice(1);
  };
  const lugarDe = (s) => {
    const m = s.match(/(?:en|de|del) (?:el |la |los |las |mi |mis |nuestro |nuestra )?(barrio|sector|comunidad|colegio|escuela|parroquia|calle|parque|cancha|plaza) ((?:(?:de |del |la |el )?[A-ZÁÉÍÓÚÑ][\wáéíóúñ]+ ?){1,4})/);
    return m ? `${m[1]} ${m[2].trim()}` : '';
  };

  const q = document.getElementById('q');
  const mirror = document.querySelector('.typeline__mirror');
  const line = document.querySelector('.typeline');
  const title = document.getElementById('a-title');
  const answer = document.querySelector('.answer');
  const img = document.getElementById('a-img');
  const cap = document.getElementById('a-cap');
  const lugarRow = document.getElementById('a-lugar-row');
  const lugar = document.getElementById('a-lugar');
  const area = document.getElementById('problema');
  let shown = img ? img.getAttribute('src') : '';

  const caret = () => {
    if (!q || !mirror) return;
    mirror.textContent = q.value || ' ';
    const w = Math.min(mirror.offsetWidth, q.clientWidth - 8);
    line.style.setProperty('--caret', `${w + 6}px`);
  };
  const update = () => {
    if (!q) return;
    const text = q.value.trim();
    const t = text ? corto(text) : 'Escribe qué pasa, dónde y a quién afecta';
    if (title.textContent !== t) {
      title.textContent = t;
      answer.classList.remove('is-fresh'); void answer.offsetWidth; answer.classList.add('is-fresh');
    }
    const l = lugarDe(text);
    lugarRow.hidden = !l; lugar.textContent = l;
    const f = foto(text);
    if (f.src !== shown) {
      shown = f.src;
      if (reduce) { img.src = f.src; img.alt = f.t; cap.textContent = f.t; }
      else {
        img.classList.add('is-swapping');
        setTimeout(() => {
          img.src = f.src; img.alt = f.t; cap.textContent = f.t;
          img.decode?.().catch(() => {}).finally(() => img.classList.remove('is-swapping'));
        }, 220);
      }
    }
    caret();
  };
  if (q) {
    q.addEventListener('input', update);
    update();
    document.fonts.ready.then(caret);
    addEventListener('resize', caret);
    document.querySelectorAll('[data-ex]').forEach((b) => b.addEventListener('click', () => {
      q.value = b.dataset.ex; update(); q.focus({ preventScroll: true }); q.setSelectionRange(q.value.length, q.value.length);
    }));
    document.getElementById('a-go').addEventListener('click', () => {
      const text = q.value.trim();
      if (text && area) { area.value = text.charAt(0).toUpperCase() + text.slice(1) + (/[.!?]$/.test(text) ? '' : '.'); chips.forEach((c) => c.classList.remove('is-on')); }
      setTimeout(() => document.getElementById('nombre')?.focus({ preventScroll: true }), 500);
    });
  }

  /* ---- coordinator switches ---- */
  document.querySelectorAll('.sband').forEach((band) => {
    const sw = band.querySelector('.switch');
    const flip = () => {
      const on = sw.getAttribute('aria-checked') !== 'true';
      sw.setAttribute('aria-checked', String(on));
      band.classList.toggle('is-on', on);
    };
    sw.addEventListener('click', (e) => { e.stopPropagation(); flip(); });
    band.addEventListener('click', flip);
  });

  /* ---- the open form: creates a real project through the app's own API ---- */
  const chips = [...document.querySelectorAll('.chip')];
  chips.forEach((c) => c.addEventListener('click', () => {
    area.value = c.dataset.fill;
    chips.forEach((x) => x.classList.toggle('is-on', x === c));
  }));
  area?.addEventListener('input', () => chips.forEach((x) => x.classList.toggle('is-on', x.dataset.fill === area.value)));

  const form = document.getElementById('start-form');
  const err = document.getElementById('start-err');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('.dialog__btn');
    const problema = area.value.trim();
    const nombre = document.getElementById('nombre').value.trim();
    btn.setAttribute('aria-busy', 'true'); btn.textContent = 'Despertando al equipo…'; err.hidden = true;
    try {
      const res = await fetch('/api/projects', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ problema, nombre }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo crear el proyecto.');
      try { localStorage.setItem(`llakta:yo:${data.id}`, nombre); } catch {}
      location.href = `/p/${data.id}`;
    } catch (x) {
      err.textContent = x.message || 'No se pudo crear el proyecto. Prueba desde la app.';
      err.hidden = false;
      btn.removeAttribute('aria-busy'); btn.textContent = 'Armar el plan';
    }
  });
})();
