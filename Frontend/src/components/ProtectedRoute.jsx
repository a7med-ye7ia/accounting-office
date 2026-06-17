import { Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { verify } from "../api/auth";

const ProtectedRoute = () => {
  const [isValid, setIsValid] = useState(null);

  useEffect(() => {
    const checkToken = async () => {
      const token = localStorage.getItem("authToken");

      if (!token) {
        setIsValid(false);
        return;
      }

      try {
        const response = await verify(token);

        if (response.success) {
          setIsValid(true);
        } else {
          setIsValid(false);
        }

      } catch (error) {
        console.log("Invalid token");

        localStorage.removeItem("authToken");
        localStorage.removeItem("user");

        setIsValid(false);
      }
    };

    checkToken();
  }, []);

  
  // while checking token
  if (isValid === null) {
    return <div>Checking authentication...</div>;
  }


  if (!isValid) {
    return <Navigate to="/" replace />;
  }


  return <Outlet />;
};

export default ProtectedRoute;