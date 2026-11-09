// Comprehensive spellcheck engine with common typos, phonetic corrections, and edit distance

const COMMON_TYPOS: Record<string, string[]> = {
  teh: ['the'],
  adn: ['and'],
  taht: ['that'],
  thsi: ['this'],
  wich: ['which', 'with'],
  recieve: ['receive'],
  recieved: ['received'],
  seperate: ['separate'],
  seperated: ['separated'],
  occured: ['occurred'],
  untill: ['until'],
  definately: ['definitely'],
  definatly: ['definitely'],
  accomodate: ['accommodate'],
  beleive: ['believe'],
  belive: ['believe'],
  calender: ['calendar'],
  embarass: ['embarrass'],
  elemsents: ['elements'],
  elemnt: ['element'],
  neccessary: ['necessary'],
  necesary: ['necessary'],
  noticable: ['noticeable'],
  ocassion: ['occasion'],
  persue: ['pursue'],
  posession: ['possession'],
  reccomend: ['recommend'],
  recomend: ['recommend'],
  succesful: ['successful'],
  tommorrow: ['tomorrow'],
  tommorow: ['tomorrow'],
  wierd: ['weird'],
  goverment: ['government'],
  enviroment: ['environment'],
  experiance: ['experience'],
  alot: ['a lot', 'allot'],
  acheive: ['achieve'],
  collegue: ['colleague'],
  comming: ['coming'],
  concious: ['conscious'],
  dissapoint: ['disappoint'],
  existance: ['existence'],
  foriegn: ['foreign'],
  gaurantee: ['guarantee'],
  garantee: ['guarantee'],
  happend: ['happened'],
  immediatly: ['immediately'],
  incidently: ['incidentally'],
  independant: ['independent'],
  knowlege: ['knowledge'],
  maintainance: ['maintenance'],
  millenium: ['millennium'],
  mispell: ['misspell'],
  misspell: ['misspell'],
  neice: ['niece'],
  ocasionally: ['occasionally'],
  occurance: ['occurrence'],
  privelege: ['privilege'],
  priviledge: ['privilege'],
  probaly: ['probably'],
  propper: ['proper'],
  publically: ['publicly'],
  realy: ['really'],
  relavent: ['relevant'],
  remeber: ['remember'],
  resistence: ['resistance'],
  rythm: ['rhythm'],
  sensible: ['sensible'],
  similiar: ['similar'],
  speach: ['speech'],
  succesfully: ['successfully'],
  suprise: ['surprise'],
  tendancy: ['tendency'],
  truely: ['truly'],
  unfortunatly: ['unfortunately'],
  writting: ['writing'],
  allways: ['always'],
  becuase: ['because'],
  beacause: ['because'],
  begining: ['beginning'],
  buisness: ['business'],
  catagory: ['category'],
  completly: ['completely'],
  curiousity: ['curiosity'],
  decission: ['decision'],
  diffrent: ['different'],
  dosen: ['doesn'],
  dosent: ['doesn\'t'],
  dident: ['didn\'t'],
  favorate: ['favorite'],
  finaly: ['finally'],
  foward: ['forward'],
  freind: ['friend'],
  greatful: ['grateful'],
  interupt: ['interrupt'],
  langauge: ['language'],
  libary: ['library'],
  lisence: ['license'],
  minature: ['miniature'],
  morgage: ['mortgage'],
  naturaly: ['naturally'],
  oclock: ["o'clock"],
  oppertunity: ['opportunity'],
  oppinion: ['opinion'],
  origional: ['original'],
  particuler: ['particular'],
  peice: ['piece'],
  possable: ['possible'],
  prefered: ['preferred'],
  presance: ['presence'],
  pronounciation: ['pronunciation'],
  religous: ['religious'],
  responsability: ['responsibility'],
  restaraunt: ['restaurant'],
  saftey: ['safety'],
  scedule: ['schedule'],
  shaddow: ['shadow'],
  shouldent: ["shouldn't"],
  sincerly: ['sincerely'],
  stoped: ['stopped'],
  straigt: ['straight'],
  strenght: ['strength'],
  studing: ['studying'],
  sucess: ['success'],
  swimmin: ['swimming'],
  temperture: ['temperature'],
  therfore: ['therefore'],
  threshhold: ['threshold'],
  throught: ['through', 'thought'],
  togeather: ['together'],
  tomarrow: ['tomorrow'],
  tongue: ['tongue'],
  totaly: ['totally'],
  tounge: ['tongue'],
  twelth: ['twelfth'],
  tyranical: ['tyrannical'],
  unanimious: ['unanimous'],
  underate: ['underrate'],
  unforseen: ['unforeseen'],
  univeristy: ['university'],
  unneccessary: ['unnecessary'],
  unsuccesful: ['unsuccessful'],
  usefull: ['useful'],
  vaccuum: ['vacuum'],
  vegatable: ['vegetable'],
  vegatarian: ['vegetarian'],
  vehical: ['vehicle'],
  vengance: ['vengeance'],
  villian: ['villain'],
  visable: ['visible'],
  voulme: ['volume'],
  warrent: ['warrant'],
  weild: ['wield'],
  wellfare: ['welfare'],
  wether: ['whether', 'weather'],
  whitch: ['which'],
  widht: ['width'],
  wont: ["won't"],
  wouldent: ["wouldn't"],
  wraped: ['wrapped'],
  yeild: ['yield'],
  yesturday: ['yesterday'],
  yatch: ['yacht'],
  zeelot: ['zealot'],
};

