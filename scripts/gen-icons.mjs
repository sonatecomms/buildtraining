// Generate PWA icons from the 1024px master mark (public/icon-app.png).
//  - icon-192 / icon-512: "any" purpose, full-bleed (the mark as-is).
//  - icon-maskable-512: "maskable" purpose — the mark scaled to ~80% on a solid
//    forest canvas so OS masking (circle/squircle) never clips the "B".
import sharp from "sharp";

const SRC = "public/icon-app.png";
const FOREST = { r: 25, g: 53, b: 12, alpha: 1 }; // #19350C

await sharp(SRC).resize(192, 192).png().toFile("public/icon-192.png");
await sharp(SRC).resize(512, 512).png().toFile("public/icon-512.png");

// maskable: 80% logo, centered, forest padding to the edges (safe zone = inner 80%)
const inner = await sharp(SRC).resize(410, 410).png().toBuffer();
await sharp({ create: { width: 512, height: 512, channels: 4, background: FOREST } })
  .composite([{ input: inner, gravity: "center" }])
  .png()
  .toFile("public/icon-maskable-512.png");

console.log("icons written: icon-192, icon-512, icon-maskable-512");
