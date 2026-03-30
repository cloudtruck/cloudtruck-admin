'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Truck, Home, ArrowLeft, AlertCircle } from 'lucide-react';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="max-w-md w-full text-center px-6">
        {/* Large 404 number */}
        <p className="text-6xl font-bold text-zinc-900 leading-none mb-6">404</p>

        {/* Icon in a rounded circle */}
        <div className="flex justify-center mb-6">
          <div className="bg-zinc-100 rounded-full p-4">
            <Truck className="size-8 text-zinc-500" />
          </div>
        </div>

        {/* Heading */}
        <h1 className="page-title">Page not found</h1>

        {/* Subtext */}
        <p className="page-subtitle">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        {/* Action buttons */}
        <div className="flex gap-3 justify-center mt-8">
          <Button
            variant="default"
            onClick={() => router.push('/dashboard')}
          >
            <Home />
            Go to Dashboard
          </Button>

          <Button
            variant="outline"
            onClick={() => router.back()}
          >
            <ArrowLeft />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}
