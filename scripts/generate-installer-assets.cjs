const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 600,
    height: 600,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  const buildDir = path.resolve(__dirname, '../build');
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
  }

  const logoPngPath = path.resolve(__dirname, '../public/logo.png');
  const hasCustomLogo = fs.existsSync(logoPngPath);
  let logoDataUrl = '';
  if (hasCustomLogo) {
    const buf = fs.readFileSync(logoPngPath);
    logoDataUrl = `data:image/png;base64,${buf.toString('base64')}`;
  }

  await win.loadURL('about:blank');

  // Generate assets inside Chromium using HTML5 canvas
  const assets = await win.webContents.executeJavaScript(`
    new Promise((resolve) => {
      const hasCustomLogo = ${hasCustomLogo};
      const logoDataUrl = "${logoDataUrl}";

      // Fallback SVG emblem string matching LoadingScreen.tsx
      const fallbackSvg = \`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
          <defs>
            <linearGradient id="emblemGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#2c2a28"/>
              <stop offset="100%" stop-color="#181716"/>
            </linearGradient>
            <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#e8cfb5"/>
              <stop offset="100%" stop-color="#c99a6b"/>
            </linearGradient>
          </defs>
          <rect width="128" height="128" rx="36" fill="url(#emblemGrad)"/>
          <rect x="2" y="2" width="124" height="124" rx="34" fill="none" stroke="#443f3b" stroke-width="2"/>
          <circle cx="64" cy="64" r="34" stroke="url(#ringGrad)" stroke-width="6.5" stroke-linecap="round" fill="none"/>
          <circle cx="64" cy="64" r="9" fill="#FAF8F5"/>
          <line x1="42" y1="64" x2="86" y2="64" stroke="#FAF8F5" stroke-width="5" stroke-linecap="round"/>
        </svg>
      \`;

      const loadLogoImg = () => {
        return new Promise((res) => {
          const img = new Image();
          img.onload = () => res(img);
          img.onerror = () => {
            // Load SVG fallback
            const svgImg = new Image();
            svgImg.onload = () => res(svgImg);
            svgImg.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(fallbackSvg);
          };
          if (hasCustomLogo && logoDataUrl) {
            img.src = logoDataUrl;
          } else {
            img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(fallbackSvg);
          }
        });
      };

      // Helper to convert canvas ImageData to 24-bit BMP base64
      function canvasToBmpBase64(ctx, width, height) {
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        const rowSize = width * 3;
        const rowPadding = (4 - (rowSize % 4)) % 4;
        const paddedRowSize = rowSize + rowPadding;
        const pixelArraySize = paddedRowSize * height;
        const fileSize = 54 + pixelArraySize;

        const buffer = new Uint8Array(fileSize);

        // BMP Header (14 bytes)
        buffer[0] = 0x42; // 'B'
        buffer[1] = 0x4D; // 'M'
        buffer[2] = fileSize & 0xff;
        buffer[3] = (fileSize >> 8) & 0xff;
        buffer[4] = (fileSize >> 16) & 0xff;
        buffer[5] = (fileSize >> 24) & 0xff;
        buffer[10] = 54; // Offset to pixel array

        // DIB Header (BITMAPINFOHEADER, 40 bytes)
        buffer[14] = 40; // DIB header size
        buffer[18] = width & 0xff;
        buffer[19] = (width >> 8) & 0xff;
        buffer[20] = (width >> 16) & 0xff;
        buffer[21] = (width >> 24) & 0xff;
        buffer[22] = height & 0xff;
        buffer[23] = (height >> 8) & 0xff;
        buffer[24] = (height >> 16) & 0xff;
        buffer[25] = (height >> 24) & 0xff;
        buffer[26] = 1; // Color planes
        buffer[28] = 24; // Bits per pixel (24 bpp BGR)
        buffer[30] = 0; // BI_RGB (uncompressed)
        buffer[34] = pixelArraySize & 0xff;
        buffer[35] = (pixelArraySize >> 8) & 0xff;
        buffer[36] = (pixelArraySize >> 16) & 0xff;
        buffer[37] = (pixelArraySize >> 24) & 0xff;
        buffer[38] = 0x13; // 72 DPI (2835 ppm)
        buffer[39] = 0x0b;
        buffer[42] = 0x13;
        buffer[43] = 0x0b;

        // Write BGR pixels bottom-to-top
        let destOffset = 54;
        for (let y = height - 1; y >= 0; y--) {
          for (let x = 0; x < width; x++) {
            const srcIndex = (y * width + x) * 4;
            buffer[destOffset++] = data[srcIndex + 2]; // Blue
            buffer[destOffset++] = data[srcIndex + 1]; // Green
            buffer[destOffset++] = data[srcIndex];     // Red
          }
          for (let p = 0; p < rowPadding; p++) {
            buffer[destOffset++] = 0;
          }
        }

        let binary = '';
        for (let i = 0; i < buffer.byteLength; i++) {
          binary += String.fromCharCode(buffer[i]);
        }
        return btoa(binary);
      }

      loadLogoImg().then((logoImg) => {
        // 1. NSIS Installer Sidebar Bitmap (164 x 314)
        const sideCanvas = document.createElement('canvas');
        sideCanvas.width = 164;
        sideCanvas.height = 314;
        const sideCtx = sideCanvas.getContext('2d');

        const bgGrad = sideCtx.createLinearGradient(0, 0, 0, 314);
        bgGrad.addColorStop(0, '#1c1b1a');
        bgGrad.addColorStop(0.5, '#151413');
        bgGrad.addColorStop(1, '#0e0e0d');
        sideCtx.fillStyle = bgGrad;
        sideCtx.fillRect(0, 0, 164, 314);

        const glowGrad = sideCtx.createRadialGradient(82, 85, 5, 82, 85, 75);
        glowGrad.addColorStop(0, 'rgba(217, 163, 107, 0.22)');
        glowGrad.addColorStop(0.6, 'rgba(217, 163, 107, 0.06)');
        glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        sideCtx.fillStyle = glowGrad;
        sideCtx.beginPath();
        sideCtx.arc(82, 85, 75, 0, Math.PI * 2);
        sideCtx.fill();

        sideCtx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        sideCtx.lineWidth = 1;
        for (let i = 20; i < 314; i += 24) {
          sideCtx.beginPath();
          sideCtx.moveTo(0, i);
          sideCtx.lineTo(164, i);
          sideCtx.stroke();
        }

        const logoSize = 64;
        sideCtx.drawImage(logoImg, (164 - logoSize) / 2, 53, logoSize, logoSize);

        sideCtx.fillStyle = '#FAF8F5';
        sideCtx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        sideCtx.textAlign = 'center';
        sideCtx.fillText('A  U  R  A', 82, 148);

        sideCtx.fillStyle = '#b3aba2';
        sideCtx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        sideCtx.fillText('Live Markdown Editor', 82, 168);

        const lineGrad = sideCtx.createLinearGradient(30, 0, 134, 0);
        lineGrad.addColorStop(0, 'rgba(217, 163, 107, 0)');
        lineGrad.addColorStop(0.5, 'rgba(217, 163, 107, 0.7)');
        lineGrad.addColorStop(1, 'rgba(217, 163, 107, 0)');
        sideCtx.strokeStyle = lineGrad;
        sideCtx.lineWidth = 1.5;
        sideCtx.beginPath();
        sideCtx.moveTo(30, 185);
        sideCtx.lineTo(134, 185);
        sideCtx.stroke();

        sideCtx.fillStyle = '#8c857b';
        sideCtx.font = '9px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        sideCtx.fillText('• 100% Offline & Private', 82, 212);
        sideCtx.fillText('• Zero Distractions', 82, 230);
        sideCtx.fillText('• Split & Live Markdown', 82, 248);

        const sidebarBmp = canvasToBmpBase64(sideCtx, 164, 314);
        const sidebarPng = sideCanvas.toDataURL('image/png').split(',')[1];

        // 2. NSIS Installer Header Bitmap (150 x 57)
        const headCanvas = document.createElement('canvas');
        headCanvas.width = 150;
        headCanvas.height = 57;
        const headCtx = headCanvas.getContext('2d');

        const headBg = headCtx.createLinearGradient(0, 0, 150, 57);
        headBg.addColorStop(0, '#22201e');
        headBg.addColorStop(1, '#181716');
        headCtx.fillStyle = headBg;
        headCtx.fillRect(0, 0, 150, 57);

        headCtx.drawImage(logoImg, 106, 8, 38, 38);

        headCtx.fillStyle = '#FAF8F5';
        headCtx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        headCtx.textAlign = 'left';
        headCtx.fillText('Aura Editor', 12, 26);

        headCtx.fillStyle = '#b3aba2';
        headCtx.font = '9px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        headCtx.fillText('Setup Wizard', 12, 40);

        const headerBmp = canvasToBmpBase64(headCtx, 150, 57);
        const headerPng = headCanvas.toDataURL('image/png').split(',')[1];

        // 3. Multi-resolution Icons for .ICO (256, 128, 64, 48, 32, 16)
        const iconSizes = [256, 128, 64, 48, 32, 16];
        const iconDataUrls = {};

        iconSizes.forEach((size) => {
          const icCanvas = document.createElement('canvas');
          icCanvas.width = size;
          icCanvas.height = size;
          const icCtx = icCanvas.getContext('2d');
          icCtx.drawImage(logoImg, 0, 0, size, size);
          iconDataUrls[size] = icCanvas.toDataURL('image/png').split(',')[1];
        });

        resolve({
          sidebarBmp,
          sidebarPng,
          headerBmp,
          headerPng,
          iconDataUrls,
        });
      });
    })
  `);

  // Save BMP Bitmaps & PNG Previews
  fs.writeFileSync(path.join(buildDir, 'installerSidebar.bmp'), Buffer.from(assets.sidebarBmp, 'base64'));
  fs.writeFileSync(path.join(buildDir, 'uninstallerSidebar.bmp'), Buffer.from(assets.sidebarBmp, 'base64'));
  fs.writeFileSync(path.join(buildDir, 'installerHeader.bmp'), Buffer.from(assets.headerBmp, 'base64'));
  if (assets.sidebarPng) {
    fs.writeFileSync(path.join(buildDir, 'installerSidebar.png'), Buffer.from(assets.sidebarPng, 'base64'));
  }
  if (assets.headerPng) {
    fs.writeFileSync(path.join(buildDir, 'installerHeader.png'), Buffer.from(assets.headerPng, 'base64'));
  }
  console.log('Saved custom BMP bitmaps and PNG previews (sidebar and header).');

  // Pack Multi-Size ICO file
  function packIco(pngBuffersBySize) {
    const count = Object.keys(pngBuffersBySize).length;
    const headerSize = 6;
    const dirEntrySize = 16;
    let offset = headerSize + dirEntrySize * count;

    const entries = [];
    const images = [];

    for (const [sizeStr, pngBuf] of Object.entries(pngBuffersBySize)) {
      const size = parseInt(sizeStr, 10);
      const width = size >= 256 ? 0 : size;
      const height = size >= 256 ? 0 : size;

      const entry = Buffer.alloc(16);
      entry.writeUInt8(width, 0);
      entry.writeUInt8(height, 1);
      entry.writeUInt8(0, 2); // color count
      entry.writeUInt8(0, 3); // reserved
      entry.writeUInt16LE(1, 4); // color planes
      entry.writeUInt16LE(32, 6); // bpp
      entry.writeUInt32LE(pngBuf.length, 8); // size
      entry.writeUInt32LE(offset, 12); // offset

      entries.push(entry);
      images.push(pngBuf);
      offset += pngBuf.length;
    }

    const icoHeader = Buffer.alloc(6);
    icoHeader.writeUInt16LE(0, 0); // reserved
    icoHeader.writeUInt16LE(1, 2); // type 1 = icon
    icoHeader.writeUInt16LE(count, 4); // count

    return Buffer.concat([icoHeader, ...entries, ...images]);
  }

  const pngBuffers = {};
  for (const [size, b64] of Object.entries(assets.iconDataUrls)) {
    pngBuffers[size] = Buffer.from(b64, 'base64');
  }

  const icoBuffer = packIco(pngBuffers);

  fs.writeFileSync(path.join(buildDir, 'icon.ico'), icoBuffer);
  fs.writeFileSync(path.join(buildDir, 'installerIcon.ico'), icoBuffer);
  fs.writeFileSync(path.join(buildDir, 'uninstallerIcon.ico'), icoBuffer);
  fs.writeFileSync(path.join(buildDir, 'installerHeaderIcon.ico'), icoBuffer);
  fs.writeFileSync(path.join(buildDir, 'icon.png'), pngBuffers['256']);
  console.log('Saved custom Windows icon.ico, installerIcon.ico, and icon.png successfully.');

  win.close();
  app.quit();
});
