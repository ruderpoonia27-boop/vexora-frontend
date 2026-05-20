import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, RadioTower, Sparkles } from 'lucide-react';
import apiClient from '@/lib/apiClient';

const getCountdownTarget = (announcement) => announcement.endTime || announcement.startTime || null;

const formatCountdown = (value) => {
  if (!value) return '';
  const diff = new Date(value).getTime() - Date.now();
  if (Number.isNaN(diff) || diff <= 0) return '';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m ${seconds}s`;
};

const LiveAnnouncementBar = () => {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [nowTick, setNowTick] = useState(0);

  const loadAnnouncements = async () => {
    try {
      const result = await apiClient.get('/announcements', { cacheTtl: 5000 });
      setAnnouncements(result.items || []);
    } catch (error) {
      console.error('Failed to load announcements:', error);
      setAnnouncements([]);
    }
  };

  useEffect(() => {
    loadAnnouncements();
    let refreshInterval = null;
    let events = null;
    if (typeof EventSource !== 'undefined') {
      events = new EventSource(`${apiClient.baseURL}/announcements/events`);
      events.addEventListener('announcements:update', loadAnnouncements);
      events.addEventListener('error', () => {
        if (!refreshInterval) {
          refreshInterval = window.setInterval(loadAnnouncements, 30000);
        }
      });
    } else {
      refreshInterval = window.setInterval(loadAnnouncements, 30000);
    }

    return () => {
      if (refreshInterval) window.clearInterval(refreshInterval);
      events?.close();
    };
  }, []);

  useEffect(() => {
    if (announcements.length <= 1) return undefined;
    const slideInterval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % announcements.length);
    }, 4200);
    return () => window.clearInterval(slideInterval);
  }, [announcements.length]);

  useEffect(() => {
    const hasCountdown = announcements.some((announcement) => announcement.showCountdown);
    if (!hasCountdown) return undefined;
    const tickInterval = window.setInterval(() => setNowTick((current) => current + 1), 1000);
    return () => window.clearInterval(tickInterval);
  }, [announcements]);

  useEffect(() => {
    if (activeIndex >= announcements.length) setActiveIndex(0);
  }, [activeIndex, announcements.length]);

  const marqueeItems = useMemo(() => [...announcements, ...announcements], [announcements]);
  const activeAnnouncement = announcements[activeIndex];

  const openAnnouncement = (announcement) => {
    if (!announcement?.redirectUrl) return;
    if (/^https?:\/\//i.test(announcement.redirectUrl)) {
      window.open(announcement.redirectUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    navigate(announcement.redirectUrl);
  };

  if (announcements.length === 0 || !activeAnnouncement) return null;

  return (
    <section className="relative z-30 -mt-24 mb-16 px-4 md:-mt-28">
      <div className="container mx-auto max-w-6xl">
        <div className="overflow-hidden rounded-[26px] border border-primary/25 bg-[rgba(8,13,28,0.78)] shadow-[0_0_34px_rgba(0,212,255,0.16),0_20px_70px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
          <div className="flex items-center gap-3 border-b border-primary/15 px-4 py-3 sm:px-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-secondary/25 bg-secondary/10 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-secondary">
              <RadioTower className="h-3.5 w-3.5 animate-pulse" /> Live
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
              <div
                className="flex min-w-max gap-6 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground"
                style={{ '--marquee-duration': `${Math.max(18, announcements.length * 7)}s` }}
              >
                {marqueeItems.map((item, index) => (
                  <span key={`${item.id || item._id}_${index}`} className="inline-flex items-center gap-2">
                    <span>{item.icon || '🔥'}</span>
                    <span>{item.title}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-3 p-3 sm:p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <button
              key={activeAnnouncement.id || activeAnnouncement._id || activeIndex}
              type="button"
              onClick={() => openAnnouncement(activeAnnouncement)}
              className={`announcement-card group relative overflow-hidden rounded-2xl border border-primary/20 bg-[linear-gradient(135deg,rgba(0,212,255,0.12),rgba(217,70,239,0.08),rgba(8,13,28,0.8))] p-4 text-left transition-all hover:border-primary/50 hover:shadow-[0_0_20px_rgba(0,212,255,0.14)] ${
                activeAnnouncement.isImportant ? 'animate-pulse' : ''
              }`}
            >
              <div className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100 bg-[radial-gradient(circle_at_top_right,rgba(0,212,255,0.18),transparent_35%)]" />
              <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-2xl shadow-[0_0_20px_rgba(0,212,255,0.16)]">
                    {activeAnnouncement.icon || '🔥'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {activeAnnouncement.showNewBadge ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.16em] text-primary-foreground shadow-[0_0_18px_rgba(0,212,255,0.35)]">
                          <Sparkles className="h-3 w-3" /> New
                        </span>
                      ) : null}
                      <h2 className="text-lg font-black text-foreground md:text-xl">{activeAnnouncement.title}</h2>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground md:text-base">{activeAnnouncement.message}</p>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {activeAnnouncement.showCountdown ? (
                    <span className="rounded-full border border-secondary/25 bg-secondary/10 px-3 py-1.5 text-xs font-black text-secondary">
                      {formatCountdown(getCountdownTarget(activeAnnouncement), nowTick) || 'Live'}
                    </span>
                  ) : null}
                  {activeAnnouncement.buttonText ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-xs font-black text-primary-foreground transition-colors group-hover:bg-primary/90">
                      {activeAnnouncement.buttonText}
                      <ChevronRight className="h-4 w-4" />
                    </span>
                  ) : null}
                </div>
              </div>
            </button>

            <div className="flex justify-center gap-2 lg:flex-col">
              {announcements.map((item, index) => (
                <button
                  key={item.id || item._id || index}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={`h-2.5 rounded-full transition-all ${index === activeIndex ? 'w-8 bg-primary shadow-[0_0_14px_rgba(0,212,255,0.5)] lg:h-8 lg:w-2.5' : 'w-2.5 bg-muted/60 hover:bg-primary/60 lg:h-2.5 lg:w-2.5'}`}
                  aria-label={`Show announcement ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LiveAnnouncementBar;
