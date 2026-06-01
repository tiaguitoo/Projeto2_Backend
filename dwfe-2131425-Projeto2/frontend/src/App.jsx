import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";
import Sidebar from "./components/Sidebar";
import Widgets from "./components/Widgets";
import LandingPage from "./pages/LandingPage";
import Feed from "./pages/Feed";
import Profile from "./pages/Profile";
import Backoffice from "./pages/Backoffice";
import TweetDetail from "./pages/TweetDetail";
import { X, Check } from "lucide-react";

function AppContent() {
  const { user } = useAuth();
  const { background, setBackground, accent, setAccent } = useTheme();
  
  // SPA Routing state
  const [currentPage, setCurrentPage] = useState("feed");
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  
  // Widget refresh state
  const [widgetRefreshTrigger, setWidgetRefreshTrigger] = useState(0);

  const triggerWidgetRefresh = () => {
    setWidgetRefreshTrigger((prev) => prev + 1);
  };

  // Security redirect: Ensure only admins can stay on the backoffice page
  useEffect(() => {
    if (user && user.role !== "admin" && currentPage === "backoffice") {
      setCurrentPage("feed");
    }
  }, [user, currentPage]);

  // Render Page Content based on route state
  const renderPage = () => {
    if (currentPage === "feed") {
      return (
        <Feed
          setCurrentPage={setCurrentPage}
          onTriggerWidgetRefresh={triggerWidgetRefresh}
        />
      );
    }
    
    if (currentPage.startsWith("profile_")) {
      const username = currentPage.replace("profile_", "");
      return (
        <Profile
          username={username}
          setCurrentPage={setCurrentPage}
          onTriggerWidgetRefresh={triggerWidgetRefresh}
        />
      );
    }
    
    if (currentPage === "backoffice") {
      return <Backoffice />;
    }
    
    if (currentPage.startsWith("tweet-detail_")) {
      const tweetId = currentPage.replace("tweet-detail_", "");
      return (
        <TweetDetail
          tweetId={tweetId}
          setCurrentPage={setCurrentPage}
          onTriggerWidgetRefresh={triggerWidgetRefresh}
        />
      );
    }

    return (
      <div className="feed-container" style={{ padding: "20px" }}>
        <h2>Página não encontrada</h2>
        <button className="btn-primary" onClick={() => setCurrentPage("feed")}>
          Voltar para o Feed
        </button>
      </div>
    );
  };

  // If not logged in, render the Landing Portal
  if (!user) {
    return <LandingPage />;
  }

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        onOpenThemeModal={() => setThemeModalOpen(true)}
      />

      {/* Main Dynamic Content Column */}
      {renderPage()}

      {/* Right Column Widgets */}
      <Widgets
        setCurrentPage={setCurrentPage}
        refreshTrigger={widgetRefreshTrigger}
      />

      {/* Theme Customizer Modal */}
      {themeModalOpen && (
        <div 
          className="modal-overlay" 
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setThemeModalOpen(false);
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "600px", textAlign: "center" }}
          >
            <div className="modal-header">
              <span style={{ fontWeight: "800", fontSize: "20px" }}>
                Personalizar a sua vista
              </span>
              <button
                className="modal-close-btn"
                onClick={() => setThemeModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body" style={{ padding: "0 10px 20px 10px" }}>
              <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "24px" }}>
                Estas definições afetam todas as contas do XClone neste browser.
              </p>

              {/* Accent Colors selector */}
              <div style={{ marginBottom: "24px", textAlign: "left" }}>
                <span className="auth-label" style={{ fontSize: "14px", fontWeight: "700" }}>Cor de Destaque</span>
                <div className="theme-accent-row">
                  {[
                    { name: "blue", color: "#1d9bf0" },
                    { name: "yellow", color: "#ffd400" },
                    { name: "pink", color: "#f91880" },
                    { name: "purple", color: "#7856ff" },
                    { name: "orange", color: "#ff7a00" },
                    { name: "green", color: "#00ba7c" }
                  ].map((colorObj) => (
                    <button
                      key={colorObj.name}
                      type="button"
                      className="theme-accent-circle"
                      style={{ backgroundColor: colorObj.color }}
                      onClick={() => setAccent(colorObj.name)}
                      title={`Cor ${colorObj.name}`}
                    >
                      {accent === colorObj.name && <Check size={18} color="#fff" strokeWidth={3} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Background selector */}
              <div style={{ textAlign: "left", marginBottom: "24px" }}>
                <span className="auth-label" style={{ fontSize: "14px", fontWeight: "700" }}>Fundo</span>
                <div className="theme-bg-row">
                  {/* Light */}
                  <div
                    className={`theme-bg-card light ${background === "light" ? "active" : ""}`}
                    onClick={() => setBackground("light")}
                  >
                    <div className="theme-bg-card-radio">
                      {background === "light" && <div className="inner-check"></div>}
                    </div>
                    <span>Claro</span>
                  </div>

                  {/* Dim */}
                  <div
                    className={`theme-bg-card dim ${background === "dim" ? "active" : ""}`}
                    onClick={() => setBackground("dim")}
                  >
                    <div className="theme-bg-card-radio">
                      {background === "dim" && <div className="inner-check"></div>}
                    </div>
                    <span>Crepúsculo</span>
                  </div>

                  {/* Dark */}
                  <div
                    className={`theme-bg-card dark ${background === "dark" ? "active" : ""}`}
                    onClick={() => setBackground("dark")}
                  >
                    <div className="theme-bg-card-radio">
                      {background === "dark" && <div className="inner-check"></div>}
                    </div>
                    <span>Escuro</span>
                  </div>
                </div>
              </div>

              {/* Confirm Button */}
              <button
                className="btn-primary"
                style={{ width: "120px", margin: "10px auto 0 auto" }}
                onClick={() => setThemeModalOpen(false)}
              >
                Concluído
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  );
}
