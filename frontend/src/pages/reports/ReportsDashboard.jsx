import { useQuery } from "@tanstack/react-query";
import {
  Users,
  UserCheck,
  UserX,
  Briefcase,
  DollarSign,
  Calendar,
  Clock,
} from "lucide-react";
import { reportsApi } from "../../api/reports";
import StatisticsCard from "../../components/reports/StatisticsCard";

const ReportsDashboard = () => {
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ["reportsDashboard"],
    queryFn: () => reportsApi.getDashboardSummary(),
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const stats = dashboard?.data || {};

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatisticsCard
          title="Total Employees"
          value={stats.total_employees || 0}
          icon={Users}
          color="text-blue-600"
          bgColor="bg-blue-100"
        />
        <StatisticsCard
          title="Active Employees"
          value={stats.active_employees || 0}
          icon={UserCheck}
          color="text-green-600"
          bgColor="bg-green-100"
        />
        <StatisticsCard
          title="Present Today"
          value={stats.present_today || 0}
          icon={Clock}
          color="text-emerald-600"
          bgColor="bg-emerald-100"
        />
        <StatisticsCard
          title="Absent Today"
          value={stats.absent_today || 0}
          icon={UserX}
          color="text-red-600"
          bgColor="bg-red-100"
        />
        <StatisticsCard
          title="On Leave Today"
          value={stats.on_leave_today || 0}
          icon={Calendar}
          color="text-yellow-600"
          bgColor="bg-yellow-100"
        />
        <StatisticsCard
          title="Total Payroll (Current Month)"
          value={`$${(stats.total_payroll_current_month || 0).toLocaleString()}`}
          icon={DollarSign}
          color="text-purple-600"
          bgColor="bg-purple-100"
        />
        <StatisticsCard
          title="Average Attendance %"
          value={`${stats.average_attendance_percentage || 0}%`}
          icon={Briefcase}
          color="text-indigo-600"
          bgColor="bg-indigo-100"
        />
        <StatisticsCard
          title="Pending Leave Requests"
          value={stats.pending_leave_requests || 0}
          icon={Calendar}
          color="text-orange-600"
          bgColor="bg-orange-100"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
          <div className="space-y-3">
            <a href="/reports/attendance" className="block p-3 border rounded-lg hover:bg-gray-50">
              Attendance Reports
            </a>
            <a href="/reports/leave" className="block p-3 border rounded-lg hover:bg-gray-50">
              Leave Reports
            </a>
            <a href="/reports/payroll" className="block p-3 border rounded-lg hover:bg-gray-50">
              Payroll Reports
            </a>
            <a href="/reports/employees" className="block p-3 border rounded-lg hover:bg-gray-50">
              Employee Reports
            </a>
            <a href="/reports/analytics" className="block p-3 border rounded-lg hover:bg-gray-50">
              Analytics Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsDashboard;
