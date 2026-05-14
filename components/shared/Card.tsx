interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-3 md:p-4 ${className}`}>
      {children}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  icon?: any;
  color?: "blue" | "green" | "red" | "purple" | "teal";
}

export function StatCard({ label, value, icon, color = "blue" }: StatCardProps) {
  const colorClass = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600",
    purple: "bg-purple-50 text-purple-600",
    teal: "bg-teal-50 text-teal-600",
  }[color];

  return (
    <Card className="text-center">
      {icon && (
        <div className={`${colorClass} rounded-lg p-3 w-fit mx-auto mb-2 bg-opacity-20`}>
          {typeof icon === 'string' ? (
            <i className={`ti ${icon} text-3xl md:text-4xl`}></i>
          ) : (
            <span className="text-3xl md:text-4xl flex items-center justify-center">
              {icon}
            </span>
          )}
        </div>
      )}
      <p className="text-xs md:text-sm text-gray-600 mb-1">{label}</p>
      <p className="text-xl md:text-2xl font-bold text-gray-900">{value}</p>
    </Card>
  );
}