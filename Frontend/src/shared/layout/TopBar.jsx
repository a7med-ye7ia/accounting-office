import { Menu, Sun, Moon, Bell } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import useSidebar from "../hooks/useSidebar";
import { useTheme } from "../../context/ThemeContext.jsx";
import { useEffect, useState } from "react";
import { fetchNotifications, markNotificationAsRead} from "../../api/notification";

function TopBar() {
  const { toggle, isOpen, isDesktop } = useSidebar();
  const showNavMenu = !isDesktop;
  const { theme, toggleTheme } = useTheme();
  const [currentUser, setCurrentUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const user = localStorage.getItem('user');
    // console.log(JSON.parse(user));
    try {
      setCurrentUser(user ? JSON.parse(user) : null);
    } catch (e) {
      setCurrentUser(null);
    }
  }, []);

  useEffect(() => {
    const fetchForUser = async () => {
      if (!currentUser || !currentUser.id) return;
      try {
        const data = await fetchNotifications(currentUser.id);
        console.log('Fetched notifications:', data);
        setNotifications(Array.isArray(data) ? data : []);
        setUnreadCount(data.filter(n => !n.read).length);
      } catch (err) {
        console.error('Failed to load notifications', err);
      }
    };

    fetchForUser();
  }, [currentUser]);

  const navigate = useNavigate();
  const handleNotificationClick = (notificationId) => {
    markNotificationAsRead(notificationId);
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));

    // Navigate to the notification detail page or perform any other action
    const notification = notifications.find(n => n.id === notificationId);
    const handleEmpAction = () => {
      navigate("/EmployeeTasks", {
        state: {
          openTaskId: notification.referenceId
        }
      });
    };

    const handleOwnerAction = () => {
      navigate(`/profile/${currentUser.id}`, {
        state: {
          openTaskId: notification.referenceId
        }
      });
    };

    if (!notification) return;
    if (notification.type === 'TASK_ASSIGNED') {
      console.log("yyyyyyyyyyyyyyyyyy");
        handleEmpAction();
    }

    if (notification.type === 'COMMENT_ADDED') {
      console.log("xxxxxxxxxxxxx", currentUser);
      if (currentUser && currentUser.roleName === 'owner') {
        handleOwnerAction();
      }

      if (currentUser && currentUser.roleName === 'employee') {
        handleEmpAction();
      }
    }
  }

  return (
    <header className="z-30 shrink-0 border-b border-appBorder bg-appSurface/70 backdrop-blur-2xl backdrop-saturate-150">
      <div className="flex h-[4.25rem] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-3 lg:gap-4">
          {showNavMenu && (
            <button
              type="button"
              onClick={toggle}
              aria-expanded={isOpen}
              aria-controls="app-sidebar"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-appBorder bg-appMuted/80 text-appText ui-transition hover:border-brand/40 hover:bg-brand/10 hover:text-brand active:scale-95"
              aria-label={isOpen ? "إغلاق القائمة" : "فتح القائمة"}
            >
              <Menu size={20} />
            </button>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="hidden h-9 w-px bg-appBorder sm:block" aria-hidden />

          <div className="flex items-center gap-1 rounded-2xl border border-appBorder bg-appMuted/50 p-1 sm:p-1.5">
            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-appSubtext ui-transition hover:bg-appSurface hover:text-brand hover:shadow-sm"
              title={theme === "dark" ? "الوضع الفاتح" : "الوضع الداكن"}
              aria-label={theme === "dark" ? "تفعيل الوضع الفاتح" : "تفعيل الوضع الداكن"}
            >
              {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
            </button>

          </div>

          <div className="flex items-center gap-3 border-s border-appBorder ps-3 sm:ps-4">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifications(v => !v)}
                className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-appBorder bg-appMuted/70 text-appText ui-transition hover:border-brand/40 hover:bg-brand/10 hover:text-brand active:scale-95"
                aria-label="إشعارات"
                title="الإشعارات"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-semibold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute left-0 z-40 mt-2 w-80 rounded-lg border border-appBorder bg-appSurface p-2 shadow-lg">
                  <div className="max-h-64 overflow-auto">
                    {notifications.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-appSubtext">لا توجد إشعارات</div>
                    ) : (
                      notifications.map((n, idx) => (
                        <div key={n.id || idx} className="rounded-md px-3 py-2 hover:bg-appMuted/60" onClick={() => handleNotificationClick(n.id)}>
                          <div className="text-sm font-semibold text-appText truncate">{n.title}</div>
                          {n.message && <div className="mt-1 text-xs text-appSubtext truncate">{n.message}</div>}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <span className="hidden max-w-[8rem] truncate text-xs font-semibold text-appText md:block">
              {currentUser ? currentUser.fullName : "اسم المستخدم"}
            </span>
            <Link
              to={`/profile/${currentUser ? currentUser.id : ""}`}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-appBorder bg-gradient-to-br from-brand/20 to-brandDeep/10 text-sm font-bold text-brand shadow-sm ui-transition hover:border-brand/50 hover:from-brand/30 hover:shadow-panel active:scale-95"
            >
              {currentUser ? (currentUser.fullName.charAt(0) + " " + currentUser.fullName.split(" ").pop().charAt(0)): "U"}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

export default TopBar;
