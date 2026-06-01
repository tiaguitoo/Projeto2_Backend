import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Search, UserPlus } from "lucide-react";

export default function Widgets({ setCurrentPage, refreshTrigger }) {
  const { fetchWithAuth } = useAuth();
  const [suggestions, setSuggestions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const loadSuggestions = async () => {
    try {
      const res = await fetchWithAuth("/users/suggestions");
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data);
      }
    } catch (error) {
      console.error("Error loading suggestions:", error);
    }
  };

  useEffect(() => {
    loadSuggestions();
  }, [refreshTrigger]);

  const handleFollow = async (userId, isFollowing) => {
    try {
      const method = isFollowing ? "DELETE" : "POST";
      const res = await fetchWithAuth(`/users/${userId}/follow`, { method });
      if (res.ok) {
        // Toggle status locally
        setSuggestions((prev) =>
          prev.map((s) =>
            s.user_id === userId ? { ...s, isFollowing: !isFollowing } : s
          )
        );
      }
    } catch (error) {
      console.error("Follow action failed:", error);
    }
  };

  const trends = [
    { category: "Tecnologia · Tendência em Portugal", name: "#ReactJS", tweets: "124K tweets" },
    { category: "Web Development · Tendência", name: "#NodeJS", tweets: "89.5K tweets" },
    { category: "Educação · Tendência", name: "Universidade de Aveiro", tweets: "12.3K tweets" },
    { category: "Design · Tendência", name: "Glassmorphism", tweets: "4.8K tweets" },
    { category: "Bases de Dados · Tendência", name: "#Sequelize", tweets: "2.1K tweets" }
  ];

  return (
    <aside className="widgets-container">
      {/* Search Input */}
      <div className="search-bar">
        <Search size={18} />
        <input
          type="text"
          placeholder="Procurar no XClone"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Quem Seguir Widget */}
      <div className="widget-box">
        <h2 className="widget-title">Quem seguir</h2>
        {suggestions.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
            Sem sugestões adicionais de momento.
          </p>
        ) : (
          suggestions.map((userSuggestion) => (
            <div key={userSuggestion.user_id} className="suggestion-item">
              <div
                className="profile-avatar"
                style={{ cursor: "pointer" }}
                onClick={() => setCurrentPage(`profile_${userSuggestion.username}`)}
              >
                {userSuggestion.username.slice(0, 2)}
              </div>
              <div
                className="suggestion-info"
                style={{ cursor: "pointer" }}
                onClick={() => setCurrentPage(`profile_${userSuggestion.username}`)}
              >
                <div className="suggestion-name">{userSuggestion.username}</div>
                <div className="suggestion-username">@{userSuggestion.username}</div>
              </div>
              <button
                className={`suggestion-btn ${userSuggestion.isFollowing ? "following" : ""}`}
                onClick={() => handleFollow(userSuggestion.user_id, userSuggestion.isFollowing)}
              >
                {userSuggestion.isFollowing ? "A seguir" : "Seguir"}
              </button>
            </div>
          ))
        )}
      </div>

      {/* Tendências Widget */}
      <div className="widget-box">
        <h2 className="widget-title">Tendências para si</h2>
        {trends.map((trend, idx) => (
          <div key={idx} className="widget-item" style={{ flexDirection: "column", alignItems: "flex-start", gap: "2px" }}>
            <span className="widget-trend-cat">{trend.category}</span>
            <span className="widget-trend-name">{trend.name}</span>
            <span className="widget-trend-tweets">{trend.tweets}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}
