'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../lib/api';
import { UploadCloud, X, Send } from 'lucide-react';

export default function PostForm() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setImageFile(null);
      setImagePreview(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB');
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setError('Only JPG, PNG, WEBP, and GIF images are allowed');
      return;
    }

    setError('');
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a title');
      return;
    }
    if (!content.trim()) {
      setError('Please provide post content');
      return;
    }

    try {
      setLoading(true);
      setError('');

      let response;
      if (imageFile) {
        const formData = new FormData();
        formData.append('title', title.trim());
        formData.append('content', content.trim());
        formData.append('image', imageFile);

        response = await api('/posts', {
          method: 'POST',
          body: formData,
          isFormData: true,
        });
      } else {
        response = await api('/posts', {
          method: 'POST',
          body: {
            title: title.trim(),
            content: content.trim(),
          },
        });
      }

      if (response.success && response.data?.post) {
        router.push(`/post/${response.data.post._id}`);
      } else {
        router.push('/');
      }
    } catch (err) {
      setError(err.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card bg-white p-5 rounded border border-[#ccc]">
      <h1 className="text-xl font-bold mb-4 pb-2 border-b border-[#edeff1]">Create a Post</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2.5 rounded text-sm mb-4">
          {error}
        </div>
      )}

      <div className="mb-4">
        <label htmlFor="post-title" className="block text-xs font-semibold text-[#7c7c7c] uppercase mb-1">
          Title ({title.length}/300)
        </label>
        <input
          id="post-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          maxLength={300}
          required
          className="w-full border border-[#ccc] rounded px-3 py-2 text-sm focus:border-[#0079d3] transition-colors"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="post-content" className="block text-xs font-semibold text-[#7c7c7c] uppercase mb-1">
          Post Content
        </label>
        <textarea
          id="post-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind? Share your thoughts, story, or discussion topic..."
          rows={8}
          maxLength={40000}
          required
          className="w-full border border-[#ccc] rounded px-3 py-2 text-sm focus:border-[#0079d3] transition-colors resize-y leading-relaxed"
        />
      </div>

      <div className="mb-6">
        <label className="block text-xs font-semibold text-[#7c7c7c] uppercase mb-1">
          Image (Optional)
        </label>
        {!imagePreview ? (
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-[#edeff1] border-dashed rounded-md hover:border-[#0079d3] transition-colors cursor-pointer relative">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleImageChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <div className="space-y-1 text-center">
              <UploadCloud className="mx-auto h-8 w-8 text-[#7c7c7c]" strokeWidth={1.5} />
              <div className="flex text-xs text-[#7c7c7c] justify-center">
                <span className="font-semibold text-[#0079d3]">Upload an image</span>
                <span className="pl-1">or drag and drop</span>
              </div>
              <p className="text-[11px] text-[#7c7c7c]">PNG, JPG, WEBP, GIF up to 5MB</p>
            </div>
          </div>
        ) : (
          <div className="relative border rounded p-2 inline-block">
            <img
              src={imagePreview}
              alt="Preview"
              className="max-h-48 rounded object-cover"
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow"
              aria-label="Remove image"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-3 border-t border-[#edeff1]">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-sm font-semibold rounded border border-[#ccc] hover:bg-[#f8f9fa] transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !title.trim() || !content.trim()}
          className="px-6 py-2 text-sm font-semibold rounded bg-[#0079d3] hover:bg-[#006cbd] text-white transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <Send size={15} />
          {loading ? 'Publishing...' : 'Publish Post'}
        </button>
      </div>
    </form>
  );
}
