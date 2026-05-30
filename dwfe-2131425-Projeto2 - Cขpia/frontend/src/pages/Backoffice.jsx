import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Edit2, Trash2, X, Shield, MessageSquare, Users, ImageOff } from "lucide-react";

export default function Backoffice() {
  const { fetchWithAuth, user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("users"); // 'users' | 'tweets'
  const [users, setUsers] = useState([]);
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals editing states
  const [editingUser, setEditingUser] = useState(null);
  const [editUsername, setEditUsername] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState("user");
  const [editPassword, setEditPassword] = useState("");

  const [editingTweet, setEditingTweet] = useState(null);
  const [editTweetContent, setEditTweetContent] = useState("");

  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === "users") {
        const res = await fetchWithAuth("/admin/users");
        if (res.ok) {
          const data = await res.json();
          setUsers(data);
        } else {
          setError("Erro ao carregar lista de utilizadores.");
        }
      } else {
        const res = await fetchWithAuth("/admin/tweets");
        if (res.ok) {
          const data = await res.json();
          setTweets(data);
        } else {
          setError("Erro ao carregar lista de tweets.");
        }
      }
    } catch (err) {
      console.error("Backoffice load error:", err);
      setError("Erro de ligação ao servidor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  // Actions for Users
  const handleEditUserClick = (user) => {
    setEditingUser(user);
    setEditUsername(user.username);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditPassword("");
  };

  const handleEditUserSubmit = async (e) => {
    e.preventDefault();
    if (!editUsername || !editEmail) return;
    try {
      const res = await fetchWithAuth(`/admin/users/${editingUser.user_id}`, {
        method: "PUT",
        body: {
          username: editUsername,
          email: editEmail,
          role: editRole,
          password: editPassword.trim() ? editPassword : undefined
        }
      });
      if (res.ok) {
        setEditingUser(null);
        loadData();
      } else {
        const errData = await res.json();
        alert(`Erro: ${errData.error}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (userId === currentUser.user_id) {
      alert("Não pode eliminar a sua própria conta de administrador.");
      return;
    }
    if (!window.confirm("Tem a certeza que deseja eliminar este utilizador e todos os seus tweets?")) {
      return;
    }
    try {
      const res = await fetchWithAuth(`/admin/users/${userId}`, { method: "DELETE" });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.user_id !== userId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Actions for Tweets
  const handleEditTweetClick = (tweet) => {
    setEditingTweet(tweet);
    setEditTweetContent(tweet.content);
  };

  const handleEditTweetSubmit = async (e) => {
    e.preventDefault();
    if (!editTweetContent.trim()) return;
    try {
      const res = await fetchWithAuth(`/admin/tweets/${editingTweet.tweet_id}`, {
        method: "PUT",
        body: { content: editTweetContent }
      });
      if (res.ok) {
        setEditingTweet(null);
        loadData();
      } else {
        const errData = await res.json();
        alert(`Erro: ${errData.error}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTweet = async (tweetId) => {
    if (!window.confirm("Tem a certeza que deseja eliminar este tweet?")) {
      return;
    }
    try {
      const res = await fetchWithAuth(`/admin/tweets/${tweetId}`, { method: "DELETE" });
      if (res.ok) {
        setTweets((prev) => prev.filter((t) => t.tweet_id !== tweetId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveTweetImage = async (tweetId) => {
    if (!window.confirm("Tem a certeza que deseja remover a imagem deste tweet?")) {
      return;
    }
    try {
      const res = await fetchWithAuth(`/admin/tweets/${tweetId}/image`, { method: "DELETE" });
      if (res.ok) {
        setTweets((prev) => prev.map((t) => t.tweet_id === tweetId ? { ...t, attachment_url: null } : t));
        setEditingTweet((prev) => prev && prev.tweet_id === tweetId ? { ...prev, attachment_url: null } : prev);
      } else {
        const errData = await res.json();
        alert(`Erro: ${errData.error}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <header className="admin-header">
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Shield size={32} className="accent-color" style={{ color: "var(--accent-color)" }} />
          <h1 style={{ fontSize: "24px", fontWeight: "800", color: "var(--text-color)" }}>
            Backoffice de Administração
          </h1>
        </div>
      </header>

      {/* KPI Metrics */}
      <div className="admin-metrics">
        <div className="metric-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="metric-title">Utilizadores</span>
            <Users size={20} style={{ color: "var(--text-muted)" }} />
          </div>
          <span className="metric-value">{activeTab === "users" ? users.length : "—"}</span>
        </div>
        <div className="metric-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="metric-title">Tweets Publicados</span>
            <MessageSquare size={20} style={{ color: "var(--text-muted)" }} />
          </div>
          <span className="metric-value">{activeTab === "tweets" ? tweets.length : "—"}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <div
          className={`admin-tab ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          Utilizadores
        </div>
        <div
          className={`admin-tab ${activeTab === "tweets" ? "active" : ""}`}
          onClick={() => setActiveTab("tweets")}
        >
          Tweets
        </div>
      </div>

      {/* Error Message */}
      {error && <div className="auth-error" style={{ padding: "0 16px" }}>{error}</div>}

      {/* Data tables */}
      <div className="admin-table-container">
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
            A carregar dados do painel...
          </div>
        ) : activeTab === "users" ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome de utilizador</th>
                <th>E-mail</th>
                <th>Nível / Role</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.user_id}>
                  <td>{user.user_id}</td>
                  <td style={{ fontWeight: "700" }}>@{user.username}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`admin-badge ${user.role}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="btn-icon-action edit"
                        onClick={() => handleEditUserClick(user)}
                        title="Editar utilizador"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="btn-icon-action delete"
                        onClick={() => handleDeleteUser(user.user_id)}
                        disabled={user.user_id === currentUser.user_id}
                        title="Eliminar utilizador"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Autor</th>
                <th>Conteúdo</th>
                <th>Gostos</th>
                <th>Respostas</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {tweets.map((tweet) => (
                <tr key={tweet.tweet_id}>
                  <td>{tweet.tweet_id}</td>
                  <td>@{tweet.user?.username || "user"}</td>
                  <td 
                    style={{ maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                    title={tweet.content}
                  >
                    {tweet.content}
                  </td>
                  <td>{tweet.likesCount || 0}</td>
                  <td>{tweet.repliesCount || 0}</td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="btn-icon-action edit"
                        onClick={() => handleEditTweetClick(tweet)}
                        title="Editar tweet"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="btn-icon-action delete"
                        onClick={() => handleDeleteTweet(tweet.tweet_id)}
                        title="Eliminar tweet"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="modal-overlay" onClick={() => setEditingUser(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "450px" }}>
            <div className="modal-header">
              <span style={{ fontWeight: "800", fontSize: "18px" }}>Editar Utilizador</span>
              <button className="modal-close-btn" onClick={() => setEditingUser(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <form className="auth-form" onSubmit={handleEditUserSubmit}>
                <div className="auth-input-group">
                  <label className="auth-label">Nome de utilizador</label>
                  <input
                    type="text"
                    className="auth-input"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="auth-input-group">
                  <label className="auth-label">Endereço de E-mail</label>
                  <input
                    type="email"
                    className="auth-input"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="auth-input-group">
                  <label className="auth-label">Role</label>
                  <select
                    className="auth-input"
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    style={{ appearance: "auto" }}
                  >
                    <option value="user">User (Comum)</option>
                    <option value="admin">Admin (Administrador)</option>
                  </select>
                </div>
                <div className="auth-input-group">
                  <label className="auth-label">Nova palavra-passe (opcional)</label>
                  <input
                    type="password"
                    className="auth-input"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Deixe em branco para manter"
                  />
                </div>
                <button type="submit" className="btn-primary" style={{ width: "100%", marginTop: "12px" }}>
                  Guardar Alterações
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Tweet Modal */}
      {editingTweet && (
        <div className="modal-overlay" onClick={() => setEditingTweet(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px" }}>
            <div className="modal-header">
              <span style={{ fontWeight: "800", fontSize: "18px" }}>Editar Tweet</span>
              <button className="modal-close-btn" onClick={() => setEditingTweet(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <form className="auth-form" onSubmit={handleEditTweetSubmit}>
                <div className="auth-input-group">
                  <label className="auth-label">Conteúdo do Tweet</label>
                  <textarea
                    className="auth-input"
                    value={editTweetContent}
                    onChange={(e) => setEditTweetContent(e.target.value)}
                    style={{ minHeight: "100px", resize: "vertical" }}
                    required
                  />
                </div>

                {editingTweet.attachment_url && (
                  <div className="auth-input-group" style={{ marginTop: "16px" }}>
                    <label className="auth-label">Imagem Anexada</label>
                    <div style={{ position: "relative", display: "inline-block", width: "100%" }}>
                      <img 
                        src={editingTweet.attachment_url} 
                        alt="Anexo" 
                        style={{ maxWidth: "100%", maxHeight: "200px", borderRadius: "8px", display: "block", border: "1px solid var(--border-color)", objectFit: "contain", background: "var(--bg-dim)" }} 
                      />
                      <button
                        type="button"
                        className="remove-attachment-btn"
                        onClick={() => handleRemoveTweetImage(editingTweet.tweet_id)}
                        title="Remover imagem"
                      >
                        <ImageOff size={18} />
                      </button>
                    </div>
                  </div>
                )}

                <button type="submit" className="btn-primary" style={{ width: "100%", marginTop: "24px" }}>
                  Guardar Tweet
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
