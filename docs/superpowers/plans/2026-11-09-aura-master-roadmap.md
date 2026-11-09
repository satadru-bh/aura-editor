# Aura Master Roadmap & Architecture Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan section-by-section. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform Aura into the definitive distraction-free Markdown writing instrument: replacing virtual `localStorage` with a true local folder/vault filesystem, auto-saving pasted media to disk, adding elegant inline Callouts and Table controls, bi-directional `[[WikiLinks]]` with floating glass previews, and optimizing bundle performance.

**Architecture:**
- **Local-First Workspace Core:** Decouple file storage from browser `localStorage` into direct local filesystem reads/writes via Electron IPC (`fs/promises` + file watcher), supporting real folder workspaces ("Vaults").
- **Asset Pipeline:** Intercept image paste/drop events, stream images to a local `./assets/` folder, and insert clean relative Markdown references instead of Base64 blobs.
- **Live Typographic Luxuries:** Extend CodeMirror 6 ViewPlugins for Obsidian-grade Callouts (`> [!NOTE]`), interactive table navigation, paragraph focus spotlight, and `[[WikiLink]]` auto-complete with popover previews.
- **Bundle Optimization:** Dynamic code-splitting for heavy engines (`mermaid`, `katex`, `cytoscape`, `html2canvas`) and modularizing `src/App.tsx`.

**Tech Stack:** React 19, TypeScript, CodeMirror 6, Electron, Vite, Tailwind CSS, Vitest.

**Spec:** User architecture guidance (2026-11-09) — "Solidify Aura as the greatest without forgetting the plot: minimal, luxury writing instrument, zero latency, not a bloated kitchen-sink app."

---

## Global Constraints
- **Preserve the Plot:** Aura is a precision writing instrument, not an enterprise database or infinite canvas. Every feature must prioritize typographic elegance, speed, and focus.
- **Offline & Private:** 100% local execution. No cloud accounts, telemetries, or remote server dependencies required for core writing.
- **Standard Markdown:** Files must remain pure, standard `.md` text files fully readable in VS Code, Obsidian, GitHub, or any text editor.
- **Performance Budget:** App cold start under 150ms; keystroke latency under 8ms; 0 dropped frames during fast scrolling.
- **Test Integrity:** All existing 30 Vitest tests must pass at every phase; new features must have comprehensive unit tests.

---

## Review Focus
1. **Data Loss Immunity:** Editing existing files on disk must write reliably to the physical file without clobbering drafts or truncating on unexpected shutdown.
2. **Media Asset Integrity:** Dropping or pasting PNG/JPEG/GIF must never produce raw multi-megabyte Base64 text in the markdown file.
3. **Typographic Grace:** Callout boxes, tables, and math rendering must seamlessly transition between live formatted visual and editable raw markdown without cursor jumps.
4. **Link Resolution:** `[[WikiLinks]]` must resolve case-insensitively, handle note renames without dead links, and open linked notes instantaneously.
5. **Clean Monochromatic Aesthetic:** No garish accent outlines outside the text area; maintain luxury minimal palette in dark and light modes.

---

## Master Task Decomposition (Section-by-Section)

```
┌────────────────────────────────────────────────────────────────────────┐
│                   AURA MASTER IMPLEMENTATION PHASES                   │
├────────────────────────────────────────────────────────────────────────┤
│ Section 1: True Local Workspace & Folder Vault (Disk-First Storage)   │
│ Section 2: Clipboard & Drag-Drop Asset Vault (No Base64 Bloat)        │
│ Section 3: Luxury Typographic Blocks (Callouts & Table Navigation)     │
│ Section 4: Focus Flow Modes (Paragraph Spotlight, Bionic, Hemingway)   │
│ Section 5: WikiLinks (`[[Note]]`) & Frosted Glass Hover Preview        │
│ Section 6: Architecture Clean-Up & Bundle Code-Splitting              │
└────────────────────────────────────────────────────────────────────────┘
```

---

### Section 1: True Local Workspace & Folder Vault (Disk-First Storage)

**Goal:** Eliminate browser `localStorage` size limits by enabling users to open any real local folder (e.g. `C:\MyNotes`) as a workspace, syncing edits directly to `.md` files on disk with two-way file watching.

