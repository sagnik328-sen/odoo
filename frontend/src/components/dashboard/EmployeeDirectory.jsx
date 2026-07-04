import { useState, useEffect } from 'react';
import { employeeApi } from '../../api/employee';
import { mockState } from '../../utils/mockState';
import { 
  Plus, Search, Filter, Edit2, Trash2, Eye, ChevronLeft, ChevronRight,
  UserPlus, X, File, Download, Upload, RefreshCw, AlertCircle, CheckCircle,
  User, Briefcase, CreditCard, FileText
} from 'lucide-react';

const EmployeeDirectory = ({ currentUser }) => {
  // Directory Query States
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [desgFilter, setDesgFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(5);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Target Employee for View/Edit
  const [selectedEmpId, setSelectedEmpId] = useState(null);
  const [selectedEmp, setSelectedEmp] = useState(null);

  // Form States (Create / Edit)
  const [formFields, setFormFields] = useState({
    employee_id: '',
    full_name: '',
    email: '',
    password: '',
    role: 'employee',
    phone: '',
    address: '',
    department: '',
    designation: '',
    manager_id: '',
    joining_date: '',
    base_salary: 0,
    allowances: 0,
    bonuses: 0,
    deductions: 0,
    tax: 0
  });

  // Detailed Modal Tab
  const [activeDetailTab, setActiveDetailTab] = useState('personal');

  // File Upload States
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [docName, setDocName] = useState('');
  const [docFile, setDocFile] = useState(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Error/Success Alerts
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Dropdown Manager Options
  const [managers, setManagers] = useState([]);

  // Fetch Directory
  const fetchDirectory = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const params = {
        page,
        size: pageSize,
        search: search || undefined,
        department: deptFilter || undefined,
        designation: desgFilter || undefined,
        role: roleFilter || undefined
      };
      const data = await employeeApi.getEmployees(params);
      setEmployees(data.items);
      setTotal(data.total);
      setTotalPages(data.pages);
    } catch (err) {
      setErrorMsg('Failed to load employee directory');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Managers List (HR & Admin)
  const fetchManagers = async () => {
    try {
      const data = await employeeApi.getEmployees({ size: 100 });
      const filtered = data.items.filter(u => u.role === 'hr' || u.role === 'admin');
      setManagers(filtered);
    } catch (err) {
      console.error("Failed to load managers:", err);
    }
  };

  useEffect(() => {
    fetchDirectory();
  // These explicit filters are the request boundary; the helper is local to this component.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, deptFilter, desgFilter, roleFilter]);

  useEffect(() => {
    fetchManagers();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchDirectory();
  };

  // Onboard Employee
  const handleOnboard = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const payload = {
        ...formFields,
        manager_id: formFields.manager_id || null,
        joining_date: formFields.joining_date ? new Date(formFields.joining_date).toISOString() : null,
        base_salary: parseFloat(formFields.base_salary) || 0,
        allowances: parseFloat(formFields.allowances) || 0,
        bonuses: parseFloat(formFields.bonuses) || 0,
        deductions: parseFloat(formFields.deductions) || 0,
        tax: parseFloat(formFields.tax) || 0
      };
      
      const created = await employeeApi.createEmployee(payload);
      setSuccessMsg('Employee onboarded successfully!');
      
      // Sync Mock Notifications/Logs
      mockState.addSystemLog({
        action: 'Onboard Employee',
        user: currentUser.email,
        details: `Registered employee: ${created.full_name} (${created.employee_id})`
      });
      mockState.addNotification({
        userId: 'all',
        title: 'New Team Member',
        message: `Welcome ${created.full_name} to the team as a ${created.role}!`
      });

      setFormFields({
        employee_id: '',
        full_name: '',
        email: '',
        password: '',
        role: 'employee',
        phone: '',
        address: '',
        department: '',
        designation: '',
        manager_id: '',
        joining_date: '',
        base_salary: 0,
        allowances: 0,
        bonuses: 0,
        deductions: 0,
        tax: 0
      });

      setTimeout(() => {
        setSuccessMsg('');
        setIsCreateModalOpen(false);
        fetchDirectory();
      }, 1500);

    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to onboard employee');
    }
  };

  // Edit Employee Open
  const openEditModal = (emp) => {
    setFormFields({
      employee_id: emp.employee_id,
      full_name: emp.full_name,
      email: emp.email,
      password: '', // hide password
      role: emp.role,
      phone: emp.profile?.phone || '',
      address: emp.profile?.address || '',
      department: emp.profile?.department || '',
      designation: emp.profile?.designation || '',
      manager_id: emp.profile?.manager_id || '',
      joining_date: emp.profile?.joining_date ? emp.profile.joining_date.substring(0, 10) : '',
      base_salary: emp.profile?.base_salary || 0,
      allowances: emp.profile?.allowances || 0,
      bonuses: emp.profile?.bonuses || 0,
      deductions: emp.profile?.deductions || 0,
      tax: emp.profile?.tax || 0
    });
    setSelectedEmpId(emp.id);
    setIsEditModalOpen(true);
  };

  // Edit Employee Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const payload = {
        ...formFields,
        manager_id: formFields.manager_id || null,
        joining_date: formFields.joining_date ? new Date(formFields.joining_date).toISOString() : null,
        base_salary: parseFloat(formFields.base_salary) || 0,
        allowances: parseFloat(formFields.allowances) || 0,
        bonuses: parseFloat(formFields.bonuses) || 0,
        deductions: parseFloat(formFields.deductions) || 0,
        tax: parseFloat(formFields.tax) || 0
      };
      
      const updated = await employeeApi.updateEmployee(selectedEmpId, payload);
      setSuccessMsg('Employee details updated successfully!');

      mockState.addSystemLog({
        action: 'Update Employee',
        user: currentUser.email,
        details: `Updated details for ${updated.full_name} (${updated.employee_id})`
      });

      setTimeout(() => {
        setSuccessMsg('');
        setIsEditModalOpen(false);
        fetchDirectory();
      }, 1500);

    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to update employee details');
    }
  };

  // Delete Employee
  const handleDelete = async (empId, name) => {
    if (empId === currentUser.id) {
      alert("You cannot delete your own account!");
      return;
    }
    if (!window.confirm(`Are you sure you want to delete employee ${name}? This will remove their user record and profile permanently.`)) return;

    try {
      await employeeApi.deleteEmployee(empId);
      
      mockState.addSystemLog({
        action: 'Delete Employee',
        user: currentUser.email,
        details: `Deleted employee profile for ${name}`
      });

      fetchDirectory();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete employee');
    }
  };

  // View Details Open
  const openDetailModal = async (emp) => {
    setSelectedEmpId(emp.id);
    setActiveDetailTab('personal');
    setErrorMsg('');
    try {
      const data = await employeeApi.getEmployee(emp.id);
      setSelectedEmp(data);
      setIsDetailModalOpen(true);
    } catch (err) {
      alert('Failed to load employee details');
    }
  };

  // Avatar Upload (in detail modal)
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploadingAvatar(true);
      await employeeApi.uploadAvatar(selectedEmpId, file);
      // reload
      const data = await employeeApi.getEmployee(selectedEmpId);
      setSelectedEmp(data);
      fetchDirectory();
    } catch (err) {
      alert("Failed to upload profile picture");
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Document Upload (in detail modal)
  const handleDocUpload = async (e) => {
    e.preventDefault();
    if (!docName || !docFile) return;
    try {
      setUploadingDoc(true);
      await employeeApi.uploadDocument(selectedEmpId, docName, docFile);
      setDocName('');
      setDocFile(null);
      // reload
      const data = await employeeApi.getEmployee(selectedEmpId);
      setSelectedEmp(data);
    } catch (err) {
      alert("Failed to upload document");
    } finally {
      setUploadingDoc(false);
    }
  };

  // Document Delete (in detail modal)
  const handleDocDelete = async (docId) => {
    if (!window.confirm("Delete this document?")) return;
    try {
      await employeeApi.deleteDocument(selectedEmpId, docId);
      // reload
      const data = await employeeApi.getEmployee(selectedEmpId);
      setSelectedEmp(data);
    } catch (err) {
      alert("Failed to delete document");
    }
  };

  const getAvatarUrl = (path) => {
    if (!path) return null;
    return path.startsWith('http') ? path : `http://localhost:8000${path}`;
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Card */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <span className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <Briefcase className="h-5 w-5" />
            </span>
            Employee Records Directory
          </h3>
          <button
            onClick={() => {
              setFormFields({
                employee_id: '',
                full_name: '',
                email: '',
                password: '',
                role: 'employee',
                phone: '',
                address: '',
                department: '',
                designation: '',
                manager_id: '',
                joining_date: '',
                base_salary: 0,
                allowances: 0,
                deductions: 0
              });
              setIsCreateModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 text-xs font-bold shadow-sm transition active:scale-95"
          >
            <UserPlus className="h-4 w-4" />
            Onboard Employee
          </button>
        </div>

        {/* Filters Form */}
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search directory..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <select
              value={deptFilter}
              onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 bg-white"
            >
              <option value="">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="Product">Product</option>
              <option value="HR">Human Resources</option>
              <option value="Operations">Operations</option>
              <option value="Sales">Sales</option>
              <option value="Marketing">Marketing</option>
              <option value="Finance">Finance</option>
            </select>
          </div>

          <div>
            <select
              value={desgFilter}
              onChange={(e) => { setDesgFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 bg-white"
            >
              <option value="">All Designations</option>
              <option value="Software Developer">Software Developer</option>
              <option value="Senior Frontend Engineer">Senior Frontend Engineer</option>
              <option value="HR Specialist">HR Specialist</option>
              <option value="Product Manager">Product Manager</option>
              <option value="QA Lead">QA Lead</option>
              <option value="Administrator">Administrator</option>
            </select>
          </div>

          <div>
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 bg-white"
            >
              <option value="">All System Roles</option>
              <option value="employee">Employee</option>
              <option value="hr">HR Manager</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          <button
            type="submit"
            className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1"
          >
            <Filter className="h-3.5 w-3.5" /> Filter List
          </button>
        </form>
      </div>

      {/* Directory Table */}
      <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin" />
            <span className="text-xs text-slate-400 mt-2 font-semibold">Retrieving employee roster...</span>
          </div>
        ) : employees.length === 0 ? (
          <div className="text-center py-20 text-slate-450 text-sm">
            No employees found matching the current search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Employee details</th>
                  <th className="px-5 py-3.5">ID</th>
                  <th className="px-5 py-3.5">Department</th>
                  <th className="px-5 py-3.5">Designation</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {employees.map(emp => (
                  <tr key={emp.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-3.5 flex items-center gap-3">
                      {emp.profile?.profile_picture ? (
                        <img 
                          src={getAvatarUrl(emp.profile.profile_picture)} 
                          alt={emp.full_name} 
                          className="h-9 w-9 rounded-full object-cover border border-slate-100"
                        />
                      ) : (
                        <div className="h-9 w-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700">
                          {emp.full_name.split(' ').map(n=>n[0]).join('')}
                        </div>
                      )}
                      <div>
                        <div className="font-extrabold text-slate-900">{emp.full_name}</div>
                        <div className="text-[10px] text-slate-400">{emp.email}</div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-500 font-bold">{emp.employee_id}</td>
                    <td className="px-5 py-3.5 text-slate-700">{emp.profile?.department || 'Operations'}</td>
                    <td className="px-5 py-3.5 text-slate-700">{emp.profile?.designation || 'Software Engineer'}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        emp.role === 'admin' 
                          ? 'bg-fuchsia-50 text-fuchsia-700' 
                          : emp.role === 'hr' 
                          ? 'bg-emerald-50 text-emerald-700' 
                          : 'bg-indigo-50 text-indigo-700'
                      }`}>
                        {emp.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openDetailModal(emp)}
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-indigo-650 transition"
                          title="View Profile Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(emp)}
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-amber-600 transition"
                          title="Edit Profile"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(emp.id, emp.full_name)}
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-red-650 transition"
                          title="Delete Employee"
                          disabled={emp.id === currentUser.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination bar */}
        {!loading && total > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-5 py-4">
            <span className="text-xs text-slate-400 font-bold">
              Showing <strong className="text-slate-600">{employees.length}</strong> of <strong className="text-slate-600">{total}</strong> employees
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl transition disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex items-center px-3 text-xs font-black text-slate-700">
                Page {page} of {totalPages}
              </div>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl transition disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal - Onboard Employee */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-150">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-indigo-600" />
                Register & Onboard New Employee
              </h3>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-650 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleOnboard} className="mt-4 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-150 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {errorMsg}
                </div>
              )}
              {successMsg && (
                <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-150 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 shrink-0" />
                  {successMsg}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Personal Section */}
                <div className="space-y-3.5">
                  <h4 className="font-extrabold text-xs text-indigo-600 uppercase tracking-wider border-b border-indigo-50 pb-1.5">1. Account Details</h4>
                  
                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Employee ID *</label>
                    <input
                      type="text"
                      placeholder="e.g. EMP-101"
                      value={formFields.employee_id}
                      onChange={(e) => setFormFields({ ...formFields, employee_id: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Full Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. John Doe"
                      value={formFields.full_name}
                      onChange={(e) => setFormFields({ ...formFields, full_name: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Email Address *</label>
                    <input
                      type="email"
                      placeholder="e.g. john@peopleflow.com"
                      value={formFields.email}
                      onChange={(e) => setFormFields({ ...formFields, email: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Temporary Password</label>
                    <input
                      type="password"
                      placeholder="Leave empty for 'Welcome123!'"
                      value={formFields.password}
                      onChange={(e) => setFormFields({ ...formFields, password: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">System Role</label>
                    <select
                      value={formFields.role}
                      onChange={(e) => setFormFields({ ...formFields, role: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 bg-white"
                    >
                      <option value="employee">Employee</option>
                      <option value="hr">HR Operations</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Phone</label>
                    <input
                      type="text"
                      placeholder="+1 555-0100"
                      value={formFields.phone}
                      onChange={(e) => setFormFields({ ...formFields, phone: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Address</label>
                    <textarea
                      placeholder="123 Main St, Springfield"
                      value={formFields.address}
                      onChange={(e) => setFormFields({ ...formFields, address: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 h-16 resize-none"
                    />
                  </div>
                </div>

                {/* Job & Salary Section */}
                <div className="space-y-3.5">
                  <h4 className="font-extrabold text-xs text-indigo-600 uppercase tracking-wider border-b border-indigo-50 pb-1.5">2. Job Profile & Pay</h4>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Department</label>
                    <select
                      value={formFields.department}
                      onChange={(e) => setFormFields({ ...formFields, department: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 bg-white"
                    >
                      <option value="">Select Department</option>
                      <option value="Engineering">Engineering</option>
                      <option value="Product">Product</option>
                      <option value="HR">Human Resources</option>
                      <option value="Operations">Operations</option>
                      <option value="Sales">Sales</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Finance">Finance</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Designation</label>
                    <input
                      type="text"
                      placeholder="e.g. Software Developer"
                      value={formFields.designation}
                      onChange={(e) => setFormFields({ ...formFields, designation: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Reporting Manager</label>
                    <select
                      value={formFields.manager_id}
                      onChange={(e) => setFormFields({ ...formFields, manager_id: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 bg-white"
                    >
                      <option value="">None / Self-Reporting</option>
                      {managers.map(mgr => (
                        <option key={mgr.id} value={mgr.id}>{mgr.full_name} ({mgr.role})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Joining Date</label>
                    <input
                      type="date"
                      value={formFields.joining_date}
                      onChange={(e) => setFormFields({ ...formFields, joining_date: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Base Salary ($)</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={formFields.base_salary}
                      onChange={(e) => setFormFields({ ...formFields, base_salary: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Allowances ($)</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={formFields.allowances}
                      onChange={(e) => setFormFields({ ...formFields, allowances: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Bonuses ($)</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={formFields.bonuses}
                      onChange={(e) => setFormFields({ ...formFields, bonuses: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Deductions ($)</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={formFields.deductions}
                      onChange={(e) => setFormFields({ ...formFields, deductions: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Tax ($)</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={formFields.tax}
                      onChange={(e) => setFormFields({ ...formFields, tax: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-550 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold text-white transition shadow-sm"
                >
                  Onboard Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Edit Employee Details */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-150">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-amber-600" />
                Edit Employee Account & Profile
              </h3>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-650 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="mt-4 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-150 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {errorMsg}
                </div>
              )}
              {successMsg && (
                <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-150 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 shrink-0" />
                  {successMsg}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Account Details */}
                <div className="space-y-3.5">
                  <h4 className="font-extrabold text-xs text-amber-600 uppercase tracking-wider border-b border-amber-50 pb-1.5">1. Account Details</h4>
                  
                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Employee ID (Read-only)</label>
                    <input
                      type="text"
                      value={formFields.employee_id}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-slate-50 text-slate-500 outline-none"
                      disabled
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Full Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. John Doe"
                      value={formFields.full_name}
                      onChange={(e) => setFormFields({ ...formFields, full_name: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Email Address *</label>
                    <input
                      type="email"
                      placeholder="e.g. john@peopleflow.com"
                      value={formFields.email}
                      onChange={(e) => setFormFields({ ...formFields, email: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">System Role</label>
                    <select
                      value={formFields.role}
                      onChange={(e) => setFormFields({ ...formFields, role: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 bg-white"
                    >
                      <option value="employee">Employee</option>
                      <option value="hr">HR Operations</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Phone</label>
                    <input
                      type="text"
                      placeholder="+1 555-0100"
                      value={formFields.phone}
                      onChange={(e) => setFormFields({ ...formFields, phone: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Address</label>
                    <textarea
                      placeholder="123 Main St, Springfield"
                      value={formFields.address}
                      onChange={(e) => setFormFields({ ...formFields, address: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 h-16 resize-none"
                    />
                  </div>
                </div>

                {/* Job Profile & Pay */}
                <div className="space-y-3.5">
                  <h4 className="font-extrabold text-xs text-amber-600 uppercase tracking-wider border-b border-amber-50 pb-1.5">2. Job Profile & Pay</h4>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Department</label>
                    <select
                      value={formFields.department}
                      onChange={(e) => setFormFields({ ...formFields, department: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 bg-white"
                    >
                      <option value="">Select Department</option>
                      <option value="Engineering">Engineering</option>
                      <option value="Product">Product</option>
                      <option value="HR">Human Resources</option>
                      <option value="Operations">Operations</option>
                      <option value="Sales">Sales</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Finance">Finance</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Designation</label>
                    <input
                      type="text"
                      placeholder="e.g. Software Developer"
                      value={formFields.designation}
                      onChange={(e) => setFormFields({ ...formFields, designation: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Reporting Manager</label>
                    <select
                      value={formFields.manager_id}
                      onChange={(e) => setFormFields({ ...formFields, manager_id: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 bg-white"
                    >
                      <option value="">None / Self-Reporting</option>
                      {managers.map(mgr => (
                        <option key={mgr.id} value={mgr.id}>{mgr.full_name} ({mgr.role})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Joining Date</label>
                    <input
                      type="date"
                      value={formFields.joining_date}
                      onChange={(e) => setFormFields({ ...formFields, joining_date: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Base Salary ($)</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={formFields.base_salary}
                      onChange={(e) => setFormFields({ ...formFields, base_salary: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Allowances ($)</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={formFields.allowances}
                      onChange={(e) => setFormFields({ ...formFields, allowances: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Bonuses ($)</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={formFields.bonuses}
                      onChange={(e) => setFormFields({ ...formFields, bonuses: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Deductions ($)</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={formFields.deductions}
                      onChange={(e) => setFormFields({ ...formFields, deductions: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Tax ($)</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={formFields.tax}
                      onChange={(e) => setFormFields({ ...formFields, tax: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-550 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-sm font-semibold text-white transition shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Employee Details (HR / Admin view) */}
      {isDetailModalOpen && selectedEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in-50 zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-150">
              <div>
                <h3 className="text-xl font-extrabold text-gray-900">Employee Details (Admin View)</h3>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mt-0.5">{selectedEmp.full_name} &bull; ID: {selectedEmp.employee_id}</p>
              </div>
              <button 
                onClick={() => setIsDetailModalOpen(false)}
                className="text-gray-400 hover:text-gray-650 transition p-1 bg-slate-50 hover:bg-slate-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Profile Summary Card with Avatar Uploader */}
            <div className="mt-4 flex flex-col sm:flex-row items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="relative group shrink-0">
                {selectedEmp.profile?.profile_picture ? (
                  <img 
                    src={getAvatarUrl(selectedEmp.profile.profile_picture)} 
                    alt={selectedEmp.full_name} 
                    className="h-20 w-20 rounded-full object-cover border-2 border-indigo-100 shadow-md"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-indigo-500 to-teal-500 text-white flex items-center justify-center font-black text-2xl shadow-md">
                    {selectedEmp.full_name.split(' ').map(n => n[0]).join('')}
                  </div>
                )}
                <label className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                  <Upload className="h-4 w-4" />
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleAvatarUpload} 
                    className="hidden" 
                    disabled={uploadingAvatar}
                  />
                </label>
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-white/75 rounded-full flex items-center justify-center">
                    <RefreshCw className="h-5 w-5 animate-spin text-indigo-600" />
                  </div>
                )}
              </div>
              <div className="text-center sm:text-left">
                <h4 className="font-extrabold text-xl text-slate-800">{selectedEmp.full_name}</h4>
                <p className="text-sm font-semibold text-indigo-600">{selectedEmp.profile?.designation || 'Software Engineer'}</p>
                <p className="text-xs text-slate-400 capitalize">{selectedEmp.role} Account &bull; {selectedEmp.profile?.department || 'Development'}</p>
              </div>
            </div>

            {/* Tabs Navigation */}
            <div className="mt-5 flex border-b border-gray-150">
              {[
                { id: 'personal', name: 'Personal', icon: User },
                { id: 'job', name: 'Job Details', icon: Briefcase },
                { id: 'salary', name: 'Salary', icon: CreditCard },
                { id: 'documents', name: 'Documents', icon: FileText }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveDetailTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold border-b-2 transition uppercase tracking-wider ${
                    activeDetailTab === tab.id 
                      ? 'border-indigo-600 text-indigo-600' 
                      : 'border-transparent text-gray-400 hover:text-gray-650'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.name}</span>
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="mt-4 min-h-48">
              {/* Tab 1: Personal */}
              {activeDetailTab === 'personal' && (
                <div className="space-y-3.5 text-sm">
                  <h5 className="font-bold text-slate-800 text-sm mb-3">Personal Contact details</h5>
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span className="text-slate-400">Email Address</span>
                    <span className="font-bold text-slate-800">{selectedEmp.email}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span className="text-slate-400">Phone Number</span>
                    <span className="font-bold text-slate-800">{selectedEmp.profile?.phone || 'Not Provided'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span className="text-slate-400">Residential Address</span>
                    <span className="font-bold text-slate-800 text-right max-w-xs">{selectedEmp.profile?.address || 'Not Provided'}</span>
                  </div>
                </div>
              )}

              {/* Tab 2: Job Details */}
              {activeDetailTab === 'job' && (
                <div className="space-y-3.5 text-sm">
                  <h5 className="font-bold text-slate-800 text-sm mb-3">Employment Details</h5>
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span className="text-slate-400">Department</span>
                    <span className="font-bold text-slate-800">{selectedEmp.profile?.department || 'Operations'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span className="text-slate-400">Designation</span>
                    <span className="font-bold text-slate-800">{selectedEmp.profile?.designation || 'Staff'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span className="text-slate-400">Direct Manager</span>
                    <span className="font-bold text-slate-800">{selectedEmp.profile?.manager_name || 'None / Self-Reporting'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span className="text-slate-400">Joining Date</span>
                    <span className="font-bold text-slate-800">
                      {selectedEmp.profile?.joining_date 
                        ? new Date(selectedEmp.profile.joining_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
                        : 'June 01, 2026'}
                    </span>
                  </div>
                </div>
              )}

              {/* Tab 3: Salary */}
              {activeDetailTab === 'salary' && (
                <div className="space-y-3.5 text-sm">
                  <h5 className="font-bold text-slate-800 text-sm mb-3">Compensation Structure</h5>
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span className="text-slate-400">Base Salary</span>
                    <span className="font-bold text-slate-800">${(selectedEmp.profile?.base_salary || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span className="text-slate-400">Allowances</span>
                    <span className="font-bold text-green-600">+ ${(selectedEmp.profile?.allowances || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span className="text-slate-400">Bonuses</span>
                    <span className="font-bold text-green-600">+ ${(selectedEmp.profile?.bonuses || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span className="text-slate-400">Deductions</span>
                    <span className="font-bold text-red-500">- ${(selectedEmp.profile?.deductions || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span className="text-slate-400">Tax</span>
                    <span className="font-bold text-red-500">- ${(selectedEmp.profile?.tax || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="font-bold text-slate-850">Net Take-Home Salary</span>
                    <span className="font-black text-indigo-600 text-base">
                      ${(
                        (selectedEmp.profile?.base_salary || 0) + 
                        (selectedEmp.profile?.allowances || 0) + 
                        (selectedEmp.profile?.bonuses || 0) - 
                        (selectedEmp.profile?.deductions || 0) - 
                        (selectedEmp.profile?.tax || 0)
                      ).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </span>
                  </div>
                </div>
              )}

              {/* Tab 4: Documents */}
              {activeDetailTab === 'documents' && (
                <div>
                  <h5 className="font-bold text-slate-800 text-sm mb-3">Employee Documents Directory</h5>

                  {/* Documents List */}
                  <div className="space-y-2 max-h-32 overflow-y-auto mb-4 pr-1">
                    {(!selectedEmp.profile?.documents || selectedEmp.profile.documents.length === 0) ? (
                      <div className="text-center py-4 text-gray-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        No uploaded documents found.
                      </div>
                    ) : (
                      selectedEmp.profile.documents.map(doc => (
                        <div key={doc.id} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs">
                          <div className="flex items-center gap-2 truncate">
                            <File className="h-4 w-4 shrink-0 text-slate-400" />
                            <span className="font-bold text-slate-700 truncate">{doc.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => window.open(getAvatarUrl(doc.file_path))}
                              className="p-1 hover:bg-indigo-50 hover:text-indigo-600 rounded transition"
                              title="Download/View File"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDocDelete(doc.id)}
                              className="p-1 hover:bg-red-50 hover:text-red-600 rounded transition"
                              title="Delete File"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Upload Form */}
                  <form onSubmit={handleDocUpload} className="border-t border-slate-100 pt-3 flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      placeholder="Document Name (e.g. Contract, ID)"
                      value={docName}
                      onChange={(e) => setDocName(e.target.value)}
                      className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
                      required
                    />
                    <div className="flex gap-2">
                      <input
                        type="file"
                        id="detail-doc-file"
                        onChange={(e) => setDocFile(e.target.files[0])}
                        className="hidden"
                      />
                      <label 
                        htmlFor="detail-doc-file"
                        className="cursor-pointer border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-650 flex items-center justify-center shrink-0"
                      >
                        {docFile ? "File Selected" : "Select File"}
                      </label>
                      <button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-1.5 rounded-lg flex items-center gap-1 shadow-sm shrink-0"
                        disabled={uploadingDoc}
                      >
                        {uploadingDoc ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <Upload className="h-3.5 w-3.5" /> Upload
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            <div className="mt-6 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDirectory;
