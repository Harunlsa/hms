import { Tag } from "antd";

export type StatusType = 
  | "success" | "processing" | "error" | "warning" | "default"
  | "active" | "completed" | "cancelled" | "pending" | "overdue" | "confirmed" | "missed" | "paid" | "ongoing";

interface StatusTagProps {
  status: StatusType;
  text?: string;
  className?: string;
}

const STATUS_MAP: Record<string, string> = {
  active: "success",
  completed: "default",
  cancelled: "error",
  pending: "processing",
  overdue: "error",
  confirmed: "success",
  missed: "warning",
  paid: "success",
  ongoing: "processing",
  // Standard antd
  success: "success",
  processing: "processing",
  error: "error",
  warning: "warning",
  default: "default",
};

export function StatusTag({ status, text, className = "" }: StatusTagProps) {
  const color = STATUS_MAP[status.toLowerCase()] || "default";
  
  return (
    <Tag 
      color={color} 
      className={`rounded-full border-none font-black text-[9px] uppercase px-2.5 m-0 shadow-sm ${className}`}
    >
      {text || status}
    </Tag>
  );
}
