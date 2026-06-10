import puppeteer from "puppeteer-core";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = process.env.PORT || "3210";
const OUT = process.env.OUT || "/tmp/build-splash";
const base = `http://localhost:${PORT}`;

const fs = await import("node:fs");
fs.mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--hide-scrollbars"],
});

// Capture the splash at several moments of the ~1.9s run. Fresh page each time
// = fresh session = the splash plays again.
const frames = [120, 380, 700, 880, 1150, 1500];
for (const at of frames) {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto(base + "/", { waitUntil: "domcontentloaded", timeout: 30000 });
  await new Promise((r) => setTimeout(r, at));
  await page.screenshot({ path: `${OUT}/splash-${String(at).padStart(4, "0")}.png` });
  await page.close();
  console.log("shot splash", at);
}

await browser.close();
console.log("done");
