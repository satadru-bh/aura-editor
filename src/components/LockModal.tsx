import React, { useState } from 'react';
import { X, Lock, Unlock, Key, Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react';

interface LockModalProps {
  isOpen: boolean;
  isCurrentlyEncrypted: boolean;
  fileName: string;
  onLock: (passphrase: string) => Promise<boolean>;
  onUnlock: (passphrase: string) => Promise<boolean>;
  onRemoveLock: () => Promise<boolean>;
  onClose: () => void;
}

export const LockModal: React.FC<LockModalProps> = ({
  isOpen,
  isCurrentlyEncrypted,
  fileName,
  onLock,
  onUnlock,
  onRemoveLock,
  onClose,
}) => {
  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!passphrase.trim()) {
      setError('Please enter a passphrase.');
      return;
    }

    if (!isCurrentlyEncrypted) {
      if (passphrase.length < 4) {
        setError('Passphrase must be at least 4 characters long.');
        return;
      }
      if (passphrase !== confirmPassphrase) {
        setError('Passphrases do not match.');
        return;
      }
      setLoading(true);
      const success = await onLock(passphrase);
      setLoading(false);
      if (success) {
        setPassphrase('');
        setConfirmPassphrase('');
        onClose();
      } else {
        setError('Failed to encrypt document.');
      }
    } else {
      setLoading(true);
      const success = await onUnlock(passphrase);
      setLoading(false);
      if (success) {
        setPassphrase('');
        onClose();
      } else {
        setError('Incorrect passphrase. Please try again.');
      }
    }
  };

  const handlePermanentUnlock = async () => {
    setLoading(true);
    const success = await onRemoveLock();
    setLoading(false);
    if (success) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] transition-all animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[var(--surface-color)] text-[var(--text-color)] rounded-2xl shadow-2xl border border-[var(--border-color)] overflow-hidden flex flex-col text-xs animate-slideDown select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2.5">
            {isCurrentlyEncrypted ? (
              <Unlock className="w-5 h-5 text-[var(--text-color)] flex-shrink-0" />
            ) : (
              <Lock className="w-5 h-5 text-[var(--text-color)] flex-shrink-0" />
            )}
            <div>
              <span className="font-semibold text-sm text-[var(--text-color)]">
                {isCurrentlyEncrypted ? 'Unlock Document' : 'Encrypt Document'}
              </span>
              <span className="text-[11px] text-[var(--muted-color)] block font-normal truncate max-w-[280px]">
                {fileName}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md hover:bg-[var(--hover-bg)] text-[var(--muted-color)] hover:text-[var(--text-color)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="text-[11px] text-[var(--muted-color)] leading-relaxed">
            {isCurrentlyEncrypted
              ? 'This document is protected with zero-knowledge AES-256 encryption. Enter your secret passphrase to decrypt and edit.'
              : 'Protect this document with client-side AES-GCM-256 encryption. Only those with your secret passphrase will be able to read or decrypt the contents.'}
          </div>

          {error && (
            <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[11px] flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Passphrase Input */}
          <div className="space-y-1.5">
            <label className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--muted-color)]">
              {isCurrentlyEncrypted ? 'Passphrase' : 'New Passphrase'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoFocus
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="Enter secret passphrase..."
                className="w-full px-3 py-2 pr-9 rounded-xl border border-[var(--border-color)] bg-[var(--hover-bg)]/20 outline-none focus:border-[var(--text-color)]/50 focus:ring-1 focus:ring-[var(--text-color)]/20 text-xs font-mono text-[var(--text-color)] placeholder:text-[var(--muted-color)]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--muted-color)] hover:text-[var(--text-color)] cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Confirm Passphrase (Only when locking) */}
          {!isCurrentlyEncrypted && (
            <div className="space-y-1.5">
              <label className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--muted-color)]">
                Confirm Passphrase
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassphrase}
                onChange={(e) => setConfirmPassphrase(e.target.value)}
                placeholder="Repeat passphrase..."
                className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--hover-bg)]/20 outline-none focus:border-[var(--text-color)]/50 focus:ring-1 focus:ring-[var(--text-color)]/20 text-xs font-mono text-[var(--text-color)] placeholder:text-[var(--muted-color)]"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            {isCurrentlyEncrypted ? (
              <button
                type="button"
                onClick={handlePermanentUnlock}
                className="text-[11px] text-[var(--muted-color)] hover:text-red-500 transition-colors cursor-pointer"
              >
                Remove Encryption
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-xl border border-[var(--border-color)] hover:bg-[var(--hover-bg)] transition-colors text-[var(--text-color)] font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-1.5 rounded-xl bg-[var(--text-color)] text-[var(--bg-color)] hover:opacity-90 font-medium shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading
                  ? 'Processing...'
                  : isCurrentlyEncrypted
                  ? 'Unlock Document'
                  : 'Encrypt Document'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
