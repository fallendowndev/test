'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNotification } from '../context/NotificationContext';
import { api } from '../lib/api';
import {
  Link2,
  ImageIcon,
  Video,
  Bold,
  Italic,
  Strikethrough,
  Superscript,
  Heading2,
  AlertCircle,
  Quote,
  Code,
  List,
  ListOrdered,
  MoreHorizontal,
  ChevronDown,
  Tag,
  X,
  Check
} from 'lucide-react';

const COMMUNITIES = [
  { id: 'general', name: 'r/general', desc: 'Open discussion for everything' },
  { id: 'technology', name: 'r/technology', desc: 'Tech news, gadgets & software' },
  { id: 'programming', name: 'r/programming', desc: 'Code, tips and dev talk' },
  { id: 'creative', name: 'r/creative', desc: 'Art, design and photography' },
  { id: 'gaming', name: 'r/gaming', desc: 'Video games, clips and discussions' },
];

const AVAILABLE_TAGS = ['Discussion', 'Question', 'News', 'Help', 'Art', 'Feedback'];

export default function PostForm() {
  const router = useRouter();
  const { toast } = useNotification();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [communityDropdownOpen, setCommunityDropdownOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState(null);
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);

  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState(null); // 'image' | 'video'
  const [loading, setLoading] = useState(false);

  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const textareaRef = useRef(null);

  // Pick up image/video forwarded from the home page pic button
  useEffect(() => {
    try {
      const pendingData = sessionStorage.getItem('pendingPostMedia');
      if (pendingData) {
        const name = sessionStorage.getItem('pendingPostMediaName') || 'media_upload';
        const type = sessionStorage.getItem('pendingPostMediaType') || 'image/jpeg';
        sessionStorage.removeItem('pendingPostMedia');
        sessionStorage.removeItem('pendingPostMediaName');
        sessionStorage.removeItem('pendingPostMediaType');

        fetch(pendingData)
          .then((res) => res.blob())
          .then((blob) => {
            const file = new File([blob], name, { type });
            setMediaFile(file);
            setMediaType(type.startsWith('video/') ? 'video' : 'image');
            setMediaPreview(pendingData);
          })
          .catch(() => {});
      }
    } catch {}
  }, []);

  const handleMediaChange = (e, forcedType = null) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      toast.error('File must be smaller than 50MB');
      return;
    }

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      toast.error('Only images (JPG, PNG, WebP, GIF) and videos (MP4, WebM) are allowed');
      return;
    }

    setMediaFile(file);
    setMediaType(isVideo || forcedType === 'video' ? 'video' : 'image');
    setMediaPreview(URL.createObjectURL(file));
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaType(null);
    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview);
      setMediaPreview(null);
    }
  };

  // Helper to format/insert markdown symbols in textarea
  const insertFormatting = (prefix, suffix = '') => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = el.value;
    const selected = text.substring(start, end);
    const replacement = `${prefix}${selected || 'text'}${suffix}`;
    const newContent = text.substring(0, start) + replacement + text.substring(end);
    setContent(newContent);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length + (selected ? selected.length : 4));
    }, 10);
  };

  const handleSaveDraft = () => {
    if (!title.trim() && !content.trim()) {
      toast.info('Nothing to save as draft yet');
      return;
    }
    try {
      localStorage.setItem('saved_post_draft', JSON.stringify({ title, content, linkUrl }));
      toast.success('Draft saved successfully');
    } catch {
      toast.error('Could not save draft');
    }
  };

  const handleLoadDraft = () => {
    try {
      const saved = localStorage.getItem('saved_post_draft');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.title) setTitle(parsed.title);
        if (parsed.content) setContent(parsed.content);
        if (parsed.linkUrl) {
          setLinkUrl(parsed.linkUrl);
          setShowLinkInput(true);
        }
        toast.success('Draft loaded');
      } else {
        toast.info('No saved draft found');
      }
    } catch {
      toast.error('Failed to load draft');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.warning('Please enter a post title');
      return;
    }

    if (linkUrl.trim()) {
      try {
        new URL(linkUrl.trim());
      } catch {
        toast.error('Please enter a valid full URL (e.g. https://example.com)');
        return;
      }
    }

    try {
      setLoading(true);

      // Append tag if selected
      const finalTitle = selectedTag ? `[${selectedTag}] ${title.trim()}` : title.trim();

      let response;
      if (mediaFile) {
        const formData = new FormData();
        formData.append('title', finalTitle);
        formData.append('content', content.trim());
        formData.append('postType', 'media');
        formData.append('file', mediaFile);
        if (linkUrl.trim()) {
          formData.append('link', linkUrl.trim());
        }

        response = await api('/posts', {
          method: 'POST',
          body: formData,
          isFormData: true,
        });
      } else {
        const payload = {
          title: finalTitle,
          content: content.trim(),
          postType: linkUrl.trim() ? 'link' : 'text',
        };
        if (linkUrl.trim()) {
          payload.link = linkUrl.trim();
        }

        response = await api('/posts', {
          method: 'POST',
          body: payload,
        });
      }

      if (response.success && response.data?.post) {
        try {
          localStorage.removeItem('saved_post_draft');
        } catch {}
        toast.success('Post published successfully!');
        router.push(`/post/${response.data.post._id}`);
      } else {
        router.push('/');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-2">
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={imageInputRef}
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => handleMediaChange(e, 'image')}
      />
      <input
        type="file"
        ref={videoInputRef}
        accept="video/mp4,video/webm,video/quicktime"
        className="hidden"
        onChange={(e) => handleMediaChange(e, 'video')}
      />

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Top Header Row: Community Selector + Drafts button */}
        <div className="flex items-center justify-between gap-3">
          {/* Community Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setCommunityDropdownOpen(!communityDropdownOpen)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 text-xs sm:text-sm font-semibold text-zinc-100 transition-colors cursor-pointer select-none"
            >
              <span>{selectedCommunity ? selectedCommunity.name : 'Select Community'}</span>
              <ChevronDown size={14} className={`text-zinc-400 transition-transform ${communityDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {communityDropdownOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setCommunityDropdownOpen(false)} />
                <div className="absolute left-0 top-full mt-2 w-64 rounded-2xl bg-[#141419] border border-white/10 p-1.5 shadow-2xl z-30 space-y-1">
                  {COMMUNITIES.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setSelectedCommunity(c);
                        setCommunityDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/10 flex items-center justify-between text-xs text-zinc-200 transition-colors cursor-pointer"
                    >
                      <div>
                        <p className="font-semibold text-zinc-100">{c.name}</p>
                        <p className="text-[11px] text-zinc-500">{c.desc}</p>
                      </div>
                      {selectedCommunity?.id === c.id && <Check size={14} className="text-white" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Drafts Link */}
          <button
            type="button"
            onClick={handleLoadDraft}
            className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            Drafts
          </button>
        </div>

        {/* Main Post Box */}
        <div className="bg-[#0b0b0e] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-3 shadow-lg">
          {/* Title Input */}
          <div className="relative">
            <input
              type="text"
              dir="auto"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              maxLength={300}
              required
              className="w-full bg-transparent border-0 outline-none text-xl sm:text-2xl font-bold text-white placeholder:text-zinc-600 tracking-tight"
            />
          </div>

          {/* Tag Pill Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setTagDropdownOpen(!tagDropdownOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-300 transition-colors cursor-pointer select-none"
            >
              <Tag size={12} className="text-zinc-400" />
              <span>{selectedTag ? selectedTag : '+ Add tags'}</span>
              {selectedTag && (
                <X
                  size={12}
                  className="text-zinc-400 hover:text-white ml-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTag(null);
                  }}
                />
              )}
            </button>

            {tagDropdownOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setTagDropdownOpen(false)} />
                <div className="absolute left-0 top-full mt-2 flex flex-wrap gap-1.5 p-2 rounded-xl bg-[#141419] border border-white/10 shadow-xl z-30 max-w-xs">
                  {AVAILABLE_TAGS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setSelectedTag(t);
                        setTagDropdownOpen(false);
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                        selectedTag === t
                          ? 'bg-white text-black'
                          : 'bg-white/5 hover:bg-white/15 text-zinc-200'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Body Textarea */}
          <div className="pt-1">
            <textarea
              ref={textareaRef}
              dir="auto"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Body text (optional)"
              rows={7}
              maxLength={40000}
              className="w-full bg-transparent border-0 outline-none text-zinc-200 placeholder:text-zinc-600 resize-y min-h-[150px] text-sm leading-relaxed"
            />
          </div>

          {/* Media Preview if attached */}
          {mediaPreview && (
            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black max-h-[380px] flex items-center justify-center my-3">
              {mediaType === 'video' ? (
                <video src={mediaPreview} controls className="max-h-[380px] w-full rounded-xl bg-black" />
              ) : (
                <img src={mediaPreview} alt="Preview" className="max-h-[380px] w-auto max-w-full object-contain rounded-xl" />
              )}
              <button
                type="button"
                onClick={removeMedia}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-black/80 hover:bg-red-500/90 text-white transition-all cursor-pointer shadow-md"
                aria-label="Remove media"
              >
                <X size={15} />
              </button>
            </div>
          )}

          {/* Optional Link Input row */}
          {showLinkInput && (
            <div className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.03] border border-white/10 my-2">
              <Link2 size={16} className="text-zinc-400 shrink-0 ml-1" />
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                className="flex-1 bg-transparent border-0 outline-none text-xs text-zinc-100 placeholder:text-zinc-500"
              />
              <button
                type="button"
                onClick={() => {
                  setLinkUrl('');
                  setShowLinkInput(false);
                }}
                className="p-1 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Bottom Toolbar & Action buttons */}
          <div className="border-t border-white/10 pt-3 flex flex-wrap items-center justify-between gap-3">
            {/* Left formatting & attachment icon bar */}
            <div className="flex items-center gap-1 sm:gap-1.5 text-zinc-400 flex-wrap">
              <button
                type="button"
                onClick={() => setShowLinkInput(!showLinkInput)}
                className={`p-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors cursor-pointer ${
                  showLinkInput ? 'text-white bg-white/10' : ''
                }`}
                title="Add Link"
              >
                <Link2 size={16} />
              </button>

              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="p-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Add Image"
              >
                <ImageIcon size={16} />
              </button>

              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                className="p-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Add Video"
              >
                <Video size={16} />
              </button>

              <span className="w-px h-4 bg-white/10 mx-1 hidden sm:inline-block" />

              <button
                type="button"
                onClick={() => insertFormatting('**', '**')}
                className="p-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Bold"
              >
                <Bold size={16} />
              </button>

              <button
                type="button"
                onClick={() => insertFormatting('*', '*')}
                className="p-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Italic"
              >
                <Italic size={16} />
              </button>

              <button
                type="button"
                onClick={() => insertFormatting('~~', '~~')}
                className="p-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Strikethrough"
              >
                <Strikethrough size={16} />
              </button>

              <button
                type="button"
                onClick={() => insertFormatting('^')}
                className="p-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors cursor-pointer hidden sm:inline-block"
                title="Superscript"
              >
                <Superscript size={16} />
              </button>

              <button
                type="button"
                onClick={() => insertFormatting('## ')}
                className="p-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Heading"
              >
                <Heading2 size={16} />
              </button>

              <button
                type="button"
                onClick={() => insertFormatting('>!', '!<')}
                className="p-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors cursor-pointer hidden sm:inline-block"
                title="Spoiler"
              >
                <AlertCircle size={16} />
              </button>

              <button
                type="button"
                onClick={() => insertFormatting('> ')}
                className="p-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors cursor-pointer hidden sm:inline-block"
                title="Quote"
              >
                <Quote size={16} />
              </button>

              <button
                type="button"
                onClick={() => insertFormatting('`', '`')}
                className="p-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Code"
              >
                <Code size={16} />
              </button>

              <button
                type="button"
                onClick={() => insertFormatting('- ')}
                className="p-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors cursor-pointer hidden sm:inline-block"
                title="Bullet List"
              >
                <List size={16} />
              </button>

              <button
                type="button"
                onClick={() => insertFormatting('1. ')}
                className="p-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors cursor-pointer hidden sm:inline-block"
                title="Numbered List"
              >
                <ListOrdered size={16} />
              </button>

              <button
                type="button"
                onClick={() => insertFormatting('***\n')}
                className="p-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Divider"
              >
                <MoreHorizontal size={16} />
              </button>
            </div>

            {/* Right action buttons: Save Draft & Post */}
            <div className="flex items-center gap-2.5 ml-auto">
              <button
                type="button"
                onClick={handleSaveDraft}
                className="px-4 py-1.5 rounded-full border border-white/20 hover:bg-white/10 text-xs font-semibold text-zinc-200 transition-colors cursor-pointer select-none"
              >
                Save Draft
              </button>

              <button
                type="submit"
                disabled={loading || !title.trim()}
                className="px-6 py-1.5 rounded-full bg-white hover:bg-zinc-200 text-black text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer select-none shadow-sm"
              >
                {loading ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