// Common word dictionary for Levenshtein spell checking
const COMMON_DICTIONARY = new Set([
  // Core English words
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he',
  'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or',
  'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out', 'if', 'about',
  'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know',
  'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than',
  'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two',
  'how', 'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give',
  'day', 'most', 'us', 'editor', 'markdown', 'document', 'project', 'content', 'create', 'update', 'delete',
  'settings', 'preferences', 'window', 'action', 'search', 'replace', 'format', 'style', 'color', 'theme',
  'preview', 'structure', 'outline', 'table', 'code', 'diagram', 'acoustics', 'keyboard', 'keystroke',
  'important', 'necessary', 'different', 'separate', 'receive', 'business', 'experience', 'government',
  'environment', 'schedule', 'restaurant', 'language', 'category', 'successful', 'tomorrow', 'yesterday',
  'definitely', 'immediately', 'recommend', 'decision', 'grateful', 'believe', 'calendar', 'maintenance',
  'knowledge', 'independent', 'occurrence', 'privilege', 'probably', 'sentence', 'paragraph', 'header',
  'footer', 'section', 'command', 'palette', 'shortcut', 'fullscreen', 'overview', 'statistics', 'words',
  'characters', 'reading', 'version', 'snapshot', 'backup', 'export', 'import', 'download', 'upload',
  'encrypt', 'decrypt', 'password', 'protected', 'security', 'vault', 'storage', 'session', 'database',
  'connection', 'application', 'interface', 'component', 'container', 'element', 'function', 'variable',

  // UI, Editor & Interaction Vocabulary
  'spelling', 'spellcheck', 'error', 'errors', 'suggest', 'suggestion', 'suggestions', 'correct', 'correction',
  'dictionary', 'ignore', 'add', 'dropdown', 'button', 'buttons', 'menu', 'menus', 'option', 'options',
  'more', 'regular', 'chevron', 'expand', 'collapse', 'compact', 'styled', 'seamlessly', 'integrated',
  'cursor', 'caret', 'border', 'outline', 'select', 'selected', 'selection', 'multi', 'insert', 'cut',
  'copy', 'paste', 'copied', 'undo', 'redo', 'bold', 'italic', 'strikethrough', 'quote', 'callout',
  'thematic', 'break', 'task', 'list', 'item', 'checkbox', 'find', 'modal', 'file', 'files', 'folder',
  'folders', 'disk', 'save', 'open', 'close', 'rename', 'title', 'bar', 'sidebar', 'drawer', 'tab',
  'tabs', 'explorer', 'acrylic', 'glass', 'blur', 'shadow', 'accent', 'light', 'dark', 'contrast',
  'switch', 'toggle', 'active', 'inactive', 'status', 'notification', 'alert', 'prompt', 'dialog',
  'minimize', 'maximize', 'restore', 'drag', 'drop', 'draggable', 'column', 'row', 'cell', 'inline',
  'mermaid', 'math', 'formula', 'latex', 'katex', 'equation', 'link', 'image', 'heading', 'subheading',
  'count', 'speed', 'startup', 'loading', 'logo', 'fallback', 'ready', 'welcome', 'untitled', 'default',
  'custom', 'user', 'monospace', 'sans', 'serif', 'size', 'width', 'height', 'auto', 'opacity',

  // Common General English Vocabulary
  'able', 'about', 'above', 'accept', 'across', 'act', 'active', 'actually', 'again', 'against', 'age',
  'ago', 'agree', 'air', 'almost', 'already', 'always', 'among', 'amount', 'another', 'answer', 'appear',
  'area', 'around', 'art', 'ask', 'available', 'away', 'back', 'bad', 'base', 'based', 'beautiful',
  'become', 'before', 'begin', 'behind', 'best', 'better', 'between', 'big', 'bit', 'black', 'blue',
  'body', 'book', 'both', 'boy', 'break', 'brief', 'bring', 'brother', 'build', 'call', 'called', 'cannot',
  'car', 'care', 'case', 'cause', 'center', 'certain', 'chair', 'change', 'check', 'child', 'children',
  'choose', 'city', 'class', 'clean', 'clear', 'clearly', 'close', 'cold', 'come', 'common', 'company',
  'complete', 'completely', 'condition', 'consider', 'continue', 'control', 'cost', 'country', 'course',
  'court', 'cover', 'current', 'cut', 'data', 'daughter', 'day', 'deal', 'death', 'decide', 'deep',
  'develop', 'development', 'die', 'direct', 'direction', 'do', 'doctor', 'door', 'down', 'draw', 'drive',
  'drop', 'during', 'each', 'early', 'east', 'easy', 'economic', 'economy', 'edge', 'effect', 'effort',
  'eight', 'either', 'election', 'else', 'end', 'energy', 'enjoy', 'enough', 'enter', 'entire', 'especially',
  'even', 'evening', 'ever', 'every', 'everyone', 'everything', 'evidence', 'exactly', 'example', 'executive',
  'expect', 'eye', 'face', 'fact', 'fall', 'family', 'far', 'fast', 'father', 'feel', 'feeling', 'few',
  'field', 'fight', 'figure', 'fill', 'film', 'final', 'finally', 'find', 'fine', 'finger', 'finish',
  'fire', 'firm', 'first', 'fish', 'five', 'floor', 'fly', 'focus', 'food', 'foot', 'force', 'foreign',
  'forget', 'form', 'former', 'forward', 'four', 'free', 'friend', 'front', 'full', 'fund', 'future',
  'game', 'garden', 'general', 'generally', 'girl', 'give', 'glass', 'go', 'goal', 'god', 'good',
  'great', 'green', 'ground', 'group', 'grow', 'growth', 'guess', 'gun', 'guy', 'hair', 'half', 'hand',
  'hang', 'happen', 'happy', 'hard', 'have', 'head', 'health', 'hear', 'heart', 'heat', 'heavy', 'help',
  'here', 'herself', 'high', 'himself', 'history', 'hit', 'hold', 'home', 'hope', 'hospital', 'hot',
  'hotel', 'hour', 'house', 'human', 'hundred', 'husband', 'idea', 'identify', 'image', 'imagine',
  'impact', 'include', 'including', 'increase', 'indeed', 'indicate', 'individual', 'industry', 'inside',
  'instead', 'institution', 'interest', 'interesting', 'international', 'interview', 'into', 'investment',
  'involve', 'issue', 'item', 'itself', 'job', 'join', 'just', 'keep', 'key', 'kid', 'kill', 'kind',
  'kitchen', 'know', 'knowledge', 'land', 'large', 'last', 'late', 'later', 'laugh', 'law', 'lawyer',
  'lay', 'lead', 'leader', 'learn', 'least', 'leave', 'left', 'leg', 'legal', 'less', 'let', 'letter',
  'level', 'lie', 'life', 'light', 'likely', 'line', 'list', 'listen', 'little', 'live', 'local', 'long',
  'look', 'lose', 'loss', 'lot', 'love', 'low', 'machine', 'magazine', 'main', 'maintain', 'major',
  'majority', 'make', 'man', 'manage', 'management', 'manager', 'many', 'market', 'marriage', 'material',
  'matter', 'may', 'maybe', 'mean', 'measure', 'media', 'medical', 'meet', 'meeting', 'member', 'memory',
  'mention', 'message', 'method', 'middle', 'might', 'military', 'million', 'mind', 'minute', 'miss',
  'mission', 'model', 'modern', 'moment', 'money', 'month', 'more', 'morning', 'most', 'mostly', 'mother',
  'mouth', 'move', 'movement', 'movie', 'much', 'music', 'must', 'name', 'nation', 'national', 'natural',
  'nature', 'near', 'nearly', 'need', 'network', 'never', 'news', 'next', 'nice', 'night', 'none',
  'north', 'note', 'nothing', 'notice', 'now', 'number', 'occur', 'off', 'office', 'officer', 'official',
  'often', 'oil', 'old', 'once', 'one', 'only', 'onto', 'open', 'operation', 'opportunity', 'option',
  'order', 'organization', 'original', 'other', 'others', 'our', 'out', 'outside', 'over', 'own', 'page',
  'pain', 'painting', 'paper', 'parent', 'part', 'participant', 'particular', 'particularly', 'partner',
  'party', 'pass', 'past', 'patient', 'pattern', 'pay', 'peace', 'people', 'per', 'perform', 'performance',
  'perhaps', 'period', 'person', 'personal', 'phone', 'physical', 'pick', 'picture', 'piece', 'place',
  'plan', 'plant', 'play', 'player', 'point', 'police', 'policy', 'political', 'politics', 'poor',
  'popular', 'population', 'position', 'positive', 'possible', 'power', 'practice', 'prepare', 'present',
  'president', 'pressure', 'pretty', 'prevent', 'price', 'private', 'probably', 'problem', 'process',
  'produce', 'product', 'production', 'professional', 'professor', 'program', 'project', 'property',
  'protect', 'prove', 'provide', 'public', 'pull', 'purpose', 'push', 'put', 'quality', 'question',
  'quickly', 'quite', 'race', 'radio', 'raise', 'range', 'rate', 'rather', 'reach', 'read', 'ready',
  'real', 'reality', 'realize', 'really', 'reason', 'receive', 'recent', 'recently', 'recognize', 'record',
  'red', 'reduce', 'reflect', 'region', 'relate', 'relationship', 'religious', 'remain', 'remember',
  'remove', 'report', 'represent', 'republican', 'require', 'research', 'resource', 'respond', 'response',
  'responsibility', 'rest', 'result', 'return', 'reveal', 'rich', 'right', 'rise', 'risk', 'road',
  'rock', 'role', 'room', 'rule', 'run', 'safe', 'same', 'save', 'scene', 'school', 'science',
  'scientist', 'score', 'sea', 'season', 'seat', 'second', 'section', 'security', 'see', 'seek', 'seem',
  'sell', 'send', 'senior', 'sense', 'series', 'serious', 'serve', 'service', 'set', 'seven', 'several',
  'shake', 'share', 'she', 'shoot', 'short', 'shot', 'should', 'shoulder', 'show', 'side', 'sign',
  'significant', 'similar', 'simple', 'simply', 'since', 'sing', 'single', 'sister', 'sit', 'site',
  'situation', 'six', 'size', 'skill', 'skin', 'small', 'smile', 'social', 'society', 'soldier', 'some',
  'somebody', 'someone', 'something', 'sometimes', 'son', 'song', 'soon', 'sort', 'sound', 'source',
  'south', 'southern', 'space', 'speak', 'special', 'specific', 'speech', 'spend', 'sport', 'spring',
  'staff', 'stage', 'stand', 'standard', 'star', 'start', 'state', 'statement', 'station', 'stay',
  'step', 'still', 'stock', 'stop', 'store', 'story', 'strategy', 'street', 'strong', 'structure',
  'student', 'study', 'stuff', 'style', 'subject', 'success', 'successful', 'such', 'suddenly', 'suffer',
  'suggest', 'summer', 'support', 'sure', 'surface', 'system', 'table', 'take', 'talk', 'task', 'tax',
  'teach', 'teacher', 'team', 'technology', 'television', 'tell', 'ten', 'tend', 'term', 'test',
  'than', 'thank', 'thanks', 'that', 'the', 'their', 'them', 'themselves', 'then', 'theory', 'there',
  'these', 'they', 'thing', 'think', 'third', 'this', 'those', 'though', 'thought', 'thousand', 'threat',
  'three', 'through', 'throughout', 'throw', 'thus', 'time', 'today', 'together', 'tonight', 'too',
  'top', 'total', 'tough', 'toward', 'towards', 'town', 'trade', 'traditional', 'training', 'travel',
  'treat', 'treatment', 'tree', 'trial', 'trip', 'true', 'truth', 'try', 'turn', 'tv', 'two', 'type',
  'under', 'understand', 'unit', 'until', 'upon', 'us', 'use', 'usually', 'value', 'various', 'very',
  'victim', 'view', 'violence', 'visit', 'voice', 'vote', 'wait', 'walk', 'wall', 'want', 'war',
  'watch', 'water', 'way', 'weapon', 'wear', 'week', 'weight', 'well', 'west', 'western', 'what',
  'whatever', 'when', 'where', 'whether', 'which', 'while', 'white', 'who', 'whole', 'whom', 'whose',
  'why', 'wide', 'wife', 'win', 'wind', 'window', 'wish', 'with', 'within', 'without', 'woman',
  'wonder', 'word', 'work', 'worker', 'world', 'worry', 'would', 'write', 'writer', 'wrong', 'yard',
  'yeah', 'year', 'yes', 'yet', 'young', 'your', 'yourself',

  // Common contractions
  "don't", 'dont', "can't", 'cant', "won't", 'wont', "it's", 'its', "doesn't", 'doesnt',
  "didn't", 'didnt', "haven't", 'havent', "hasn't", 'hasnt', "hadn't", 'hadnt',
  "shouldn't", 'shouldnt', "wouldn't", 'wouldnt', "couldn't", 'couldnt',
  "you're", 'youre', "they're", 'theyre', "we're", 'were', "i'm", 'im',
  "i've", 'ive', "we've", 'weve', "they've", 'theyve', "you've", 'youve',
  "isn't", 'isnt', "aren't", 'arent', "wasn't", 'wasnt', "weren't", 'werent', "let's", 'lets',
]);

