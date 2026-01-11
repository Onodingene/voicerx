import axios from 'axios';
import { type Appointment } from '../types/db';

const API_URL = '/api';

export const appointmentApi = {
  getNurseQueue: async (token: string): Promise<Appointment[]> => {
    try {
      const response = await axios.get(`${API_URL}/appointments`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("API Response:", response.data); // Debug log

      // Handle different response structures from backend
      // Backend might return: { appointments: [...] } or just [...]
      let appointments: Appointment[] = [];
      
      if (Array.isArray(response.data)) {
        appointments = response.data;
      } else if (response.data.appointments && Array.isArray(response.data.appointments)) {
        appointments = response.data.appointments;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        appointments = response.data.data;
      } else {
        console.warn("Unexpected response structure:", response.data);
        appointments = [];
      }
      
      // Filter out completed/cancelled appointments
      const hiddenStatuses = ['COMPLETED', 'CANCELLED'];
      
      const filtered = appointments.filter((apt: Appointment) =>
        !hiddenStatuses.includes(apt.status)
      );

      console.log("Filtered appointments:", filtered); // Debug log
      
      return filtered;
    } catch (error) {
      console.error("Error fetching nurse queue:", error);
      throw error;
    }
  },

  // Create a new appointment
  create: async (payload: any, token: string) => {
    try {
      const response = await axios.post(`${API_URL}/appointments`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      
      console.log("Appointment created:", response.data); // Debug log
      return response.data;
    } catch (error) {
      console.error("Error creating appointment:", error);
      throw error;
    }
  },

  // Update appointment status (useful for workflow)
  updateStatus: async (appointmentId: string, status: string, token: string) => {
    try {
      const response = await axios.patch(
        `${API_URL}/appointments/${appointmentId}/status`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error updating appointment status:", error);
      throw error;
    }
  },

  // Assign doctor to appointment
  assignDoctor: async (appointmentId: string, doctorId: string, token: string) => {
    try {
      const response = await axios.patch(
        `${API_URL}/appointments/${appointmentId}/assign-doctor`,
        { doctorId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error assigning doctor:", error);
      throw error;
    }
  },

  // Get single appointment by ID
  getById: async (appointmentId: string, token: string) => {
    try {
      const response = await axios.get(`${API_URL}/appointments/${appointmentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching appointment:", error);
      throw error;
    }
  }
};