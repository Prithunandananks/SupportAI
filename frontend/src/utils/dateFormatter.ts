export function formatTimeAgo(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  const timeOptions: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
  const timeString = date.toLocaleTimeString('en-US', timeOptions);

  if (diffMins < 1) {
    return "Just now";
  }

  if (diffHours < 1) {
    return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  }

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (targetDate.getTime() === today.getTime()) {
    return `Today • ${timeString}`;
  }

  if (targetDate.getTime() === yesterday.getTime()) {
    return `Yesterday • ${timeString}`;
  }

  if (diffDays <= 7) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago • ${timeString}`;
  }

  const dateOptions: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
  const dateString = date.toLocaleDateString('en-GB', dateOptions);
  return `${dateString} • ${timeString}`;
}
