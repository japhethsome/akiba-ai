import sharp from "sharp";
import { join } from "path";

const publicDir = "c:\\Users\\user\\Desktop\\AAkiba\\akiba-ai\\public";

async function compress() {
  try {
    console.log("Compressing hero.png...");
    await sharp(join(publicDir, "hero.png"))
      .webp({ quality: 80 })
      .toFile(join(publicDir, "hero.webp"));
    console.log("hero.webp created successfully!");

    console.log("Compressing main.png...");
    await sharp(join(publicDir, "main.png"))
      .webp({ quality: 80 })
      .toFile(join(publicDir, "main.webp"));
    console.log("main.webp created successfully!");

    console.log("Compressing logo.png...");
    await sharp(join(publicDir, "logo.png"))
      .webp({ quality: 80 })
      .toFile(join(publicDir, "logo.webp"));
    console.log("logo.webp created successfully!");

  } catch (err) {
    console.error("Compression failed:", err);
  }
}

compress();
