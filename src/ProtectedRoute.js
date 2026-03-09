import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

function ProtectedRoute({ children, allowedRoles }) {
    const { currentUser, userRole, loading } = useAuth();

    if (loading) {
        return <div>Loading...</div>; // Or a proper spinner
    }

    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    // If roles are specified, check if user has permission
    if (allowedRoles && !allowedRoles.includes(userRole)) {
        return <Navigate to="/" replace />;
    }

    return children;
}

export default ProtectedRoute;
