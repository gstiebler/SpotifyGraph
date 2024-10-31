import { Navigate } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { tokenState } from '../state/authState';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const token = useRecoilValue(tokenState);
  
  if (!token) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
