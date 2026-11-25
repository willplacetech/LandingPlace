import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const page = new URL("./index.html", import.meta.url);
const html = existsSync(page) ? readFileSync(page, "utf8") : "";
const pageV2 = new URL("./index-v2.html", import.meta.url);
const htmlV2 = existsSync(pageV2) ? readFileSync(pageV2, "utf8") : "";
const pageV2CssFile = new URL("./styles-v2/page.css", import.meta.url);
const pageV2Css = existsSync(pageV2CssFile) ? readFileSync(pageV2CssFile, "utf8") : "";
const purePage = new URL("./indexPuro.html", import.meta.url);
const pureHtml = existsSync(purePage) ? readFileSync(purePage, "utf8") : "";
const clientManifestFile = new URL("./assets/client-logos.json", import.meta.url);
const clientManifest = JSON.parse(readFileSync(clientManifestFile, "utf8"));
const clientLogosScript = readFileSync(new URL("./assets/client-logos.js", import.meta.url), "utf8");
const adminPage = new URL("./admin.html", import.meta.url);
const adminHtml = readFileSync(adminPage, "utf8");
const adminScript = readFileSync(new URL("./assets/client-admin.js", import.meta.url), "utf8");

test("has a responsive Portuguese page with navigable sections", () => {
  assert.match(html, /<html lang="pt-BR">/);
  assert.match(html, /name="viewport"/);
  for (const id of ["solucoes", "empresa", "contato"]) {
    assert.match(html, new RegExp(`id="${id}"`));
    assert.match(html, new RegExp(`href="#${id}"`));
  }
  for (const id of ["portfolio", "linhas"]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  for (const label of ["Servidores", "Conectividade e Telefonia", "Mobilidade Premium", "Notebooks corporativos", "Celulares", "Escritório completo"]) {
    assert.ok(html.includes(label), `missing solution: ${label}`);
  }
});

test("shows all portfolio cards with the images used by indexPuro", () => {
  const portfolio = html.match(/<section\b(?=[^>]*\bid="portfolio")[^>]*>[\s\S]*?<\/section>/)?.[0] ?? "";
  const cards = [...portfolio.matchAll(/<article class="portfolio-card">[\s\S]*?<\/article>/g)].map(([markup]) => markup);
  assert.equal(cards.length, 4);

  for (const [title, imageId] of [
    ["Servidores", "37730212"],
    ["Notebooks", "8532637"],
    ["Celulares", "1719945421298"],
    ["Acessórios", "1788458813190"],
  ]) {
    const card = cards.find(markup => markup.includes(`<h3>${title}</h3>`)) ?? "";
    const image = card.match(/<img\b[^>]*>/)?.[0] ?? "";
    assert.match(image, new RegExp(`alt="${title}"`));
    assert.match(image, new RegExp(`src="[^"]*${imageId}`));
  }
});

test("shows the six product lines and their accessible brand logos from indexPuro", () => {
  const lines = html.match(/<section\b(?=[^>]*\bid="linhas")[^>]*>([\s\S]*?)<\/section>/)?.[1] ?? "";
  const expectedBrands = [
    ["Servidores", [["lenovo.webp", "Lenovo"], ["dell.webp", "Dell"]]],
    ["Conectividade e Telefonia", []],
    ["Mobilidade Premium", [["apple.webp", "Apple"]]],
    ["Notebooks corporativos", [["lenovo.webp", "Lenovo"], ["dell.webp", "Dell"], ["acer.webp", "Acer"]]],
    ["Celulares", [["apple.webp", "Apple"], ["samsung.webp", "Samsung"], ["xiaomi-mi.webp", "Xiaomi Mi"], ["motorola.webp", "Motorola"]]],
    ["Escritório completo", [["acer.webp", "Acer"], ["logitech.webp", "Logitech"], ["dell.webp", "Dell"]]],
  ];

  for (const [title, brands] of expectedBrands) {
    const card = [...lines.matchAll(/<article class="product-line">[\s\S]*?<\/article>/g)]
      .map(([markup]) => markup)
      .find(markup => markup.includes(`<h3>${title}</h3>`)) ?? "";
    assert.ok(card, `missing product line: ${title}`);
    const actualBrands = [...card.matchAll(/<img class="product-brand-logo" src="assets\/product-logos\/([^"]+)" alt="([^"]+)"/g)]
      .map(([, image, alt]) => [image, alt]);
    assert.deepEqual(actualBrands, brands, `unexpected brands for ${title}`);
    for (const [image] of brands) {
      assert.ok(existsSync(new URL(`./assets/product-logos/${image}`, import.meta.url)), `missing ${image}`);
    }
  }
  assert.equal((lines.match(/class="product-line"/g) ?? []).length, 6);
  assert.equal((lines.match(/href="https:\/\/wa\.me\/5511915971190\?/g) ?? []).length, 6);
});

test("alternates dark and light backgrounds across the main sections", () => {
  const sections = [...html.matchAll(/<section\b([^>]*)>/g)].map(([, attributes]) => ({
    id: attributes.match(/\bid="([^"]+)"/)?.[1],
    light: /\bclass="[^"]*\blight-section\b/.test(attributes),
  }));
  assert.deepEqual(sections, [
    { id: "inicio", light: false },
    { id: "solucoes", light: true },
    { id: "portfolio", light: false },
    { id: "linhas", light: false },
    { id: "empresa", light: false },
    { id: "clientes", light: true },
    { id: "contato", light: false },
  ]);
});

test("keeps portfolio and product line photos in their natural colors", () => {
  assert.doesNotMatch(html, /class="[^"]*duotone-img/);
  assert.match(html, /\.portfolio-image,\s*\.product-line-image\s*\{[^}]*mix-blend-mode:\s*normal;[^}]*filter:\s*none;/);
});

