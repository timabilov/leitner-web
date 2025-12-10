import { Navigate, Outlet } from 'react-router-dom'; // Note: 'react-router' usually implies 'react-router-dom'
import { useUserStore } from '../store/userStore';

export const ProtectedRoute = () => {
  const { userId } = useUserStore();

  // If not logged in, redirect to Login
  if (!userId) {
    return <Navigate to="/" replace />;
  }

  // If logged in, render child routes
  return <Outlet />;
};

export const PublicRoute = () => {
    const { userId } = useUserStore();
  
    // If already logged in, redirect to Dashboard/Notes
    if (userId) {
      return <Navigate to="/notes" replace />;
    }
  
    return <Outlet />;
};