**Files:**
- Create: `src/services/WorkspaceService.ts`
- Create: `src/services/WorkspaceService.test.ts`
- Modify: `electron/main.cjs`
- Modify: `electron/preload.cjs`
- Modify: `src/services/FileSystemService.ts`
- Modify: `src/components/SidebarDrawer.tsx`
- Modify: `src/components/TitleBar.tsx`

- [ ] Step 1.1: In `electron/main.cjs`, implement IPC handlers `workspace:openFolderDialog`, `workspace:readDirectoryTree`, and recursive directory watcher using `fs.watch`.
- [ ] Step 1.2: In `electron/preload.cjs`, expose `openFolderDialog`, `readDirectoryTree`, and `onWorkspaceChanged`.
- [ ] Step 1.3: Create `src/services/WorkspaceService.ts` to manage active workspace path, folder hierarchy, open documents, and disk synchronization.
- [ ] Step 1.4: Write unit tests in `src/services/WorkspaceService.test.ts` verifying file tree sorting, markdown file filtering, and path resolution.
- [ ] Step 1.5: Update `SidebarDrawer.tsx` to render the real folder file tree alongside favorites and recent files.
- [ ] Step 1.6: Update `TitleBar.tsx` to include "Open Folder..." action and display the current workspace name.
- [ ] Step 1.7: Run `npm.cmd test` and verify tests pass.

---

### Section 2: Clipboard & Drag-Drop Asset Vault (No Base64 Bloat)

**Goal:** Intercept pasted/dropped images, automatically save them into the workspace's `./assets/` directory on disk, and insert clean relative links `![](./assets/image.png)` instead of 5MB Base64 blobs.

**Files:**
- Create: `src/services/AssetManagerService.ts`
- Create: `src/services/AssetManagerService.test.ts`
- Modify: `electron/main.cjs`
- Modify: `electron/preload.cjs`
- Modify: `src/components/Editor.tsx`
- Modify: `src/editor/LiveMarkdownPlugin.ts`

- [ ] Step 2.1: In `electron/main.cjs`, implement `asset:saveImage` handler to write binary buffer or Base64 data from clipboard to `${noteDir}/assets/${filename}` on disk.
- [ ] Step 2.2: In `electron/preload.cjs`, expose `saveAssetImage(notePath, buffer, preferredName)`.
- [ ] Step 2.3: Create `src/services/AssetManagerService.ts` to generate clean collision-free asset names (`image-YYYYMMDD-HHmmss.png`).
- [ ] Step 2.4: Write unit tests in `src/services/AssetManagerService.test.ts`.
- [ ] Step 2.5: In `src/components/Editor.tsx`, intercept `paste` and `drop` events with image MIME types, route through `AssetManagerService`, and insert `![image](./assets/filename.png)`.
- [ ] Step 2.6: In `LiveMarkdownPlugin.ts`, resolve local relative image paths cleanly in the live preview with rounded corners and subtle captioning.
- [ ] Step 2.7: Run tests to verify clean integration.

---

### Section 3: Luxury Typographic Blocks (Callouts & Interactive Tables)

**Goal:** Add native, distraction-free rendering for Obsidian-style Callouts (`> [!NOTE]`, `> [!TIP]`, etc.) and interactive table cell navigation without leaving the flow state.

**Files:**
- Create: `src/editor/CalloutPlugin.ts`
- Create: `src/editor/CalloutPlugin.test.ts`
- Create: `src/editor/TablePlugin.ts`
- Modify: `src/editor/LiveMarkdownPlugin.ts`
- Modify: `src/components/Editor.tsx`
- Modify: `src/index.css`

- [ ] Step 3.1: Create `src/editor/CalloutPlugin.ts` with CodeMirror 6 `ViewPlugin` and `DecorationSet` detecting `> [!TYPE]` blockquotes (Note, Tip, Important, Warning, Caution, Quote).
- [ ] Step 3.2: Add minimalist, luxury monochromatic styling in `src/index.css` for each callout type (subtle border, elegant Lucide icon, soft muted background).
- [ ] Step 3.3: Write tests in `src/editor/CalloutPlugin.test.ts` verifying parser regex and decoration ranges.
- [ ] Step 3.4: Create `src/editor/TablePlugin.ts` enabling `Tab` to jump to next cell, `Shift+Tab` to jump to previous cell, and `Enter` inside a table row to insert a new row automatically.
- [ ] Step 3.5: Mount `CalloutPlugin` and `TablePlugin` in `src/components/Editor.tsx`.
- [ ] Step 3.6: Verify rendering and run `npm.cmd test`.

