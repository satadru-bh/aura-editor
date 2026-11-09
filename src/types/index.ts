export type ThemeId =
  | 'paper'
  | 'white'
  | 'dark'
  | 'oled'
  | 'slate'
  | 'sepia'
  | 'nord'
  | 'dracula'
  | 'solarizedLight'
  | 'solarizedDark'
  | 'forest'
  | 'coffee'
  | 'terracotta'
  | 'lavender'
  | 'matrix'
  | 'rosePine'
  | 'hcLight'
  | 'hcDark';

export type FontId = 'serif' | 'sans' | 'mono' | 'quattro';

export type ContentWidth = '800px' | '980px' | '1160px' | '1360px' | '100%';

export type AmbientSoundId = 'none' | 'rain' | 'waves' | 'wind' | 'fire' | 'cafe' | 'brown' | 'pink' | 'white';

export type KeystrokeSoundId = 'none' | 'typewriter' | 'clicky' | 'thock' | 'bubble';

export type SplitMode = 'none' | 'vertical' | 'horizontal';

export interface AudioSettings {
  ambientSound: AmbientSoundId;
  ambientVolume: number; // 0 to 1
  ambientPlaying: boolean;
  keystrokeSound: KeystrokeSoundId;
  keystrokeVolume: number; // 0 to 1
  keystrokeEnabled: boolean;
}

export interface SplitSettings {
  mode: SplitMode;
  splitFileId: string | null;
  ratio: number; // 20 to 80 (percentage)
  syncScroll: boolean;
}

export interface WordTrigger {
  id: string;
  trigger: string; // e.g. ";sig" or ":date" or "!todo"
  replacement: string; // e.g. "Best regards,\nSatadru" or "{{date}}"
  enabled: boolean;
  description?: string;
}

export type EditorViewMode = 'live' | 'source' | 'split';

export interface EditorSettings {
  theme: ThemeId;
  font: FontId;
  fontSize: number; // in px, e.g. 17
  lineHeight: number; // e.g. 1.75
  contentWidth: ContentWidth;
  typewriterMode: boolean;
  minimalMode: boolean;
  focusMode: boolean;
  showTitleBar: boolean;
  showTabBar: boolean;
  showStatusBar: boolean;
  showLineNumbers: boolean;
  spellcheck: boolean;
  liveMarkdown: boolean;
  editorMode?: EditorViewMode;
  syntaxFade: boolean;
  vimMode: boolean;
  tabSize: number;
  autosaveInterval: number; // in ms, 0 = disabled
  audio: AudioSettings;
  split: SplitSettings;
  wordTriggers?: WordTrigger[];
}

export interface EncryptedPayload {
  iv: string;
  salt: string;
  ciphertext: string;
}

export interface FileItem {
  id: string;
  name: string;
  path?: string; // native path if available
  content: string;
  lastModified: number;
  createdAt: number;
  isFavorite?: boolean;
  isRecent?: boolean;
  isEncrypted?: boolean;
  encryptedData?: EncryptedPayload;
  fileHandle?: any; // FileSystemFileHandle on web
}

export interface OutlineItem {
  id: string;
  level: number; // 1 to 6
  text: string;
  from: number;
  to: number;
  line: number;
}

export interface DocumentStats {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  lines: number;
  paragraphs: number;
  readingTimeMinutes: number;
  speakingTimeMinutes: number;
}

export interface ToastMessage {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  text: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface SearchMatch {
  from: number;
  to: number;
  line: number;
}

export interface GraphNode {
  id: string;
  name: string;
  fileId: string;
  linksCount: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  radius?: number;
}

export interface GraphLink {
  source: string;
  target: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface FloatingWindow {
  fileId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  isMinimized?: boolean;
}
