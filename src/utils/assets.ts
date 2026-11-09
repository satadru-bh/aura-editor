import auraLogo from '../assets/logo.png';

/**
 * Universal logo asset URL bundled by Vite.
 * Resolves correctly relative to index.html in:
 * - Local development server (http://localhost:5173/...)
 * - Web production builds (./assets/logo-*.png)
 * - Electron production builds loaded via file:// (file:///.../dist/assets/logo-*.png)
 * - Packaged application asar archives (file:///.../resources/app.asar/dist/assets/logo-*.png)
 */
export const AURA_LOGO: string = auraLogo;

export default AURA_LOGO;