---

### Section 4: Flow State Writing Modes (Paragraph Spotlight, Bionic, Hemingway)

**Goal:** Provide specialized deep-focus writing modes that help writers push past distractions and self-doubt.

**Files:**
- Create: `src/editor/FocusFlowPlugin.ts`
- Create: `src/editor/FocusFlowPlugin.test.ts`
- Modify: `src/types.ts`
- Modify: `src/components/Editor.tsx`
- Modify: `src/components/SettingsModal.tsx`
- Modify: `src/components/FloatingToolbar.tsx`
- Modify: `src/components/StatusBar.tsx`

- [ ] Step 4.1: In `src/types.ts`, add `focusSpotlight: 'none' | 'paragraph' | 'sentence'`, `bionicReading: boolean`, and `hemingwayMode: boolean` to `EditorSettings`.
- [ ] Step 4.2: Create `src/editor/FocusFlowPlugin.ts`:
  - **Paragraph Spotlight:** Decorates all blocks outside the active selection with `.opacity-30 transition-opacity`.
  - **Bionic Reading:** Dynamically decorates word starts with bold typography in live preview.
  - **Hemingway Mode:** Prevents `Backspace` and `Delete` key events, encouraging continuous drafting.
- [ ] Step 4.3: Write unit tests in `src/editor/FocusFlowPlugin.test.ts`.
- [ ] Step 4.4: Add toggles in `StatusBar.tsx`, `CommandPalette.tsx`, and `SettingsModal.tsx`.
- [ ] Step 4.5: Verify seamless toggle transitions with zero typing lag.

---

### Section 5: Bi-Directional WikiLinks (`[[Note]]`) & Glass Hover Preview

**Goal:** Implement fast, frictionless note-to-note linking with a frosted glass preview popover when hovering over `[[links]]`.

**Files:**
- Create: `src/editor/WikiLinkPlugin.ts`
- Create: `src/editor/WikiLinkPlugin.test.ts`
- Create: `src/components/WikiLinkPreviewPopover.tsx`
- Modify: `src/components/Editor.tsx`
- Modify: `src/components/SidebarDrawer.tsx`

- [ ] Step 5.1: Create `src/editor/WikiLinkPlugin.ts`:
  - CodeMirror autocompletion source triggered by typing `[[`, filtering notes in current workspace.
  - Custom decoration for `[[Note Title]]` with subtle underline and clickable navigation handler.
- [ ] Step 5.2: Write tests in `src/editor/WikiLinkPlugin.test.ts`.
- [ ] Step 5.3: Build `src/components/WikiLinkPreviewPopover.tsx`: a sleek floating popover with backdrop-filter blur showing the first 300 words of the linked note on hover.
- [ ] Step 5.4: In `SidebarDrawer.tsx`, add a collapsible "Backlinks" tab showing documents that reference the current note.
- [ ] Step 5.5: Run test suite to verify.

---

### Section 6: Architecture Clean-Up & Bundle Code-Splitting

**Goal:** Shrink the 3.15 MB monolithic bundle, modularize the 2,283-line `src/App.tsx`, and optimize cold-start performance.

**Files:**
- Modify: `vite.config.ts`
- Create: `src/context/WorkspaceContext.tsx`
- Create: `src/context/EditorSettingsContext.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/Editor.tsx`

- [ ] Step 6.1: In `vite.config.ts`, configure `manualChunks` to split `vendor-codemirror`, `vendor-mermaid`, `vendor-katex`, and `vendor-react` into distinct cached chunks.
- [ ] Step 6.2: Lazy load `mermaid`, `katex`, and `html2canvas` via dynamic `import()` so they only load when a document actually contains a diagram, formula, or export action.
- [ ] Step 6.3: Extract modal state and settings management out of `src/App.tsx` into `EditorSettingsContext` and `WorkspaceContext`.
- [ ] Step 6.4: Run `npm.cmd run build` and verify main bundle size decreases dramatically.
- [ ] Step 6.5: Run `npm.cmd test` to guarantee 100% test passing and zero regressions.
