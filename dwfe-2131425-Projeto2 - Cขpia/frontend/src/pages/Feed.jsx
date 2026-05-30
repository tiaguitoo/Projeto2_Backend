import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import TweetComposer from "../components/TweetComposer";
import TweetCard from "../components/TweetCard";

export default function Feed({ setCurrentPage, onTriggerWidgetRefresh }) {
  const { fetchWithAuth } = useAuth();
  const [activeTab, setActiveTab] = useState("foryou"); // 'foryou' | 'following'
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadFeed = async () => {
    setLoading(true);
    try {
      const url = activeTab === "following" ? "/tweets?feed=following" : "/tweets";
      const res = await fetchWithAuth(url);
      if (res.ok) {
        const data = await res.json();
        setTweets(data);
      } else {
        console.error("Failed to load feed");
      }
    } catch (err) {
      console.error("Error loading feed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();
  }, [activeTab]);

  // Handle addition of a newly composed tweet to the top of feed state
  const handleTweetCreated = (newTweet) => {
    setTweets((prev) => [newTweet, ...prev]);
    if (onTriggerWidgetRefresh) {
      onTriggerWidgetRefresh(); // Refresh suggestions since trends/following changed
    }
  };

  // Handle deletions
  const handleTweetDeleted = (deletedTweetId) => {
    setTweets((prev) => prev.filter((t) => t.tweet_id !== deletedTweetId));
    if (onTriggerWidgetRefresh) {
      onTriggerWidgetRefresh();
    }
  };

  // Handle card modifications (likes updates)
  const handleTweetUpdated = (updatedTweet) => {
    setTweets((prev) =>
      prev.map((t) => (t.tweet_id === updatedTweet.tweet_id ? updatedTweet : t))
    );
  };

  return (
    <div className="feed-container">
      {/* Header Sticky */}
      <header className="feed-header">
        <span>Página Inicial</span>
      </header>

      {/* Tabs */}
      <div className="feed-tabs">
        <div
          className={`feed-tab ${activeTab === "foryou" ? "active" : ""}`}
          onClick={() => setActiveTab("foryou")}
        >
          Para si
        </div>
        <div
          className={`feed-tab ${activeTab === "following" ? "active" : ""}`}
          onClick={() => setActiveTab("following")}
        >
          Seguindo
        </div>
      </div>

      {/* Tweet Composer */}
      <TweetComposer onTweetCreated={handleTweetCreated} />

      {/* Tweets Feed List */}
      <div style={{ flex: 1 }}>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
            A carregar tweets...
          </div>
        ) : tweets.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", fontSize: "15px" }}>
            {activeTab === "following"
              ? "Ainda não segue ninguém que tenha publicado, ou as pessoas que segue não têm tweets. Siga utilizadores na barra lateral!"
              : "Sem tweets para apresentar de momento. Publique o primeiro!"}
          </div>
        ) : (
          tweets.map((tweet) => (
            <TweetCard
              key={tweet.tweet_id}
              tweet={tweet}
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
