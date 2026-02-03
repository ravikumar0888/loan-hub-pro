import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import { SessionTimeoutWarning } from '@/components/auth/SessionTimeoutWarning';

// Constants - configurable via environment variables
const TIMEOUT_DURATION = parseInt(
  import.meta.env.VITE_SESSION_TIMEOUT_MS || '300000', // Default 5 minutes
  10
);
const WARNING_DURATION = parseInt(
  import.meta.env.VITE_SESSION_WARNING_MS || '60000', // Default 1 minute
  10
);
const THROTTLE_INTERVAL = parseInt(
  import.meta.env.VITE_ACTIVITY_THROTTLE_MS || '1000', // Default 1 second
  10
);

// Context type
interface SessionTimeoutContextType {
  showWarning: boolean;
  countdown: number;
  resetTimer: () => void;
}

const SessionTimeoutContext = createContext<SessionTimeoutContextType | undefined>(undefined);

// Provider component
export function SessionTimeoutProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, logout } = useAuth();

  // State
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(60);

  // Refs for timers
  const timeoutTimer = useRef<NodeJS.Timeout | null>(null);
  const warningTimer = useRef<NodeJS.Timeout | null>(null);
  const countdownTimer = useRef<NodeJS.Timeout | null>(null);
  const lastActivity = useRef<number>(Date.now());

  // Start both warning and logout timers
  const startTimers = useCallback(() => {
    // Clear any existing timers
    if (timeoutTimer.current) clearTimeout(timeoutTimer.current);
    if (warningTimer.current) clearTimeout(warningTimer.current);
    if (countdownTimer.current) clearInterval(countdownTimer.current);

    // Hide warning if showing
    setShowWarning(false);

    // Start warning timer (shows warning before timeout)
    warningTimer.current = setTimeout(() => {
      setShowWarning(true);
    }, TIMEOUT_DURATION - WARNING_DURATION);

    // Start logout timer (actual timeout)
    timeoutTimer.current = setTimeout(() => {
      handleLogout();
    }, TIMEOUT_DURATION);
  }, []);

  // Reset timer on activity
  const resetTimer = useCallback(() => {
    startTimers();
  }, [startTimers]);

  // Handle logout
  const handleLogout = useCallback(() => {
    // Clear all timers
    if (timeoutTimer.current) clearTimeout(timeoutTimer.current);
    if (warningTimer.current) clearTimeout(warningTimer.current);
    if (countdownTimer.current) clearInterval(countdownTimer.current);

    // Call AuthContext logout
    logout();
  }, [logout]);

  // Broadcast activity to other tabs
  const broadcastActivity = useCallback(() => {
    localStorage.setItem('session_activity', Date.now().toString());
  }, []);

  // Handle user activity with throttling
  const handleActivity = useCallback(() => {
    const now = Date.now();

    // Only reset if throttle interval has passed
    if (now - lastActivity.current > THROTTLE_INTERVAL) {
      lastActivity.current = now;
      resetTimer();
      broadcastActivity();
    }
  }, [resetTimer, broadcastActivity]);

  // Handle "Stay Logged In" button
  const handleStayLoggedIn = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  // Handle "Logout Now" button
  const handleLogoutNow = useCallback(() => {
    handleLogout();
  }, [handleLogout]);

  // Effect: Initialize/cleanup based on auth state
  useEffect(() => {
    if (isAuthenticated) {
      // User is logged in, start timers
      startTimers();
    } else {
      // User is not logged in, cleanup timers
      if (timeoutTimer.current) clearTimeout(timeoutTimer.current);
      if (warningTimer.current) clearTimeout(warningTimer.current);
      if (countdownTimer.current) clearInterval(countdownTimer.current);
      setShowWarning(false);
    }

    // Cleanup on unmount
    return () => {
      if (timeoutTimer.current) clearTimeout(timeoutTimer.current);
      if (warningTimer.current) clearTimeout(warningTimer.current);
      if (countdownTimer.current) clearInterval(countdownTimer.current);
    };
  }, [isAuthenticated, startTimers]);

  // Effect: Attach activity event listeners
  useEffect(() => {
    if (!isAuthenticated) return;

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

    // Add event listeners
    events.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Cleanup
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [isAuthenticated, handleActivity]);

  // Effect: Multi-tab sync via localStorage
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'session_activity') {
        // Another tab had activity, reset our timer
        resetTimer();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [resetTimer]);

  // Effect: Countdown timer when warning is showing
  useEffect(() => {
    if (!showWarning) return;

    // Initialize countdown
    setCountdown(Math.floor(WARNING_DURATION / 1000));

    // Start countdown interval
    countdownTimer.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownTimer.current) clearInterval(countdownTimer.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Cleanup
    return () => {
      if (countdownTimer.current) clearInterval(countdownTimer.current);
    };
  }, [showWarning]);

  return (
    <SessionTimeoutContext.Provider
      value={{
        showWarning,
        countdown,
        resetTimer,
      }}
    >
      {children}
      <SessionTimeoutWarning
        open={showWarning}
        countdown={countdown}
        onStayLoggedIn={handleStayLoggedIn}
        onLogoutNow={handleLogoutNow}
      />
    </SessionTimeoutContext.Provider>
  );
}

// Hook to use session timeout context
export function useSessionTimeout() {
  const context = useContext(SessionTimeoutContext);
  if (context === undefined) {
    throw new Error('useSessionTimeout must be used within SessionTimeoutProvider');
  }
  return context;
}
