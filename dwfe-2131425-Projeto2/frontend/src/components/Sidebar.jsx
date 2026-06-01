import React from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  Home,
  User,
  Shield,
  Palette,
  LogOut
} from "lucide-react";

const XLogo = ({ size = 24, fill = "currentColor", ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={fill} {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export default function Sidebar({ currentPage, setCurrentPage, onOpenThemeModal }) {
  const { user, logout } = useAuth();

  if (!user) return null;

  const navItems = [
    { id: "feed", label: "Página Inicial", icon: Home },
    { id: "profile", label: "Perfil", icon: User, value: user.username },
    ...(user.role === "admin"
      ? [{ id: "backoffice", label: "Backoffice", icon: Shield }]
      : [])
  ];

  const handleNavClick = (item) => {
    if (item.id === "profile") {
      setCurrentPage(`profile_${item.value}`);
    } else {
      setCurrentPage(item.id);
    }
  };

  return (
    <aside className="sidebar">
      <div>
        {/* Brand Logo */}
        <div className="logo-container" onClick={() => setCurrentPage("feed")}>
          <XLogo size={32} fill="var(--accent-color)" />
        </div>

        {/* Navigation Menu */}
        <nav className="nav-links">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              currentPage === item.id ||
              (item.id === "profile" && currentPage.startsWith("profile_"));

            return (
              <div
                key={item.id}
                className={`nav-item ${isActive ? "active" : ""}`}
                onClick={() => handleNavClick(item)}
              >
                <Icon size={26} strokeWidth={isActive ? 2.5 : 2} />
                <span>{item.label}</span>
              </div>
            );
          })}

          {/* Theme customizer button */}
          <div className="nav-item" onClick={onOpenThemeModal}>
            <Palette size={26} strokeWidth={2} />
            <span>Personalizar</span>
          </div>
        </nav>

        {/* Action Button */}
        <button
          className="sidebar-tweet-btn"
          onClick={() => {
            // Trigger tweet focus or open a modal
            const composer = document.querySelector(".composer-input");
            if (composer) {
              composer.focus();
            }
          }}
        >
          <span>Tweetar</span>
        </button>
      </div>

      {/* User profile details & Logout */}
      <div>
        <div className="sidebar-profile">
          <div
            className="profile-avatar"
            onClick={() => setCurrentPage(`profile_${user.username}`)}
          >
            {user.username.slice(0, 2)}
          </div>
          <div
            className="profile-info"
            onClick={() => setCurrentPage(`profile_${user.username}`)}
          >
            <div className="profile-name">{user.username}</div>
            <div className="profile-username">@{user.username}</div>
          </div>
          <button
            className="btn-icon-action"
            title="Terminar Sessão"
            onClick={logout}
            style={{ marginLeft: "8px" }}
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </aside>
  );
}
