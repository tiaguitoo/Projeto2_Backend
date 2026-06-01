import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Heart, MessageCircle, Trash2, X } from "lucide-react";

export default function TweetCard({ tweet, onTweetDeleted, onTweetUpdated, setCurrentPage }) {
  const { user, fetchWithAuth } = useAuth();
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const handleLike = async (e) => {
    e.stopPropagation(); // Avoid triggering card navigation click
    try {
      const method = tweet.isLiked ? "DELETE" : "POST";
      const res = await fetchWithAuth(`/tweets/${tweet.tweet_id}/like`, { method });
      if (res.ok) {
        const updatedTweet = {
          ...tweet,
          isLiked: !tweet.isLiked,
          likesCount: tweet.isLiked ? tweet.likesCount - 1 : tweet.likesCount + 1
        };
        if (onTweetUpdated) {
          onTweetUpdated(updatedTweet);
        }
      }
    } catch (err) {
      console.error("Like toggle error:", err);
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation(); // Avoid triggering card navigation click
    if (!window.confirm("Tem a certeza que deseja eliminar este tweet?")) {
      return;
    }

    try {
      const res = await fetchWithAuth(`/tweets/${tweet.tweet_id}`, { method: "DELETE" });
      if (res.ok) {
        if (onTweetDeleted) {
          onTweetDeleted(tweet.tweet_id);
        }
      } else {
        const errorData = await res.json();
        alert(`Erro: ${errorData.error || "Não foi possível eliminar o tweet."}`);
      }
    } catch (err) {
      console.error("Delete tweet error:", err);
    }
  };

  const handleCardClick = () => {
    setCurrentPage(`tweet-detail_${tweet.tweet_id}`);
  };

  // Human-readable date formatting
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("pt-PT", {
        day: "numeric",
        month: "short"
      });
    } catch (e) {
      return "";
    }
  };

  const formatFullDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString("pt-PT", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (e) {
      return "";
    }
  };

  // Determine permissions for delete button
  const canDelete = user && (user.user_id === tweet.user_id || user.role === "admin");

  return (
    <div className="tweet-card" onClick={handleCardClick}>
      {/* Author avatar column */}
      <div
        className="profile-avatar"
        onClick={(e) => {
          e.stopPropagation();
          setCurrentPage(`profile_${tweet.user?.username || "user"}`);
        }}
      >
        {(tweet.user?.username || "US").slice(0, 2)}
      </div>

      {/* Main Tweet Body column */}
      <div className="tweet-main">
        <div className="tweet-header">
          <span
            className="tweet-author-name"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentPage(`profile_${tweet.user?.username || "user"}`);
            }}
          >
            {tweet.user?.username || "Utilizador"}
          </span>
          <span className="tweet-author-username">
            @{tweet.user?.username || "user"}
          </span>
          <span className="tweet-timestamp" title={formatFullDate(tweet.created_at)}>
            {formatDate(tweet.created_at)}
          </span>
        </div>

        {/* Replying indicator */}
        {tweet.reply_to_tweet_id && tweet.parentTweet?.user && (
          <div 
            style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "4px", cursor: "pointer", display: "inline-block" }}
            onClick={(e) => {
              e.stopPropagation();
              setCurrentPage(`tweet-detail_${tweet.reply_to_tweet_id}`);
            }}
            title="Ver tweet original"
          >
            A responder a <span style={{ color: "var(--accent-color)" }}>@{tweet.parentTweet.user.username}</span>
          </div>
        )}

        {/* Content */}
        <div className="tweet-content">{tweet.content}</div>

        {/* Attachment image */}
        {tweet.attachment_url && (
          <div 
            className="tweet-attachment"
            onClick={(e) => {
              e.stopPropagation();
              setIsImageModalOpen(true);
            }}
            style={{ cursor: "pointer" }}
            title="Expandir imagem"
          >
            <img src={tweet.attachment_url} alt="Tweet media" loading="lazy" />
          </div>
        )}

        {/* Action icons bar */}
        <div className="tweet-actions">
          {/* Comment icon button */}
          <button
            className="tweet-action-btn comment"
            onClick={handleCardClick}
            title="Responder"
          >
            <MessageCircle size={18} />
            <span>{tweet.repliesCount || 0}</span>
          </button>

          {/* Like icon button */}
          <button
            className={`tweet-action-btn like ${tweet.isLiked ? "active" : ""}`}
            onClick={handleLike}
            title={tweet.isLiked ? "Retirar Gostei" : "Gostar"}
          >
            <Heart size={18} />
            <span>{tweet.likesCount || 0}</span>
          </button>

          {/* Delete icon button (only visible to owner or admin) */}
          {canDelete ? (
            <button
              className="tweet-action-btn delete"
              onClick={handleDelete}
              title="Eliminar Tweet"
            >
              <Trash2 size={18} />
            </button>
          ) : (
            <div style={{ width: "30px" }}></div> /* spacing aligner */
          )}
        </div>
      </div>

      {/* Image Modal */}
      {isImageModalOpen && (
        <div 
          className="modal-overlay" 
          style={{ zIndex: 9999, cursor: "default" }}
          onMouseDown={(e) => {
            e.stopPropagation();
            if (e.target === e.currentTarget) setIsImageModalOpen(false);
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsImageModalOpen(false);
              }}
              style={{ position: "absolute", top: "-40px", right: "0", background: "none", border: "none", color: "white", cursor: "pointer", padding: "8px" }}
              title="Fechar"
            >
              <X size={28} />
            </button>
            <img 
              src={tweet.attachment_url} 
              alt="Expanded media" 
              style={{ maxWidth: "100%", maxHeight: "90vh", objectFit: "contain", borderRadius: "8px" }} 
            />
          </div>
        </div>
      )}
    </div>
  );
}
