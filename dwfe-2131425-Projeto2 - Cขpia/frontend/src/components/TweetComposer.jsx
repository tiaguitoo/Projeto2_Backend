import React, { useState, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Image, X, ImageOff } from "lucide-react";

export default function TweetComposer({
  placeholder = "O que está a acontecer?",
  replyToTweetId = null,
  onTweetCreated
}) {
  const { user, fetchWithAuth } = useAuth();
  const [content, setContent] = useState("");
  const [attachment, setAttachment] = useState(null); // Base64 string
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const handleTextChange = (e) => {
    setContent(e.target.value);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (limit to 4MB for safe transfer)
      if (file.size > 4 * 1024 * 1024) {
        alert("A imagem não pode exceder 4MB.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachment(reader.result); // base64 string
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (content.trim().length === 0 || content.length > 280 || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetchWithAuth("/tweets", {
        method: "POST",
        body: {
          content,
          reply_to_tweet_id: replyToTweetId,
          attachment_url: attachment // Seta o base64 para a base de dados
        }
      });

      if (res.ok) {
        const newTweet = await res.json();
        setContent("");
        setAttachment(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        if (onTweetCreated) {
          onTweetCreated(newTweet);
        }
      } else {
        const errorData = await res.json();
        alert(`Erro: ${errorData.error || "Não foi possível enviar o tweet."}`);
      }
    } catch (err) {
      console.error("Composer submission error:", err);
      alert("Erro de ligação ao servidor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const charCount = content.length;
  const remaining = 280 - charCount;
  const isOverLimit = remaining < 0;
  const counterClass =
    remaining <= 20
      ? remaining <= 0
        ? "composer-character-counter danger"
        : "composer-character-counter warning"
      : "composer-character-counter";

  if (!user) return null;

  return (
    <div className="composer-container">
      {/* User Avatar */}
      <div className="profile-avatar">{user.username.slice(0, 2)}</div>

      <div className="composer-main">
        <form onSubmit={handleSubmit}>
          <textarea
            className="composer-input"
            placeholder={placeholder}
            value={content}
            onChange={handleTextChange}
            disabled={isSubmitting}
          />

          {/* Attachment Preview */}
          {attachment && (
            <div className="composer-attachment-preview">
              <img src={attachment} alt="Anexo" />
              <button
                type="button"
                className="remove-attachment-btn"
                onClick={removeAttachment}
                title="Remover Imagem"
              >
                <ImageOff size={18} />
              </button>
            </div>
          )}

          {/* Composer Footer Actions */}
          <div className="composer-footer">
            <div className="composer-tools">
              <button
                type="button"
                className="composer-icon-btn"
                onClick={() => fileInputRef.current?.click()}
                title="Adicionar Foto"
                disabled={isSubmitting}
              >
                <Image size={20} />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                style={{ display: "none" }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              {charCount > 0 && (
                <span className={counterClass}>{remaining}</span>
              )}
              <button
                type="submit"
                className="composer-submit-btn"
                disabled={content.trim().length === 0 || isOverLimit || isSubmitting}
              >
                {isSubmitting ? "A enviar..." : replyToTweetId ? "Responder" : "Tweetar"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
