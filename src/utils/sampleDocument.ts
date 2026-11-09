export const SAMPLE_DOCUMENT = `# Welcome to Aura

A minimal, offline Markdown editor.

## Getting Started

- **Top Bar**: Switch between open tabs or double-click to rename.
- **Sidebar**: Press **\`Ctrl + Shift + E\`** to open the sidebar for files and section outline.
- **Command Palette**: Press **\`Ctrl + K\`** to search commands, files, and themes.
- **Settings**: Press **\`Ctrl + ,\`** to customize font, layout, and shortcuts.
- **Split Editor**: Press **\`Ctrl + \\\`** to split the view vertically or horizontally.

### Three Steps to Mastery
1. **Explore the Workspace**: Open files, switch tabs, and navigate document outlines.
2. **Write & Format**: Experience instant in-place markdown rendering and live editing.
3. **Export & Share**: Generate pixel-perfect vector PDFs, styled HTML, or portable Markdown.

## Word Triggers & Text Expansions

Type any of the following trigger codes anywhere in the editor to watch them expand instantly:

| Trigger Code | Expands Into | Description |
| :--- | :--- | :--- |
| \`:date\` | *Current Date (e.g. 2026-08-28)* | Automatically inserts today's date |
| \`:time\` | *Current Time (e.g. 21:45)* | Automatically inserts current local time |
| \`;sig\` | \`Best regards,\\\\n\` | Professional sign-off signature |
| \`!todo\` | \`- [ ] \` | Creates a new interactive checklist task |
| \`!tip\` | \`> [!TIP]\\\\n> \` | GitHub-style Tip callout box |
| \`!note\` | \`> [!NOTE]\\\\n> \` | GitHub-style Note callout box |
| \`!warn\` | \`> [!WARNING]\\\\n> \` | GitHub-style Warning callout box |
| \`!code\` | \`\`\`\`typescript ... \`\`\`\` | Fenced code block template |
| \`;shrug\` | \`¯\\\\_(ツ)_/¯\` | Expressive shrug emoticon |
| \`;arrow\` | \`→\` | Clean Unicode directional arrow |

> [!TIP]
> **Custom Snippets**: Open **Settings (\`Ctrl + ,\`)** and navigate to **Word Triggers** to configure custom codes and multi-line snippets with dynamic macros like \`{{date}}\`, \`{{time}}\`, and \`{{cursor}}\`.

## 18 Handcrafted Themes

Switch themes anytime via **Settings (\`Ctrl + ,\`)** or the **Command Palette (\`Ctrl + K\`)**:

| Theme | Tone | Character & Palette |
| :--- | :--- | :--- |
| **Paper Warm** | Light | Classic ivory canvas for natural editorial comfort |
| **Pure White** | Light | Ultra-clean studio brightness |
| **Obsidian Dark** | Dark | Deep warm charcoal for nocturnal writing |
| **True OLED** | Dark | Pure pitch black (\`#000000\`) for zero-bleed OLED contrast |
| **Nordic Slate** | Dark | Deep midnight ocean blue |
| **Antique Sepia** | Light | Vintage parchment & warm novel book tones |
| **Nord Frost** | Dark | Arctic polar blue & muted frost |
| **Dracula Gothic**| Dark | Midnight purple & neon pink accents |
| **Solarized Light**| Light | Precision designer cream & cyan |
| **Solarized Dark** | Dark | Deep oceanic abyss & amber highlights |
| **Deep Forest** | Dark | Evergreen pine & calming sage moss |
| **Espresso Mocha**| Dark | Rich roasted coffee & warm cream |
| **Terracotta Dusk**| Dark | Warm desert sunset & clay rust |
| **Twilight Lavender**| Dark | Soft dreamlike violet & wisteria |
| **Terminal Matrix**| Dark | Deep obsidian & phosphor cyber green |
| **Rosé Pine** | Dark | Soft Nordic pine & rose dusk |
| **High Contrast Light**| A11y | Maximum contrast black text on white |
| **High Contrast Dark** | A11y | Maximum contrast white text on black |

## Zero-Knowledge AES-256 Encryption

Protect your private journals, thoughts, and sensitive documents:
- Press **\`Ctrl + L\`** or click the Lock button in the top bar to encrypt the active note with **AES-GCM-256**.
- Protected with zero-knowledge cryptography: your passphrase is never stored on disk.
- Locked documents cannot be viewed or searched without your secret passphrase.

## Side-by-Side Split Editor

- Press **\`Ctrl + \\\`** or click the Split button to split the workspace vertically or horizontally.
- Reference a second document, outline, or notes side-by-side with synchronized scrolling options.

## Keyboard Acoustics & Source Mode

Immerse yourself in deep writing focus with mechanical keystroke audio synthesis:
- **Switch Profiles**: Tactile Blue Click, Deep Linear Thock, Vintage Typewriter (with carriage bell), and Soft Bubble clicks.
- **Source Mode**: Toggle between raw Markdown source code and live visual rendering at any time from the status bar or via **\`Ctrl + Shift + U\`**.

## Live Formatting & Markdown Specs

Aura renders full GitHub Flavored Markdown (GFM) directly in-place:

### Typography
- **Bold text** (\`Ctrl + B\`) and *Italic text* (\`Ctrl + I\`)
- ~~Strikethrough~~ (\`Ctrl + Shift + X\`)
- ==Highlighted text== (\`==highlight==\`)
- Subscripts (\`H~2~O\`) and Superscripts (\`E = mc^2^\`)

### Interactive Task Lists
- [x] Download & launch Aura Editor
- [x] Try Word Triggers (\`:date\`, \`;sig\`, \`!todo\`)
- [ ] Try True Fullscreen (\`F11\`) and Zen Mode (\`Alt + Z\`)
- [ ] Write the first chapter of your story

### Syntax-Highlighted Code Blocks

\`\`\`typescript
interface Note {
  id: string;
  title: string;
  wordCount: number;
  encrypted: boolean;
}

const welcomeNote: Note = {
  id: 'aura-welcome',
  title: 'Welcome to Aura',
  wordCount: 750,
  encrypted: false,
};
\`\`\`

### LaTeX Mathematical Equations

Inline equation: $E = \\frac{mc^2}{\\sqrt{1 - \\frac{v^2}{c^2}}}$

Display block math:

$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$

### Interactive Mermaid Diagrams

\`\`\`mermaid
flowchart LR
    A[Raw Thought] --> B[Aura Draft]
    B --> C{Review}
    C -->|Refine| B
    C -->|Export| D[High-Res PDF]
    C -->|Publish| E[Markdown / HTML]
\`\`\`

## Direct Export & Import Hub

Press **\`Ctrl + Shift + I\`** or click the Export button to export your work with 100% visual fidelity:
- **Direct PDF Export**: High-resolution vector documents with embedded fonts, tables, diagrams, and math.
- **Clean HTML**: Self-contained styled HTML documents styled with your active theme.
- **Universal Formats**: Standard Markdown (\`.md\`), Plain Text (\`.txt\`), and Formatted Rich Text clipboard copy.

## Essential Keyboard Shortcuts

| Command | Key Binding |
| :--- | :--- |
| **Command Palette** | \`Ctrl + K\` |
| **Sidebar (Documents & Outline)** | \`Ctrl + Shift + E\` / \`Ctrl + Shift + O\` |
| **New Document** | \`Ctrl + N\` |
| **Save Document** | \`Ctrl + S\` |
| **Close Active Tab** | \`Ctrl + W\` |
| **Insert Table** | \`Ctrl + Shift + T\` |
| **Word Triggers / Expansions** | \`:date\`, \`:sig\`, \`!todo\`, \`!tip\`, \`!code\` |
| **Minimal Zen Mode** | \`Alt + Z\` / \`Ctrl + Shift + M\` |
| **True Fullscreen** | \`F11\` |
| **Split Editor Side-by-Side** | \`Ctrl + \\\` |
| **Encrypt / Lock Document** | \`Ctrl + L\` |
| **Find / Replace** | \`Ctrl + F\` / \`Ctrl + H\` |
| **Import & Export Hub** | \`Ctrl + Shift + I\` |
| **Preferences & Settings** | \`Ctrl + ,\` |
| **Shortcuts Cheat Sheet** | \`Ctrl + /\` |

> Built with craftsmanship for those who write. No tracking. No subscriptions. Completely local.
>
> **Aura Editor v1.0.0**
`;
