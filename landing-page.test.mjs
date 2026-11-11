import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const page = new URL("./index.html", import.meta.url);
const html = existsSync(page) ? readFileSync(page, "utf8") : "";

test("has a responsive Portuguese page with navigable sections", () => {
  assert.match(html, /<html lang="pt-BR">/);
  assert.match(html, /name="viewport"/);
  for (const id of ["solucoes", "empresa", "contato"]) {
    assert.match(html, new RegExp(`id="${id}"`));
    assert.match(html, new RegExp(`href="#${id}"`));
  }
  for (const label of ["Servidores", "Conectividade", "Mobilidade", "Notebooks", "Celulares", "Acessórios"]) {
    assert.ok(html.includes(label), `missing solution: ${label}`);
  }
});

test("alternates dark and light backgrounds across the main sections", () => {
  const sections = [...html.matchAll(/<section\b([^>]*)>/g)].map(([, attributes]) => ({
    id: attributes.match(/\bid="([^"]+)"/)?.[1],
    light: /\bclass="[^"]*\blight-section\b/.test(attributes),
  }));
  assert.deepEqual(sections, [
    { id: "inicio", light: false },
    { id: "solucoes", light: true },
    { id: "empresa", light: false },
    { id: "clientes", light: true },
    { id: "contato", light: false },
  ]);
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

test("shows all six PDF client logos in an accessible automatic loop", () => {
  assert.match(html, /class="client-carousel"[^>]*aria-label="Clientes PlaceTech"/);
  assert.match(html, /@keyframes client-loop/);
  assert.match(html, /\.client-carousel\.is-running \.client-track[\s\S]*?animation:\s*client-loop/);
  assert.match(html, /aria-hidden="true"[\s\S]*?client-logos/);
  assert.match(html, /prefers-reduced-motion:\s*reduce[\s\S]*?client-track[\s\S]*?animation:\s*none/);
  assert.match(html, /pauseButton\.addEventListener\("click"/);
  assert.match(html, /pauseButton\.hidden = false/);
  assert.doesNotMatch(html, /<img src="assets\/client-logos\/[^"]+"[^>]*loading="lazy"/);
  for (const client of ["andritz", "palmeiras", "engemon", "renault-brasil", "ampm", "santos-fc"]) {
    assert.ok(html.includes(`${client}.webp`), `missing client logo: ${client}`);
    assert.ok(existsSync(new URL(`./assets/client-logos/${client}.webp`, import.meta.url)), `missing logo file: ${client}`);
  }
});

test("keeps motion optional and the page self-contained", () => {
  assert.match(html, /prefers-reduced-motion:\s*reduce/);
  assert.match(html, /:focus-visible/);
  assert.doesNotMatch(html, /<script[^>]+src=/i);
  assert.doesNotMatch(html, /transition:\s*all\b/i);
});
