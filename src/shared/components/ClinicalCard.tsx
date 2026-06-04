import { Typography } from "antd";

const { Text } = Typography;

interface ClinicalCardProps {
  title: string;
  icon?: React.ReactNode;
  extra?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  headerClassName?: string;
  noPadding?: boolean;
}

export function ClinicalCard({
  title,
  icon,
  extra,
  children,
  className = "",
  bodyClassName = "",
  headerClassName = "",
  noPadding = false,
}: ClinicalCardProps) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm ${className}`}>
      <div className={`bg-gray-50 border-b border-gray-100 px-5 py-3 flex items-center justify-between ${headerClassName}`}>
        <div className="flex items-center gap-2">
          {icon && <span className="text-gray-400 flex items-center">{icon}</span>}
          <Text className="font-bold text-gray-700 uppercase text-xs tracking-wider">
            {title}
          </Text>
        </div>
        {extra && <div className="flex items-center">{extra}</div>}
      </div>
      <div className={`${noPadding ? "" : "p-5"} ${bodyClassName}`}>
        {children}
      </div>
    </div>
  );
}
