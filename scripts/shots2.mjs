import puppeteer from "puppeteer-core";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = process.env.PORT || "3000";
const OUT = process.env.OUT || "/tmp/forge-shots4";
const base = `http://localhost:${PORT}`;
const fs = await import("node:fs");
fs.mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--hide-scrollbars"],
});

async function mobile() {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  return page;
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// 1. Program builder, Monday selected (shows the Lower workout w/ blocks, drag handles, video thumbs)
{
  const page = await mobile();
  await page.goto(`${base}/clients/client-jordan?tab=program`, { waitUntil: "networkidle0" });
  await page.click('[data-dow="1"]'); // Monday
  await wait(500);
  await page.screenshot({ path: `${OUT}/a-program-monday.png` });

  // 2. open the video picker on the first movement
  await page.click('button[title="Choose demo video"]');
  await wait(900);
  await page.screenshot({ path: `${OUT}/b-video-picker.png` });
  await page.close();
  console.log("program + video done");
}

// 3. Train view, Monday selected (week strip + day workout)
{
  const page = await mobile();
  await page.goto(`${base}/clients/client-jordan?tab=train`, { waitUntil: "networkidle0" });
  await page.click('[data-dow="1"]');
  await wait(500);
  await page.screenshot({ path: `${OUT}/c-train-monday.png` });
  await page.close();
  console.log("train done");
}

await browser.close();
console.log("done");
