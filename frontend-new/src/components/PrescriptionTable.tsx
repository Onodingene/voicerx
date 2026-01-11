// components/PrescriptionTable.tsx
"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { type RootState } from "../store";
import { Pill, Clock, CheckCircle2, Search, X, User, Stethoscope, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "../hooks/use-toast";

interface PrescriptionItem {
  id: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  instructions?: string;
  isDispensed: boolean;
}

interface Prescription {
  id: string;
  prescriptionNumber: string;
  status: "SENT_TO_PHARMACY" | "DISPENSING" | "DISPENSED" | "CANCELLED";
  prescribedAt: string;
  dispensedAt?: string;
  items: PrescriptionItem[];
  patient: {
    patientIdNumber: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    knownAllergies?: string;
  };
  prescribedByUser: {
    firstName: string;
    lastName: string;
    specialization?: string;
  };
  dispensedByUser?: {
    firstName: string;
    lastName: string;
  };
  appointment: {
    appointmentNumber: string;
    priority?: string;
    chiefComplaint?: string;
  };
}

interface TableProps {
  statusFilter: "pending" | "dispensed" | "all";
  title: string;
}

export default function PrescriptionTable({ statusFilter, title }: TableProps) {
  const { token } = useSelector((state: RootState) => state.auth);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  // 1. Fetching Logic with auth
  const { data: prescriptionsData, isLoading } = useQuery({
    queryKey: ["prescriptions", statusFilter, searchQuery],
    queryFn: async () => {
      if (!token) throw new Error("Not authenticated");

      const params = new URLSearchParams();
      if (statusFilter === "pending") {
        params.append("queue", "true"); // Gets SENT_TO_PHARMACY and DISPENSING
      } else if (statusFilter === "dispensed") {
        params.append("status", "DISPENSED");
      }
      // For "all", we don't add status filter

      const res = await fetch(`/api/prescriptions?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch prescriptions");
      }

      return res.json();
    },
    enabled: !!token,
  });

  const prescriptions: Prescription[] = prescriptionsData?.prescriptions || [];

  // Filter by search query
  const filteredPrescriptions = prescriptions.filter((rx) => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    const patientName = `${rx.patient.firstName} ${rx.patient.lastName}`.toLowerCase();
    const doctorName = `${rx.prescribedByUser.firstName} ${rx.prescribedByUser.lastName}`.toLowerCase();
    return (
      patientName.includes(search) ||
      rx.patient.patientIdNumber.toLowerCase().includes(search) ||
      rx.prescriptionNumber.toLowerCase().includes(search) ||
      doctorName.includes(search)
    );
  });

  // 2. Mutation Logic for dispensing
  const dispenseMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!token) throw new Error("Not authenticated");

      const res = await fetch(`/api/prescriptions/${id}/dispense`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to dispense");
      }

      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Prescription Dispensed",
        description: data.message || "Medication has been dispensed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["prescriptions"] });
      queryClient.invalidateQueries({ queryKey: ["prescription-stats"] });
      setSelectedPrescription(null);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Dispense Failed",
        description: error.message,
      });
    },
  });

  const handleDispense = useCallback(
    (id: string) => {
      if (confirm("Are you sure you want to mark this prescription as dispensed?")) {
        dispenseMutation.mutate(id);
      }
    },
    [dispenseMutation]
  );

  // 3. UI Helpers
  const getStatusColor = (status: string) => {
    switch (status) {
      case "DISPENSED":
        return "bg-green-100 text-green-800 border-green-200";
      case "SENT_TO_PHARMACY":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "DISPENSING":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "CANCELLED":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!token) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <p className="text-gray-500">Please log in to view prescriptions.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-8 bg-gray-50 min-h-screen">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900">{title}</h2>

      {/* Search Bar */}
      <div className="mb-4 sm:mb-6 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search by patient, ID, or doctor..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-sm sm:text-base"
        />
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-xs font-semibold text-gray-700 uppercase">Patient</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-xs font-semibold text-gray-700 uppercase hidden sm:table-cell">Doctor</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-xs font-semibold text-gray-700 uppercase">Status</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-xs font-semibold text-gray-700 uppercase hidden md:table-cell">Issued</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-xs font-semibold text-gray-700 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Loading prescriptions...
                  </td>
                </tr>
              ) : filteredPrescriptions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No prescriptions found.
                  </td>
                </tr>
              ) : (
                filteredPrescriptions.map((prescription) => (
                  <tr
                    key={prescription.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setSelectedPrescription(prescription)}
                  >
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="text-purple-600" size={16} />
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900 text-sm sm:text-base truncate">
                            {prescription.patient.firstName} {prescription.patient.lastName}
                          </div>
                          <div className="text-xs text-gray-500">{prescription.patient.patientIdNumber}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        <Stethoscope size={14} className="text-gray-400" />
                        <span className="truncate">
                          Dr. {prescription.prescribedByUser.firstName} {prescription.prescribedByUser.lastName}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-[10px] font-bold border ${getStatusColor(
                          prescription.status
                        )}`}
                      >
                        {prescription.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs text-gray-600 hidden md:table-cell">
                      {formatDate(prescription.prescribedAt)}
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                      {prescription.status === "SENT_TO_PHARMACY" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDispense(prescription.id);
                          }}
                          disabled={dispenseMutation.isPending}
                          className="bg-blue-600 text-white px-2 sm:px-3 py-1.5 rounded-md text-xs hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          {dispenseMutation.isPending ? "..." : "Dispense"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for prescription details */}
      {selectedPrescription && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b p-4 sm:p-6 flex justify-between items-center">
              <div>
                <h3 className="text-lg sm:text-xl font-bold">Prescription Details</h3>
                <p className="text-sm text-gray-500">{selectedPrescription.prescriptionNumber}</p>
              </div>
              <button
                onClick={() => setSelectedPrescription(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-4 sm:p-6">
              {/* Patient Info Section */}
              <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Patient</p>
                <p className="font-bold text-lg">
                  {selectedPrescription.patient.firstName} {selectedPrescription.patient.lastName}
                </p>
                <p className="text-sm text-gray-600">ID: {selectedPrescription.patient.patientIdNumber}</p>
                {selectedPrescription.patient.knownAllergies && (
                  <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
                    <AlertCircle size={14} />
                    <span>Allergies: {selectedPrescription.patient.knownAllergies}</span>
                  </div>
                )}
              </div>

              {/* Doctor Info */}
              <div className="mb-6">
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Prescribed By</p>
                <div className="flex items-center gap-2">
                  <Stethoscope size={16} className="text-gray-400" />
                  <span>
                    Dr. {selectedPrescription.prescribedByUser.firstName}{" "}
                    {selectedPrescription.prescribedByUser.lastName}
                    {selectedPrescription.prescribedByUser.specialization &&
                      ` - ${selectedPrescription.prescribedByUser.specialization}`}
                  </span>
                </div>
              </div>

              {/* Medications List */}
              <div className="mb-6">
                <p className="text-xs font-bold text-gray-400 uppercase mb-3">Medications</p>
                <div className="space-y-3">
                  {selectedPrescription.items.map((item, idx) => (
                    <div key={idx} className="border p-4 rounded-lg flex gap-4">
                      <div className="bg-blue-50 p-2 rounded-lg h-fit">
                        <Pill className="text-blue-600" size={20} />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold">{item.medicationName}</p>
                        <p className="text-sm text-gray-600">
                          {item.dosage} — {item.frequency} — {item.duration}
                        </p>
                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                        {item.instructions && (
                          <p className="mt-2 text-sm bg-blue-50 p-2 rounded text-blue-800">
                            {item.instructions}
                          </p>
                        )}
                      </div>
                      {item.isDispensed && (
                        <CheckCircle2 className="text-green-500 flex-shrink-0" size={20} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons in Modal */}
              {selectedPrescription.status === "SENT_TO_PHARMACY" && (
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    onClick={() => handleDispense(selectedPrescription.id)}
                    disabled={dispenseMutation.isPending}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {dispenseMutation.isPending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <CheckCircle2 size={20} />
                    )}
                    Mark as Dispensed
                  </button>
                </div>
              )}

              {selectedPrescription.status === "DISPENSED" && selectedPrescription.dispensedByUser && (
                <div className="pt-4 border-t text-sm text-gray-600">
                  <p>
                    Dispensed by {selectedPrescription.dispensedByUser.firstName}{" "}
                    {selectedPrescription.dispensedByUser.lastName}
                    {selectedPrescription.dispensedAt && ` on ${formatDate(selectedPrescription.dispensedAt)}`}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
