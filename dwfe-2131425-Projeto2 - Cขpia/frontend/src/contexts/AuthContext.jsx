import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

function decodeToken(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Token decoding failed:", error);
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    return localStorage.getItem("clonetwitter_token") || null;
  });
  
  const [user, setUser] = useState(() => {
    const savedToken = localStorage.getItem("clonetwitter_token");
    return savedToken ? decodeToken(savedToken) : null;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sync token to user state
  useEffect(() => {
    if (token) {
      localStorage.setItem("clonetwitter_token", token);
      setUser(decodeToken(token));
    } else {
      localStorage.removeItem("clonetwitter_token");
      setUser(null);
    }
  }, [token]);

  // Auth Operations
  const register = async (username, email, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao efetuar registo.");
      }
      setToken(data.token);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Credenciais inválidas.");
      }
      setToken(data.token);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  // Helper function for authenticated API requests
  const fetchWithAuth = async (url, options = {}) => {
    const headers = {
      ...options.headers,
      "Authorization": `Bearer ${token}`
    };
    
    // Auto-detect JSON payload
    if (options.body && typeof options.body === "object" && !(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(options.body);
    }

    const response = await fetch(`${API_BASE}${url}`, { ...options, headers });
    
    // Auto-logout if unauthorized (token expired/invalidated)
    if (response.status === 401) {
      logout();
    }
    
    return response;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        register,
        login,
        logout,
        fetchWithAuth,
        API_BASE
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}