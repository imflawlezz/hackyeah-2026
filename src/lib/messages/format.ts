export function unreadLabel(count: number) {
  const noun =
    count % 10 >= 2 &&
    count % 10 <= 4 &&
    !(count % 100 >= 12 && count % 100 <= 14)
      ? "nieprzeczytane"
      : "nieprzeczytanych";
  return `Powiadomienia, ${count} ${count === 1 ? "nieprzeczytane" : noun}`;
}
export function isUnread(lastMessageAt: string, lastReadAt?: string) {
  return !lastReadAt || Date.parse(lastMessageAt) > Date.parse(lastReadAt);
}
export function relativeTime(date: string, now = Date.now()) {
  const seconds = Math.round((Date.parse(date) - now) / 1000);
  const formatter = new Intl.RelativeTimeFormat("pl", { numeric: "auto" });
  if (Math.abs(seconds) < 60) return formatter.format(seconds, "second");
  if (Math.abs(seconds) < 3600)
    return formatter.format(Math.round(seconds / 60), "minute");
  if (Math.abs(seconds) < 86400)
    return formatter.format(Math.round(seconds / 3600), "hour");
  return formatter.format(Math.round(seconds / 86400), "day");
}
export const roleLabels = {
  resident: "Mieszkaniec",
  jst: "Samorząd",
  expert: "Ekspert",
  admin: "Zespół ROPS",
};
