import { Navigate, Outlet } from 'react-router-dom'; // Note: 'react-router' usually implies 'react-router-dom'
import { useUserStore } from '../store/userStore';

export const ProtectedRoute = () => {
  const { userId, accessToken } = useUserStore();

  console.log(userId, accessToken)
  // If we have an access token but no userId yet, 
  // it might be mid-update. We can show a simple loader.
  if (!userId && accessToken) {
    return <div className="h-screen w-full flex items-center justify-center bg-white">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
    </div>;
  }

  if (!userId) {
    return <Navigate to="/" replace />;
  }

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