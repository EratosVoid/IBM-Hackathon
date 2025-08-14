import { useState } from 'react';
import { Navigate, Link as RouterLink } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Input,
  Button,
  Link,
  Divider,
  Spinner,
} from '@heroui/react';
import { toast } from 'sonner';

import { useAuthStore } from '@/stores/authStore';
import { api, ApiError } from '@/utils/api';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login, isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'dev@hackathon.com',
      password: 'cityplanner123',
    },
  });

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const response = await api.auth.login(data.email, data.password);
      
      if (response.success) {
        login(response.user, response.token);
        toast.success('Welcome to Agentic City Planner!');
      } else {
        toast.error('Login failed. Please check your credentials.');
      }
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col gap-1 items-center pb-6">
          <h1 className="text-2xl font-bold text-center">
            Agentic City Planner
          </h1>
          <p className="text-small text-default-500 text-center">
            AI-powered urban planning and city design
          </p>
        </CardHeader>
        
        <CardBody className="gap-4">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              {...register('email')}
              type="email"
              label="Email"
              placeholder="Enter your email"
              isInvalid={!!errors.email}
              errorMessage={errors.email?.message}
              isDisabled={isLoading}
            />
            
            <Input
              {...register('password')}
              type="password"
              label="Password"
              placeholder="Enter your password"
              isInvalid={!!errors.password}
              errorMessage={errors.password?.message}
              isDisabled={isLoading}
            />
            
            <Button
              type="submit"
              color="primary"
              size="lg"
              isLoading={isLoading}
              isDisabled={isLoading}
              className="w-full"
            >
              {isLoading ? <Spinner color="white" size="sm" /> : 'Sign In'}
            </Button>
          </form>
          
          <Divider />
          
          <div className="text-center text-small">
            <p className="text-default-500">Demo Credentials:</p>
            <p className="text-default-600 font-mono text-xs">
              dev@hackathon.com / cityplanner123
            </p>
          </div>
        </CardBody>
        
        <CardFooter className="justify-center">
          <p className="text-small text-default-500">
            Need an account?{' '}
            <Link as={RouterLink} to="/register" color="primary">
              Register here
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}