import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function main() {
  const { pipeline } = await import('@huggingface/transformers');
  console.log('Loading ORMBG model...');
  const pipe = await pipeline('image-segmentation', 'onnx-community/ormbg-ONNX');
  console.log('Model loaded successfully.');

  const trophies = [
    { name: 'league.png', yMax: 486, fillCavities: true },
    { name: 'd2.png', yMax: 436, fillCavities: true },
    { name: 'd3.png', yMax: 436, fillCavities: true },
    { name: 'europa-league.png', yMax: 495, fillCavities: true },
    { name: 'champions-league.png', yMax: 480, fillCavities: true }
  ];

  const originalsDir = path.join('public/assets/trophies/originals');
  if (!fs.existsSync(originalsDir)) {
    fs.mkdirSync(originalsDir, { recursive: true });
  }

  for (const t of trophies) {
    const srcPath = path.join('public/assets/trophies', t.name);
    const origPath = path.join(originalsDir, t.name);

    if (!fs.existsSync(origPath)) {
      fs.copyFileSync(srcPath, origPath);
    }

    console.log(`\n========================================\nProcessing ${t.name}...`);

    const result = await pipe(origPath);
    const mask = result[0].mask;
    const w = mask.width;
    const h = mask.height;

    const { data: rgbData } = await sharp(origPath).raw().toBuffer({ resolveWithObject: true });

    // 1. Initial foreground
    const fg = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) {
      const y = Math.floor(i / w);
      if (y <= t.yMax && mask.data[i] >= 35) {
        fg[i] = 1;
      }
    }

    // 2. Flood fill background from borders
    const isBg = new Uint8Array(w * h);
    const queue = [];
    const addSeed = (x, y) => {
      const idx = y * w + x;
      if (!isBg[idx] && fg[idx] === 0) {
        isBg[idx] = 1;
        queue.push(idx);
      }
    };
    for (let x = 0; x < w; x++) { addSeed(x, 0); addSeed(x, h - 1); }
    for (let y = 0; y < h; y++) { addSeed(0, y); addSeed(w - 1, y); }

    let head = 0;
    while (head < queue.length) {
      const curr = queue[head++];
      const cy = Math.floor(curr / w);
      const cx = curr % w;
      const neighbors = [
        [cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]
      ];
      for (const [nx, ny] of neighbors) {
        if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
          const nidx = ny * w + nx;
          if (!isBg[nidx] && fg[nidx] === 0) {
            isBg[nidx] = 1;
            queue.push(nidx);
          }
        }
      }
    }

    // 3. Cavity handling (for trophies with dark reflective bowls)
    if (t.fillCavities) {
      const holeVisited = new Uint8Array(w * h);
      for (let i = 0; i < w * h; i++) {
        if (!isBg[i] && !fg[i] && !holeVisited[i]) {
          const holeComp = [i];
          holeVisited[i] = 1;
          let qh = 0;
          let sumX = i % w;

          while (qh < holeComp.length) {
            const curr = holeComp[qh++];
            const cy = Math.floor(curr / w);
            const cx = curr % w;
            const neighbors = [
              [cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]
            ];
            for (const [nx, ny] of neighbors) {
              if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                const nidx = ny * w + nx;
                if (!isBg[nidx] && !fg[nidx] && !holeVisited[nidx]) {
                  holeVisited[nidx] = 1;
                  holeComp.push(nidx);
                  sumX += nx;
                }
              }
            }
          }

          const meanX = sumX / holeComp.length;
          // If hole is in cup bowl column, fill it
          if (meanX >= 0.29 * w && meanX <= 0.71 * w) {
            console.log(`Filled central bowl cavity (${holeComp.length} px) at centroid ${(meanX / w).toFixed(2)}w`);
            for (const p of holeComp) {
              fg[p] = 1;
            }
          }
        }
      }
    }

    // 4. Remove isolated noise / specks
    const fgVisited = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) {
      if (fg[i] && !fgVisited[i]) {
        const comp = [i];
        fgVisited[i] = 1;
        let qh = 0;
        while (qh < comp.length) {
          const curr = comp[qh++];
          const cy = Math.floor(curr / w);
          const cx = curr % w;
          const neighbors = [
            [cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]
          ];
          for (const [nx, ny] of neighbors) {
            if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
              const nidx = ny * w + nx;
              if (fg[nidx] && !fgVisited[nidx]) {
                fgVisited[nidx] = 1;
                comp.push(nidx);
              }
            }
          }
        }
        if (comp.length < 500) {
          for (const p of comp) fg[p] = 0;
        }
      }
    }

    // 5. Antialiasing / smooth edge matting
    // Use raw mask alpha along boundary for smooth edges, 255 in deep interior
    const alphaMatte = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) {
      if (fg[i]) {
        // If it's a solid interior pixel, keep high alpha; if at boundary, use original mask gradient
        const origA = mask.data[i];
        alphaMatte[i] = origA > 180 ? 255 : Math.max(origA, 220);
      } else {
        alphaMatte[i] = 0;
      }
    }

    // 6. Build final RGBA image
    const rgba = Buffer.alloc(w * h * 4);
    for (let i = 0; i < w * h; i++) {
      rgba[i * 4] = rgbData[i * 3];
      rgba[i * 4 + 1] = rgbData[i * 3 + 1];
      rgba[i * 4 + 2] = rgbData[i * 3 + 2];
      rgba[i * 4 + 3] = alphaMatte[i];
    }

    const outBuffer = await sharp(rgba, {
      raw: { width: w, height: h, channels: 4 }
    }).png().toBuffer();

    fs.writeFileSync(srcPath, outBuffer);

    console.log(`Successfully generated clean transparent cutout for ${t.name}`);
  }

  console.log('\nAll 5 trophies processed successfully!');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
