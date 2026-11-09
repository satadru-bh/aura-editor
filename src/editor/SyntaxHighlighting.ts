import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { Extension } from '@codemirror/state';
import { ThemeId } from '../types';

export const DARK_THEMES: ThemeId[] = [
  'dark',
  'oled',
  'slate',
  'nord',
  'dracula',
  'solarizedDark',
  'forest',
  'coffee',
  'terracotta',
  'lavender',
  'matrix',
  'rosePine',
  'hcDark',
];

export function createSyntaxHighlighting(theme: ThemeId): Extension {
  const isDark = DARK_THEMES.includes(theme);

  // Bespoke editorial color palette for syntax tokens
  const style = HighlightStyle.define([
    // Keywords & modifiers
    {
      tag: [tags.keyword, tags.definitionKeyword, tags.moduleKeyword, tags.controlKeyword],
      color: isDark ? '#F472B6' : '#C026D3', // Pink / Magenta
      fontWeight: '600',
    },
    // Functions & methods
    {
      tag: [tags.function(tags.variableName), tags.function(tags.propertyName)],
      color: isDark ? '#60A5FA' : '#2563EB', // Vibrant Blue
      fontWeight: '500',
    },
    // Types, classes, interfaces
    {
      tag: [tags.typeName, tags.className, tags.standard(tags.typeName)],
      color: isDark ? '#34D399' : '#059669', // Emerald Green
      fontWeight: '600',
    },
    // Strings & characters
    {
      tag: [tags.string, tags.special(tags.string), tags.character],
      color: isDark ? '#FBBF24' : '#D97706', // Warm Amber
    },
    // Numbers & Booleans
    {
      tag: [tags.number, tags.integer, tags.float, tags.bool, tags.null],
      color: isDark ? '#FB923C' : '#EA580C', // Orange
      fontWeight: '500',
    },
    // Comments
    {
      tag: [tags.comment, tags.lineComment, tags.blockComment, tags.docComment],
      color: isDark ? '#71717A' : '#A1A1AA', // Subtle Gray
      fontStyle: 'italic',
    },
    // Variables & Properties
    {
      tag: [tags.variableName, tags.propertyName, tags.attributeValue],
      color: isDark ? '#E4E4E7' : '#27272A', // Primary Text Tone
    },
    // HTML / XML Tags & Attributes
    {
      tag: tags.tagName,
      color: isDark ? '#F87171' : '#DC2626', // Red / Rose
      fontWeight: '500',
    },
    {
      tag: tags.attributeName,
      color: isDark ? '#A78BFA' : '#7C3AED', // Violet
    },
    // Operators & Punctuation
    {
      tag: [tags.operator, tags.punctuation, tags.bracket, tags.separator],
      color: isDark ? '#A1A1AA' : '#71717A',
    },
    // RegEx
    {
      tag: tags.regexp,
      color: isDark ? '#2DD4BF' : '#0D9488', // Teal
    },
  ]);

  return syntaxHighlighting(style);
}
