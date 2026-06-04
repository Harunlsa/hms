import { Typography } from "antd";

const { Text } = Typography;

interface ValueGroupProps {
  label: string;
  value: React.ReactNode;
  className?: string;
  horizontal?: boolean;
  valueClassName?: string;
}

export function ValueGroup({ 
  label, 
  value, 
  className = "", 
  horizontal = false,
  valueClassName = "" 
}: ValueGroupProps) {
  if (horizontal) {
    return (
      <div className={`grid grid-cols-[120px_1fr] gap-4 items-baseline ${className}`}>
        <Text type="secondary" className="text-[10px] uppercase font-bold tracking-tight text-gray-400">
          {label}
        </Text>
        <div className={`text-sm text-gray-800 ${valueClassName}`}>
          {value || <Text italic className="text-gray-300">N/A</Text>}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-0.5 ${className}`}>
      <Text type="secondary" className="text-[10px] uppercase font-bold tracking-tight text-gray-400">
        {label}
      </Text>
      <div className={`text-sm text-gray-800 font-medium ${valueClassName}`}>
        {value || <Text italic className="text-gray-300">N/A</Text>}
      </div>
    </div>
  );
}
