const statusColors = {
  "Present": "bg-green-100 text-green-800",
  "Absent": "bg-red-100 text-red-800",
  "Half-Day": "bg-yellow-100 text-yellow-800",
  "Leave": "bg-blue-100 text-blue-800",
  "Holiday": "bg-gray-100 text-gray-800"
};

const StatusBadge = ({ status }) => {
  const colorClass = statusColors[status] || "bg-gray-100 text-gray-800";

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
