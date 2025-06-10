import { useAuth } from '@/provider';
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Spinner } from '@heroui/spinner'

const PrivateRoute: React.FC = () => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <div className='flex items-center justify-center w-full h-full'><Spinner /></div>; // Or a nice spinner
    }

    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;