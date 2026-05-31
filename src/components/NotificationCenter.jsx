import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bell, Trophy, Wallet, Info, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const NotificationCenter = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);
  const triggerRef = useRef(null);
  const seenNotificationIdsRef = useRef(new Set());
  const hasLoadedRef = useRef(false);

  const fetchNotifications = async ({ announceNew = false, showLoading = true } = {}) => {
    if (!currentUser) {
      setNotifications([]);
      seenNotificationIdsRef.current = new Set();
      hasLoadedRef.current = false;
      return;
    }

    if (showLoading) setLoading(true);
    try {
      if (!showLoading && document.visibilityState === 'hidden') {
        return;
      }

      const result = await apiClient.get('/notifications?page=1&perPage=50', { cacheTtl: 12000 });
      const items = result.items || [];
      const freshWinner = items.find((notification) => (
        announceNew
        && hasLoadedRef.current
        && notification.type === 'winner'
        && notification._id
        && !seenNotificationIdsRef.current.has(notification._id)
      ));

      setNotifications(items);
      seenNotificationIdsRef.current = new Set(items.map((notification) => notification._id).filter(Boolean));
      hasLoadedRef.current = true;

      if (freshWinner) {
        toast({
          title: 'Match reward credited',
          description: freshWinner.message
        });
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      if (showLoading) setNotifications([]);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications({ showLoading: true });
    if (!currentUser) return undefined;

    const handleFocus = () => fetchNotifications({ announceNew: true, showLoading: false });
    const intervalId = window.setInterval(() => {
      fetchNotifications({ announceNew: true, showLoading: false });
    }, 30000);

    window.addEventListener('focus', handleFocus);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, [currentUser?._id, currentUser?.id]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event) => {
      const target = event.target;
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) {
        return;
      }
      setIsOpen(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const unreadCount = useMemo(() => notifications.filter((notification) => !notification.read).length, [notifications]);

  const markAsRead = async (id) => {
    try {
      await apiClient.put(`/notifications/${id}`, { read: true });
      setNotifications((current) => current.map((notification) => (
        notification._id === id ? { ...notification, read: true } : notification
      )));
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter((notification) => !notification.read);
    for (const notification of unread) {
      // eslint-disable-next-line no-await-in-loop
      await markAsRead(notification._id);
    }
  };

  const handleNotificationClick = async (notification) => {
    await markAsRead(notification._id);
    if (notification.link) {
      navigate(notification.link);
      setIsOpen(false);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'tournament':
        return <Trophy className="w-4 h-4 text-primary" />;
      case 'wallet':
        return <Wallet className="w-4 h-4 text-secondary" />;
      case 'winner':
        return <Trophy className="w-4 h-4 text-accent" />;
      default:
        return <Info className="w-4 h-4 text-muted-foreground" />;
    }
  };

  if (!currentUser) return null;

  const notificationPanel = isOpen ? createPortal(
    <div className="fixed inset-0 z-[9999]">
      <button
        type="button"
        aria-label="Close notifications"
        className="absolute inset-0 cursor-default bg-background/35 backdrop-blur-[1px] sm:bg-transparent sm:backdrop-blur-none"
        onClick={() => setIsOpen(false)}
      />
      <div
        ref={panelRef}
        className="absolute left-3 right-3 top-[4.75rem] max-h-[min(78vh,34rem)] overflow-hidden rounded-2xl border border-primary/20 bg-card shadow-[0_24px_80px_rgba(0,0,0,0.55)] box-glow-primary sm:left-auto sm:right-4 sm:top-16 sm:w-96"
      >
        <div className="flex items-center justify-between gap-3 border-b border-border/50 bg-background/80 p-4">
          <h3 className="font-bold text-foreground">Notifications</h3>
          {unreadCount > 0 ? (
            <button onClick={markAllAsRead} className="flex shrink-0 items-center gap-1 text-xs text-primary hover:underline">
              <CheckCircle2 className="w-3 h-3" /> Mark all read
            </button>
          ) : null}
        </div>

        <div className="max-h-[calc(min(78vh,34rem)-7.25rem)] overflow-y-auto overscroll-contain">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground text-sm animate-pulse">Loading...</div>
          ) : notifications.length > 0 ? (
            <div className="divide-y divide-border/50">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`flex cursor-pointer gap-3 p-4 transition-colors hover:bg-background/50 ${!notification.read ? 'bg-primary/5' : ''}`}
                >
                  <div className="mt-1 shrink-0">{getIcon(notification.type)}</div>
                  <div className="min-w-0 flex-1">
                    <p className={`break-words text-sm leading-relaxed ${!notification.read ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      {new Date(notification.createdAt || notification.created).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No notifications yet.
            </div>
          )}
        </div>

        <div className="p-3 border-t border-border/50 text-center bg-background/80">
          <button
            onClick={() => {
              navigate('/profile');
              setIsOpen(false);
            }}
            className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            View Profile
          </button>
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-label="Open notifications"
        className="relative p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-card"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 ? (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-background"></span>
        ) : null}
      </button>

      {notificationPanel}
    </div>
  );
};

export default NotificationCenter;
