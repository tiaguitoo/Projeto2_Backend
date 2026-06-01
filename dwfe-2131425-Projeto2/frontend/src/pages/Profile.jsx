import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import TweetCard from "../components/TweetCard";
import { Calendar, ArrowLeft, X } from "lucide-react";

export default function Profile({ username, setCurrentPage, onTriggerWidgetRefresh }) {
  const { user: currentUser, fetchWithAuth } = useAuth();
  const [profileUser, setProfileUser] = useState(null);
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Follows modal state
  const [modalType, setModalType] = useState(null); // 'followers' | 'following'
  const [modalUsers, setModalUsers] = useState([]);
  const [isModalLoading, setIsModalLoading] = useState(false);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(`/users/profile/${username}`);
      if (res.ok) {
        const data = await res.json();
        setProfileUser(data.profile);
        setTweets(data.tweets);
      } else {
        console.error("Failed to load profile");
      }
    } catch (err) {
      console.error("Error loading profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [username]);

  const handleFollowToggle = async () => {
    if (!profileUser) return;
    try {
      const method = profileUser.isFollowing ? "DELETE" : "POST";
      const res = await fetchWithAuth(`/users/${profileUser.user_id}/follow`, { method });
      if (res.ok) {
        // Toggle locally
        setProfileUser((prev) => ({
          ...prev,
          isFollowing: !prev.isFollowing,
          followersCount: prev.isFollowing ? prev.followersCount - 1 : prev.followersCount + 1
        }));
        if (onTriggerWidgetRefresh) {
          onTriggerWidgetRefresh();
        }
      }
    } catch (err) {
      console.error("Error toggling follow:", err);
    }
  };

  const handleTweetDeleted = (deletedTweetId) => {
    setTweets((prev) => prev.filter((t) => t.tweet_id !== deletedTweetId));
    if (onTriggerWidgetRefresh) {
      onTriggerWidgetRefresh();
    }
  };

  const handleTweetUpdated = (updatedTweet) => {
    setTweets((prev) =>
      prev.map((t) => (t.tweet_id === updatedTweet.tweet_id ? updatedTweet : t))
    );
  };

  const openFollowsModal = async (type) => {
    if (!profileUser) return;
    setModalType(type);
    setIsModalLoading(true);
    setModalUsers([]);
    try {
      const res = await fetchWithAuth(`/users/${profileUser.user_id}/${type}`);
      if (res.ok) {
        const data = await res.json();
        setModalUsers(data);
      }
    } catch (error) {
      console.error(`Error loading ${type}:`, error);
    } finally {
      setIsModalLoading(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("pt-PT", {
        month: "long",
        year: "numeric"
      });
    } catch (e) {
      return "";
    }
  };

  if (loading) {
    return (
      <div className="feed-container" style={{ justifyContent: "center", alignItems: "center" }}>
        <span style={{ color: "var(--text-muted)" }}>A carregar perfil...</span>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="feed-container" style={{ padding: "20px" }}>
        <button
          onClick={() => setCurrentPage("feed")}
          style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--accent-color)", cursor: "pointer", fontWeight: "700", marginBottom: "20px" }}
        >
          <ArrowLeft size={18} /> Voltar à página inicial
        </button>
        <div style={{ textAlign: "center", color: "var(--text-muted)", marginTop: "40px" }}>
          Utilizador não encontrado.
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser && currentUser.username === profileUser.username;

  return (
    <div className="feed-container">
      {/* Header with back button */}
      <header className="feed-header" style={{ gap: "24px" }}>
        <button
          onClick={() => setCurrentPage("feed")}
          style={{ cursor: "pointer", color: "var(--text-color)" }}
          title="Voltar"
        >
          <ArrowLeft size={20} />
        </button>
        <div style={{ display: "flex", flexDirection: "column", textAlign: "left", lineHeight: "1.2" }}>
          <span style={{ fontWeight: "800", fontSize: "19px" }}>{profileUser.username}</span>
          <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: "400" }}>
            {tweets.length} tweets
          </span>
        </div>
      </header>

      {/* Banner & Avatar */}
      <div className="profile-banner">
        <div className="profile-avatar-large">
          {profileUser.username.slice(0, 2)}
        </div>
      </div>

      {/* Profile Action Bar */}
      <div className="profile-action-bar">
        {isOwnProfile ? (
          <button className="profile-btn" style={{ visibility: "hidden" }}>
            Editar perfil
          </button>
        ) : (
          <button
            className={`profile-btn ${profileUser.isFollowing ? "suggestion-btn following" : "suggestion-btn"}`}
            onClick={handleFollowToggle}
          >
            {profileUser.isFollowing ? "A seguir" : "Seguir"}
          </button>
        )}
      </div>

      {/* User Details */}
      <div className="profile-details">
        <div className="profile-details-name">{profileUser.username}</div>
        <div className="profile-details-username">@{profileUser.username}</div>

        <div className="profile-metadata">
          <div className="profile-metadata-item">
            <Calendar size={16} />
            <span>Aderiu em {formatDate(profileUser.created_at)}</span>
          </div>
        </div>

        <div className="profile-stats">
          <div 
            style={{ cursor: "pointer" }} 
            onClick={() => openFollowsModal("following")}
            onMouseEnter={(e) => e.currentTarget.style.textDecoration = "underline"}
            onMouseLeave={(e) => e.currentTarget.style.textDecoration = "none"}
          >
            <span className="profile-stat-count">{profileUser.followingCount || 0}</span>
            <span className="profile-stat-label"> A seguir</span>
          </div>
          <div 
            style={{ cursor: "pointer" }} 
            onClick={() => openFollowsModal("followers")}
            onMouseEnter={(e) => e.currentTarget.style.textDecoration = "underline"}
            onMouseLeave={(e) => e.currentTarget.style.textDecoration = "none"}
          >
            <span className="profile-stat-count">{profileUser.followersCount || 0}</span>
            <span className="profile-stat-label"> Seguidores</span>
          </div>
        </div>
      </div>

      {/* Tabs Title */}
      <div className="feed-tabs" style={{ borderBottom: "1px solid var(--border-color)" }}>
        <div className="feed-tab active" style={{ cursor: "default" }}>
          Tweets
        </div>
      </div>

      {/* Profile Tweets List */}
      <div style={{ flex: 1 }}>
        {tweets.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", fontSize: "14px" }}>
            Este utilizador ainda não publicou nenhum tweet.
          </div>
        ) : (
          tweets.map((tweet) => (
            <TweetCard
              key={tweet.tweet_id}
              tweet={{ ...tweet, user: profileUser }}
              onTweetDeleted={handleTweetDeleted}
              onTweetUpdated={handleTweetUpdated}
              setCurrentPage={setCurrentPage}
            />
          ))
        )}
      </div>

      {/* Follows Modal */}
      {modalType && (
        <div 
          className="modal-overlay" 
          onClick={() => setModalType(null)}
          style={{ zIndex: 9999 }}
        >
          <div 
            className="modal-content" 
            onClick={(e) => e.stopPropagation()} 
            style={{ maxWidth: "450px", minHeight: "450px", display: "flex", flexDirection: "column" }}
          >
            <div className="modal-header">
              <span style={{ fontWeight: "800", fontSize: "18px" }}>
                {modalType === "followers" ? "Seguidores" : "A Seguir"}
              </span>
              <button className="modal-close-btn" onClick={() => setModalType(null)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body" style={{ flex: 1, padding: "8px 0", overflowY: "auto" }}>
              {isModalLoading ? (
                <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>A carregar...</div>
              ) : modalUsers.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
                  A lista está vazia.
                </div>
              ) : (
                modalUsers.map(u => (
                  <div 
                    key={u.user_id} 
                    className="suggestion-item" 
                    style={{ borderBottom: "1px solid var(--border-color)", padding: "16px", cursor: "pointer" }}
                    onClick={() => {
                      setModalType(null);
                      setCurrentPage(`profile_${u.username}`);
                    }}
                  >
                    <div className="profile-avatar">{u.username.slice(0, 2)}</div>
                    <div className="suggestion-info" style={{ marginLeft: "12px" }}>
                      <div className="suggestion-name">{u.username}</div>
                      <div className="suggestion-username">@{u.username}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
