'use client';

import ProtectedRoute from '../components/ProtectedRoute';
import PostForm from '../components/PostForm';

export default function CreatePostPage() {
  return (
    <ProtectedRoute>
      <div className="max-w-3xl mx-auto px-4 py-6">
        <PostForm />
      </div>
    </ProtectedRoute>
  );
}
