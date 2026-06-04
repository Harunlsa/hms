import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export const formatDate = (iso?: string, format = "DD MMM YYYY") => {
  if (!iso) return "—";
  return dayjs(iso).format(format);
};

export const formatDateTime = (iso?: string) => {
  if (!iso) return "—";
  return dayjs(iso).format("DD MMM YYYY, hh:mm A");
};

export const formatTime = (iso?: string) => {
  if (!iso) return "—";
  return dayjs(iso).format("hh:mm A");
};

export const formatDob = (iso?: string) => {
  if (!iso) return "—";
  return dayjs(iso).format("DD MMMM YYYY");
};

export const fromNow = (iso?: string) => {
  if (!iso) return "";
  return dayjs(iso).fromNow();
};

export const isToday = (iso?: string) => {
  if (!iso) return false;
  return dayjs(iso).isSame(dayjs(), "day");
};
