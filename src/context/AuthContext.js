// src/context/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { db } from "./firebase";
import { getDoc, doc } from "firebase/firestore";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Auth State Changed - User:", user);
      setCurrentUser(user);
      
      if (user) {
        try {
          // Fetch user data from Firestore using UID
          const userDoc = await getDoc(doc(db, 'Users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserRole(userData.role);
            console.log("User Data from Firestore:", {
              uid: user.uid,
              email: user.email,
              role: userData.role,
              fullData: userData
            });
          } else {
            console.log("No user document found for UID:", user.uid);
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
        }
      } else {
        setUserRole(null);
        console.log("No user is signed in");
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const logout = () => {
    return signOut(auth);
  };

  const value = {
    currentUser,
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
