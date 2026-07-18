/* Lumina satış asistanı — EsteTouch WP eklentisindeki /estetouch/v1/lumina-* uçlarına bağlanır.
   Framework yok; tema sayfanın kendi CSS değişkenlerinden gelir (1600: --ice/--panel/--txt, 1200: --teal/--card/--ink).
   API anahtarı frontend'e GİTMEZ — tüm AI çağrıları sunucuda. */
(function () {
  'use strict';
  var SC = document.currentScript || {};
  var MODEL = (SC.dataset && SC.dataset.model) === '1200' ? '1200' : '1600';
  var PAGE = (SC.dataset && SC.dataset.page) || (MODEL === '1200' ? 'lumina-1200' : 'index');
  var LOCAL = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  // MİMARİ: Lumina landing'leri (mavi 1600 + mor 1200) EsteTouch WP sitesinden AYRI alan adında
  // yaşar; widget WP'ye ÇAPRAZ-DOMAIN bağlanır. WP adresi değişirse script etiketine
  // data-api="https://wp-alan-adi.com/wp-json/estetouch/v1" ekleyin — kod değişmez.
  // (Yeni landing domaini WP tarafında etp_lumina_origins option'ına da eklenmeli — CORS allowlist.)
  // Yerel WP (PHP yerleşik sunucu) /wp-json rewrite yapmaz → ?rest_route= biçimi.
  var API = (SC.dataset && SC.dataset.api) ||
    (LOCAL ? 'http://127.0.0.1:8081/?rest_route=/estetouch/v1' : 'https://www.luminapro.com.tr/wp-json/estetouch/v1');
  var WA_FALLBACK = 'https://wa.me/905333347431?text=' + encodeURIComponent('Merhaba, Lumina ' + MODEL + 'W hakkında bilgi almak istiyorum.');
  // Bölüm hangi sayfada? (çapraz bağlantı için)
  var IDS_1600 = ['video', 'dalga', 'teknoloji', 'basliklar', 'canli-demo', 'donanim', 'sogutma', 'anatomi', 'klinik', 'teknik', 'guven', 'iletisim'];
  var IDS_1200 = ['video', 'neden', 'dalga', 'fototermal', 'basliklar', 'sogutma', 'teknik', 'karsilastir', 'surec', 'guven', 'iletisim', 'harita'];

  var sid = '';
  var busy = false;
  var opened = false;
  var TOUCH = 'ontouchstart' in window; // dokunmatikte otomatik focus klavyeyi/zoom'u tetiklemesin
  try { sid = sessionStorage.getItem('lumSid') || ''; } catch (e) {}

  /* ---------- stil (tema fallback zinciri: 1600 → 1200 → nötr) ---------- */
  var onPrimaryDark = getComputedStyle(document.documentElement).getPropertyValue('--ice').trim() !== '';
  var css = '' +
    '.lmc-fab{position:fixed;right:22px;bottom:92px;z-index:80;width:56px;height:56px;border-radius:50%;border:1px solid var(--line,#2a3a4a);cursor:pointer;display:flex;align-items:center;justify-content:center;background:var(--ice,var(--teal,#19b6c9));color:' + (onPrimaryDark ? '#062033' : '#fff') + ';box-shadow:0 12px 30px rgba(0,0,0,.35);transition:transform .25s,box-shadow .25s}' +
    '.lmc-fab:hover{transform:translateY(-3px) scale(1.05);box-shadow:0 16px 38px rgba(0,0,0,.45)}' +
    '.lmc-fab svg{width:26px;height:26px}' +
    '@media(max-width:760px){.lmc-fab{bottom:150px;right:16px}}' +
    '.lmc-panel{position:fixed;right:22px;bottom:160px;z-index:81;width:360px;max-width:calc(100vw - 32px);height:540px;max-height:calc(100vh - 120px);display:none;flex-direction:column;background:var(--panel,var(--card,#14202b));color:var(--txt,var(--ink,#eaf3f8));border:1px solid var(--line,#2a3a4a);border-radius:var(--r,16px);box-shadow:0 30px 70px rgba(0,0,0,.5);overflow:hidden}' +
    '.lmc-panel.on{display:flex}' +
    '@media(max-width:760px){.lmc-panel{right:0;left:0;bottom:0;width:100%;max-width:none;height:78vh;height:78dvh;border-radius:18px 18px 0 0}.lmc-in{font-size:16px}}' +
    '.lmc-head{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid var(--line,#2a3a4a);background:var(--bg2,rgba(0,0,0,.18))}' +
    '.lmc-head b{font-size:.95rem}' +
    '.lmc-dot{width:8px;height:8px;border-radius:50%;background:#31d158;box-shadow:0 0 8px rgba(49,209,88,.8);flex:none}' +
    '.lmc-close{margin-left:auto;width:32px;height:32px;border:0;border-radius:9px;background:transparent;color:inherit;font-size:1.2rem;cursor:pointer;line-height:1}' +
    '.lmc-close:hover{background:rgba(255,255,255,.08)}' +
    '.lmc-msgs{flex:1;overflow-y:auto;padding:16px 14px;display:flex;flex-direction:column;gap:10px}' +
    '.lmc-b{max-width:85%;padding:10px 13px;border-radius:14px;font-size:.88rem;line-height:1.55;white-space:pre-wrap;word-wrap:break-word}' +
    '.lmc-bot{align-self:flex-start;background:var(--bg2,rgba(255,255,255,.06));border:1px solid var(--line,#2a3a4a);border-bottom-left-radius:5px}' +
    '.lmc-me{align-self:flex-end;background:var(--ice,var(--teal,#19b6c9));color:' + (onPrimaryDark ? '#062033' : '#fff') + ';border-bottom-right-radius:5px}' +
    '.lmc-chips{display:flex;flex-wrap:wrap;gap:7px;align-self:flex-start}' +
    '.lmc-chip{border:1px solid var(--line,#2a3a4a);background:transparent;color:var(--ice2,var(--teal-d,#8fd4de));padding:7px 12px;border-radius:999px;font-size:.78rem;cursor:pointer;transition:border-color .2s,transform .2s}' +
    '.lmc-chip:hover{border-color:var(--ice,var(--teal,#19b6c9));transform:translateY(-2px)}' +
    '.lmc-act{align-self:flex-start;display:inline-flex;align-items:center;gap:8px;padding:10px 15px;border-radius:12px;font-size:.85rem;font-weight:700;cursor:pointer;border:1px solid var(--line,#2a3a4a);background:var(--bg2,rgba(255,255,255,.06));color:var(--ice2,var(--teal-d,#8fd4de));text-decoration:none;transition:transform .2s,border-color .2s}' +
    '.lmc-act:hover{transform:translateY(-2px);border-color:var(--ice,var(--teal,#19b6c9))}' +
    '.lmc-act.wa{background:#1fbf5f;border-color:#1fbf5f;color:#fff}' +
    '.lmc-ok{align-self:flex-start;font-size:.83rem;padding:9px 13px;border-radius:12px;border:1px solid rgba(49,209,88,.4);background:rgba(49,209,88,.1);color:#7ee6a1}' +
    '.lmc-typing{align-self:flex-start;display:flex;gap:5px;padding:12px 15px}' +
    '.lmc-typing span{width:7px;height:7px;border-radius:50%;background:var(--mut,#8aa);animation:lmcB 1.2s ease-in-out infinite}' +
    '.lmc-typing span:nth-child(2){animation-delay:.15s}.lmc-typing span:nth-child(3){animation-delay:.3s}' +
    '@keyframes lmcB{0%,60%,100%{opacity:.3;transform:translateY(0)}30%{opacity:1;transform:translateY(-4px)}}' +
    '.lmc-form{display:flex;gap:8px;padding:12px;border-top:1px solid var(--line,#2a3a4a)}' +
    '.lmc-in{flex:1;padding:11px 13px;border-radius:11px;border:1px solid var(--line,#2a3a4a);background:var(--bg2,rgba(0,0,0,.2));color:inherit;font-size:.88rem;font-family:inherit;outline:none}' +
    '.lmc-in:focus{border-color:var(--ice,var(--teal,#19b6c9))}' +
    '.lmc-send{width:44px;border:0;border-radius:11px;background:var(--ice,var(--teal,#19b6c9));color:' + (onPrimaryDark ? '#062033' : '#fff') + ';cursor:pointer;display:flex;align-items:center;justify-content:center;transition:transform .2s}' +
    '.lmc-send:hover{transform:scale(1.06)}' +
    '.lmc-send:disabled,.lmc-in:disabled{opacity:.55;cursor:default}' +
    '.lmc-note{font-size:.68rem;color:var(--mut,#8aa);text-align:center;padding:0 12px 10px}' +
    '@media(prefers-reduced-motion:reduce){.lmc-fab,.lmc-chip,.lmc-act,.lmc-send{transition:none}.lmc-typing span{animation:none;opacity:.6}}';
  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  /* ---------- iskelet ---------- */
  var fab = document.createElement('button');
  fab.className = 'lmc-fab';
  fab.type = 'button';
  fab.setAttribute('aria-label', 'Lumina satış asistanı — sohbeti aç');
  fab.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-8 8H5l-2 2V12a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8z"/><path d="M9 11h.01M13 11h.01M17 11h.01"/></svg>';
  document.body.appendChild(fab);

  var panel = document.createElement('div');
  panel.className = 'lmc-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Lumina satış asistanı sohbeti');
  panel.innerHTML =
    '<div class="lmc-head"><span class="lmc-dot"></span><b>Lumina Asistanı</b>' +
    '<button class="lmc-close" type="button" aria-label="Sohbeti kapat">×</button></div>' +
    '<div class="lmc-msgs" aria-live="polite"></div>' +
    '<form class="lmc-form"><input class="lmc-in" type="text" maxlength="500" placeholder="Sorunuzu yazın…" aria-label="Mesaj">' +
    '<button class="lmc-send" type="submit" aria-label="Gönder"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/></svg></button></form>' +
    '<div class="lmc-note">Yapay zekâ asistanı — fiyat ve kesin bilgi için ekibimiz sizi arar.</div>';
  document.body.appendChild(panel);

  var msgs = panel.querySelector('.lmc-msgs');
  var form = panel.querySelector('.lmc-form');
  var input = panel.querySelector('.lmc-in');
  var sendBtn = panel.querySelector('.lmc-send');

  /* ---------- yardımcılar ---------- */
  function bubble(role, text) {
    var d = document.createElement('div');
    d.className = 'lmc-b ' + (role === 'me' ? 'lmc-me' : 'lmc-bot');
    d.textContent = text;
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
    save(role, text);
    return d;
  }
  function save(role, text) {
    try {
      var arr = JSON.parse(sessionStorage.getItem('lumMsgs') || '[]');
      arr.push({ r: role, t: text });
      sessionStorage.setItem('lumMsgs', JSON.stringify(arr.slice(-30)));
    } catch (e) {}
  }
  function typing(on) {
    var t = msgs.querySelector('.lmc-typing');
    if (on && !t) {
      t = document.createElement('div');
      t.className = 'lmc-typing';
      t.innerHTML = '<span></span><span></span><span></span>';
      msgs.appendChild(t);
      msgs.scrollTop = msgs.scrollHeight;
    } else if (!on && t) { t.remove(); }
    input.disabled = on;
    sendBtn.disabled = on;
    busy = on;
    if (!on && opened && !TOUCH) input.focus(); // yanıt gelince odağı geri ver (masaüstü)
  }
  function chips(list) {
    if (!list || !list.length) return;
    var w = document.createElement('div');
    w.className = 'lmc-chips';
    list.forEach(function (c) {
      var b = document.createElement('button');
      b.className = 'lmc-chip';
      b.type = 'button';
      b.textContent = c;
      b.addEventListener('click', function () { if (busy) return; w.remove(); send(c); });
      w.appendChild(b);
    });
    msgs.appendChild(w);
    msgs.scrollTop = msgs.scrollHeight;
  }
  function renderActions(actions) {
    (actions || []).forEach(function (a) {
      if (a.type === 'scroll' && a.anchor) {
        var id = a.anchor.replace('#', '');
        var here = document.getElementById(id);
        var el = document.createElement(here ? 'button' : 'a');
        el.className = 'lmc-act';
        el.textContent = '↓ ' + (a.label || 'Bölüme git');
        if (here) {
          el.type = 'button';
          el.addEventListener('click', function () {
            here.scrollIntoView({ behavior: 'smooth', block: 'start' });
            toggle(false);
          });
        } else {
          // Bölüm öbür sayfada — doğru sayfaya bağla.
          var target = IDS_1600.indexOf(id) >= 0 && MODEL === '1200' ? 'index.html' : 'lumina-1200.html';
          if (IDS_1200.indexOf(id) >= 0 && MODEL === '1600') target = 'lumina-1200.html';
          el.href = target + a.anchor;
        }
        msgs.appendChild(el);
      } else if (a.type === 'handoff' && a.url) {
        var w = document.createElement('a');
        w.className = 'lmc-act wa';
        w.href = a.url;
        w.target = '_blank';
        w.rel = 'noopener';
        w.textContent = '💬 ' + (a.label || 'WhatsApp ile devam et');
        msgs.appendChild(w);
      } else if (a.type === 'lead_created') {
        var ok = document.createElement('div');
        ok.className = 'lmc-ok';
        ok.textContent = '✓ Talebiniz alındı — satış ekibimiz aynı gün arayacak.';
        msgs.appendChild(ok);
      }
    });
    msgs.scrollTop = msgs.scrollHeight;
  }
  function offline() {
    bubble('bot', 'Şu an bağlanamadım — dilerseniz WhatsApp üzerinden hemen yazabilir ya da 0216 389 95 80 numarasını arayabilirsiniz.');
    var w = document.createElement('a');
    w.className = 'lmc-act wa';
    w.href = WA_FALLBACK;
    w.target = '_blank';
    w.rel = 'noopener';
    w.textContent = '💬 WhatsApp ile yazın';
    msgs.appendChild(w);
    msgs.scrollTop = msgs.scrollHeight;
  }
  function post(path, body, ms) {
    var ctl = new AbortController();
    // chat çok-turlu araç akışında (lead) sunucu 60-80sn sürebilir — istemci erken pes etmesin.
    var timer = setTimeout(function () { ctl.abort(); }, ms || 30000);
    return fetch(API + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctl.signal
    }).then(function (r) { return r.json(); }).finally(function () { clearTimeout(timer); });
  }

  /* ---------- akış ---------- */
  function hello() {
    typing(true);
    post('/lumina-hello', { model: MODEL, lang: 'tr' }).then(function (d) {
      typing(false);
      if (!d || !d.ok) { offline(); return; }
      sid = d.session_id || sid;
      try { sessionStorage.setItem('lumSid', sid); } catch (e) {}
      bubble('bot', d.greeting || 'Merhaba! Size nasıl yardımcı olabilirim?');
      chips(d.chips);
    }).catch(function () { typing(false); offline(); });
  }
  function send(text) {
    text = (text || '').trim();
    if (!text || busy) return;
    bubble('me', text);
    input.value = '';
    typing(true);
    post('/lumina-chat', { session_id: sid, message: text, model: MODEL, page: PAGE, lang: 'tr' }, 90000).then(function (d) {
      typing(false);
      if (!d || !d.ok) {
        if (d && d.code === 'etp_rate') { bubble('bot', 'Kısa sürede çok mesaj aldım 😊 Birazdan tekrar deneyin ya da WhatsApp\'tan yazın.'); return; }
        offline();
        return;
      }
      sid = d.session_id || sid;
      try { sessionStorage.setItem('lumSid', sid); } catch (e) {}
      bubble('bot', d.reply || '…');
      renderActions(d.actions);
      if (d.offline) {
        var w = document.createElement('a');
        w.className = 'lmc-act wa';
        w.href = WA_FALLBACK;
        w.target = '_blank';
        w.rel = 'noopener';
        w.textContent = '💬 WhatsApp ile yazın';
        msgs.appendChild(w);
      }
    }).catch(function () { typing(false); offline(); });
  }
  function restore() {
    try {
      var arr = JSON.parse(sessionStorage.getItem('lumMsgs') || '[]');
      if (!arr.length) return false;
      arr.forEach(function (m) {
        var d = document.createElement('div');
        d.className = 'lmc-b ' + (m.r === 'me' ? 'lmc-me' : 'lmc-bot');
        d.textContent = m.t;
        msgs.appendChild(d);
      });
      msgs.scrollTop = msgs.scrollHeight;
      return true;
    } catch (e) { return false; }
  }
  function toggle(on) {
    opened = typeof on === 'boolean' ? on : !opened;
    panel.classList.toggle('on', opened);
    fab.setAttribute('aria-label', opened ? 'Sohbeti kapat' : 'Lumina satış asistanı — sohbeti aç');
    if (opened) {
      if (!msgs.childElementCount) {
        if (!restore()) hello();
        else if (!sid) hello();
      }
      if (!TOUCH) setTimeout(function () { input.focus(); }, 60);
    }
  }

  fab.addEventListener('click', function () { toggle(); });
  panel.querySelector('.lmc-close').addEventListener('click', function () { toggle(false); });
  document.addEventListener('keydown', function (e) { if ('Escape' === e.key && opened) toggle(false); });
  form.addEventListener('submit', function (e) { e.preventDefault(); send(input.value); });
})();
