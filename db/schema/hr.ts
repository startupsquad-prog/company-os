/**
 * HR Schema
 * 
 * Auto-generated from database introspection.
 * Contains 3 tables from the hr schema.
 */

import { pgTable, pgSchema, index, foreignKey, unique, uuid, text, boolean, timestamp, check, integer, jsonb, pgPolicy, date, numeric, bigint, pgView } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

// Import schemas
export const commonUtil = pgSchema("common_util");
export const crm = pgSchema("crm");
export const core = pgSchema("core");
export const hr = pgSchema("hr");
export const ats = pgSchema("ats");
export const importOps = pgSchema("import_ops");
export const ops = pgSchema("ops");

// Import referenced tables from other schemas
import { profilesInCore } from './core'

export const attendanceRecordsInHr = hr.table("attendance_records", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sessionId: uuid("session_id").notNull(),
	recordType: text("record_type").notNull(),
	timestamp: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	location: text(),
	deviceInfo: text("device_info"),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by"),
}, (table) => [
	index("idx_attendance_records_session").using("btree", table.sessionId.asc().nullsLast().op("uuid_ops")),
	index("idx_attendance_records_timestamp").using("btree", table.timestamp.asc().nullsLast().op("timestamptz_ops")),
	foreignKey({
			columns: [table.sessionId],
			foreignColumns: [attendanceSessionsInHr.id],
			name: "attendance_records_session_id_fkey"
		}).onDelete("cascade"),
	check("attendance_records_record_type_check", sql`record_type = ANY (ARRAY['check_in'::text, 'check_out'::text, 'break_start'::text, 'break_end'::text, 'manual_entry'::text])`),
]);

export const attendanceSessionsInHr = hr.table("attendance_sessions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	employeeId: uuid("employee_id").notNull(),
	date: date().notNull(),
	checkInTime: timestamp("check_in_time", { withTimezone: true, mode: 'string' }),
	checkOutTime: timestamp("check_out_time", { withTimezone: true, mode: 'string' }),
	breakDurationMinutes: integer("break_duration_minutes").default(0),
	totalHours: numeric("total_hours", { precision: 5, scale:  2 }),
	status: text().default('pending'),
	notes: text(),
	approvedBy: uuid("approved_by"),
	approvedAt: timestamp("approved_at", { withTimezone: true, mode: 'string' }),
	meta: jsonb().default({}),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by"),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_attendance_sessions_date").using("btree", table.date.asc().nullsLast().op("date_ops")),
	index("idx_attendance_sessions_employee").using("btree", table.employeeId.asc().nullsLast().op("uuid_ops")),
	index("idx_attendance_sessions_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.approvedBy],
			foreignColumns: [profilesInCore.id],
			name: "attendance_sessions_approved_by_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.employeeId],
			foreignColumns: [profilesInCore.id],
			name: "attendance_sessions_employee_id_fkey"
		}).onDelete("cascade"),
	unique("attendance_sessions_employee_id_date_key").on(table.employeeId, table.date),
	check("attendance_sessions_status_check", sql`status = ANY (ARRAY['pending'::text, 'present'::text, 'absent'::text, 'half_day'::text, 'leave'::text, 'holiday'::text])`),
]);

export const leaveRequestsInHr = hr.table("leave_requests", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	employeeId: uuid("employee_id").notNull(),
	leaveType: text("leave_type").notNull(),
	startDate: date("start_date").notNull(),
	endDate: date("end_date").notNull(),
	daysCount: numeric("days_count", { precision: 5, scale:  2 }).notNull(),
	reason: text(),
	status: text().default('pending'),
	approvedBy: uuid("approved_by"),
	approvedAt: timestamp("approved_at", { withTimezone: true, mode: 'string' }),
	rejectionReason: text("rejection_reason"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by"),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_leave_requests_dates").using("btree", table.startDate.asc().nullsLast().op("date_ops"), table.endDate.asc().nullsLast().op("date_ops")),
	index("idx_leave_requests_employee").using("btree", table.employeeId.asc().nullsLast().op("uuid_ops")),
	index("idx_leave_requests_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.approvedBy],
			foreignColumns: [profilesInCore.id],
			name: "leave_requests_approved_by_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.employeeId],
			foreignColumns: [profilesInCore.id],
			name: "leave_requests_employee_id_fkey"
		}).onDelete("cascade"),
	check("leave_requests_leave_type_check", sql`leave_type = ANY (ARRAY['sick'::text, 'vacation'::text, 'personal'::text, 'maternity'::text, 'paternity'::text, 'other'::text])`),
	check("leave_requests_status_check", sql`status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'cancelled'::text])`),
]);
