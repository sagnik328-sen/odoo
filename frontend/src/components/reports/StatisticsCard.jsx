import { TrendingUp, TrendingDown } from "lucide-react";

const StatisticsCard = ({ title, value, icon: Icon, color = "text-blue-600", bgColor = "bg-blue-100", trend }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-full ${bgColor}`}>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
        {trend !== undefined && (
          <div className="flex items-center gap-1">
            {trend > 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
            <span className={`text-sm font-medium ${trend > 0 ? "text-green-600" : "text-red-600"}`}>
              {Math.abs(trend)}%
            </span>
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-sm text-gray-500">{title}</p>
    </div>
  );
};

export default StatisticsCard;
