import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { attendanceApi } from "../../api/attendance";
import StatusBadge from "../StatusBadge";
import { Loader2, CheckIn, CheckOut } from "lucide-react";

const EmployeeAttendanceDashboard = () => {
  const queryClient = useQueryClient();
  const [error, setError] = useState("");

  const { data: todayAttendance, isLoading } = useQuery({
    queryKey: ["todayAttendance"],
    queryFn: () => attendanceApi.getTodayAttendance()
  });

  const checkInMutation = useMutation({
    mutationFn: attendanceApi.checkIn,
    onSuccess: () => {
      queryClient.invalidateQueries(["todayAttendance"]);
      setError("");
    },
    onError: (err) => {
      setError(err.response?.data?.detail || "Check-in failed");
    }
  });

  const checkOutMutation = useMutation({
    mutationFn: attendanceApi.checkOut,
    onSuccess: () => {
      queryClient.invalidateQueries(["todayAttendance"]);
      setError("");
    },
    onError: (err) => {
      setError(err.response?.data?.detail || "Check-out failed");
    }
  });

  const handleCheckIn = () => {
    checkInMutation.mutate();
  };

  const handleCheckOut = () => {
    checkOutMutation.mutate();
  };

  const formatTime = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleTimeString();
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Attendance Dashboard</h2>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Check In/Out Section */}
        <div className="col-span-1 md:col-span-2 bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Today's Attendance</h3>
          {isLoading ? (
            <div className="flex justify-center">
              <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
            </div>
          ) : todayAttendance ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">Check In</p>
                  <p className="text-lg font-medium">{formatTime(todayAttendance.check_in)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Check Out</p>
                  <p className="text-lg font-medium">{formatTime(todayAttendance.check_out)}</p>
                </div>
                <StatusBadge status={todayAttendance.attendance_status} />
              </div>
              <div className="flex gap-4">
                {!todayAttendance.check_in && (
                  <button
                    onClick={handleCheckIn}
                    disabled={checkInMutation.isPending}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                  >
                    {checkInMutation.isPending ? (
                      <Loader2 className="animate-spin h-4 w-4" />
                    ) : (
                      <CheckIn className="h-4 w-4" />
                    )}
                    Check In
                  </button>
                )}
                {todayAttendance.check_in && !todayAttendance.check_out && (
                  <button
                    onClick={handleCheckOut}
                    disabled={checkOutMutation.isPending}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                  >
                    {checkOutMutation.isPending ? (
                      <Loader2 className="animate-spin h-4 w-4" />
                    ) : (
                      <CheckOut className="h-4 w-4" />
                    )}
                    Check Out
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Working Hours</p>
                  <p className="text-lg font-medium">{todayAttendance.working_hours}h</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Overtime</p>
                  <p className="text-lg font-medium">{todayAttendance.overtime_hours}h</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No attendance recorded for today yet</p>
              <button
                onClick={handleCheckIn}
                disabled={checkInMutation.isPending}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 mx-auto"
              >
                {checkInMutation.isPending ? (
                  <Loader2 className="animate-spin h-4 w-4" />
                ) : (
                  <CheckIn className="h-4 w-4" />
                )}
                Check In
              </button>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">This Week</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Present</span>
              <span className="font-medium text-green-600">-</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Absent</span>
              <span className="font-medium text-red-600">-</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Hours</span>
              <span className="font-medium text-blue-600">-</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeAttendanceDashboard;
