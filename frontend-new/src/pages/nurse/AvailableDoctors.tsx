import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { type RootState } from "../../store";
import { Search, UserCheck, Users, Loader2 } from "lucide-react";
import axios from "axios";

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  email: string;
  isAvailable: boolean;
  currentPatients: number;
}

const AvailableDoctors = () => {
  const { token } = useSelector((state: RootState) => state.auth);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchDoctors = async () => {
      if (!token) return;
      try {
        const response = await axios.get('/api/doctors/available', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDoctors(response.data.doctors || []);
      } catch (error) {
        console.error("Failed to fetch doctors:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDoctors();
  }, [token]);

  const filteredDoctors = doctors.filter(doc => {
    const search = searchQuery.toLowerCase();
    return doc.name.toLowerCase().includes(search) ||
           doc.specialty.toLowerCase().includes(search);
  });

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold font-heading text-gray-900">Available Doctors</h1>
          <p className="text-gray-500 font-medium">Real-time status of clinical staff</p>
        </div>

        {/* Search Bar */}
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by name or specialty..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#390C87] outline-none transition-all"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading doctors...</span>
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border">
          <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">No available doctors found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.map((doc) => (
            <div key={doc.id} className="bg-white p-6 rounded-2xl shadow-card border border-transparent hover:border-[#390C87]/20 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center text-[#390C87]">
                  <UserCheck size={24} />
                </div>
                <span className="bg-green-100 text-green-700 text-[10px] font-black px-2 py-1 rounded-md uppercase">
                  Available
                </span>
              </div>

              <h3 className="font-bold text-lg text-gray-900">{doc.name}</h3>
              <p className="text-sm text-gray-500 mb-6">{doc.specialty}</p>

              <div className="bg-tertiary p-4 rounded-xl border border-gray-100">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1">Current Queue</p>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-800">
                    {doc.currentPatients} patient{doc.currentPatients !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AvailableDoctors;
