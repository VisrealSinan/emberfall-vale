// Turns the web version of the game (index.html at the repo root) into a copy
// that runs offline inside the launcher: three.js and the fonts load from
// local files instead of the internet.
const HEAD =
  '<!doctype html>\n<html lang="en"><head><meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">';

function localizeHtml(html, fontsHref) {
  let out = html
    .replace(
      /<script src="https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/three\.js\/[^"]+"><\/script>/,
      '<script src="three.min.js"></script>'
    )
    .replace(/<link rel="preconnect"[^>]*>\s*/g, '')
    .replace(
      /<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^"]*">/,
      `<link rel="stylesheet" href="${fontsHref}">`
    );
  if (!/^\s*<!doctype/i.test(out)) out = HEAD + '\n' + out;
  return out;
}

module.exports = { localizeHtml };
