/**
 * COMMON_UTIL Schema
 * 
 * Auto-generated from database introspection.
 * Contains 24 tables from the common_util schema.
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
import { profilesInCore, departmentsInCore, companiesInCore, contactsInCore, teamsInCore, verticalsInCore } from './core'
import { leadsInCrm } from './crm'

export const passwordVaultDocumentsInCommonUtil = commonUtil.table("password_vault_documents", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: text().notNull(),
	documentType: text("document_type"),
	documentNumberEncrypted: text("document_number_encrypted"),
	issuer: text(),
	issueDate: date("issue_date"),
	expiryDate: date("expiry_date"),
	fileUrl: text("file_url"),
	fileName: text("file_name"),
	category: text(),
	companyId: uuid("company_id"),
	notes: text(),
	tags: text().array(),
	isFavorite: boolean("is_favorite").default(false),
	lastAccessedAt: timestamp("last_accessed_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by"),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_password_vault_documents_category").using("btree", table.category.asc().nullsLast().op("text_ops")),
	index("idx_password_vault_documents_company").using("btree", table.companyId.asc().nullsLast().op("uuid_ops")),
	index("idx_password_vault_documents_created_by").using("btree", table.createdBy.asc().nullsLast().op("text_ops")),
	index("idx_password_vault_documents_deleted").using("btree", table.deletedAt.asc().nullsLast().op("timestamptz_ops")).where(sql`(deleted_at IS NULL)`),
	index("idx_password_vault_documents_expiry").using("btree", table.expiryDate.asc().nullsLast().op("date_ops")),
	index("idx_password_vault_documents_favorite").using("btree", table.isFavorite.asc().nullsLast().op("bool_ops")),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companiesInCore.id],
			name: "password_vault_documents_company_id_fkey"
		}).onDelete("set null"),
	pgPolicy("Users can view password vault documents", { as: "permissive", for: "select", to: ["public"], using: sql`((core.get_clerk_user_id() IS NOT NULL) AND (deleted_at IS NULL) AND (created_by = core.get_clerk_user_id()))` }),
	pgPolicy("Users can create password vault documents", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Users can update own password vault documents", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Users can delete own password vault documents", { as: "permissive", for: "delete", to: ["public"] }),
	check("password_vault_documents_document_type_check", sql`document_type = ANY (ARRAY['passport'::text, 'license'::text, 'certificate'::text, 'contract'::text, 'other'::text])`),
]);

export const passwordVaultPasswordsInCommonUtil = commonUtil.table("password_vault_passwords", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: text().notNull(),
	username: text(),
	passwordEncrypted: text("password_encrypted").notNull(),
	url: text(),
	category: text(),
	companyId: uuid("company_id"),
	notes: text(),
	tags: text().array(),
	isFavorite: boolean("is_favorite").default(false),
	lastAccessedAt: timestamp("last_accessed_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by"),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_password_vault_passwords_category").using("btree", table.category.asc().nullsLast().op("text_ops")),
	index("idx_password_vault_passwords_company").using("btree", table.companyId.asc().nullsLast().op("uuid_ops")),
	index("idx_password_vault_passwords_created_by").using("btree", table.createdBy.asc().nullsLast().op("text_ops")),
	index("idx_password_vault_passwords_deleted").using("btree", table.deletedAt.asc().nullsLast().op("timestamptz_ops")).where(sql`(deleted_at IS NULL)`),
	index("idx_password_vault_passwords_favorite").using("btree", table.isFavorite.asc().nullsLast().op("bool_ops")),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companiesInCore.id],
			name: "password_vault_passwords_company_id_fkey"
		}).onDelete("set null"),
	pgPolicy("Users can view password vault passwords", { as: "permissive", for: "select", to: ["public"], using: sql`((core.get_clerk_user_id() IS NOT NULL) AND (deleted_at IS NULL) AND (created_by = core.get_clerk_user_id()))` }),
	pgPolicy("Users can create password vault passwords", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Users can update own password vault passwords", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Users can delete own password vault passwords", { as: "permissive", for: "delete", to: ["public"] }),
]);

export const taskAssigneesInCommonUtil = commonUtil.table("task_assignees", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	taskId: uuid("task_id").notNull(),
	profileId: uuid("profile_id").notNull(),
	role: text().default('collaborator').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_task_assignees_profile_id").using("btree", table.profileId.asc().nullsLast().op("uuid_ops")),
	index("idx_task_assignees_role").using("btree", table.role.asc().nullsLast().op("text_ops")),
	index("idx_task_assignees_task_id").using("btree", table.taskId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [profilesInCore.id],
			name: "task_assignees_profile_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.taskId],
			foreignColumns: [tasksInCommonUtil.id],
			name: "task_assignees_task_id_fkey"
		}).onDelete("cascade"),
	unique("task_assignees_task_id_profile_id_key").on(table.taskId, table.profileId),
	check("task_assignees_role_check", sql`role = ANY (ARRAY['owner'::text, 'collaborator'::text, 'watcher'::text])`),
]);

export const ticketAssignmentsInCommonUtil = commonUtil.table("ticket_assignments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	ticketId: uuid("ticket_id").notNull(),
	assigneeId: uuid("assignee_id").notNull(),
	role: text().default('assignee'),
	assignedAt: timestamp("assigned_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	assignedBy: text("assigned_by"),
}, (table) => [
	index("idx_ticket_assignments_assignee").using("btree", table.assigneeId.asc().nullsLast().op("uuid_ops")),
	index("idx_ticket_assignments_ticket").using("btree", table.ticketId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.assigneeId],
			foreignColumns: [profilesInCore.id],
			name: "ticket_assignments_assignee_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.ticketId],
			foreignColumns: [ticketsInCommonUtil.id],
			name: "ticket_assignments_ticket_id_fkey"
		}).onDelete("cascade"),
	unique("ticket_assignments_ticket_id_assignee_id_key").on(table.ticketId, table.assigneeId),
	check("ticket_assignments_role_check", sql`role = ANY (ARRAY['assignee'::text, 'watcher'::text, 'collaborator'::text])`),
]);

export const ticketCommentsInCommonUtil = commonUtil.table("ticket_comments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	ticketId: uuid("ticket_id").notNull(),
	authorId: uuid("author_id").notNull(),
	content: text().notNull(),
	isInternal: boolean("is_internal").default(false),
	attachments: jsonb().default([]),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_ticket_comments_author").using("btree", table.authorId.asc().nullsLast().op("uuid_ops")),
	index("idx_ticket_comments_ticket").using("btree", table.ticketId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [profilesInCore.id],
			name: "ticket_comments_author_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.ticketId],
			foreignColumns: [ticketsInCommonUtil.id],
			name: "ticket_comments_ticket_id_fkey"
		}).onDelete("cascade"),
]);

export const ticketsInCommonUtil = commonUtil.table("tickets", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	ticketNumber: text("ticket_number").notNull(),
	title: text().notNull(),
	description: text(),
	clientId: uuid("client_id"),
	clientEmail: text("client_email"),
	clientName: text("client_name"),
	status: text().default('new'),
	priority: text().default('medium'),
	category: text(),
	assigneeId: uuid("assignee_id"),
	dueDate: timestamp("due_date", { withTimezone: true, mode: 'string' }),
	resolution: text(),
	resolvedAt: timestamp("resolved_at", { withTimezone: true, mode: 'string' }),
	resolvedBy: uuid("resolved_by"),
	meta: jsonb().default({}),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by"),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_tickets_assignee").using("btree", table.assigneeId.asc().nullsLast().op("uuid_ops")),
	index("idx_tickets_client").using("btree", table.clientId.asc().nullsLast().op("uuid_ops")),
	index("idx_tickets_priority").using("btree", table.priority.asc().nullsLast().op("text_ops")),
	index("idx_tickets_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_tickets_ticket_number").using("btree", table.ticketNumber.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.assigneeId],
			foreignColumns: [profilesInCore.id],
			name: "tickets_assignee_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [contactsInCore.id],
			name: "tickets_client_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.resolvedBy],
			foreignColumns: [profilesInCore.id],
			name: "tickets_resolved_by_fkey"
		}).onDelete("set null"),
	unique("tickets_ticket_number_key").on(table.ticketNumber),
	check("tickets_priority_check", sql`priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text])`),
	check("tickets_status_check", sql`status = ANY (ARRAY['new'::text, 'open'::text, 'in_progress'::text, 'waiting'::text, 'resolved'::text, 'closed'::text, 'cancelled'::text])`),
]);

export const ticketSolutionsInCommonUtil = commonUtil.table("ticket_solutions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	ticketId: uuid("ticket_id").notNull(),
	title: text().notNull(),
	description: text(),
	checklistItems: jsonb("checklist_items").default([]),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by"),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_ticket_solutions_ticket").using("btree", table.ticketId.asc().nullsLast().op("uuid_ops")),
	index("idx_ticket_solutions_created_by").using("btree", table.createdBy.asc().nullsLast().op("text_ops")),
	foreignKey({
		columns: [table.ticketId],
		foreignColumns: [ticketsInCommonUtil.id],
		name: "ticket_solutions_ticket_id_fkey"
	}).onDelete("cascade"),
]);

export const passwordVaultCardsInCommonUtil = commonUtil.table("password_vault_cards", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: text().notNull(),
	cardholderName: text("cardholder_name"),
	cardNumberEncrypted: text("card_number_encrypted").notNull(),
	expiryMonth: integer("expiry_month"),
	expiryYear: integer("expiry_year"),
	cvvEncrypted: text("cvv_encrypted"),
	cardType: text("card_type"),
	bankName: text("bank_name").notNull(),
	billingAddress: text("billing_address"),
	category: text(),
	companyId: uuid("company_id"),
	notes: text(),
	tags: text().array(),
	isFavorite: boolean("is_favorite").default(false),
	lastAccessedAt: timestamp("last_accessed_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by"),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_password_vault_cards_category").using("btree", table.category.asc().nullsLast().op("text_ops")),
	index("idx_password_vault_cards_company").using("btree", table.companyId.asc().nullsLast().op("uuid_ops")),
	index("idx_password_vault_cards_created_by").using("btree", table.createdBy.asc().nullsLast().op("text_ops")),
	index("idx_password_vault_cards_deleted").using("btree", table.deletedAt.asc().nullsLast().op("timestamptz_ops")).where(sql`(deleted_at IS NULL)`),
	index("idx_password_vault_cards_expiry").using("btree", table.expiryYear.asc().nullsLast().op("int4_ops"), table.expiryMonth.asc().nullsLast().op("int4_ops")),
	index("idx_password_vault_cards_favorite").using("btree", table.isFavorite.asc().nullsLast().op("bool_ops")),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companiesInCore.id],
			name: "password_vault_cards_company_id_fkey"
		}).onDelete("set null"),
	pgPolicy("Users can view password vault cards", { as: "permissive", for: "select", to: ["public"], using: sql`((core.get_clerk_user_id() IS NOT NULL) AND (deleted_at IS NULL) AND (created_by = core.get_clerk_user_id()))` }),
	pgPolicy("Users can create password vault cards", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Users can update own password vault cards", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Users can delete own password vault cards", { as: "permissive", for: "delete", to: ["public"] }),
	check("password_vault_cards_card_type_check", sql`card_type = ANY (ARRAY['debit'::text, 'credit'::text])`),
	check("password_vault_cards_expiry_month_check", sql`(expiry_month >= 1) AND (expiry_month <= 12)`),
	check("password_vault_cards_expiry_year_check", sql`expiry_year >= 2024`),
]);

export const messageThreadParticipantsInCommonUtil = commonUtil.table("message_thread_participants", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	threadId: uuid("thread_id").notNull(),
	profileId: uuid("profile_id").notNull(),
	lastReadAt: timestamp("last_read_at", { withTimezone: true, mode: 'string' }),
	isMuted: boolean("is_muted").default(false),
	joinedAt: timestamp("joined_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_message_thread_participants_profile").using("btree", table.profileId.asc().nullsLast().op("uuid_ops")),
	index("idx_message_thread_participants_thread").using("btree", table.threadId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [profilesInCore.id],
			name: "message_thread_participants_profile_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.threadId],
			foreignColumns: [messageThreadsInCommonUtil.id],
			name: "message_thread_participants_thread_id_fkey"
		}).onDelete("cascade"),
	unique("message_thread_participants_thread_id_profile_id_key").on(table.threadId, table.profileId),
]);

export const eventParticipantsInCommonUtil = commonUtil.table("event_participants", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	eventId: uuid("event_id").notNull(),
	profileId: uuid("profile_id").notNull(),
	status: text().default('pending'),
	responseAt: timestamp("response_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_event_participants_event").using("btree", table.eventId.asc().nullsLast().op("uuid_ops")),
	index("idx_event_participants_profile").using("btree", table.profileId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.eventId],
			foreignColumns: [eventsInCommonUtil.id],
			name: "event_participants_event_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [profilesInCore.id],
			name: "event_participants_profile_id_fkey"
		}).onDelete("cascade"),
	unique("event_participants_event_id_profile_id_key").on(table.eventId, table.profileId),
	check("event_participants_status_check", sql`status = ANY (ARRAY['pending'::text, 'accepted'::text, 'declined'::text, 'tentative'::text])`),
]);

export const eventsInCommonUtil = commonUtil.table("events", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: text().notNull(),
	description: text(),
	eventType: text("event_type").default('meeting'),
	startTime: timestamp("start_time", { withTimezone: true, mode: 'string' }).notNull(),
	endTime: timestamp("end_time", { withTimezone: true, mode: 'string' }).notNull(),
	allDay: boolean("all_day").default(false),
	location: text(),
	organizerId: uuid("organizer_id").notNull(),
	leadId: uuid("lead_id"),
	status: text().default('scheduled'),
	reminderMinutes: integer("reminder_minutes").array(),
	meta: jsonb().default({}),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by"),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_events_lead").using("btree", table.leadId.asc().nullsLast().op("uuid_ops")),
	index("idx_events_organizer").using("btree", table.organizerId.asc().nullsLast().op("uuid_ops")),
	index("idx_events_start_time").using("btree", table.startTime.asc().nullsLast().op("timestamptz_ops")),
	index("idx_events_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.leadId],
			foreignColumns: [leadsInCrm.id],
			name: "events_lead_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.organizerId],
			foreignColumns: [profilesInCore.id],
			name: "events_organizer_id_fkey"
		}).onDelete("cascade"),
	check("events_event_type_check", sql`event_type = ANY (ARRAY['meeting'::text, 'call'::text, 'task'::text, 'reminder'::text, 'other'::text])`),
	check("events_status_check", sql`status = ANY (ARRAY['scheduled'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text])`),
]);

export const messagesInCommonUtil = commonUtil.table("messages", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	threadId: uuid("thread_id").notNull(),
	senderId: uuid("sender_id").notNull(),
	content: text().notNull(),
	messageType: text("message_type").default('text'),
	fileUrl: text("file_url"),
	fileName: text("file_name"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	fileSize: bigint("file_size", { mode: "number" }),
	isEdited: boolean("is_edited").default(false),
	editedAt: timestamp("edited_at", { withTimezone: true, mode: 'string' }),
	meta: jsonb().default({}),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_messages_created_at").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_messages_sender").using("btree", table.senderId.asc().nullsLast().op("uuid_ops")),
	index("idx_messages_thread").using("btree", table.threadId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.senderId],
			foreignColumns: [profilesInCore.id],
			name: "messages_sender_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.threadId],
			foreignColumns: [messageThreadsInCommonUtil.id],
			name: "messages_thread_id_fkey"
		}).onDelete("cascade"),
	check("messages_message_type_check", sql`message_type = ANY (ARRAY['text'::text, 'file'::text, 'system'::text])`),
]);

export const taskStatusHistoryInCommonUtil = commonUtil.table("task_status_history", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	taskId: uuid("task_id").notNull(),
	fromStatus: text("from_status"),
	toStatus: text("to_status").notNull(),
	changedBy: text("changed_by"),
	changedAt: timestamp("changed_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_task_status_history_changed_at").using("btree", table.changedAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_task_status_history_task_id").using("btree", table.taskId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.taskId],
			foreignColumns: [tasksInCommonUtil.id],
			name: "task_status_history_task_id_fkey"
		}).onDelete("cascade"),
]);

export const tasksInCommonUtil = commonUtil.table("tasks", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: text().notNull(),
	description: text(),
	priority: text(),
	status: text(),
	departmentId: uuid("department_id"),
	verticalKey: text("vertical_key"),
	dueDate: timestamp("due_date", { withTimezone: true, mode: 'string' }),
	createdBy: text("created_by"),
	updatedBy: text("updated_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
	estimatedDuration: integer("estimated_duration"),
	importantLinks: jsonb("important_links").default([]),
	isStarred: boolean("is_starred").default(false),
	position: integer().default(0),
	verticalId: uuid("vertical_id"),
}, (table) => [
	index("idx_tasks_created_by").using("btree", table.createdBy.asc().nullsLast().op("text_ops")),
	index("idx_tasks_deleted_at").using("btree", table.deletedAt.asc().nullsLast().op("timestamptz_ops")).where(sql`(deleted_at IS NULL)`),
	index("idx_tasks_department_id").using("btree", table.departmentId.asc().nullsLast().op("uuid_ops")),
	index("idx_tasks_due_date").using("btree", table.dueDate.asc().nullsLast().op("timestamptz_ops")).where(sql`((deleted_at IS NULL) AND (due_date IS NOT NULL))`),
	index("idx_tasks_is_starred").using("btree", table.isStarred.asc().nullsLast().op("bool_ops")).where(sql`((is_starred = true) AND (deleted_at IS NULL))`),
	index("idx_tasks_priority").using("btree", table.priority.asc().nullsLast().op("text_ops")).where(sql`(deleted_at IS NULL)`),
	index("idx_tasks_status").using("btree", table.status.asc().nullsLast().op("text_ops")).where(sql`(deleted_at IS NULL)`),
	index("idx_tasks_status_position").using("btree", table.status.asc().nullsLast().op("int4_ops"), table.position.asc().nullsLast().op("text_ops")).where(sql`(deleted_at IS NULL)`),
	index("idx_tasks_updated_by").using("btree", table.updatedBy.asc().nullsLast().op("text_ops")),
	index("idx_tasks_vertical").using("btree", table.verticalId.asc().nullsLast().op("uuid_ops")),
	index("idx_tasks_vertical_key").using("btree", table.verticalKey.asc().nullsLast().op("text_ops")).where(sql`(vertical_key IS NOT NULL)`),
	foreignKey({
			columns: [table.departmentId],
			foreignColumns: [departmentsInCore.id],
			name: "tasks_department_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.verticalId],
			foreignColumns: [verticalsInCore.id],
			name: "tasks_vertical_id_fkey"
		}).onDelete("set null"),
]);

export const documentAssignmentsInCommonUtil = commonUtil.table("document_assignments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	documentId: uuid("document_id").notNull(),
	profileId: uuid("profile_id").notNull(),
	canView: boolean("can_view").default(true),
	canDownload: boolean("can_download").default(true),
	canEdit: boolean("can_edit").default(false),
	assignedAt: timestamp("assigned_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	assignedBy: text("assigned_by"),
}, (table) => [
	index("idx_document_assignments_document").using("btree", table.documentId.asc().nullsLast().op("uuid_ops")),
	index("idx_document_assignments_profile").using("btree", table.profileId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.documentId],
			foreignColumns: [documentsInCommonUtil.id],
			name: "document_assignments_document_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [profilesInCore.id],
			name: "document_assignments_profile_id_fkey"
		}).onDelete("cascade"),
	unique("document_assignments_document_id_profile_id_key").on(table.documentId, table.profileId),
]);

export const documentsInCommonUtil = commonUtil.table("documents", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: text().notNull(),
	description: text(),
	fileName: text("file_name").notNull(),
	fileUrl: text("file_url").notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	fileSize: bigint("file_size", { mode: "number" }),
	mimeType: text("mime_type"),
	category: text(),
	status: text().default('active'),
	downloadCount: integer("download_count").default(0),
	viewCount: integer("view_count").default(0),
	meta: jsonb().default({}),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by"),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_documents_category").using("btree", table.category.asc().nullsLast().op("text_ops")),
	index("idx_documents_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	check("documents_status_check", sql`status = ANY (ARRAY['active'::text, 'archived'::text, 'deleted'::text])`),
]);

export const messageThreadsInCommonUtil = commonUtil.table("message_threads", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	subject: text(),
	threadType: text("thread_type").default('direct'),
	leadId: uuid("lead_id"),
	lastMessageAt: timestamp("last_message_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by"),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_message_threads_last_message").using("btree", table.lastMessageAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_message_threads_lead").using("btree", table.leadId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.leadId],
			foreignColumns: [leadsInCrm.id],
			name: "message_threads_lead_id_fkey"
		}).onDelete("set null"),
	check("message_threads_thread_type_check", sql`thread_type = ANY (ARRAY['direct'::text, 'group'::text, 'lead'::text])`),
]);

export const taskDeliverablesInCommonUtil = commonUtil.table("task_deliverables", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	taskId: uuid("task_id").notNull(),
	title: text().notNull(),
	isCompleted: boolean("is_completed").default(false).notNull(),
	position: integer().default(0).notNull(),
	createdBy: text("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_task_deliverables_position").using("btree", table.taskId.asc().nullsLast().op("int4_ops"), table.position.asc().nullsLast().op("int4_ops")),
	index("idx_task_deliverables_task_id").using("btree", table.taskId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.taskId],
			foreignColumns: [tasksInCommonUtil.id],
			name: "task_deliverables_task_id_fkey"
		}).onDelete("cascade"),
]);

export const ticketStatusHistoryInCommonUtil = commonUtil.table("ticket_status_history", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	ticketId: uuid("ticket_id").notNull(),
	status: text().notNull(),
	previousStatus: text("previous_status"),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by"),
}, (table) => [
	index("idx_ticket_status_history_ticket").using("btree", table.ticketId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.ticketId],
			foreignColumns: [ticketsInCommonUtil.id],
			name: "ticket_status_history_ticket_id_fkey"
		}).onDelete("cascade"),
]);

export const taskCommentsInCommonUtil = commonUtil.table("task_comments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	taskId: uuid("task_id").notNull(),
	authorId: text("author_id").notNull(),
	body: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_task_comments_author_id").using("btree", table.authorId.asc().nullsLast().op("text_ops")),
	index("idx_task_comments_created_at").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_task_comments_task_id").using("btree", table.taskId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.taskId],
			foreignColumns: [tasksInCommonUtil.id],
			name: "task_comments_task_id_fkey"
		}).onDelete("cascade"),
]);

export const taskSubtasksInCommonUtil = commonUtil.table("task_subtasks", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	taskId: uuid("task_id").notNull(),
	title: text().notNull(),
	isCompleted: boolean("is_completed").default(false).notNull(),
	position: integer().default(0).notNull(),
	createdBy: text("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_task_subtasks_position").using("btree", table.taskId.asc().nullsLast().op("int4_ops"), table.position.asc().nullsLast().op("int4_ops")),
	index("idx_task_subtasks_task_id").using("btree", table.taskId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.taskId],
			foreignColumns: [tasksInCommonUtil.id],
			name: "task_subtasks_task_id_fkey"
		}).onDelete("cascade"),
]);

export const taskAttachmentsInCommonUtil = commonUtil.table("task_attachments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	taskId: uuid("task_id").notNull(),
	fileName: text("file_name").notNull(),
	filePath: text("file_path").notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	fileSize: bigint("file_size", { mode: "number" }).notNull(),
	mimeType: text("mime_type"),
	uploadedBy: text("uploaded_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_task_attachments_task_id").using("btree", table.taskId.asc().nullsLast().op("uuid_ops")),
	index("idx_task_attachments_uploaded_by").using("btree", table.uploadedBy.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.taskId],
			foreignColumns: [tasksInCommonUtil.id],
			name: "task_attachments_task_id_fkey"
		}).onDelete("cascade"),
]);

export const subscriptionRenewalsInCommonUtil = commonUtil.table("subscription_renewals", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	subscriptionId: uuid("subscription_id").notNull(),
	renewalDate: date("renewal_date").notNull(),
	amount: numeric({ precision: 15, scale:  2 }),
	currency: text().default('USD'),
	billingCycle: text("billing_cycle"),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by"),
}, (table) => [
	index("idx_subscription_renewals_date").using("btree", table.renewalDate.asc().nullsLast().op("date_ops")),
	index("idx_subscription_renewals_subscription").using("btree", table.subscriptionId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.subscriptionId],
			foreignColumns: [subscriptionsInCommonUtil.id],
			name: "subscription_renewals_subscription_id_fkey"
		}).onDelete("cascade"),
]);

export const subscriptionUsersInCommonUtil = commonUtil.table("subscription_users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	subscriptionId: uuid("subscription_id").notNull(),
	profileId: uuid("profile_id").notNull(),
	accessLevel: text("access_level").default('user'),
	addedAt: timestamp("added_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	addedBy: text("added_by"),
}, (table) => [
	index("idx_subscription_users_profile").using("btree", table.profileId.asc().nullsLast().op("uuid_ops")),
	index("idx_subscription_users_subscription").using("btree", table.subscriptionId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [profilesInCore.id],
			name: "subscription_users_profile_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.subscriptionId],
			foreignColumns: [subscriptionsInCommonUtil.id],
			name: "subscription_users_subscription_id_fkey"
		}).onDelete("cascade"),
	unique("subscription_users_subscription_id_profile_id_key").on(table.subscriptionId, table.profileId),
	check("subscription_users_access_level_check", sql`access_level = ANY (ARRAY['admin'::text, 'user'::text, 'viewer'::text])`),
]);

export const subscriptionsInCommonUtil = commonUtil.table("subscriptions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	subscriptionName: text("subscription_name").notNull(),
	vendorId: uuid("vendor_id"),
	vendorName: text("vendor_name"),
	planTier: text("plan_tier"),
	costPerPeriod: numeric("cost_per_period", { precision: 15, scale:  2 }),
	costPerUser: numeric("cost_per_user", { precision: 15, scale:  2 }),
	billingCycle: text("billing_cycle"),
	currency: text().default('USD'),
	autoRenewalStatus: text("auto_renewal_status").default('enabled'),
	ownerId: uuid("owner_id"),
	teamId: uuid("team_id"),
	startDate: date("start_date"),
	expiryDate: date("expiry_date"),
	renewalDate: date("renewal_date"),
	status: text().default('active'),
	numberOfUsers: integer("number_of_users").default(1),
	portalUrl: text("portal_url"),
	category: text(),
	notes: text(),
	credentialsEncrypted: jsonb("credentials_encrypted"),
	meta: jsonb().default({}),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by"),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
	iconUrl: text("icon_url"),
}, (table) => [
	index("idx_subscriptions_category").using("btree", table.category.asc().nullsLast().op("text_ops")),
	index("idx_subscriptions_expiry_date").using("btree", table.expiryDate.asc().nullsLast().op("date_ops")),
	index("idx_subscriptions_owner").using("btree", table.ownerId.asc().nullsLast().op("uuid_ops")),
	index("idx_subscriptions_renewal_date").using("btree", table.renewalDate.asc().nullsLast().op("date_ops")),
	index("idx_subscriptions_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_subscriptions_team").using("btree", table.teamId.asc().nullsLast().op("uuid_ops")),
	index("idx_subscriptions_vendor").using("btree", table.vendorId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.ownerId],
			foreignColumns: [profilesInCore.id],
			name: "subscriptions_owner_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.teamId],
			foreignColumns: [teamsInCore.id],
			name: "subscriptions_team_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.vendorId],
			foreignColumns: [contactsInCore.id],
			name: "subscriptions_vendor_id_fkey"
		}).onDelete("set null"),
	check("subscriptions_auto_renewal_status_check", sql`auto_renewal_status = ANY (ARRAY['enabled'::text, 'disabled'::text, 'cancelled'::text])`),
	check("subscriptions_billing_cycle_check", sql`billing_cycle = ANY (ARRAY['monthly'::text, 'quarterly'::text, 'yearly'::text, 'one_time'::text])`),
	check("subscriptions_status_check", sql`status = ANY (ARRAY['active'::text, 'expired'::text, 'cancelled'::text, 'pending'::text, 'trial'::text])`),
]);
