import { FileText, Table, FileSpreadsheet, File, Loader2 } from "lucide-react";

const ExportButtons = ({ onExportCsv, onExportExcel, onExportPdf, loading = false }) => {
  return (
    <div className="flex gap-2">
      <button
        onClick={onExportCsv}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <FileText className="h-4 w-4" />}
        CSV
      </button>
      <button
        onClick={onExportExcel}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <FileSpreadsheet className="h-4 w-4" />}
        Excel
      </button>
      <button
        onClick={onExportPdf}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <File className="h-4 w-4" />}
        PDF
      </button>
    </div>
  );
};

export default ExportButtons;
