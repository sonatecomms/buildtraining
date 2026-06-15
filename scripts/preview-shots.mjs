// Screenshot the local /preview route in each design direction (A/B/C).
// Run against a dev server started with Supabase env blanked (local coach mode),
// so the auth gate is bypassed. Usage: PORT=3211 node scripts/preview-shots.mjs
import puppeteer from "puppeteer-core";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = process.env.PORT || "3211";
const OUT = process.env.OUT || "/tmp/build-preview";
const base = `http://localhost:${PORT}/preview`;

const fs = await import("node:fs");
fs.mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--hide-scrollbars"],
});

const page = await browser.newPage();
await page.setViewport({ width: 430, height: 2800, deviceScaleFactor: 2 });
await page.goto(base, { waitUntil: "networkidle0", timeout: 30000 });
await new Promise((r) => setTimeout(r, 1200)); // let splash clear / fonts load

const labels = ["Refined", "Editorial", "Bold"];
for (const label of labels) {
  const clicked = await page.evaluate((lbl) => {
    const btn = [...document.querySelectorAll("button")].find((b) => b.textContent?.includes(lbl));
    if (btn) { btn.click(); return true; }
    return false;
  }, label);
  await new Promise((r) => setTimeout(r, 600));
  const file = `${OUT}/${label.toLowerCase()}.png`;
  await page.screenshot({ path: file });
  console.log(`${clicked ? "OK " : "?? "} ${label} -> ${file}`);
}

// also capture whatever the page top shows (to detect an auth gate)
const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 120));
console.log("PAGE TEXT:", JSON.stringify(bodyText));

await browser.close();
