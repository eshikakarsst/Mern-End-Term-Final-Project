import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotificationMenu from "./NotificationMenu";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch {
      navigate("/login");
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-[#eaecf2] bg-white/90 backdrop-blur-xl">
      <nav className="mx-auto flex h-[68px] w-full max-w-[1120px] items-center justify-between px-5 sm:px-7" aria-label="Main navigation">
        <Link to={user ? "/groups" : "/login"} className="focus-ring flex items-center gap-3 rounded-lg">
          <span className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-[#5865d8] font-bold text-white shadow-[0_5px_12px_rgba(88,101,216,.25)]">S</span>
          <span>
            <span className="block font-bold tracking-[-.03em] text-[#252a35]">StudySync</span>
            <span className="hidden text-[11px] text-[#9197a5] sm:block">Make study time count</span>
          </span>
        </Link>
        {user ? (
          <div className="flex items-center gap-3 sm:gap-5">
            <NotificationMenu />
            <span className="hidden h-8 w-px bg-[#eceef3] sm:block" aria-hidden="true" />
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ececff] text-sm font-bold text-[#5865d8]" aria-label={`${user.name}'s profile`}>
              {user.name?.trim().charAt(0).toUpperCase() || "S"}
            </div>
            <span className="hidden max-w-32 truncate text-sm font-semibold text-[#3d4351] sm:block">{user.name}</span>
            <button type="button" onClick={handleLogout} className="focus-ring rounded-lg border border-[#e6e8ef] px-3 py-2 text-xs font-semibold text-[#626a7b] transition hover:border-[#d3d7e2] hover:bg-[#f7f8fb] sm:px-4 sm:text-sm">
              Sign out
            </button>
          </div>
        ) : (
          <Link to="/login" className="primary-button focus-ring min-h-10">Sign in</Link>
        )}
      </nav>
      {user && <div className="border-t border-[#f1f2f6]">
        <nav className="mx-auto flex w-full max-w-[1120px] gap-1 overflow-x-auto px-5 py-2 sm:px-7" aria-label="Workspace navigation">
          {[["/groups", "Groups"], ["/planner", "My planner"], ["/calendar", "Calendar"], ["/focus", "Focus timer"]].map(([to, label]) => <Link key={to} to={to} className="focus-ring shrink-0 rounded-lg px-3 py-2 text-xs font-semibold text-[#737b8c] transition hover:bg-[#f4f5fb] hover:text-[#5865d8] sm:text-sm">{label}</Link>)}
        </nav>
      </div>}
    </header>
  );
}