test("adds stronger shadows and contrast to product line logos", () => {
  const logoRule = html.match(/\.product-brand-logo\s*\{([^}]*)\}/)?.[1] ?? "";
  assert.match(logoRule, /filter:\s*drop-shadow\(0 1px 2px rgba\(0, 0, 0, 0\.35\)\)/);
  assert.match(html, /\.product-brand-logo\[src\$="\/(?:lenovo|apple|samsung|xiaomi-mi)\.webp"\][\s\S]*?filter:\s*brightness\(0\)\s+drop-shadow\(0 1px 2px rgba\(0, 0, 0, 0\.35\)\)/);
});

test("uses smoother easing for images and interface transitions", () => {
  assert.match(html, /--ease-out:\s*cubic-bezier\(0\.22, 1, 0\.36, 1\)/);
  assert.match(html, /\.portfolio-image,\s*\.product-line-image\s*\{[^}]*transition:\s*transform 1100ms var\(--ease-out\)/);
  assert.match(html, /\.portfolio-card:hover \.portfolio-image,\s*\.product-line-media:hover \.product-line-image\s*\{\s*transform:\s*scale\(1\.03\)/);
  assert.match(html, /transition:\s*color 260ms var\(--ease-out\)/);
  assert.match(html, /transition:\s*background-color 250ms var\(--ease-out\),\s*transform 300ms var\(--ease-out\)/);
});

test("keeps call-to-action buttons consistent without dark hover states", () => {
  const button = html.match(/\.button\s*\{([^}]*)\}/)?.[1] ?? "";
  const buttonHover = html.match(/\.button:hover\s*\{([^}]*)\}/)?.[1] ?? "";
  const secondaryHover = html.match(/\.button-secondary:hover\s*\{([^}]*)\}/)?.[1] ?? "";
  assert.match(button, /min-height:\s*48px/);
  assert.match(button, /background:\s*var\(--orange-action\)/);
  assert.match(buttonHover, /background:\s*var\(--orange-action\)/);
  assert.match(secondaryHover, /background:\s*transparent/);
  assert.doesNotMatch(html, /\.nav-links \.button\s*\{[^}]*min-height:\s*40px/);
  assert.doesNotMatch(html, /\.button\s*\{[^}]*min-height:\s*46px/);
  assert.match(html, /\.button:active\s*\{\s*color:\s*inherit;/);
});

