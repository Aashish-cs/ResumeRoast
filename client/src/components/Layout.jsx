import { Flame, LogOut, Menu, UploadCloud, UserRound, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navClass = ({ isActive }) =>
  `rounded-md px-3 py-2 text-sm font-medium transition ${
    isActive
      ? "bg-zinc-950 text-white"
      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
  }`;

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const nav = (
    <>
      <NavLink to="/upload" className={navClass} onClick={() => setMobileOpen(false)}>
        Upload
      </NavLink>
      <NavLink to="/pricing" className={navClass} onClick={() => setMobileOpen(false)}>
        Pricing
      </NavLink>
      {user && (
        <NavLink
          to="/dashboard"
          className={navClass}
          onClick={() => setMobileOpen(false)}
        >
          Dashboard
        </NavLink>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-[#fafafa] text-zinc-950">
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 font-black tracking-tight">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-orange-600 text-white">
              <Flame className="h-5 w-5" />
            </span>
            <span>ResumeRoast</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">{nav}</nav>

          <div className="hidden items-center gap-2 md:flex">
            {user ? (
              <>
                <span className="inline-flex max-w-[180px] items-center gap-2 truncate rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-600">
                  <UserRound className="h-4 w-4 shrink-0" />
                  <span className="truncate">{user.email}</span>
                </span>
                <button className="button-secondary" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="button-secondary">
                  Login
                </Link>
                <Link to="/signup" className="button-primary">
                  <UploadCloud className="h-4 w-4" />
                  Start
                </Link>
              </>
            )}
          </div>

          <button
            className="button-secondary px-3 md:hidden"
            onClick={() => setMobileOpen((value) => !value)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="border-t border-zinc-200 bg-white px-4 py-3 md:hidden">
            <div className="flex flex-col gap-2">
              {nav}
              {user ? (
                <button className="button-secondary justify-start" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="button-secondary justify-start"
                    onClick={() => setMobileOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="button-primary justify-start"
                    onClick={() => setMobileOpen(false)}
                  >
                    <UploadCloud className="h-4 w-4" />
                    Start
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main>{children}</main>
    </div>
  );
};

export default Layout;
