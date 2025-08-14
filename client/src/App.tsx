import { Route, Routes, Navigate } from "react-router-dom";
import { Toaster } from 'sonner';

import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import ProjectsPage from "@/pages/projects";
import CreateProjectPage from "@/pages/CreateProjectPage";
import { useAuthStore } from "@/stores/authStore";

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

// Public Route Component (redirects to dashboard if authenticated)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}

function App() {
  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } />
        
        {/* Protected Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } />
        
        <Route path="/projects" element={
          <ProtectedRoute>
            <ProjectsPage />
          </ProtectedRoute>
        } />
        
        <Route path="/projects/new" element={
          <ProtectedRoute>
            <CreateProjectPage />
          </ProtectedRoute>
        } />
        
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* Catch all - redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      
      {/* Global Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'hsl(var(--heroui-background))',
            border: '1px solid hsl(var(--heroui-default-200))',
            color: 'hsl(var(--heroui-foreground))',
          },
        }}
      />
    </>
  );
}

export default App;
