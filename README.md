# Aura — Ultra-Minimal Live Markdown Text Editor

> **"The document is the interface."**

Aura is a world-class, ultra-minimal, blazingly fast text editor designed for Windows and the Web. It synthesizes the simplicity of **Notepad**, the writing focus of **iA Writer**, the live Markdown fluidity of **Typora**, the agility of **Obsidian**, and the visual precision of **Apple software** into an editorial writing sanctuary.

---

## Key Highlights

### 1. Seamless Live Markdown (One Mode: Writing)
- **No separate preview pane**: Type `# Heading`, `**bold**`, `*italic*`, `~~strikethrough~~`, or `` `code` `` and see them transform in place.
- **Intelligent Syntax Visibility**: Markdown syntax markers fade out or hide when the cursor is elsewhere, leaving clean, elegant text. When the cursor enters a formatted element, the underlying Markdown markers smoothly reappear for direct editing.
- **Interactive Checklists**: `- [ ]` and `- [x]` render as interactive checkboxes that toggle live on click without touching the keyboard.
- **Rendered Mathematics**: Embed LaTeX equations using `$...$` (inline) and `$$...$$` (block) rendered natively via KaTeX.
- **Inline Images & Tables**: Clean visual rendering while preserving standard Markdown source files.

### 2. Editorial Typography & Restrained Themes
- **Curated Typefaces**:
  - *Editorial Serif* (Newsreader / Charter / Georgia)
  - *Modern Sans* (Inter / System Neo-Grotesque)
  - *Monospace* (JetBrains Mono / Fira Code / Consolas)
  - *Editorial Quattro* (Literata / Humanist)
- **Restrained Themes**:
  - **Warm Paper** (editorial ivory sepia)
  - **Pure White** (crisp minimal light)
  - **Charcoal Dark** (low-strain evening writing)
  - **OLED Black** (pure black for OLED displays)
  - **Slate Gray** (modern cool dark)
  - **High Contrast Light & Dark** (accessibility-first)
- **Fine-Grained Controls**: Font size (14–28px), Line spacing (1.4–2.2), Document max width (540px, 680px, 800px, 960px, Full width), Typewriter scrolling.

### 3. Keyboard-First Design & Command Palette
- **Fuzzy Command Palette (`Ctrl + K`)**: Search and execute any command, change fonts, switch themes, or export documents.
- **Floating Find & Replace (`Ctrl + F` / `Ctrl + H`)**: Regex support, whole word, match counting, replace-all.
- **Document Outline (`Ctrl + Shift + O`)**: Instant table of contents generated from headings with one-click navigation.
- **Distraction-Free Focus Mode (`F11`)**: Strips all chrome for 100% writing focus.

### 4. File Management & Data Safety
- **Cross-Platform**: Real filesystem integration on Windows desktop (Electron) and Web (File System Access API + IndexedDB persistent store).
- **Zero Data Loss**: Debounced real-time autosave + automatic crash recovery revisions history.
- **Export Options**: Export to Markdown (`.md`), Plain Text (`.txt`), Standalone Styled HTML (`.html`), Copy Rich Text, and Print / PDF.

---

## Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl + K` | Open Command Palette |
| `Ctrl + N` | New Document |
| `Ctrl + O` | Open Document from Disk |
| `Ctrl + S` | Save Document |
| `Ctrl + Shift + S` | Save Document As... |
| `Ctrl + F` | Find in Document |
| `Ctrl + H` | Find & Replace in Document |
| `Ctrl + Shift + O` | Toggle Document Outline |
| `Ctrl + Shift + E` | Toggle Document File Drawer |
| `F11` | Toggle Distraction-Free Focus Mode |
| `Ctrl + B` | Toggle Bold |
| `Ctrl + I` | Toggle Italic |
| `Ctrl + E` | Toggle Inline Code |
| `Ctrl + Shift + X` | Toggle Strikethrough |
| `Ctrl + Shift + U` | Toggle Blockquote |
| `Ctrl + Shift + C` | Toggle Checklist / Task |
| `Ctrl + ,` | Open Preferences |
| `Ctrl + /` | Keyboard Shortcuts Cheat Sheet |

---

## Development & Build

```bash
# Run web development server
npm run dev

# Run unit tests
npm test

# Build production bundle
npm run build

# Run Electron desktop app in development
npm run electron:dev

# Build Windows Desktop installer
npm run electron:build
```
