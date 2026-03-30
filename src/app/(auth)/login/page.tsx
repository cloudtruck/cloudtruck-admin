'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Truck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { loginSchema, type LoginFormData } from '@/validators/schemas';
import { authApi } from '@/lib/api';
import { logger } from '@/lib/logger';
import { useAuthStore } from '@/store/authStore';
import { AxiosError } from 'axios';
import { useEffect } from 'react';

interface ErrorResponse {
  message?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { setAuth, isAuthenticated, _hasHydrated } = useAuthStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (_hasHydrated && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, _hasHydrated, router]);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    try {
      const response = await authApi.login(data);
      const { user, accessToken } = response.data.data;

      setAuth(user, accessToken);
      toast.success('Login successful!');
      router.push('/dashboard');
    } catch (error: unknown) {
      logger.error('Login failed:', error);

      let errorMessage = 'Login failed. Please try again.';

      const axiosError = error as AxiosError;

      if (axiosError.response) {
        const { status, data } = axiosError.response;

        switch (status) {
          case 401:
            errorMessage =
              (data as ErrorResponse)?.message ||
              'Invalid email or password. Please check your credentials.';
            break;
          case 423:
            errorMessage =
              (data as ErrorResponse)?.message ||
              'Account locked due to multiple failed login attempts. Please contact support.';
            break;
          case 403:
            errorMessage =
              (data as ErrorResponse)?.message ||
              'Account blocked or inactive. Please contact support.';
            break;
          case 429:
            errorMessage = 'Too many login attempts. Please try again later.';
            break;
          case 500:
            errorMessage = 'Server error. Please try again later or contact support.';
            break;
          default:
            errorMessage = (data as ErrorResponse)?.message || errorMessage;
        }
      } else if (axiosError.message?.includes('Network Error')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Logo and Header */}
      <div className="flex flex-col items-center space-y-2 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-200">
          <Truck className="h-8 w-8" />
        </div>
        <h1 className="page-title">Cloudtruck Admin</h1>
        <p className="page-subtitle">Sign in to access the dashboard</p>
      </div>

      {/* Login Form */}
      <div className="card">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="admin@cloudtruck.com"
                      disabled={loading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" disabled={loading} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
        </Form>
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-zinc-600">© 2024 Cloudtruck. All rights reserved.</p>
    </div>
  );
}
