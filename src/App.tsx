import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import Patients from "./pages/Patients";
import Analytics from "./pages/Analytics";
import Records from "./pages/Records";
import AuditLogs from "./pages/AuditLogs";
import Settings from "./pages/Settings";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route
              path="/settings"
              element={<ProtectedRoute><Settings /></ProtectedRoute>}
            />
            <Route
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patients"
              element={<ProtectedRoute><Patients /></ProtectedRoute>}
            />
            <Route
              path="/analytics"
              element={<ProtectedRoute><Analytics /></ProtectedRoute>}
            />
            <Route
              path="/records"
              element={<ProtectedRoute><Records /></ProtectedRoute>}
            />
            <Route
              path="/audit"
              element={<ProtectedRoute><AuditLogs /></ProtectedRoute>}
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <Admin />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
