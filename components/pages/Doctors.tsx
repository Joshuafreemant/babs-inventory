"use client";

import { Card, StatCard } from "@/components/shared/Card";
import { Modal } from "@/components/shared/Modal";
import { Badge } from "@/components/shared/Badge";
import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { FaSearch, FaStethoscope ,FaPlusCircle, FaPhone} from "react-icons/fa";

interface Doctor {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  department?: string;
  hospital?: string;
  specialty?: string;
  notes?: string;
  createdAt: string;
}

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  department: "",
  hospital: "",
  specialty: "",
  notes: "",
};

const DEPARTMENTS = [
  "Cardiology", "Dermatology", "Emergency Medicine", "Endocrinology",
  "Gastroenterology", "General Practice", "Gynaecology", "Haematology",
  "Internal Medicine", "Nephrology", "Neurology", "Oncology",
  "Ophthalmology", "Orthopaedics", "Paediatrics", "Psychiatry",
  "Pulmonology", "Radiology", "Surgery", "Urology", "Other",
];

export function DoctorsComponent() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterHospital, setFilterHospital] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [hospitals, setHospitals] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>(DEPARTMENTS);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [customDepartment, setCustomDepartment] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // View doctor detail
  const [viewingDoctor, setViewingDoctor] = useState<Doctor | null>(null);

  const PAGE_SIZE = 20;

  const fetchDoctors = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(PAGE_SIZE));
      if (search) params.set("search", search);
      if (filterHospital) params.set("hospital", filterHospital);
      if (filterDepartment) params.set("department", filterDepartment);

      const res = await fetch(`/api/doctors?${params}`);
      const data = await res.json();
      if (data.error) { toast.error(data.error); return; }

      setDoctors(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalCount(data.pagination?.total || 0);
      setCurrentPage(page);

      if (data.filters?.hospitals?.length) {
        setHospitals(data.filters.hospitals.filter(Boolean));
      }
      if (data.filters?.departments?.length) {
        const combined = [...new Set([...DEPARTMENTS, ...data.filters.departments.filter(Boolean)])];
        setDepartments(combined);
      }
    } catch {
      toast.error("Failed to load doctors");
    } finally {
      setIsLoading(false);
    }
  }, [search, filterHospital, filterDepartment]);

  useEffect(() => { fetchDoctors(1); }, [filterHospital, filterDepartment]);

  useEffect(() => {
    const id = setTimeout(() => fetchDoctors(1), 300);
    return () => clearTimeout(id);
  }, [search]);

  const openAdd = () => {
    setEditingDoctor(null);
    setForm(emptyForm);
    setCustomDepartment("");
    setShowModal(true);
  };

  const openEdit = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setForm({
      name: doctor.name,
      phone: doctor.phone,
      email: doctor.email || "",
      department: DEPARTMENTS.includes(doctor.department || "") ? (doctor.department || "") : "Other",
      hospital: doctor.hospital || "",
      specialty: doctor.specialty || "",
      notes: doctor.notes || "",
    });
    setCustomDepartment(
      DEPARTMENTS.includes(doctor.department || "") ? "" : (doctor.department || "")
    );
    setViewingDoctor(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error("Name and phone number are required");
      return;
    }

    const payload = {
      ...form,
      department: customDepartment || form.department,
    };

    setIsSaving(true);
    try {
      const url = editingDoctor ? `/api/doctors/${editingDoctor._id}` : "/api/doctors";
      const method = editingDoctor ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.error) { toast.error(data.error); return; }

      toast.success(data.message || (editingDoctor ? "Doctor updated" : "Doctor added"));
      setShowModal(false);
      setEditingDoctor(null);
      fetchDoctors(currentPage);
    } catch {
      toast.error("Failed to save doctor");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (doctor: Doctor) => {
    if (!confirm(`Remove Dr. ${doctor.name} from the list?`)) return;
    setIsDeleting(doctor._id);
    try {
      const res = await fetch(`/api/doctors/${doctor._id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.error) { toast.error(data.error); return; }
      toast.success(data.message || "Doctor removed");
      setViewingDoctor(null);
      fetchDoctors(currentPage);
    } catch {
      toast.error("Failed to remove doctor");
    } finally {
      setIsDeleting(null);
    }
  };

  // Group doctors by hospital for the KPI view
  const hospitalGroups = doctors.reduce((acc, doc) => {
    const h = doc.hospital || "Unassigned";
    if (!acc[h]) acc[h] = [];
    acc[h].push(doc);
    return acc;
  }, {} as Record<string, Doctor[]>);

  const uniqueHospitals = Object.keys(hospitalGroups).length;
  const uniqueDepts = new Set(doctors.map((d) => d.department).filter(Boolean)).size;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-3 md:p-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
          <div className="mt-16">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Doctors</h1>
            <p className="text-sm md:text-base text-gray-600 mt-1">
              Manage your medical contacts and relationships
            </p>
          </div>
          <button
            onClick={openAdd}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm md:text-base hover:bg-blue-700 flex items-center gap-2 justify-center"
          >
            <FaPlusCircle />
            Add Doctor
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          <StatCard label="Total Doctors" value={totalCount.toString()} color="blue" />
          <StatCard label="Hospitals" value={uniqueHospitals.toString()} color="green" />
          <StatCard label="Departments" value={uniqueDepts.toString()} color="purple" />
          <StatCard
            label="This Page"
            value={doctors.length.toString()}
            color="teal"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <FaSearch  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"/>
            <input
              type="text"
              placeholder="Search by name, hospital, department, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterHospital}
            onChange={(e) => setFilterHospital(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Hospitals</option>
            {hospitals.map((h) => <option key={h} value={h}>{h}</option>)}
          </select>
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Departments</option>
            {departments.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        {/* Doctors List */}
        <Card>
          <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-4">
            Doctors List
            {totalCount > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-400">
                ({totalCount} total)
              </span>
            )}
          </h2>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-500">Loading doctors...</p>
            </div>
          ) : doctors.length === 0 ? (
            <div className="text-center py-12 text-gray-500 flex flex-col items-center gap-2">
              <FaStethoscope className="text-5xl mb-3 block" />
              <p className="font-medium">No doctors found</p>
              <p className="text-sm mt-1">Add your first medical contact to get started</p>
              <button
                onClick={openAdd}
                className="mt-4 text-blue-600 text-sm hover:underline"
              >
                Add a doctor
              </button>
            </div>
          ) : (
            <>
              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {doctors.map((doctor) => (
                  <div
                    key={doctor._id}
                    onClick={() => setViewingDoctor(doctor)}
                    className="border border-gray-200 rounded-lg p-3 cursor-pointer hover:bg-gray-50 active:bg-gray-100"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900">Dr. {doctor.name}</p>
                        {doctor.department && (
                          <p className="text-xs text-blue-600">{doctor.department}</p>
                        )}
                      </div>
                      {doctor.hospital && (
                        <Badge variant="default">{doctor.hospital}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                      <FaPhone  className="text-gray-400"/>
                      {doctor.phone}
                    </p>
                    {doctor.specialty && (
                      <p className="text-xs text-gray-500 mt-0.5">{doctor.specialty}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-200">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Phone</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Department</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Hospital</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Specialty</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {doctors.map((doctor) => (
                      <tr
                        key={doctor._id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => setViewingDoctor(doctor)}
                      >
                        <td className="py-3 px-4">
                          <p className="font-medium text-gray-900">Dr. {doctor.name}</p>
                          {doctor.email && (
                            <p className="text-xs text-gray-400">{doctor.email}</p>
                          )}
                        </td>
                        <td className="py-3 px-4 text-gray-600">{doctor.phone}</td>
                        <td className="py-3 px-4 text-gray-600">{doctor.department || "—"}</td>
                        <td className="py-3 px-4">
                          {doctor.hospital ? (
                            <Badge variant="default">{doctor.hospital}</Badge>
                          ) : "—"}
                        </td>
                        <td className="py-3 px-4 text-gray-500 text-xs">{doctor.specialty || "—"}</td>
                        <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-3">
                            <button
                              onClick={() => openEdit(doctor)}
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(doctor)}
                              disabled={isDeleting === doctor._id}
                              className="text-red-500 hover:text-red-700 font-medium disabled:opacity-50"
                            >
                              {isDeleting === doctor._id ? "..." : "Remove"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">Page {currentPage} of {totalPages}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => fetchDoctors(currentPage - 1)}
                      disabled={currentPage === 1 || isLoading}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => fetchDoctors(currentPage + 1)}
                      disabled={currentPage === totalPages || isLoading}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>

        {/* Hospital Breakdown */}
        {Object.keys(hospitalGroups).length > 0 && (
          <Card className="mt-6">
            <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-4">
              By Hospital
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(hospitalGroups)
                .sort((a, b) => b[1].length - a[1].length)
                .map(([hospital, docs]) => (
                  <div
                    key={hospital}
                    className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-medium text-sm text-gray-900 truncate flex-1">
                        {hospital}
                      </p>
                      <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                        {docs.length} doctor{docs.length > 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {docs.slice(0, 3).map((d) => (
                        <p key={d._id} className="text-xs text-gray-600 truncate">
                          Dr. {d.name}
                          {d.department && <span className="text-gray-400"> · {d.department}</span>}
                        </p>
                      ))}
                      {docs.length > 3 && (
                        <p className="text-xs text-gray-400">+{docs.length - 3} more</p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        )}

        {/* Add / Edit Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => { setShowModal(false); setEditingDoctor(null); }}
          title={editingDoctor ? `Edit Dr. ${editingDoctor.name}` : "Add New Doctor"}
        >
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Adebayo Okonkwo"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 08012345678"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hospital / Clinic
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lagos University Teaching Hospital"
                  value={form.hospital}
                  onChange={(e) => setForm({ ...form, hospital: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <select
                  value={form.department}
                  onChange={(e) => {
                    setForm({ ...form, department: e.target.value });
                    if (e.target.value !== "Other") setCustomDepartment("");
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select department...</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                {form.department === "Other" && (
                  <input
                    type="text"
                    placeholder="Specify department"
                    value={customDepartment}
                    onChange={(e) => setCustomDepartment(e.target.value)}
                    className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Specialty
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cardiologist, Surgeon"
                  value={form.specialty}
                  onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email (optional)
                </label>
                <input
                  type="email"
                  placeholder="doctor@hospital.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (optional)
              </label>
              <textarea
                placeholder="Any notes about this doctor..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setShowModal(false); setEditingDoctor(null); }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 text-sm"
              >
                {isSaving ? "Saving..." : editingDoctor ? "Save Changes" : "Add Doctor"}
              </button>
            </div>
          </form>
        </Modal>

        {/* View Doctor Modal */}
        <Modal
          isOpen={!!viewingDoctor}
          onClose={() => setViewingDoctor(null)}
          title={viewingDoctor ? `Dr. ${viewingDoctor.name}` : ""}
        >
          {viewingDoctor && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Phone</p>
                  <a
                    href={`tel:${viewingDoctor.phone}`}
                    className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <FaPhone className="text-xs" />
                    {viewingDoctor.phone}
                  </a>
                </div>
                {viewingDoctor.email && (
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Email</p>
                    <a
                      href={`mailto:${viewingDoctor.email}`}
                      className="text-sm text-blue-600 hover:underline truncate block"
                    >
                      {viewingDoctor.email}
                    </a>
                  </div>
                )}
                {viewingDoctor.hospital && (
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Hospital</p>
                    <p className="text-sm font-medium text-gray-900">{viewingDoctor.hospital}</p>
                  </div>
                )}
                {viewingDoctor.department && (
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Department</p>
                    <p className="text-sm font-medium text-gray-900">{viewingDoctor.department}</p>
                  </div>
                )}
                {viewingDoctor.specialty && (
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Specialty</p>
                    <p className="text-sm text-gray-700">{viewingDoctor.specialty}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Added</p>
                  <p className="text-sm text-gray-600">
                    {new Date(viewingDoctor.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {viewingDoctor.notes && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Notes</p>
                  <p className="text-sm text-gray-700">{viewingDoctor.notes}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => handleDelete(viewingDoctor)}
                  disabled={isDeleting === viewingDoctor._id}
                  className="flex-1 px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50 disabled:opacity-50"
                >
                  {isDeleting === viewingDoctor._id ? "Removing..." : "Remove"}
                </button>
                <button
                  onClick={() => openEdit(viewingDoctor)}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 text-sm"
                >
                  Edit
                </button>
              </div>
            </div>
          )}
        </Modal>

      </div>
    </div>
  );
}