import { Prisma } from "../generated/prisma/client";
import { LessonStatus, UserStatus } from "../generated/prisma/enums";

// SQL queries powering /lessons/availability/*. Behavioral spec lives in
// lesson.queries.spec.ts — read the test names first if you're new here.
//
// All `${value}` interpolations below are parameterized by Prisma.sql (each
// becomes $N on the wire); never use Prisma.raw with user input.

export interface SlotsParams {
  schoolId: string;
  courseId: string;
  from: Date;
  to: Date;
  instructorUserId: string | null;
  studentProfileId: string;
  categoryId: string;
  transmission: string;
  durationMin: number;
  // IANA name from SchoolConfig.timezone. Stored HH:MM is interpreted as
  // wall-clock in this zone; Postgres resolves DST when projecting to UTC.
  schoolTz: string;
}

/**
 * Bookable slots in [from, to) for the given enrollment.
 *
 * Algorithm: build availability windows from each eligible instructor's
 * weekly rules (interpreted as school-local wall time), slice them into
 * duration-sized slots, then drop any slot that conflicts with an instructor
 * lesson, a student lesson, or has no vehicle free. Aggregate the surviving
 * (slot, instructorId) rows into one row per slot with the list of
 * instructors who can take it.
 *
 * Returns: { startTime, endTime, instructorIds }[] — ISO UTC strings, sorted
 * by startTime. instructorIds always non-empty.
 */
export function slotsQuery(p: SlotsParams): Prisma.Sql {
  return Prisma.sql`
    -- One row per *school-local* day inside [from, to). We span ±1 day to
    -- absorb TZ-induced edge effects; the slot-level WHERE trims the final
    -- result back to [from, to).
    WITH days AS (
      SELECT generate_series(
        date_trunc('day', (${p.from.toISOString()}::timestamptz - INTERVAL '1 day') AT TIME ZONE ${p.schoolTz}),
        date_trunc('day', (${p.to.toISOString()}::timestamptz + INTERVAL '1 day' - INTERVAL '1 microsecond') AT TIME ZONE ${p.schoolTz}),
        INTERVAL '1 day'
      ) AS day_local  -- timestamp without tz, midnight of the school-local day
    ),
    -- Course-eligible ACTIVE instructor ids; optionally narrowed to a single user.
    eligible AS (
      SELECT ip.id
      FROM instructor_profiles ip
      JOIN users u ON u.id = ip."userId"
      JOIN "_CourseToInstructorProfile" cip ON cip."B" = ip.id
      WHERE u."schoolId" = ${p.schoolId}
        AND u.status = ${UserStatus.ACTIVE}::"UserStatus"
        AND cip."A" = ${p.courseId}
        AND (${p.instructorUserId}::text IS NULL OR u.id = ${p.instructorUserId}::text)
    ),
    -- One row per (instructor × school-local day) they work. day_local +
    -- HH:MM gives a wall-time, AT TIME ZONE projects it to UTC honouring DST.
    windows AS (
      SELECT
        a."instructorId",
        ((d.day_local + a."startTime"::time) AT TIME ZONE ${p.schoolTz}) AS window_start,
        ((d.day_local + a."endTime"::time) AT TIME ZONE ${p.schoolTz}) AS window_end
      FROM days d
      JOIN instructor_availabilities a
        ON a."dayOfWeek" = EXTRACT(DOW FROM d.day_local)::int
        AND a."instructorId" IN (SELECT id FROM eligible)
    ),
    -- Each working window sliced into back-to-back duration-sized slots.
    candidate_slots AS (
      SELECT
        w."instructorId",
        w.window_start + (s.i * ${p.durationMin} || ' minutes')::interval AS slot_start,
        w.window_start + ((s.i + 1) * ${p.durationMin} || ' minutes')::interval AS slot_end
      FROM windows w
      CROSS JOIN LATERAL generate_series(
        0,
        GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (w.window_end - w.window_start)) / 60 / ${p.durationMin})::int - 1)
      ) AS s(i)
      WHERE w.window_start + ((s.i + 1) * ${p.durationMin} || ' minutes')::interval <= w.window_end
    ),
    -- Constant for the whole query: count of school vehicles matching the
    -- enrollment's category and transmission. Hoisted so we evaluate it once.
    total_vehicles AS (
      SELECT COUNT(*)::int AS n
      FROM vehicles
      WHERE "schoolId" = ${p.schoolId}
        AND "categoryId" = ${p.categoryId}
        AND transmission = ${p.transmission}::"Transmission"
    )
    SELECT
      to_char(cs.slot_start AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "startTime",
      to_char(cs.slot_end   AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "endTime",
      array_agg(u.id ORDER BY u.id) AS "instructorIds"
    FROM candidate_slots cs
    JOIN instructor_profiles ip ON ip.id = cs."instructorId"
    JOIN users u ON u.id = ip."userId"
    WHERE
      -- Trim to the requested window (windows may extend past it).
      cs.slot_start >= ${p.from.toISOString()}::timestamptz
      AND cs.slot_end <= ${p.to.toISOString()}::timestamptz
      -- Drop slots overlapping a lesson the same instructor is already on.
      AND NOT EXISTS (
        SELECT 1 FROM lessons l
        WHERE l.status = ${LessonStatus.SCHEDULED}::"LessonStatus"
          AND l."instructorId" = cs."instructorId"
          AND l."startTime" < cs.slot_end
          AND l."endTime" > cs.slot_start
      )
      -- Drop slots overlapping any lesson this student already has.
      AND NOT EXISTS (
        SELECT 1 FROM lessons sl
        JOIN enrollments e ON e.id = sl."enrollmentId"
        WHERE sl.status = ${LessonStatus.SCHEDULED}::"LessonStatus"
          AND e."studentProfileId" = ${p.studentProfileId}
          AND sl."startTime" < cs.slot_end
          AND sl."endTime" > cs.slot_start
      )
      -- Require at least one matching vehicle free at this time.
      AND (SELECT n FROM total_vehicles) - (
        SELECT COUNT(*) FROM lessons vl
        WHERE vl.status = ${LessonStatus.SCHEDULED}::"LessonStatus"
          AND vl."schoolId" = ${p.schoolId}
          AND vl."vehicleId" IS NOT NULL
          AND vl."startTime" < cs.slot_end
          AND vl."endTime" > cs.slot_start
      ) > 0
    GROUP BY cs.slot_start, cs.slot_end
    ORDER BY cs.slot_start
  `;
}
