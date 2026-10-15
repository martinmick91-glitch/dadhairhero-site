// The layouts of the style, step-strip and handoff pins (pins/batch-1.mjs
// says which pins there are). Each returns the HTML for one 1000×1500 page,
// which render-pins.mjs screenshots. `css` is render-pins.mjs's BASE_CSS:
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