const USER_DICT_KEY = 'aura_user_dictionary_v1';

// Session-level ignored words set
const ignoredWords = new Set<string>();

export function ignoreWord(word: string): void {
  if (!word) return;
  const clean = word.toLowerCase().trim().replace(/^[^\w]+|[^\w]+$/g, '');
  if (clean) {
    ignoredWords.add(clean);
  }
}

export function isWordIgnored(word: string): boolean {
  if (!word) return false;
  const clean = word.toLowerCase().trim().replace(/^[^\w]+|[^\w]+$/g, '');
  return ignoredWords.has(clean);
}

export function clearIgnoredWords(): void {
  ignoredWords.clear();
}

export function getUserDictionary(): Set<string> {
  try {
    const raw = localStorage.getItem(USER_DICT_KEY);
    if (raw) {
      return new Set(JSON.parse(raw));
    }
  } catch {}
  return new Set();
}

export function addUserWord(word: string): void {
  const dict = getUserDictionary();
  const clean = word.toLowerCase().trim().replace(/^[^\w]+|[^\w]+$/g, '');
  if (clean) {
    dict.add(clean);
    try {
      localStorage.setItem(USER_DICT_KEY, JSON.stringify(Array.from(dict)));
    } catch {}
  }
}

function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

function isKnownWord(clean: string, userDict: Set<string>): boolean {
  if (COMMON_DICTIONARY.has(clean) || userDict.has(clean) || isWordIgnored(clean)) {
    return true;
  }
  const stripped = clean.replace(/'/g, '');
  if (COMMON_DICTIONARY.has(stripped) || userDict.has(stripped) || isWordIgnored(stripped)) {
    return true;
  }
  // Plural/inflected endings: -s, -es, -ed, -ing, -ly, -er, -est
  if (clean.endsWith('s')) {
    const root = clean.slice(0, -1);
    if (COMMON_DICTIONARY.has(root) || userDict.has(root) || isWordIgnored(root)) return true;
  }
  if (clean.endsWith('es')) {
    const root = clean.slice(0, -2);
    if (COMMON_DICTIONARY.has(root) || userDict.has(root) || isWordIgnored(root)) return true;
  }
  if (clean.endsWith('ed')) {
    const root = clean.slice(0, -2);
    const rootWithE = clean.slice(0, -1);
    if (COMMON_DICTIONARY.has(root) || COMMON_DICTIONARY.has(rootWithE) || userDict.has(root)) return true;
  }
  if (clean.endsWith('ing')) {
    const root = clean.slice(0, -3);
    const rootWithE = root + 'e';
    if (COMMON_DICTIONARY.has(root) || COMMON_DICTIONARY.has(rootWithE) || userDict.has(root)) return true;
  }
  if (clean.endsWith('ly')) {
    const root = clean.slice(0, -2);
    if (COMMON_DICTIONARY.has(root) || userDict.has(root) || isWordIgnored(root)) return true;
  }
  return false;
}

/**
 * Returns list of spelling suggestions for the target word.
 */
export function getSpellingSuggestions(word: string): string[] {
  if (!word || word.length < 2) return [];

  const clean = word.toLowerCase().trim().replace(/^[^\w]+|[^\w]+$/g, '');
  if (!clean || clean.length < 2) return [];

  const userDict = getUserDictionary();
  if (isKnownWord(clean, userDict)) {
    return [];
  }

  // Check direct typo dictionary lookup
  if (COMMON_TYPOS[clean]) {
    return matchCapitalization(word, COMMON_TYPOS[clean]);
  }

  const stripped = clean.replace(/'/g, '');
  if (COMMON_TYPOS[stripped]) {
    return matchCapitalization(word, COMMON_TYPOS[stripped]);
  }

  // Check Levenshtein distance matches against dictionary
  const candidates: { word: string; dist: number }[] = [];
  const maxDist = clean.length <= 4 ? 1 : 2;

  // Check combined dictionary
  const allWords = new Set([...COMMON_DICTIONARY, ...userDict]);
  for (const dictWord of allWords) {
    if (Math.abs(dictWord.length - clean.length) > maxDist) continue;
    const dist = levenshteinDistance(clean, dictWord);
    if (dist <= maxDist) {
      candidates.push({ word: dictWord, dist });
    }
  }

  candidates.sort((a, b) => a.dist - b.dist);
  const topWords = candidates.slice(0, 4).map((c) => c.word);

  return matchCapitalization(word, topWords);
}

/**
 * Checks if a word is recognized as a spelling error.
 */
export function isSpellingError(word: string): boolean {
  if (!word || word.length < 2) return false;

  // Ignore urls, file paths, numbers, code symbols, variables with underscores/dollars
  if (/[\d_@#$%^&*+=<>{}[\]|\\\/~]/.test(word) || /https?:\/\//.test(word)) {
    return false;
  }

  const clean = word.toLowerCase().trim().replace(/^[^a-zA-Z']+|[^a-zA-Z']+$/g, '');
  if (clean.length < 2) return false;

  const userDict = getUserDictionary();
  if (isKnownWord(clean, userDict)) {
    return false;
  }

  // Direct typo lookup
  const stripped = clean.replace(/'/g, '');
  if (COMMON_TYPOS[clean] || COMMON_TYPOS[stripped]) {
    return true;
  }

  // If spelling suggestions exist
  const suggestions = getSpellingSuggestions(word);
  if (suggestions.length > 0) {
    return true;
  }

  return false;
}

function matchCapitalization(original: string, suggestions: string[]): string[] {
  const isFirstUpper = /^[A-Z]/.test(original);
  const isAllUpper = original === original.toUpperCase() && original.length > 1;

  return suggestions.map((s) => {
    if (isAllUpper) return s.toUpperCase();
    if (isFirstUpper) return s.charAt(0).toUpperCase() + s.slice(1);
    return s;
  });
}
