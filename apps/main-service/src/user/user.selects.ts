const COURSE_SELECT_IN_PROFILE = {
  id: true,
  name: true,
  price: true,
  hours: true,
  categoryId: true,
  transmission: true,
} as const;

const VEHICLE_SELECT_IN_PROFILE = {
  id: true,
  make: true,
  model: true,
  licensePlate: true,
  transmission: true,
  categoryId: true,
} as const;

export const USER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  status: true,
  createdAt: true,
  instructorProfile: {
    select: {
      id: true,
      courses: { select: COURSE_SELECT_IN_PROFILE },
      vehicles: { select: VEHICLE_SELECT_IN_PROFILE },
    },
  },
  studentProfile: {
    select: {
      id: true,
      enrollments: {
        select: {
          id: true,
          courseId: true,
          course: { select: COURSE_SELECT_IN_PROFILE },
          hoursPurchased: true,
          hoursCompleted: true,
          status: true,
          createdAt: true,
        },
      },
    },
  },
  adminProfile: {
    select: {
      id: true,
    },
  },
} as const;
