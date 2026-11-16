export function formatLastSeen(ts?: string | Date | null): {
  label: string;
  isOnline: boolean;
} {
  if (!ts) return { label: "Active recently", isOnline: true };
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return { label: "Active recently", isOnline: true };

  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 15) return { label: "Active now", isOnline: true };
  if (mins < 60) return { label: `Active ${mins}m ago`, isOnline: true };

  const hours = Math.floor(mins / 60);
  if (hours < 24) return { label: `Active ${hours}h ago`, isOnline: true };

  const days = Math.floor(hours / 24);
  if (days === 1) return { label: "Active yesterday", isOnline: false };
  if (days < 30) return { label: `Active ${days}d ago`, isOnline: false };
  return { label: "Active this month", isOnline: false };
}
