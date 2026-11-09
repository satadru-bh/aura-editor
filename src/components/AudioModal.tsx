import React from 'react';
import {
  X,
  Volume2,
  VolumeX,
  Keyboard,
  Check,
} from 'lucide-react';
import { AudioSettings, KeystrokeSoundId } from '../types';
import { AudioService } from '../services/AudioService';

interface AudioModalProps {
  isOpen: boolean;
  audio: AudioSettings;
  onUpdateAudio: (newAudio: Partial<AudioSettings>) => void;
  onClose: () => void;
}

export const AudioModal: React.FC<AudioModalProps> = ({
  isOpen,
  audio,
  onUpdateAudio,
  onClose,
}) => {
  if (!isOpen) return null;

  const keystrokeOptions: {
    id: KeystrokeSoundId;
    title: string;
    desc: string;
    sampleKey: string;
  }[] = [
    {
      id: 'none',
      title: 'Silent Typing',
      desc: 'Standard quiet typing without audio feedback',
      sampleKey: '',
    },
    {
      id: 'typewriter',
      title: 'Vintage Typewriter',
      desc: 'Mechanical strikers with carriage return bell on Enter',
      sampleKey: 'Enter',
    },
    {
      id: 'clicky',
      title: 'Tactile Click (Blue Switch)',
      desc: 'Crisp high-frequency click and bottom-out clack',
      sampleKey: 'a',
    },
    {
      id: 'thock',
      title: 'Deep Linear Thock (Lubed)',
      desc: 'Muted acoustic low-resonance switch profile',
      sampleKey: 'a',
    },
    {
      id: 'bubble',
      title: 'Soft Bubble Pop',
      desc: 'Subtle resonant pops for flow-state writing',
      sampleKey: 'a',
    },
  ];

  const handleKeystrokeVolumeChange = (vol: number) => {
    onUpdateAudio({ keystrokeVolume: vol });
    AudioService.setKeystrokeVolume(vol);
  };

  const handleSelectKeystroke = (id: KeystrokeSoundId) => {
    onUpdateAudio({ keystrokeSound: id, keystrokeEnabled: id !== 'none' });
    if (id !== 'none') {
      AudioService.playKeystroke(id, id === 'typewriter' ? 'Enter' : 'a');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] transition-all animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[var(--surface-color)] text-[var(--text-color)] rounded-2xl shadow-2xl border border-[var(--border-color)] overflow-hidden flex flex-col max-h-[85vh] text-xs animate-slideDown select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2.5">
            <Volume2 className="w-5 h-5 text-[var(--text-color)]" />
            <span className="font-semibold text-sm text-[var(--text-color)]">Keyboard Acoustics</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md hover:bg-[var(--hover-bg)] text-[var(--muted-color)] hover:text-[var(--text-color)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div className="space-y-1">
            <span className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--muted-color)] block">
              Switch Sound Profile
            </span>
            <p className="text-[11px] text-[var(--muted-color)]">
              Select tactile acoustic feedback synthesized on every keystroke.
            </p>
          </div>

          {/* Keystroke Options */}
          <div className="space-y-2">
            {keystrokeOptions.map((opt) => {
              const isSelected = audio.keystrokeSound === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectKeystroke(opt.id)}
                  className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between group cursor-pointer ${
                    isSelected
                      ? 'border-[var(--text-color)]/50 bg-[var(--hover-bg)] ring-1 ring-[var(--text-color)]/20 shadow-xs'
                      : 'border-[var(--border-color)] bg-[var(--hover-bg)]/20 hover:bg-[var(--hover-bg)]'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-medium text-xs text-[var(--text-color)] flex items-center gap-1.5">
                      {isSelected && <Check className="w-3.5 h-3.5 text-[var(--text-color)] flex-shrink-0" />}
                      <span>{opt.title}</span>
                    </div>
                    <div className="text-[10.5px] text-[var(--muted-color)] mt-0.5">
                      {opt.desc}
                    </div>
                  </div>
                  {opt.id !== 'none' && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        AudioService.playKeystroke(opt.id, opt.sampleKey);
                      }}
                      className="px-2.5 py-1 rounded-md bg-[var(--hover-bg)] hover:bg-[var(--border-color)] text-[10px] font-mono text-[var(--text-color)] border border-[var(--border-color)] transition-colors flex-shrink-0 cursor-pointer"
                    >
                      Test
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Keystroke Volume Slider */}
          {audio.keystrokeSound !== 'none' && (
            <div className="pt-2 border-t border-[var(--border-color)] space-y-2">
              <div className="flex items-center justify-between text-[10.5px] text-[var(--muted-color)]">
                <span className="font-medium">Typing Volume</span>
                <span className="font-mono">{Math.round(audio.keystrokeVolume * 100)}%</span>
              </div>
              <div className="flex items-center gap-2.5 px-0.5">
                <VolumeX className="w-3.5 h-3.5 text-[var(--muted-color)]" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={audio.keystrokeVolume}
                  onChange={(e) => handleKeystrokeVolumeChange(parseFloat(e.target.value))}
                  className="flex-1 accent-[var(--text-color)] h-1.5 bg-[var(--hover-bg)] rounded-lg cursor-pointer"
                />
                <Volume2 className="w-3.5 h-3.5 text-[var(--muted-color)]" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
