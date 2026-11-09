const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false });
  await win.loadURL('about:blank');

  const srcLogoPath = path.resolve('public/logo-original.png');
  const buf = fs.readFileSync(srcLogoPath);
  const dataUri = `data:image/png;base64,${buf.toString('base64')}`;

  const croppedResult = await win.webContents.executeJavaScript(`
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, img.width, img.height);
        const data = imgData.data;

        // Find content bounds
        let minX = img.width, minY = img.height, maxX = 0, maxY = 0;
        for (let y = 0; y < img.height; y++) {
          for (let x = 0; x < img.width; x++) {
            const idx = (y * img.width + x) * 4;
            const a = data[idx + 3];
            if (a > 10) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }

        const contentW = maxX - minX + 1;
        const contentH = maxY - minY + 1;
        const maxDim = Math.max(contentW, contentH);
        
        // Add 2.5% optical padding so curves don't clip at edges
        const padding = Math.round(maxDim * 0.025);
        const targetDim = maxDim + padding * 2;

        const outCanvas = document.createElement('canvas');
        outCanvas.width = targetDim;
        outCanvas.height = targetDim;
        const outCtx = outCanvas.getContext('2d');
        outCtx.imageSmoothingEnabled = true;
        outCtx.imageSmoothingQuality = 'high';

        const destX = padding + Math.round((maxDim - contentW) / 2);
        const destY = padding + Math.round((maxDim - contentH) / 2);

        outCtx.drawImage(
          canvas,
          minX, minY, contentW, contentH,
          destX, destY, contentW, contentH
        );

        resolve({
          original: { width: img.width, height: img.height },
          bounds: { minX, minY, maxX, maxY, contentW, contentH },
          targetDim,
          dataUrl: outCanvas.toDataURL('image/png').split(',')[1]
        });
      };
      img.src = "${dataUri}";
    })
  `);

  const pngBuffer = Buffer.from(croppedResult.dataUrl, 'base64');

  // Save to public/logo.png and src/assets/logo.png
  const publicPath = path.resolve('public/logo.png');
  const assetsPath = path.resolve('src/assets/logo.png');
  fs.writeFileSync(publicPath, pngBuffer);
  fs.writeFileSync(assetsPath, pngBuffer);
  console.log(`Saved tightly-cropped logo (${croppedResult.targetDim}x${croppedResult.targetDim}) to:`);
  console.log(' -', publicPath);
  console.log(' -', assetsPath);

  // Update public/aura-icon.svg
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 256 256" width="100%" height="100%">
  <image href="data:image/png;base64,${croppedResult.dataUrl}" x="0" y="0" width="256" height="256" preserveAspectRatio="xMidYMid meet" />
</svg>
`;
  const svgPath = path.resolve('public/aura-icon.svg');
  fs.writeFileSync(svgPath, svgContent, 'utf-8');
  console.log(' - Updated', svgPath);

  win.close();
  app.quit();
});
