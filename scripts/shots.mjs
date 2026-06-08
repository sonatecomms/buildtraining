import puppeteer from "puppeteer-core";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = process.env.PORT || "3000";
const OUT = process.env.OUT || "/tmp/forge-shots3";
const base = `http://localhost:${PORT}`;

const screens = [
  ["1-home", "/"],
  ["2-program", "/clients/client-jordan?tab=program"],
  ["3-train", "/clients/client-jordan?tab=train"],
  ["4-profile", "/clients/client-jordan?tab=profile"],
  ["5-exercises", "/exercises"],
  ["6-install", "/install"],
];

const fs = await import("node:fs");
fs.mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--hide-scrollbars"],
});

for (const [name, path] of screens) {
  const page = await browser.newPage();
  // iPhone 13-ish: 390x844 CSS, 3x DPR, mobile
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  await page.goto(base + path, { waitUntil: "networkidle0", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 600)); // let tab effect + fonts settle
  await page.screenshot({ path: `${OUT}/${name}.png` });
  await page.close();
  console.log("shot", name);
}

await browser.close();
console.log("done");
