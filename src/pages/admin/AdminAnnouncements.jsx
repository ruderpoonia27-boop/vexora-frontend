import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Edit, Loader2, Megaphone, Plus, Save, Search, ToggleLeft, ToggleRight, Trash2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/lib/apiClient';
import { Skeleton } from '@/components/ui/skeleton';

const emptyForm = {
  title: '',
  message: '',
  icon: '🔥',
  buttonText: '',
  redirectUrl: '',
  order: 1,
  isActive: true,
  showNewBadge: false,
  showCountdown: false,
  isImportant: false,
  startTime: '',
  endTime: ''
};

const formatDateTime = (value) => {
  if (!value) return 'No limit';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No limit';
  return date.toLocaleString();
};

const toDateInputValue = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const toApiDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const isCurrentlyLive = (item) => {
  if (!item.isActive) return false;
  const now = Date.now();
  const start = item.startTime ? new Date(item.startTime).getTime() : null;
  const end = item.endTime ? new Date(item.endTime).getTime() : null;
  if (start && start > now) return false;
  if (end && end < now) return false;
  return true;
};

export const AdminAnnouncements = () => {
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState(emptyForm);

  const loadAnnouncements = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const result = await apiClient.get('/announcements/admin');
      setItems(result.items || []);
    } catch (error) {
      toast({ title: 'Unable to load announcements', description: error.message, variant: 'destructive' });
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
    const interval = window.setInterval(() => loadAnnouncements(false), 5000);
    return () => window.clearInterval(interval);
  }, []);

  const sortedItems = useMemo(() => (
    items
      .slice()
      .sort((left, right) => Number(left.order || 0) - Number(right.order || 0))
      .filter((item) => {
        const haystack = `${item.title} ${item.message} ${item.icon}`.toLowerCase();
        return haystack.includes(search.toLowerCase());
      })
  ), [items, search]);

  const resetForm = () => {
    setEditing(null);
    setFormData({ ...emptyForm, order: (items.length || 0) + 1 });
  };

  const startEdit = (item) => {
    setEditing(item);
    setFormData({
      title: item.title || '',
      message: item.message || '',
      icon: item.icon || '🔥',
      buttonText: item.buttonText || '',
      redirectUrl: item.redirectUrl || '',
      order: Number(item.order || 1),
      isActive: item.isActive !== false,
      showNewBadge: !!item.showNewBadge,
      showCountdown: !!item.showCountdown,
      isImportant: !!item.isImportant,
      startTime: toDateInputValue(item.startTime),
      endTime: toDateInputValue(item.endTime)
    });
  };

  const updateField = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const buildPayload = () => ({
    ...formData,
    order: Number(formData.order || 0),
    startTime: toApiDate(formData.startTime),
    endTime: toApiDate(formData.endTime)
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await apiClient.put(`/announcements/${editing.id || editing._id}`, buildPayload());
        toast({ title: 'Announcement updated' });
      } else {
        await apiClient.post('/announcements', buildPayload());
        toast({ title: 'Announcement created' });
      }
      resetForm();
      await loadAnnouncements(false);
    } catch (error) {
      toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const toggleAnnouncement = async (item) => {
    try {
      await apiClient.patch(`/announcements/${item.id || item._id}/toggle`, { isActive: !item.isActive });
      await loadAnnouncements(false);
    } catch (error) {
      toast({ title: 'Status update failed', description: error.message, variant: 'destructive' });
    }
  };

  const deleteAnnouncement = async (item) => {
    if (!window.confirm(`Delete announcement "${item.title}"?`)) return;
    try {
      await apiClient.delete(`/announcements/${item.id || item._id}`);
      toast({ title: 'Announcement deleted' });
      await loadAnnouncements(false);
    } catch (error) {
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
    }
  };

  const reorder = async (item, direction) => {
    const ordered = items.slice().sort((left, right) => Number(left.order || 0) - Number(right.order || 0));
    const index = ordered.findIndex((entry) => (entry.id || entry._id) === (item.id || item._id));
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= ordered.length) return;

    const next = ordered.slice();
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];

    try {
      await apiClient.patch('/announcements/reorder', { ids: next.map((entry) => entry.id || entry._id) });
      await loadAnnouncements(false);
    } catch (error) {
      toast({ title: 'Reorder failed', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Live Announcements</h2>
          <p className="mt-1 text-sm text-muted-foreground">Control the glowing homepage ticker, CTA links, schedules, and visibility.</p>
        </div>
        <button
          type="button"
          onClick={resetForm}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 font-bold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> New Announcement
        </button>
      </div>

      <form onSubmit={handleSubmit} className="admin-glass-panel rounded-2xl p-4 md:p-5">
        <div className="mb-4 flex items-center justify-between gap-3 border-b border-border/50 pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2 text-primary">
              <Megaphone className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold">{editing ? 'Edit Announcement' : 'Create Announcement'}</h3>
              <p className="text-xs text-muted-foreground">Only active and scheduled announcements show on the homepage.</p>
            </div>
          </div>
          {editing ? (
            <button type="button" onClick={resetForm} className="rounded-xl p-2 text-muted-foreground hover:bg-muted/40 hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          ) : null}
        </div>

        <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Title</label>
            <input
              value={formData.title}
              onChange={(event) => updateField('title', event.target.value)}
              required
              placeholder="BGMI Squad Tournament"
              className="w-full rounded-xl border border-border bg-background/60 px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Message</label>
            <input
              value={formData.message}
              onChange={(event) => updateField('message', event.target.value)}
              required
              placeholder="Starts tonight at 8 PM"
              className="w-full rounded-xl border border-border bg-background/60 px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Icon / Emoji</label>
              <input
                value={formData.icon}
                onChange={(event) => updateField('icon', event.target.value)}
                placeholder="🔥"
                className="w-full rounded-xl border border-border bg-background/60 px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Order</label>
              <input
                type="number"
                value={formData.order}
                onChange={(event) => updateField('order', event.target.value)}
                className="w-full rounded-xl border border-border bg-background/60 px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Button Text</label>
              <input
                value={formData.buttonText}
                onChange={(event) => updateField('buttonText', event.target.value)}
                placeholder="Join Now"
                className="w-full rounded-xl border border-border bg-background/60 px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Redirect Link</label>
              <input
                value={formData.redirectUrl}
                onChange={(event) => updateField('redirectUrl', event.target.value)}
                placeholder="/tournaments"
                className="w-full rounded-xl border border-border bg-background/60 px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Start Time</label>
              <input
                type="datetime-local"
                value={formData.startTime}
                onChange={(event) => updateField('startTime', event.target.value)}
                className="w-full rounded-xl border border-border bg-background/60 px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">End Time</label>
              <input
                type="datetime-local"
                value={formData.endTime}
                onChange={(event) => updateField('endTime', event.target.value)}
                className="w-full rounded-xl border border-border bg-background/60 px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {[
            ['isActive', 'Active'],
            ['showNewBadge', 'NEW Badge'],
            ['showCountdown', 'Countdown'],
            ['isImportant', 'Pulse Important']
          ].map(([field, label]) => (
            <label key={field} className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/35 px-4 py-3 text-sm font-semibold text-foreground">
              <input
                type="checkbox"
                checked={!!formData[field]}
                onChange={(event) => updateField(field, event.target.checked)}
                className="h-4 w-4 rounded border-border bg-input text-primary focus:ring-primary"
              />
              {label}
            </label>
          ))}
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {editing ? 'Save Changes' : 'Create Announcement'}
          </button>
        </div>
      </form>

      <div className="admin-glass-panel rounded-2xl p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search announcements..."
            className="w-full rounded-xl border border-border bg-background/60 py-2.5 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="admin-glass-panel rounded-2xl p-5">
              <Skeleton className="mb-3 h-6 w-44" />
              <Skeleton className="mb-3 h-4 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      ) : sortedItems.length === 0 ? (
        <div className="admin-glass-panel rounded-2xl p-10 text-center text-muted-foreground">
          No announcements found.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {sortedItems.map((item, index) => {
            const live = isCurrentlyLive(item);
            return (
              <div key={item.id || item._id} className={`admin-glass-panel rounded-2xl p-5 transition-colors ${live ? 'border-primary/30' : 'border-border/50 opacity-80'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="text-2xl">{item.icon || '🔥'}</span>
                      {item.showNewBadge ? <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-black uppercase text-primary-foreground">NEW</span> : null}
                      {item.isImportant ? <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-black uppercase text-accent">Pulse</span> : null}
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${live ? 'bg-secondary/15 text-secondary' : 'bg-muted text-muted-foreground'}`}>
                        {live ? 'Live' : item.isActive ? 'Scheduled/Expired' : 'Inactive'}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-foreground">{item.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{item.message}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleAnnouncement(item)}
                    className={`rounded-xl p-2 transition-colors ${item.isActive ? 'bg-secondary/10 text-secondary hover:bg-secondary hover:text-secondary-foreground' : 'bg-muted/40 text-muted-foreground hover:text-foreground'}`}
                    aria-label="Toggle active"
                  >
                    {item.isActive ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6" />}
                  </button>
                </div>

                <div className="mt-4 grid gap-3 text-xs text-muted-foreground sm:grid-cols-2">
                  <div className="rounded-xl border border-border/50 bg-background/35 p-3">
                    <p className="uppercase tracking-[0.16em]">Schedule</p>
                    <p className="mt-1 text-foreground">Start: {formatDateTime(item.startTime)}</p>
                    <p>End: {formatDateTime(item.endTime)}</p>
                  </div>
                  <div className="rounded-xl border border-border/50 bg-background/35 p-3">
                    <p className="uppercase tracking-[0.16em]">CTA</p>
                    <p className="mt-1 text-foreground">{item.buttonText || 'No button'}</p>
                    <p className="truncate">{item.redirectUrl || 'No link'}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/50 pt-4">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => reorder(item, -1)}
                      disabled={index === 0}
                      className="rounded-lg bg-muted/40 p-2 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
                      aria-label="Move up"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => reorder(item, 1)}
                      disabled={index === sortedItems.length - 1}
                      className="rounded-lg bg-muted/40 p-2 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
                      aria-label="Move down"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <span className="text-xs text-muted-foreground">Order {item.order || index + 1}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                    >
                      <Edit className="h-4 w-4" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteAnnouncement(item)}
                      className="rounded-lg bg-destructive/10 p-2 text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminAnnouncements;
