/* eslint-disable react/prop-types */
import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";

const PrivateRoute = ({ children, allowedRoles = ["ADMIN", "SUPER_ADMIN"] }) => {
  const { user, token } = useSelector((state) => state.auth);
  const location = useLocation();

  let userRole = null;
  if (token) {
    try {
      const payload = token.split(".")[1];
      if (payload) {
        const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
        const decodedPayload = JSON.parse(atob(base64));
        userRole = decodedPayload.role;
      }
    } catch (error) {
      console.error("Error decoding token in PrivateRoute:", error);
    }
  }

  // check if user is authenticated
  if (!token) {
    // redirect to login
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  // check if user role is allowed
  if (!allowedRoles.includes(userRole)) {
    // redirect to home/dashboard if not authorized
    return <Navigate to="/" replace />;
  }

  // if authenticated, render the children
  return children;
};

export default PrivateRoute;
