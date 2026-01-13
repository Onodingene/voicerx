// ============================================================
// API ROUTE: /api/doctors/available
// Get list of available doctors for assignment
// ============================================================

import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// GET - List available doctors
export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const cookieToken = request.cookies.get('auth-token')?.value;
    const token = authHeader?.split(' ')[1] || cookieToken;

    if (!token) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || !decoded.hospitalId) {
      return Response.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get available doctors from the same hospital
    const doctors = await prisma.user.findMany({
      where: {
        hospitalId: decoded.hospitalId,
        role: 'DOCTOR',
        isActive: true,
        isAvailable: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        specialization: true,
        isAvailable: true,
      },
      orderBy: { firstName: 'asc' },
    });

    // Get current patient count for each doctor (appointments in progress)
    const doctorsWithStats = await Promise.all(
      doctors.map(async (doc) => {
        const currentPatients = await prisma.appointment.count({
          where: {
            assignedDoctorId: doc.id,
            status: {
              in: ['ASSIGNED', 'IN_QUEUE', 'IN_CONSULTATION'],
            },
          },
        });

        return {
          ...doc,
          name: `Dr. ${doc.firstName} ${doc.lastName}`,
          specialty: doc.specialization || 'General Physician',
          currentPatients,
        };
      })
    );

    return Response.json({
      doctors: doctorsWithStats,
      count: doctorsWithStats.length,
    });
  } catch (error) {
    console.error('Get available doctors error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
