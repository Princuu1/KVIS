import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Home, Calendar, History, MessageCircle, FileText, CalendarCheck, Moon, Sun, Bell, LogOut } from "lucide-react";

const navItems = [
  { id: 'home', path: '/', label: 'Home', icon: Home, mobileLabel: 'Home' },
  { id: 'attendance', path: '/attendance', label: 'Mark Attendance', icon: CalendarCheck, mobileLabel: 'Attend' },
  { id: 'history', path: '/history', label: 'Attendance History', icon: History, mobileLabel: 'History' },
  { id: 'chat', path: '/chat', label: 'Chat Room', icon: MessageCircle, mobileLabel: 'Chat' },
  { id: 'calendar', path: '/calendar', label: 'Calendar', icon: Calendar, mobileLabel: 'Calendar' },
  { id: 'exams', path: '/exams', label: 'Exam Schedule', icon: FileText, mobileLabel: 'Exams' },
];

export default function Nav() {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    if (newIsDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <>
      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 bg-card border-b border-border z-50 md:relative" data-testid="mobile-header">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <CalendarCheck className="w-4 h-4 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-semibold text-foreground">AttendanceApp</h1>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={toggleTheme}
              className="p-2 hover:bg-accent rounded-lg"
              data-testid="button-theme-toggle"
            >
              {isDark ? <Sun className="w-4 h-4 text-muted-foreground" /> : <Moon className="w-4 h-4 text-muted-foreground" />}
            </button>
            <button className="p-2 hover:bg-accent rounded-lg" data-testid="button-notifications">
              <Bell className="w-4 h-4 text-muted-foreground" />
            </button>
            <button 
              onClick={() => logout()}
              className="p-2 hover:bg-accent rounded-lg md:hidden"
              data-testid="button-logout-mobile"
            >
              <LogOut className="w-4 h-4 text-muted-foreground" />
            </button>
            <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-secondary-foreground" data-testid="text-user-initials">
                {user ? getInitials(user.fullName) : 'U'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Desktop Sidebar Navigation */}
      <nav className="desktop-nav hidden md:block fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border z-40" data-testid="desktop-nav">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <CalendarCheck className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">AttendanceApp</h1>
              <p className="text-sm text-muted-foreground">Student Portal</p>
            </div>
          </div>
          
          <div className="space-y-2 mb-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setLocation(item.path)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-left ${
                    isActive 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-accent text-muted-foreground'
                  }`}
                  data-testid={`nav-item-${item.id}`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="border-t border-border pt-4">
            <div className="flex items-center space-x-3 px-3 py-2 mb-2">
              <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-secondary-foreground">
                  {user ? getInitials(user.fullName) : 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate" data-testid="text-user-name">
                  {user?.fullName || 'User'}
                </p>
                <p className="text-xs text-muted-foreground truncate" data-testid="text-user-roll">
                  {user?.collegeRollNo || 'N/A'}
                </p>
              </div>
            </div>
            <button
              onClick={() => logout()}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-accent text-muted-foreground transition-colors text-left"
              data-testid="button-logout-desktop"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-nav fixed bottom-0 left-0 right-0 bg-card border-t border-border md:hidden z-40" data-testid="mobile-nav">
        <div className="grid grid-cols-5 h-16">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            
            return (
              <button
                key={item.id}
                onClick={() => setLocation(item.path)}
                className={`flex flex-col items-center justify-center space-y-1 transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
                data-testid={`mobile-nav-item-${item.id}`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{item.mobileLabel}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
