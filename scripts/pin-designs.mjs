// The layouts of the style, step-strip and handoff pins (pins/batch-1.mjs
// says which pins there are), and of a seasonal guide's share image and
// pin. Each returns the HTML for one page, which render-pins.mjs
// screenshots. `css` is render-pins.mjs's BASE_CSS:
// the site's fonts and colours.

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// A headline never breaks at a hyphen ("half- / down").
const keepHyphens = (s) => esc(s).replace(/\S+-\S+/g, (word) => `<span style="white-space: nowrap">${word}</span>`);

// A style pin or a handoff pin: the headline band on top, the finished
// look filling the rest of the frame, the address at the foot.
export function stylePin(css, { headline, picture }) {
  return `
    <style>${css}
      body { display: flex; flex-direction: column; background: #fcebdd; }
      header { padding: 70px 72px 56px; }
      h1 { font-size: 112px; line-height: 0.98; text-wrap: balance; }
      .look { position: relative; flex: 1; overflow: hidden; }
      .look img { border-radius: 0; height: 100%; width: auto; min-width: 100%; position: absolute; left: 50%; transform: translateX(-50%); }
      .site { position: absolute; left: 50%; bottom: 40px; transform: translateX(-50%); background: #fff; border-radius: 999px; padding: 12px 30px; font-size: 32px; }
    </style>
    <header><h1>${keepHyphens(headline)}</h1></header>
    <div class="look"><img src="${picture}" alt=""><p class="site">dadhairhero.com</p></div>`;
}

// A step strip: the headline band, then three or four steps stacked and
// numbered, the last one the finished look.
export function stepStrip(css, { headline, steps }) {
  return `
    <style>${css}
      body { display: flex; flex-direction: column; padding: 64px 56px 0; }
      h1 { font-size: 100px; line-height: 0.98; margin: 0 16px 40px; text-wrap: balance; }
      ol { list-style: none; padding: 0; display: grid; grid-auto-rows: minmax(0, 1fr); gap: 20px; flex: 1; min-height: 0; }
      li { display: flex; align-items: center; gap: 36px; background: #fff; border-radius: 28px; padding: 18px 36px 18px 18px; min-height: 0; overflow: hidden; }
      li img { width: auto; height: 100%; aspect-ratio: 1; flex: none; border-radius: 18px; object-fit: cover; }
      .n { flex: none; width: 76px; height: 76px; border-radius: 50%; background: #fdba74; display: grid; place-items: center; font-size: 40px; font-weight: 700; }
      li.done .n { background: #1e293b; color: #fff; font-size: 34px; }
      li p { font-size: 46px; line-height: 1.12; font-weight: 600; }
      .site { text-align: center; font-size: 32px; padding: 30px 0 36px; }
    </style>
    <h1>${keepHyphens(headline)}</h1>
    <ol>${steps.map((s, i) => `
      <li class="${s.done ? 'done' : ''}"><img src="${s.picture}" alt=""><span class="n">${s.done ? '✓' : i + 1}</span><p>${esc(s.title)}</p></li>`).join('')}
    </ol>
    <p class="site">dadhairhero.com</p>`;
}

// A seasonal guide's share image, 1200×630: the headline, the address,
// and the guide's first three free looks in a row.
export function guideCollage(css, { headline, pictures }) {
  return `
      <style>${css}
        body { padding: 46px 48px 0; }
        h1 { font-size: 92px; }
        .row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-top: 34px; height: 410px; }
        .site { position: absolute; right: 48px; top: 76px; font-size: 26px; }
      </style>
      <h1>${esc(headline)}</h1>
      <p class="site">dadhairhero.com</p>
      <div class="row">${pictures.map((p) => `<img src="${p}" alt="">`).join('')}</div>`;
}

// A seasonal guide's pin, 1000×1500 (the Halloween pin's design): the
// headline and a line under it, three free looks with a label each, a
// panel saying they are free, and the address.
export function guidePin(css, { headline, sub, looks, note, noteSub }) {
  return `
      <style>${css}
        body { padding: 84px 70px 0; display: flex; flex-direction: column; }
        h1 { font-size: 132px; }
        .sub { font-size: 38px; margin-top: 26px; color: rgba(30, 41, 59, 0.78); }
        .grid { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 22px; margin-top: 46px; height: 860px; }
        .grid figure { position: relative; margin: 0; }
        .note { background: #fff; border-radius: 28px; padding: 40px 36px; display: flex; flex-direction: column; justify-content: center; }
        .note h2 { font-family: 'Instrument Serif', serif; font-weight: 400; font-size: 64px; line-height: 1.02; }
        .note p { font-size: 30px; margin-top: 18px; color: rgba(30, 41, 59, 0.78); }
        figcaption { position: absolute; left: 16px; bottom: 16px; background: #fff; border-radius: 999px; padding: 8px 20px; font-size: 28px; font-weight: 600; }
        .site { margin-top: auto; margin-bottom: 52px; text-align: center; font-size: 34px; }
      </style>
      <h1>${esc(headline)}</h1>
      <p class="sub">${esc(sub)}</p>
      <div class="grid">${looks.map((l) => `<figure><img src="${l.picture}" alt=""><figcaption>${esc(l.label)}</figcaption></figure>`).join('')}
        <div class="note"><h2>${esc(note)}</h2><p>${esc(noteSub)}</p></div></div>
      <p class="site">dadhairhero.com</p>`;
}
