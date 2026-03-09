// src/context/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { apiGetUserProfile } from "../api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [dbUser, setDbUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Auth State Changed - User:", user);
      setCurrentUser(user);
      setLoading(false); // Unblock UI right away for faster UX

      if (user) {
        try {
          // Fetch user data from our backend API
          const userData = await apiGetUserProfile();
          if (userData) {
            setDbUser(userData);
            setUserRole(userData.userType || userData.role || null); // Handle both old and new schema
          } else {
            setDbUser(null);
            setUserRole(null);
          }
        } catch (error) {
          console.error("Error fetching user profile from API:", error);
          setDbUser(null);
          setUserRole(null);
        }
      } else {
        setDbUser(null);
        setUserRole(null);
        console.log("No user is signed in");
      }
    });

    return unsubscribe;
  }, []);

  const logout = () => {
    return signOut(auth);
  };

  const value = {
    currentUser,
    dbUser,
    userRole,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
