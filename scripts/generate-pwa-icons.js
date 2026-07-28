const sharp = require('sharp');
const path = require('path');

const sizes = [192, 512];
const input = path.resolve(__dirname, '..', 'assets', 'icon.png');
const outputDir = path.resolve(__dirname, '..', 'web', 'assets');

async function generate() {
  const fs = require('fs');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const size of sizes) {
    await sharp(input)
      .resize(size, size)
      .png()
      .toFile(path.join(outputDir, `icon-${size}x${size}.png`));
    console.log(`Generated icon-${size}x${size}.png`);
  }
}

generate().catch(console.error);
