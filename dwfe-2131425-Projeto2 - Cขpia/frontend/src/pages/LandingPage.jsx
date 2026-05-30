import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { X } from "lucide-react";

const XLogo = ({ size = 24, fill = "currentColor", ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={fill} {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export default function LandingPage() {
  const { login, register } = useAuth();
  const [modalType, setModalType] = useState(null); // 'login' | 'register' | null
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setUsername("");
    setEmail("");
    setPassword("");
    setError(null);
  };

  const handleOpenModal = (type) => {
    resetForm();
    setModalType(type);
  };

  const handleCloseModal = () => {
    setModalType(null);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Por favor, preencha todos os campos.");
      return;
    }
    setLoading(true);
    setError(null);
    const result = await login(username, password);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!username || !email || !password) {
      setError("Por favor, preencha todos os campos.");
      return;
    }
    if (username.length < 4 || username.length > 15) {
      setError("O nome de utilizador deve ter entre 4 e 15 caracteres.");
      return;
    }
    setLoading(true);
    setError(null);
    const result = await register(username, email, password);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
    }
  };

  return (
    <div className="landing-container">
      {/* Left decorative panel */}
      <div className="landing-left">
        <div className="landing-left-pattern"></div>
        <XLogo size={240} fill="#fff" />
      </div>

      {/* Right form panel */}
      <div className="landing-right">
        <div className="landing-content">
          <div className="landing-logo">
            <XLogo size={52} fill="var(--accent-color)" />
          </div>
          <h1 className="landing-title">O que está a acontecer agora</h1>
          <h2 className="landing-subtitle">Adira hoje ao XClone.</h2>

          <div className="landing-btn-group">
            <button
              className="btn-primary"
              onClick={() => handleOpenModal("register")}
            >
              Criar conta
            </button>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                color: "var(--text-muted)"
              }}
            >
              <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border-color)" }}></div>
              <span style={{ fontSize: "14px" }}>já tem conta?</span>
              <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border-color)" }}></div>
            </div>
            <button
              className="btn-secondary"
              onClick={() => handleOpenModal("login")}
            >
              Iniciar sessão
            </button>
          </div>
        </div>
      </div>

      {/* Login & Register Modals */}
      {modalType && (
        <div 
          className="modal-overlay" 
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) handleCloseModal();
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "450px" }}
          >
            <div className="modal-header">
              <XLogo size={28} fill="var(--accent-color)" />
              <button className="modal-close-btn" onClick={handleCloseModal}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <h2 style={{ fontSize: "28px", fontWeight: "800", marginBottom: "20px" }}>
                {modalType === "login"
                  ? "Inicie sessão no XClone"
                  : "Crie a sua conta XClone"}
              </h2>

              <form
                className="auth-form"
                onSubmit={
                  modalType === "login" ? handleLoginSubmit : handleRegisterSubmit
                }
              >
                {/* Error Banner */}
                {error && <div className="auth-error">{error}</div>}

                {/* Fields */}
                <div className="auth-input-group">
                  <label className="auth-label">
                    {modalType === "login"
                      ? "Nome de utilizador ou Email"
                      : "Nome de utilizador (mín. 4 caract.)"}
                  </label>
                  <input
                    type="text"
                    className="auth-input"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={
                      modalType === "login" ? "Ex: joao_silva ou joao@x.com" : "Ex: joao_silva"
                    }
                    autoFocus
                    required
                  />
                </div>

                {modalType === "register" && (
                  <div className="auth-input-group">
                    <label className="auth-label">Endereço de E-mail</label>
                    <input
                      type="email"
                      className="auth-input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Ex: joao@x.com"
                      required
                    />
                  </div>
                )}

                <div className="auth-input-group">
                  <label className="auth-label">Palavra-passe</label>
                  <input
                    type="password"
                    className="auth-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  style={{ marginTop: "12px", width: "100%" }}
                  disabled={loading}
                >
                  {loading
                    ? "A processar..."
                    : modalType === "login"
                    ? "Iniciar sessão"
                    : "Registar conta"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
