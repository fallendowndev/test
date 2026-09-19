'use client';

import { Suspense } from 'react';
import ProtectedRoute from '../components/ProtectedRoute';
import PostForm from '../components/PostForm';
import LoadingSpinner from '../components/LoadingSpinner';

export default function CreatePostPage() {
  return (
    <ProtectedRoute>
      <div className="max-w-3xl mx-auto px-4 py-6">
        <Suspense fallback={<div className="py-20"><LoadingSpinner size="lg" /></div>}>
          <PostForm />
        </Suspense>
      </div>
    </ProtectedRoute>
  );
}
