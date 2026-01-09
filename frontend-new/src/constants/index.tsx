export const navItems = [
    {label: "Home", href: "#home"},
    {label: "About Me", href: "#about"},
    {label: "Portfolio", href: "#projects"},
    {label: "Services", href: "#services"},
    

]

// src/config/navigation.ts
export const navConfig = {
  admin: [
    { name: 'Dashboard', path: '/admin/dashboard' },
    { name: 'Hospital Profile', path: '/admin/hospital-profile' },
    {name: 'Upload Staff', path: '/admin/staff/upload-staff'},
    { name: 'Staff List', path: '/admin/staff/staff-list' },
    { name: 'Roles & Permissions', path: '/admin/roles-permissions' },
    { name: 'Audit Logs', path: '/admin/logs' },
    { name: 'System Settings', path: '/admin/settings' }
  ],
  nurse: [
    { name: 'Patient Records', path: '/nurse/patients' },
    { name: 'Appointments', path: '/nurse/appointments' },
    { name: 'Vitals Entry', path: '/nurse/vitals' }
  ],
  doctor: [
    { name: 'Patient Queue', path: '/doctor/queue' },
    { name: 'Consultations', path: '/doctor/consult' },
    { name: 'Status', path: '/doctor/status' }
  ],
  pharmacist: [
    { name: 'Dashboard', path: '/pharmacist/dashboard' },
    { name: 'Pending', path: '/pharmacist/pending' },
    { name: 'History', path: '/pharmacist/dispensed' }
  ]
};