test("uses the contact details and WhatsApp number from the presentation", () => {
  assert.match(html, /https:\/\/wa\.me\/5511915971190/);
  assert.match(html, /tel:\+5511915971190/);
  assert.match(html, /mailto:vendas@placotech\.com\.br/);
  assert.match(html, /https:\/\/www\.instagram\.com\/placotechh/);
  assert.match(html, /Renault Brasil/);
  assert.match(html, /Engemon/);
});

test("shows the PlaceTech symbol beside the wordmark in the header and footer", () => {
  assert.equal((html.match(/class="brand-mark"/g) ?? []).length, 2);
  assert.equal((html.match(/src="assets\/placetech-mark\.webp"/g) ?? []).length, 2);
  assert.ok(existsSync(new URL("./assets/placetech-mark.webp", import.meta.url)));
});

test("keeps navigation links visible and wrapping on small screens", () => {
  assert.match(html, /<nav class="nav-links" aria-label="Navegação principal">/);
  assert.match(html, /@media \(max-width: 680px\)[\s\S]*?\.nav-links\s*\{[^}]*flex-wrap:\s*wrap;/);
  assert.doesNotMatch(html, /class="nav-menu"/);
});

test("shows all client logos in an accessible automatic loop", () => {
  assert.match(html, /class="client-carousel"[^>]*aria-label="Clientes PlaceTech"/);
  assert.match(html, /@keyframes client-loop/);
  assert.match(html, /\.client-carousel\.is-running \.client-track[\s\S]*?animation:\s*client-loop\s+36s\s+linear\s+infinite/);
  assert.match(html, /aria-hidden="true"[\s\S]*?client-logos/);
  assert.doesNotMatch(html, /carousel-toggle|is-paused|animation-play-state:\s*paused/);
  assert.doesNotMatch(html, /<img src="assets\/client-logos\/[^"]+"[^>]*loading="lazy"/);
  for (const [client, extension] of [
    ["andritz", "webp"],
    ["palmeiras", "webp"],
    ["engemon", "webp"],
    ["renault-brasil", "webp"],
    ["ampm", "webp"],
    ["santos-fc", "webp"],
    ["vale", "png"],
    ["petrobras", "svg"],
  ]) {
    assert.ok(html.includes(`${client}.${extension}`), `missing client logo: ${client}`);
    assert.ok(existsSync(new URL(`./assets/client-logos/${client}.${extension}`, import.meta.url)), `missing logo file: ${client}`);
  }
});

test("keeps the clients heading constrained while the carousel spans the section", () => {
  const section = html.match(/<section\b(?=[^>]*\bid="clientes")[^>]*>([\s\S]*?)<\/section>/)?.[1] ?? "";
  assert.match(section, /<\/div>\s*<div\b(?=[^>]*\bclass="client-carousel")/);
  assert.match(html, /\.client-carousel\s*\{[^}]*width:\s*100%;/);
});

test("keeps the client loop infinite with reduced motion enabled", () => {
  assert.match(html, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.client-carousel\.is-running \.client-track\s*\{[^}]*animation-duration:\s*36s\s*!important;[^}]*animation-iteration-count:\s*infinite\s*!important;/);
  assert.doesNotMatch(html, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/);
});

test("preloads and distributes client logos across wide viewports before animation", () => {
  for (const client of ["andritz", "palmeiras", "engemon", "renault-brasil", "ampm", "santos-fc"]) {
    assert.match(html, new RegExp(`<link\\b[^>]*href="assets/client-logos/${client}\\.webp"[^>]*>`));
  }
  assert.match(html, /<link rel="preload" as="image" href="assets\/client-logos\/vale\.png"/);
  assert.match(html, /<link rel="preload" as="image" href="assets\/client-logos\/petrobras\.svg"/);
  assert.match(html, /\.client-carousel\.is-running \.client-list\s*\{[^}]*min-width:\s*100vw;[^}]*justify-content:\s*space-around;/);
  assert.doesNotMatch(html, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.client-list\s*\{[^}]*width:\s*100%;/);
  assert.match(html, /src="assets\/client-logos\.js" defer/);
  assert.match(clientLogosScript, /Promise\.all\(\[\.\.\.list\.querySelectorAll\("img"\)\]\.map\(waitForImage\)\)/);
});

