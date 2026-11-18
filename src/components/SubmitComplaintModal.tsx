import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  EyeOff,
  FileUp,
  SearchCheck,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import {
  CAMPUS_LOCATIONS,
  COMPLAINT_CATEGORIES,
  COMPLAINT_PRIORITIES,
  type Complaint,
  type ComplaintCategory,
  type ComplaintPriority,
  type DuplicateMatch,
} from '../types';
import { api } from '../lib/api';
import { formatRelativeTime } from '../lib/format';
import { StatusIndicator } from './StatusText';

interface SubmitComplaintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (complaint: Complaint) => void;
}

export function SubmitComplaintModal({
  isOpen,
  onClose,
  onCreated,
}: SubmitComplaintModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ComplaintCategory>('Infrastructure');
  const [location, setLocation] = useState<string>(CAMPUS_LOCATIONS[0].name);
  const [priority, setPriority] = useState<ComplaintPriority>('Medium');
  const [description, setDescription] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>(undefined);
  const [imageName, setImageName] = useState<string | null>(null);

  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([]);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live duplicate complaint detection
  useEffect(() => {
    if (!isOpen) return;
    if (title.trim().length < 5) {
      setDuplicates([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      setCheckingDuplicates(true);
      try {
        const res = await api.checkDuplicates({
          title,
          description,
          category,
          location,
        });
        setDuplicates(res.matches);
      } catch {
        // Silent fallback on duplicate check
      } finally {
        setCheckingDuplicates(false);
      }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [isOpen, title, description, category, location]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setError('Only PNG, JPEG, or WebP images are supported.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB.');
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageDataUrl(reader.result);
        setImageName(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (title.trim().length < 5) {
      setError('Please enter a clear complaint title (at least 5 characters).');
      return;
    }
    if (description.trim().length < 15) {
      setError('Please describe the issue in at least 15 characters so teams can locate and fix it.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.createComplaint({
        title: title.trim(),
        category,
        description: description.trim(),
        location,
        priority,
        isAnonymous,
        imageDataUrl,
      });
      setTitle('');
      setDescription('');
      setIsAnonymous(false);
      setImageDataUrl(undefined);
      setImageName(null);
      setDuplicates([]);
      onCreated(res.complaint);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit complaint.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Submit a Campus Complaint"
    >
      <div className="w-full max-w-2xl glass-surface-elevated rounded-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80">
          <div>
            <h2 className="text-lg font-semibold text-white">Report a Campus Issue</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Unique tracking ID generated automatically upon submission
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/70 transition-colors"
            aria-label="Close submission modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          {error && (
            <div className="flex items-center gap-2 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3.5 py-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label htmlFor="cmp-title" className="block text-xs font-medium text-slate-300 mb-1.5">
              Complaint Title
            </label>
            <input
              id="cmp-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={140}
              placeholder="e.g., Lab 302 air conditioning unit leaking water onto power strip"
              className="w-full rounded-lg bg-slate-900/90 border border-slate-700/80 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
              required
            />
          </div>

          {/* Duplicate Detection Alert */}
          {(checkingDuplicates || duplicates.length > 0) && (
            <div className="rounded-xl bg-amber-500/8 border border-amber-500/30 p-4 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
                  <SearchCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>
                    {checkingDuplicates
                      ? 'Scanning existing reports for similar issues...'
                      : `${duplicates.length} similar campus issue${
                          duplicates.length > 1 ? 's' : ''
                        } already logged`}
                  </span>
                </div>
                <span className="text-[11px] text-amber-200/70">Duplicate Detection</span>
              </div>

              {duplicates.length > 0 && (
                <div className="space-y-2">
                  {duplicates.map((match) => (
                    <div
                      key={match.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-950/60 border border-slate-800/80 px-3 py-2 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-100 truncate">{match.title}</p>
                        <p className="text-slate-400 mt-0.5 font-mono-data">
                          {match.complaintCode} · {match.location} · {formatRelativeTime(match.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <StatusIndicator status={match.status} />
                        <span className="font-mono-data tabular-nums text-amber-300 font-semibold">
                          {match.similarity}% match
                        </span>
                      </div>
                    </div>
                  ))}
                  <p className="text-[11px] text-slate-400">
                    If your issue is distinct or affects a different area, continue submitting below.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Category, Location, Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="cmp-cat" className="block text-xs font-medium text-slate-300 mb-1.5">
                Category
              </label>
              <select
                id="cmp-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
                className="w-full rounded-lg bg-slate-900/90 border border-slate-700/80 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-sky-400"
              >
                {COMPLAINT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="cmp-loc" className="block text-xs font-medium text-slate-300 mb-1.5">
                Campus Location
              </label>
              <select
                id="cmp-loc"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-lg bg-slate-900/90 border border-slate-700/80 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-sky-400"
              >
                {CAMPUS_LOCATIONS.map((loc) => (
                  <option key={loc.code} value={loc.name}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="cmp-pri" className="block text-xs font-medium text-slate-300 mb-1.5">
                Priority Level
              </label>
              <select
                id="cmp-pri"
                value={priority}
                onChange={(e) => setPriority(e.target.value as ComplaintPriority)}
                className="w-full rounded-lg bg-slate-900/90 border border-slate-700/80 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-sky-400"
              >
                {COMPLAINT_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="cmp-desc" className="block text-xs font-medium text-slate-300">
                Detailed Description
              </label>
              <span className="text-[11px] text-slate-500 font-mono-data tabular-nums">
                {description.length}/2000
              </span>
            </div>
            <textarea
              id="cmp-desc"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              placeholder="Include room number, floor, equipment ID, and any safety hazards..."
              className="w-full rounded-lg bg-slate-900/90 border border-slate-700/80 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
              required
            />
          </div>

          {/* Optional Image Upload + Anonymous Toggle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3.5">
              <p className="text-xs font-medium text-slate-300 mb-2">Photo Evidence (Optional)</p>
              {!imageDataUrl ? (
                <label className="flex items-center justify-center gap-2 border border-dashed border-slate-700 hover:border-sky-400/70 rounded-lg py-3 px-3 text-xs text-slate-400 hover:text-sky-300 cursor-pointer transition-colors">
                  <FileUp className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Upload PNG / JPG (max 5MB)</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                </label>
              ) : (
                <div className="flex items-center justify-between gap-2 bg-slate-950/70 border border-slate-800 rounded-lg p-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={imageDataUrl}
                      alt="Upload preview"
                      className="w-10 h-10 rounded object-cover shrink-0"
                    />
                    <span className="text-xs text-slate-200 truncate">{imageName || 'Image attached'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setImageDataUrl(undefined);
                      setImageName(null);
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-300 transition-colors"
                    aria-label="Remove uploaded image"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3.5 flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-200">
                  <EyeOff className="w-3.5 h-3.5 text-violet-400" aria-hidden="true" />
                  <span>Anonymous Submission</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Masks your name, email, and roll number from administrators while keeping tracking active in your dashboard.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isAnonymous}
                onClick={() => setIsAnonymous((v) => !v)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                  isAnonymous ? 'bg-violet-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
                    isAnonymous ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/70 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-sky-400 to-cyan-400 hover:from-sky-300 hover:to-cyan-300 disabled:opacity-50 text-slate-950 font-semibold text-xs transition-all whitespace-nowrap"
            >
              <Send className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{submitting ? 'Submitting...' : 'Submit Complaint'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
