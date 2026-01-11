'use client'
import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { type RootState } from '../../store';
import { StatusLegend } from "../../components/StatusLegend";
import { appointmentApi } from '../../services/api/appointments';
import { useNavigate } from 'react-router-dom';
import { 
  type Appointment, 
  type ApptStatus 
} from '../../services/types/db';

// UI Components
import { toast } from "../../hooks/use-toast";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Search, Filter, RefreshCw, UserPlus, Loader2 } from "lucide-react";

//  local components
import { QueueStats } from "../../components/QueueStats";
import { PatientCard } from "../../components/PatientCard";
import { PatientIntakeModal } from "../../components/PatientIntakeModal";
import RecordNewPatient from "./RecordNewPatient";
import { DoctorAssignmentDialog } from "../../components/DoctorAssignmentDialog";


export default function NurseOverview() {
    const navigate = useNavigate();

    const { token } = useSelector((state: RootState) => state.auth);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // UI State
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [newPatientOpen, setNewPatientOpen] = useState(false);
    const [doctorDialogOpen, setDoctorDialogOpen] = useState(false);

    // 1. Fetch Appointments (The Queue)
    const fetchQueue = async (isManualRefresh = false) => {
        if (!token) {
            toast({ 
                variant: "destructive", 
                title: "Authentication Required", 
                description: "Please log in to view the queue." 
            });
            return;
        }

        try {
            if (isManualRefresh) {
                setIsRefreshing(true);
            } else {
                setIsLoading(true);
            }

            const data = await appointmentApi.getNurseQueue(token);
            
            // Sort: Emergency > Urgent > Normal (UPPERCASE to match backend)
            const priorityOrder: Record<string, number> = {
                EMERGENCY: 3,
                URGENT: 2,
                NORMAL: 1
            };

            const sorted = data.sort((a, b) => {
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            });

            setAppointments(sorted);

            if (isManualRefresh) {
                toast({ 
                    title: "Queue Refreshed", 
                    description: `Loaded ${sorted.length} active appointment${sorted.length !== 1 ? 's' : ''}` 
                });
            }

        } catch (error: any) {
            console.error("Failed to load queue:", error);
            
            const errorMessage = error.response?.data?.message || 
                               error.response?.data?.error || 
                               "Failed to load queue. Please try again.";
            
            toast({ 
                variant: "destructive", 
                title: "Error Loading Queue", 
                description: errorMessage 
            });
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    // Load queue on mount and when token changes
    useEffect(() => { 
        fetchQueue(); 
    }, [token]);

    // ✅ AUTO-REFRESH: Poll for new appointments every 30 seconds
    useEffect(() => {
        if (!token) return;

        const interval = setInterval(() => {
            fetchQueue(); // Silently refresh in background
        }, 30000); // 30 seconds

        return () => clearInterval(interval); // Cleanup on unmount
    }, [token]);

    // 2. Computed Stats based on DB Schema
    const stats = useMemo(() => {
        const totalPatients = appointments.length;
        const awaitingVitals = appointments.filter(a => a.status === "CREATED").length;
        const awaitingDoctor = appointments.filter(a => a.status === "VITALS_RECORDED").length;
        
        // Calculate average wait time from created appointments
        const waitTimes = appointments
            .filter(a => a.status === "CREATED")
            .map(a => {
                const waitMinutes = Math.floor((Date.now() - new Date(a.createdAt).getTime()) / 60000);
                return waitMinutes;
            });
        
        const avgWaitTime = waitTimes.length > 0 
            ? `${Math.round(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length)} min`
            : "0 min";

        return {
            totalPatients,
            awaitingVitals,
            awaitingDoctor,
            avgWaitTime,
        };
    }, [appointments]);

    // 3. Filtered Appointments (Search logic)
    const filteredAppointments = useMemo(() => {
        if (!searchQuery.trim()) return appointments;

        return appointments.filter(apt => {
            const search = searchQuery.toLowerCase();
            
            // Search by patient name
            const firstName = apt.patient?.firstName?.toLowerCase() || '';
            const lastName = apt.patient?.lastName?.toLowerCase() || '';
            const fullName = `${firstName} ${lastName}`;
            
            // Search by appointment number
            const appointmentNum = apt.appointmentNumber?.toLowerCase() || '';
            
            return fullName.includes(search) || appointmentNum.includes(search);
        });
    }, [appointments, searchQuery]);

    // 4. Action Handlers
    const handleRecordVitals = (apt: Appointment) => {
        if (!apt.patient) {
            toast({ 
                variant: "destructive", 
                title: "Error", 
                description: "Patient data not available" 
            });
            return;
        }
        setSelectedAppointment(apt);
        setModalOpen(true);
    };

    const handleOpenDoctorAssignment = (apt: Appointment) => {
        if (apt.status !== "VITALS_RECORDED") {
            toast({ 
                variant: "destructive", 
                title: "Cannot Assign Doctor", 
                description: "Please record vitals first before assigning a doctor." 
            });
            return;
        }
        setSelectedAppointment(apt);
        setDoctorDialogOpen(true);
    };

    const handleManualRefresh = () => {
        fetchQueue(true);
    };

    return (
        <div className="space-y-6">
            <main className="container mx-auto px-6 py-8">
                {/* Stats Section */}
                <section className="mb-8 animate-fade-in">
                    <QueueStats {...stats} />
                </section>

                {/* Queue Section */}
                <section className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div>
                                <h2 className="text-xl font-semibold text-foreground">Patient Queue</h2>
                                <p className="text-sm text-muted-foreground">
                                    {filteredAppointments.length} active appointment{filteredAppointments.length !== 1 ? "s" : ""} waiting
                                    <span className="ml-2 text-xs opacity-60">(Auto-refreshes every 30s)</span>
                                </p>
                            </div>
                            <StatusLegend />
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by name or ID..."
                                    className="pl-9 w-72"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    aria-label="Search patients"
                                />
                            </div>
                            
                            <Button 
                                variant="outline" 
                                size="icon" 
                                aria-label="Filter patients"
                                disabled
                                title="Filter feature coming soon"
                            >
                                <Filter className="h-4 w-4" />
                            </Button>
                            
                            <Button 
                                variant="outline" 
                                size="icon" 
                                aria-label="Refresh queue"
                                onClick={handleManualRefresh}
                                disabled={isRefreshing || isLoading}
                            >
                                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                            </Button>
                            
                            <Button 
                                onClick={() => navigate('/nurse/patients')} 
                                className="gap-2"
                            >
                                <UserPlus className="h-4 w-4" />
                                New Patient
                            </Button>
                        </div>
                    </div>

                    {/* Appointment List */}
                    <div className="space-y-3">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                                <p className="text-muted-foreground">Loading queue...</p>
                            </div>
                        ) : filteredAppointments.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border">
                                {searchQuery ? (
                                    <>
                                        <p className="font-medium">No appointments match your search</p>
                                        <p className="text-sm mt-1">Try a different search term</p>
                                    </>
                                ) : (
                                    <>
                                        <p className="font-medium">No active appointments found</p>
                                        <p className="text-sm mt-1">The queue is empty</p>
                                    </>
                                )}
                            </div>
                        ) : (
                            filteredAppointments.map((apt, index) => (
                                <div 
                                    key={apt.id} 
                                    className="animate-fade-in" 
                                    style={{ animationDelay: `${0.05 * index}s` }}
                                >
                                    <PatientCard
                                        // Pass data from the Appointment object
                                        id={apt.appointmentNumber}
                                        name={apt.patient 
                                            ? `${apt.patient.firstName} ${apt.patient.lastName}` 
                                            : 'Unknown Patient'
                                        }
                                        status={apt.status}
                                        priority={apt.priority}
                                        waitingTime={new Date(apt.createdAt).toLocaleTimeString([], { 
                                            hour: '2-digit', 
                                            minute: '2-digit' 
                                        })}

                                        // Actions
                                        onClick={() => handleRecordVitals(apt)}
                                        onRecordVitals={() => handleRecordVitals(apt)}
                                        onAssignDoctor={() => handleOpenDoctorAssignment(apt)}
                                    />
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </main>

            {/* Modals & Dialogs */}
            <PatientIntakeModal
                appointment={selectedAppointment}
                open={modalOpen}
                onOpenChange={setModalOpen}
                onVitalsSaved={fetchQueue}
            />

            {selectedAppointment && (
                <DoctorAssignmentDialog
                    open={doctorDialogOpen}
                    onOpenChange={setDoctorDialogOpen}
                    appointmentId={selectedAppointment.id}
                    patientName={
                        selectedAppointment.patient 
                            ? `${selectedAppointment.patient.firstName} ${selectedAppointment.patient.lastName}`
                            : 'Unknown Patient'
                    }
                    patientId={selectedAppointment.patientId}
                    doctors={[]} // For now, pass an empty array or your list of doctors
                    onAssign={fetchQueue} // Refresh queue after assignment
                />
            )}
        </div>
    );
}