test("keeps reduced-motion styles and the page self-contained", () => {
  assert.match(html, /prefers-reduced-motion:\s*reduce/);
  assert.match(html, /:focus-visible/);
  assert.match(html, /<script src="assets\/client-logos\.js" defer><\/script>/);
  assert.doesNotMatch(html, /<script[^>]+src="https?:/i);
  assert.doesNotMatch(html, /transition:\s*all\b/i);
});

test("provides an independent second version with navigation and verified contacts", () => {
  assert.match(htmlV2, /<html lang="pt-BR">/);
  assert.match(htmlV2, /href="styles-v2\/page\.css"/);
  for (const id of ["solucoes", "sobre", "clientes", "contato"]) {
    assert.match(htmlV2, new RegExp(`id="${id}"`));
    assert.match(htmlV2, new RegExp(`href="#${id}"`));
  }
  assert.match(htmlV2, /https:\/\/wa\.me\/5511915971190/);
  assert.doesNotMatch(htmlV2, /assets\/client-logos\.js|href="admin\.html"/);
  assert.match(htmlV2, /tel:\+5511915971190/);
  assert.match(htmlV2, /mailto:vendas@placotech\.com\.br/);
  assert.match(htmlV2, /https:\/\/www\.instagram\.com\/placotechh/);
});

test("uses an ordered manifest for the main carousel and includes every current logo", () => {
  assert.equal(clientManifest.version, 1);
  assert.deepEqual(
    clientManifest.logos.map(({ name }) => name),
    ["Andritz", "Palmeiras", "Engemon", "Renault Brasil", "ampm", "Santos FC", "Vale", "Petrobras"]
  );
  for (const logo of clientManifest.logos) {
    assert.ok(existsSync(new URL(`./${logo.src}`, import.meta.url)), `missing manifest asset: ${logo.src}`);
  }
  assert.match(html, /src="assets\/client-logos\.js" defer/);
  assert.match(html, /data-manifest-version="1"/);
  assert.match(html, /\.client-carousel\.is-running \.client-track[\s\S]*?animation:\s*client-loop\s+36s\s+linear\s+infinite/);
  assert.match(html, /href="admin\.html">Área administrativa<\/a>/);
});

test("provides a password-gated logo editor with local export and reordering", () => {
  assert.match(adminHtml, /id="setup-form"/);
  assert.match(adminHtml, /id="login-form"/);
  assert.match(adminHtml, /senha é uma barreira casual/);
  assert.match(adminHtml, /href="index\.html"/);
  assert.match(adminHtml, /href="styles\/admin\.css"/);
  assert.match(adminHtml, /assets\/client-logos\.json/);
  assert.match(adminHtml, /type="file" accept="image\/png,image\/jpeg,image\/webp"/);
  assert.match(adminScript, /iterations:\s*180000/);
  assert.match(adminScript, /canvas\.toBlob\(resolve,\s*"image\/webp",\s*0\.88\)/);
  assert.match(adminScript, /download\s*=\s*"client-logos\.json"/);
  assert.match(adminScript, /data-move/);
  assert.match(adminScript, /saveDraft\(nextLogos\)/);
});

test("uses the supplied dark logo treatment in the v2 header and footer", () => {
  assert.equal((htmlV2.match(/class="wordmark"/g) ?? []).length, 2);
  assert.equal((htmlV2.match(/<span>Place<\/span><strong>Tech<\/strong>/g) ?? []).length, 2);
  assert.match(pageV2Css, /\.site-header\s*\{[^}]*background:\s*var\(--color-ink\)/);
  assert.match(pageV2Css, /\.site-footer\s*\{[^}]*background:\s*var\(--color-ink\)/);
  assert.match(pageV2Css, /\.wordmark\s*\{[^}]*color:\s*var\(--color-paper\)/);
  assert.match(pageV2Css, /\.wordmark strong\s*\{\s*color:\s*#[\da-f]{6};/i);
  assert.match(pageV2Css, /\.nav-links > a:not\(\.button\)\s*\{[^}]*color:\s*var\(--color-paper\)/);
  assert.match(pageV2Css, /\.nav-links > \.nav-cta\s*\{[^}]*background:\s*var\(--color-accent\);[^}]*color:\s*var\(--color-ink\)/);
});

test("adds a reduced-motion-safe Three.js particle shader to the v2 hero", () => {
  assert.match(htmlV2, /<canvas class="hero-canvas"[^>]*aria-hidden="true"[^>]*><\/canvas>/);
  assert.match(htmlV2, /three@[0-9.]+\/build\/three\.module\.js/);
  assert.match(htmlV2, /new THREE\.ShaderMaterial/);
  assert.match(htmlV2, /new THREE\.Points/);
  assert.match(htmlV2, /renderer\.setAnimationLoop/);
  assert.match(htmlV2, /prefers-reduced-motion:\s*reduce/);
  assert.match(htmlV2, /if \(reduceMotion\.matches\) return;/);
  assert.match(htmlV2, /renderer\.dispose\(\)/);
  assert.match(htmlV2, /uScroll/);
  assert.match(htmlV2, /href="assets\/placetech-mark\.webp"/);
  assert.match(pageV2Css, /\.hero-canvas/);
  assert.match(pageV2Css, /@media \(prefers-reduced-motion:\s*reduce\)/);
  assert.match(pageV2Css, /^@import url\("\.\/tokens\.css"\);\s*@import url\("\.\/base\.css"\);/);
  assert.match(htmlV2, /assets\/placetech-hero\.webp/);
  assert.match(htmlV2, /<a class="button button-outline" href="#solucoes"[^>]*>[\s\S]*?Explorar o portfólio/);
});

test("adds reference-inspired scroll reveals, accessible category motion and a floating contact link", () => {
  assert.match(htmlV2, /aria-roledescription="carrossel" aria-label="Categorias PlaceTech"/);
  assert.equal((htmlV2.match(/class="category-list"/g) ?? []).length, 2);
  assert.match(htmlV2, /element\.dataset\.reveal = ""/);
  assert.match(htmlV2, /class="floating-whatsapp"[^>]*aria-label="Falar com a PlaceTech no WhatsApp"/);
  assert.match(pageV2Css, /@keyframes category-flow/);
  assert.match(pageV2Css, /@keyframes whatsapp-pulse/);
  assert.match(pageV2Css, /\.category-list\[aria-hidden="true"\]\s*\{\s*display:\s*none;/);
});

test("illustrates every second-version solution with the supplied PDF images", () => {
  for (const [title, image, alt] of [
    ["Servidores", "server-rack.webp", "Rack de servidores"],
    ["Conectividade e telefonia", "connectivity.webp", "Equipamentos de rede e telefone"],
    ["Mobilidade premium", "mobility.webp", "Notebook Apple das linhas Air e Pro"],
    ["Notebooks", "notebook.webp", "Notebook corporativo"],
    ["Celulares", "cellphones.webp", "Celulares e smartphones"],
    ["Acessórios", "accessories.webp", "Acessórios para computador"],
  ]) {
    const card = [...htmlV2.matchAll(/<article class="solution-card"[\s\S]*?<\/article>/g)]
      .map(([markup]) => markup)
      .find(markup => markup.includes(`<h3 id="`) && markup.includes(`>${title}</h3>`)) ?? "";
    assert.match(card, new RegExp(`<img class="solution-image" src="assets/${image}" alt="${alt}"`));
    assert.ok(existsSync(new URL(`./assets/${image}`, import.meta.url)), `missing ${image}`);
  }
});

test("keeps the existing page untouched as the first version", () => {
  assert.match(html, /<title>PlaceTech \| Soluções em tecnologia<\/title>/);
  assert.match(htmlV2, /<title>PlaceTech \| Tecnologia para o próximo passo<\/title>/);
});

test("adds the client-logo carousel and glass header to indexPuro", () => {
  const clientSection = pureHtml.match(/<section id="clientes"[\s\S]*?<\/section>/)?.[0] ?? "";
  assert.match(pureHtml, /\bglass-header\b/);
  assert.match(clientSection, /aria-roledescription="carrossel"/);
  assert.equal((clientSection.match(/class="client-list"/g) ?? []).length, 2);
  assert.match(clientSection, /class="client-list" aria-label="Logos de clientes"/);
  assert.match(clientSection, /class="client-list" aria-hidden="true"/);
  assert.doesNotMatch(clientSection, /class="client-name"/);
  const visibleClientList = clientSection.match(/<ul class="client-list" aria-label="Logos de clientes">([\s\S]*?)<\/ul>/)?.[1] ?? "";
  for (const [client, name] of [
    ["andritz", "Andritz"],
    ["palmeiras", "Palmeiras"],
    ["engemon", "Engemon"],
    ["renault-brasil", "Renault Brasil"],
    ["ampm", "ampm"],
    ["santos-fc", "Santos FC"],
  ]) {
    assert.match(clientSection, new RegExp(`assets/client-logos/${client}\\.webp`));
    assert.match(visibleClientList, new RegExp(`assets/client-logos/${client}\\.webp" alt="${name}"`));
    assert.ok(existsSync(new URL(`./assets/client-logos/${client}.webp`, import.meta.url)), `missing logo: ${client}`);
  }
  assert.match(pureHtml, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?client-carousel/);
  assert.match(pureHtml, /Promise\.all\(clientImages\.map\(waitForImage\)\)/);
});

test("keeps both indexPuro carousels moving with reduced motion enabled", () => {
  assert.match(pureHtml, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?#clientes \.client-carousel\.is-running \.client-track\s*\{[^}]*animation-duration:\s*36s\s*!important;[^}]*animation-iteration-count:\s*infinite\s*!important;/);
  assert.match(pureHtml, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?#placetech-category-carousel \.animate-marquee\s*\{[^}]*animation:\s*marquee\s+36s\s+linear\s+infinite\s*!important;/);
});

test("replaces product brand labels with accessible logos in indexPuro", () => {
  const heroBrands = pureHtml.match(/<p [^>]*data-placetech-hero-brands[^>]*>[\s\S]*?<\/p>/)?.[0] ?? "";
  const expectedHeroLogos = [
    ["lenovo.webp", "Lenovo"],
    ["dell.webp", "Dell"],
    ["apple.webp", "Apple"],
    ["samsung.webp", "Samsung"],
    ["xiaomi-mi.webp", "Xiaomi Mi"],
    ["motorola.webp", "Motorola"],
    ["acer.webp", "Acer"],
    ["logitech.webp", "Logitech"],
  ];
  const actualHeroLogos = [...heroBrands.matchAll(/<img class="hero-brand-logo" src="assets\/product-logos\/([^"]+)" alt="([^"]+)"/g)]
    .map(([, image, alt]) => [image, alt]);
  assert.deepEqual(actualHeroLogos, expectedHeroLogos);

  const actualProductLogos = [...pureHtml.matchAll(/<img class="product-brand-logo" src="assets\/product-logos\/([^"]+)" alt="([^"]+)" loading="lazy">/g)]
    .map(([, image, alt]) => [image, alt]);
  assert.equal(actualProductLogos.length, 13);
  assert.doesNotMatch(pureHtml, />(?:LENOVO|DELL|APPLE|SAMSUNG|XIAOMI|MOTOROLA|ACER|LOGITECH)<\/span>/);
  assert.match(pureHtml, /img\[src\$="\/lenovo\.webp"\][^}]*filter:\s*brightness\(0\)\s+drop-shadow\(/);
  assert.match(pureHtml, /\.product-brand-logo\s*\{[^}]*filter:\s*drop-shadow\(/);
  for (const [image] of [...expectedHeroLogos, ...actualProductLogos]) {
    assert.ok(existsSync(new URL(`./assets/product-logos/${image}`, import.meta.url)), `missing logo: ${image}`);
  }
});

test("zooms lazy-loaded photos when they enter the viewport in indexPuro", () => {
  const lazyPhotos = [...pureHtml.matchAll(/<img[^>]*loading="lazy"[^>]*duotone-img[^>]*>/g)];
  assert.equal(lazyPhotos.length, 10);
  assert.match(pureHtml, /\.duotone-img\.is-in-view\s*\{\s*transform:\s*scale\(1\.03\);/);
  assert.match(pureHtml, /data-placetech-image-focus[\s\S]*?new IntersectionObserver/);
  assert.match(pureHtml, /entry\.target\.classList\.add\("is-in-view"\)/);
  assert.match(pureHtml, /observer\.unobserve\(entry\.target\)/);
});

test("uses the supplied PlaceTech mark and matching accent color in indexPuro", () => {
  const headerLogo = pureHtml.match(/<a href="#inicio" data-testid="nav-logo-link"[^>]*>([\s\S]*?)<\/a>/)?.[1] ?? "";
  const footer = pureHtml.match(/<footer[\s\S]*?<\/footer>/)?.[0] ?? "";
  assert.match(headerLogo, /<img[^>]*src="assets\/placetech-mark\.webp"[^>]*alt=""/);
  assert.match(footer, /src="assets\/placetech-mark\.webp"/);
  assert.equal((pureHtml.match(/src="assets\/placetech-mark\.webp"/g) ?? []).length, 2);
  assert.match(pureHtml, /meta name="theme-color" content="#FFA600"/);
  assert.match(pureHtml, /--brand:\s*#FFA600/);
  assert.match(pureHtml, /background-color:\s*rgb\(255 166 0/);
  assert.match(pureHtml, /color:\s*rgb\(255 166 0/);
  assert.doesNotMatch(pureHtml, /255 212 0|255, 212, 0/);
  assert.ok(existsSync(new URL("./assets/placetech-mark.webp", import.meta.url)));
});

test("links the indexPuro hero portfolio CTA to the portfolio section", () => {
  const cta = pureHtml.match(/<a\s+href="#portfolio"\s+data-testid="hero-portfolio-button"[\s\S]*?<\/a>/)?.[0] ?? "";
  assert.match(cta, /<span>Ver <\/span><span class="text-brand">portfólio<\/span>/);
  assert.match(cta, /lucide-arrow-down/);
  assert.match(pureHtml, /<section\s+id="portfolio"/);
});

test("highlights portfolio in the hero CTA with the PlaceTech brand color", () => {
  const cta = pureHtml.match(/<a\s+href="#portfolio"\s+data-testid="hero-portfolio-button"[\s\S]*?<\/a>/)?.[0] ?? "";
  assert.match(cta, /<span>Ver <\/span><span class="text-brand">portfólio<\/span>/);
  assert.match(pureHtml, /\.text-brand\s*\{[^}]*color:\s*rgb\(255 166 0/);
});

test("keeps the yellow category carousel infinite and responsive in indexPuro", () => {
  const start = pureHtml.indexOf('id="placetech-category-carousel"');
  const end = pureHtml.indexOf("<section", start);
  const marquee = start < 0 || end < 0 ? "" : pureHtml.slice(start, end);
  const labels = [...marquee.matchAll(/x-source-var="ITEMS"[^>]*>([^<]+)<\/span>/g)].map(([, label]) => label);

  assert.match(marquee, /role="region" aria-roledescription="carrossel" aria-label="Categorias PlaceTech"/);
  assert.equal(labels.length, 14);
  assert.deepEqual(labels.slice(0, 7), labels.slice(7));
  assert.equal(labels[0], "Servidores");
  assert.equal(labels[1], "Notebooks");
  assert.match(marquee, /aria-hidden="true" class="flex w-max shrink-0 items-center"/);
  assert.match(pureHtml, /#placetech-category-carousel \.animate-marquee\s*\{[^}]*animation-duration:\s*36s/);
});

test("removes all Emergent references from indexPuro", () => {
  assert.equal((pureHtml.match(/emergent/gi) ?? []).length, 0, "indexPuro still contains Emergent references");
});
