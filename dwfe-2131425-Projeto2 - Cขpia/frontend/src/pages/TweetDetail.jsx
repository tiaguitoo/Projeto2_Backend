import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import TweetCard from "../components/TweetCard";
import TweetComposer from "../components/TweetComposer";
import { ArrowLeft } from "lucide-react";

export default function TweetDetail({ tweetId, setCurrentPage, onTriggerWidgetRefresh }) {
  const { fetchWithAuth } = useAuth();
  const [tweet, setTweet] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadTweetDetails = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(`/tweets/${tweetId}`);
      if (res.ok) {
        const data = await res.json();
        setTweet(data.tweet);
        setReplies(data.replies);
      } else {
        console.error("Failed to load tweet details");
      }
    } catch (err) {
      console.error("Error loading tweet details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTweetDetails();
  }, [tweetId]);

  const handleReplyCreated = (newReply) => {
    // Add the new reply to the top of the list
    setReplies((prev) => [newReply, ...prev]);
    
    // Increment repliesCount on parent tweet
    setTweet((prev) => ({
      ...prev,
      repliesCount: (prev.repliesCount || 0) + 1
    }));
    
    if (onTriggerWidgetRefresh) {
      onTriggerWidgetRefresh();
    }
  };

  const handleTweetDeleted = (deletedTweetId) => {
    if (deletedTweetId === parseInt(tweetId, 10)) {
      // If the parent tweet itself was deleted, return to home feed
      setCurrentPage("feed");
    } else {
      // If a comment was deleted, remove it from list
      setReplies((prev) => prev.filter((r) => r.tweet_id !== deletedTweetId));
      setTweet((prev) => ({
        ...prev,
        repliesCount: Math.max(0, (prev.repliesCount || 0) - 1)
      }));
    }
    if (onTriggerWidgetRefresh) {
      onTriggerWidgetRefresh();
    }
  };

  const handleTweetUpdated = (updatedTweet) => {
    if (updatedTweet.tweet_id === parseInt(tweetId, 10)) {
      setTweet(updatedTweet);
    } else {
      setReplies((prev) =>
        prev.map((r) => (r.tweet_id === updatedTweet.tweet_id ? updatedTweet : r))
      );
    }
  };

  if (loading) {
    return (
      <div className="feed-container" style={{ justifyContent: "center", alignItems: "center" }}>
        <span style={{ color: "var(--text-muted)" }}>A carregar conversa...</span>
      </div>
    );
  }

  if (!tweet) {
    return (
      <div className="feed-container" style={{ padding: "20px" }}>
        <button
          onClick={() => setCurrentPage("feed")}
          style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--accent-color)", cursor: "pointer", fontWeight: "700", marginBottom: "20px" }}
        >
          <ArrowLeft size={18} /> Voltar à Página Inicial
        </button>
        <div style={{ textAlign: "center", color: "var(--text-muted)", marginTop: "40px" }}>
          Este tweet já não existe ou foi removido.
        </div>
      </div>
    );
  }

  return (
    <div className="feed-container">
      {/* Header */}
      <header className="feed-header" style={{ gap: "24px" }}>
        <button
          onClick={() => setCurrentPage("feed")}
          style={{ cursor: "pointer", color: "var(--text-color)" }}
          title="Voltar"
        >
          <ArrowLeft size={20} />
        </button>
        <span style={{ fontWeight: "800", fontSize: "19px" }}>Post / Thread</span>
      </header>

      {/* Main parent tweet */}
      <TweetCard
        tweet={tweet}
        onTweetDeleted={handleTweetDeleted}
        onTweetUpdated={handleTweetUpdated}
        setCurrentPage={setCurrentPage}
      />

      {/* Reply Composer Area */}
      <div className="detail-composer-section">
        <TweetComposer
          placeholder="Publicar a sua resposta"
          replyToTweetId={tweet.tweet_id}
          onTweetCreated={handleReplyCreated}
        />
      </div>

      {/* Replies Thread list */}
      <div style={{ flex: 1 }}>
        {replies.length === 0 ? (
          <div style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)", fontSize: "14px" }}>
            Ainda sem respostas. Seja o primeiro a comentar!
          </div>
        ) : (
          replies.map((reply) => (
            <TweetCard
              key={reply.tweet_id}
              tweet={reply}
              onTweetDeleted={handleTweetDeleted}
              onTweetUpdated={handleTweetUpdated}
              setCurrentPage={setCurrentPage}
            />
          ))
        )}
      </div>
    </div>
  );
}
