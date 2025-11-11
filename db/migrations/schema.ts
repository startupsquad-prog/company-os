import { pgTable, pgSchema, index, foreignKey, unique, uuid, text, boolean, timestamp, check, integer, jsonb, pgPolicy, date, numeric, bigint, pgView } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const commonUtil = pgSchema("common_util");
export const crm = pgSchema("crm");
export const core = pgSchema("core");
export const hr = pgSchema("hr");
export const ats = pgSchema("ats");
export const importOps = pgSchema("import_ops");
export const ops = pgSchema("ops");


export const rolesInCore = core.table("roles", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	moduleId: uuid("module_id"),
	isSystem: boolean("is_system").default(false),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by"),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_roles_module_id").using("btree", table.moduleId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.moduleId],
			foreignColumns: [modulesInCore.id],
			name: "roles_module_id_fkey"
		}).onDelete("set null"),
	unique("roles_name_key").on(table.name),
]);

export const userRoleBindingsInCore = core.table("user_role_bindings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	roleId: uuid("role_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by"),
}, (table) => [
	index("idx_user_role_bindings_role_id").using("btree", table.roleId.asc().nullsLast().op("uuid_ops")),
	index("idx_user_role_bindings_user_id").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.roleId],
			foreignColumns: [rolesInCore.id],
			name: "user_role_bindings_role_id_fkey"
		}).onDelete("cascade"),
	unique("user_role_bindings_user_id_role_id_key").on(table.userId, table.roleId),
]);

export const userVerticalsInCore = core.table("user_verticals", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	verticalId: uuid("vertical_id").notNull(),
	roleId: uuid("role_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by"),
}, (table) => [
	index("idx_user_verticals_user").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	index("idx_user_verticals_vertical").using("btree", table.verticalId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.roleId],
			foreignColumns: [rolesInCore.id],
			name: "user_verticals_role_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.verticalId],
			foreignColumns: [verticalsInCore.id],
			name: "user_verticals_vertical_id_fkey"
		}).onDelete("cascade"),
	unique("user_verticals_user_id_vertical_id_key").on(table.userId, table.verticalId),
]);

export const callsInCrm = crm.table("calls", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	leadId: uuid("lead_id"),
	contactId: uuid("contact_id"),
	callerId: uuid("caller_id"),
	callType: text("call_type").notNull(),
	direction: text(),
	phoneNumber: text("phone_number"),
	durationSeconds: integer("duration_seconds").default(0),
	status: text().default('completed'),
	outcome: text(),
	subject: text(),
	notes: text(),
	recordingUrl: text("recording_url"),
	scheduledAt: timestamp("scheduled_at", { withTimezone: true, mode: 'string' }),
	startedAt: timestamp("started_at", { withTimezone: true, mode: 'string' }),
	endedAt: timestamp("ended_at", { withTimezone: true, mode: 'string' }),
	meta: jsonb().default({}),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by"),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_calls_caller").using("btree", table.callerId.asc().nullsLast().op("uuid_ops")),
	index("idx_calls_contact").using("btree", table.contactId.asc().nullsLast().op("uuid_ops")),
	index("idx_calls_created_at").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_calls_lead").using("btree", table.leadId.asc().nullsLast().op("uuid_ops")),
	index("idx_calls_scheduled_at").using("btree", table.scheduledAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_calls_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_calls_type").using("btree", table.callType.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.callerId],
			foreignColumns: [profilesInCore.id],
			name: "calls_caller_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.contactId],
			foreignColumns: [contactsInCore.id],
			name: "calls_contact_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.leadId],
			foreignColumns: [leadsInCrm.id],
			name: "calls_lead_id_fkey"
		}).onDelete("set null"),
	check("calls_call_type_check", sql`call_type = ANY (ARRAY['inbound'::text, 'outbound'::text, 'missed'::text])`),
	check("calls_direction_check", sql`direction = ANY (ARRAY['incoming'::text, 'outgoing'::text])`),
	check("calls_status_check", sql`status = ANY (ARRAY['completed'::text, 'no_answer'::text, 'busy'::text, 'failed'::text, 'cancelled'::text])`),
]);

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

export const collectionsInCrm = crm.table("collections", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	imageUrl: text("image_url"),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by"),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
});

export const interactionsInCrm = crm.table("interactions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	entityType: text("entity_type").notNull(),
	entityId: uuid("entity_id").notNull(),
	type: text().notNull(),
	subject: text(),
	notes: text(),
	scheduledAt: timestamp("scheduled_at", { withTimezone: true, mode: 'string' }),
	durationMinutes: integer("duration_minutes"),
	outcome: text(),
	meta: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by"),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_interactions_created_at").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_interactions_deleted_at").using("btree", table.deletedAt.asc().nullsLast().op("timestamptz_ops")).where(sql`(deleted_at IS NULL)`),
	index("idx_interactions_entity").using("btree", table.entityType.asc().nullsLast().op("uuid_ops"), table.entityId.asc().nullsLast().op("uuid_ops")),
	index("idx_interactions_type").using("btree", table.type.asc().nullsLast().op("text_ops")),
	check("interactions_type_check", sql`type = ANY (ARRAY['call'::text, 'email'::text, 'meeting'::text, 'note'::text, 'task'::text])`),
]);

export const companiesInCore = core.table("companies", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	legalName: text("legal_name"),
	taxId: text("tax_id"),
	website: text(),
	industry: text(),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by"),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_companies_deleted_at").using("btree", table.deletedAt.asc().nullsLast().op("timestamptz_ops")).where(sql`(deleted_at IS NULL)`),
]);

export const teamsInCore = core.table("teams", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	departmentId: uuid("department_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by"),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.departmentId],
			foreignColumns: [departmentsInCore.id],
			name: "teams_department_id_fkey"
		}).onDelete("set null"),
]);

export const verticalsInCore = core.table("verticals", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	code: text().notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by"),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	unique("verticals_code_key").on(table.code),
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

export const leadsInCrm = crm.table("leads", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	contactId: uuid("contact_id"),
	companyId: uuid("company_id"),
	ownerId: uuid("owner_id"),
	status: text().default('new').notNull(),
	source: text(),
	value: numeric({ precision: 12, scale:  2 }),
	probability: integer().default(0),
	expectedCloseDate: date("expected_close_date"),
	notes: text(),
	tags: text().array(),
	meta: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by"),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
	verticalId: uuid("vertical_id"),
}, (table) => [
	index("idx_crm_leads_vertical").using("btree", table.verticalId.asc().nullsLast().op("uuid_ops")),
	index("idx_leads_company_id").using("btree", table.companyId.asc().nullsLast().op("uuid_ops")),
	index("idx_leads_contact_id").using("btree", table.contactId.asc().nullsLast().op("uuid_ops")),
	index("idx_leads_created_at").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_leads_deleted_at").using("btree", table.deletedAt.asc().nullsLast().op("timestamptz_ops")).where(sql`(deleted_at IS NULL)`),
	index("idx_leads_owner_id").using("btree", table.ownerId.asc().nullsLast().op("uuid_ops")),
	index("idx_leads_source").using("btree", table.source.asc().nullsLast().op("text_ops")),
	index("idx_leads_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companiesInCore.id],
			name: "leads_company_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.contactId],
			foreignColumns: [contactsInCore.id],
			name: "leads_contact_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.ownerId],
			foreignColumns: [profilesInCore.id],
			name: "leads_owner_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.verticalId],
			foreignColumns: [verticalsInCore.id],
			name: "leads_vertical_id_fkey"
		}).onDelete("set null"),
	check("leads_probability_check", sql`(probability >= 0) AND (probability <= 100)`),
	check("leads_status_check", sql`status = ANY (ARRAY['new'::text, 'contacted'::text, 'qualified'::text, 'proposal'::text, 'negotiation'::text, 'won'::text, 'lost'::text])`),
]);

export const employeesInCore = core.table("employees", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	profileId: uuid("profile_id").notNull(),
	employeeId: text("employee_id"),
	hireDate: date("hire_date"),
	terminationDate: date("termination_date"),
	status: text().default('active'),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by"),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_employees_deleted_at").using("btree", table.deletedAt.asc().nullsLast().op("timestamptz_ops")).where(sql`(deleted_at IS NULL)`),
	index("idx_employees_profile_id").using("btree", table.profileId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [profilesInCore.id],
			name: "employees_profile_id_fkey"
		}).onDelete("cascade"),
	unique("employees_employee_id_key").on(table.employeeId),
]);

export const notificationPreferencesInCore = core.table("notification_preferences", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	notificationType: text("notification_type").notNull(),
	enabled: boolean().default(true).notNull(),
	emailEnabled: boolean("email_enabled").default(false).notNull(),
	whatsappEnabled: boolean("whatsapp_enabled").default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_notification_preferences_user_id").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	unique("notification_preferences_user_id_notification_type_key").on(table.userId, table.notificationType),
]);

export const notificationsInCore = core.table("notifications", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	type: text().notNull(),
	title: text().notNull(),
	message: text().notNull(),
	entityType: text("entity_type"),
	entityId: uuid("entity_id"),
	readAt: timestamp("read_at", { withTimezone: true, mode: 'string' }),
	actionUrl: text("action_url"),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_notifications_created_at").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")).where(sql`(deleted_at IS NULL)`),
	index("idx_notifications_entity").using("btree", table.entityType.asc().nullsLast().op("text_ops"), table.entityId.asc().nullsLast().op("text_ops")).where(sql`(deleted_at IS NULL)`),
	index("idx_notifications_read").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.readAt.asc().nullsLast().op("text_ops")).where(sql`(deleted_at IS NULL)`),
	index("idx_notifications_type").using("btree", table.type.asc().nullsLast().op("text_ops")).where(sql`(deleted_at IS NULL)`),
	index("idx_notifications_user_id").using("btree", table.userId.asc().nullsLast().op("text_ops")).where(sql`(deleted_at IS NULL)`),
]);

export const productCollectionsInCrm = crm.table("product_collections", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	productId: uuid("product_id").notNull(),
	collectionId: uuid("collection_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by"),
}, (table) => [
	index("idx_product_collections_collection").using("btree", table.collectionId.asc().nullsLast().op("uuid_ops")),
	index("idx_product_collections_product").using("btree", table.productId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.collectionId],
			foreignColumns: [collectionsInCrm.id],
			name: "product_collections_collection_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [productsInCrm.id],
			name: "product_collections_product_id_fkey"
		}).onDelete("cascade"),
	unique("product_collections_product_id_collection_id_key").on(table.productId, table.collectionId),
]);

export const contactsInCore = core.table("contacts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	email: text(),
	phone: text(),
	contactType: text("contact_type").default('person'),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by"),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_contacts_deleted_at").using("btree", table.deletedAt.asc().nullsLast().op("timestamptz_ops")).where(sql`(deleted_at IS NULL)`),
	index("idx_contacts_email").using("btree", table.email.asc().nullsLast().op("text_ops")).where(sql`(email IS NOT NULL)`),
]);

export const profilesInCore = core.table("profiles", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	firstName: text("first_name"),
	lastName: text("last_name"),
	email: text(),
	phone: text(),
	departmentId: uuid("department_id"),
	avatarUrl: text("avatar_url"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by"),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_profiles_deleted_at").using("btree", table.deletedAt.asc().nullsLast().op("timestamptz_ops")).where(sql`(deleted_at IS NULL)`),
	index("idx_profiles_department_id").using("btree", table.departmentId.asc().nullsLast().op("uuid_ops")),
	index("idx_profiles_user_id").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.departmentId],
			foreignColumns: [departmentsInCore.id],
			name: "profiles_department_id_fkey"
		}).onDelete("set null"),
	unique("profiles_user_id_key").on(table.userId),
]);

export const productVariantsInCrm = crm.table("product_variants", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	productId: uuid("product_id").notNull(),
	name: text().notNull(),
	sku: text(),
	price: numeric({ precision: 15, scale:  2 }),
	costPrice: numeric("cost_price", { precision: 15, scale:  2 }),
	stockQuantity: integer("stock_quantity").default(0),
	attributes: jsonb().default({}),
	imageUrl: text("image_url"),
	isDefault: boolean("is_default").default(false),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by"),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_product_variants_product").using("btree", table.productId.asc().nullsLast().op("uuid_ops")),
	index("idx_product_variants_sku").using("btree", table.sku.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [productsInCrm.id],
			name: "product_variants_product_id_fkey"
		}).onDelete("cascade"),
	unique("product_variants_sku_key").on(table.sku),
]);

export const productsInCrm = crm.table("products", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	sku: text(),
	description: text(),
	category: text(),
	brand: text(),
	supplierId: uuid("supplier_id"),
	manufacturerId: uuid("manufacturer_id"),
	basePrice: numeric("base_price", { precision: 15, scale:  2 }),
	currency: text().default('USD'),
	costPrice: numeric("cost_price", { precision: 15, scale:  2 }),
	imageUrl: text("image_url"),
	images: text().array().default([""]),
	tags: text().array().default([""]),
	meta: jsonb().default({}),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by"),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_products_active").using("btree", table.isActive.asc().nullsLast().op("bool_ops")).where(sql`(deleted_at IS NULL)`),
	index("idx_products_category").using("btree", table.category.asc().nullsLast().op("text_ops")),
	index("idx_products_manufacturer").using("btree", table.manufacturerId.asc().nullsLast().op("uuid_ops")),
	index("idx_products_sku").using("btree", table.sku.asc().nullsLast().op("text_ops")),
	index("idx_products_supplier").using("btree", table.supplierId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.manufacturerId],
			foreignColumns: [companiesInCore.id],
			name: "products_manufacturer_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.supplierId],
			foreignColumns: [contactsInCore.id],
			name: "products_supplier_id_fkey"
		}).onDelete("set null"),
	unique("products_sku_key").on(table.sku),
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

export const moduleRecordsInCore = core.table("module_records", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	moduleId: uuid("module_id").notNull(),
	data: jsonb().default({}).notNull(),
	status: text().default('active'),
	meta: jsonb().default({}),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by"),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_module_records_module").using("btree", table.moduleId.asc().nullsLast().op("uuid_ops")),
	index("idx_module_records_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.moduleId],
			foreignColumns: [modulesInCore.id],
			name: "module_records_module_id_fkey"
		}).onDelete("cascade"),
	check("module_records_status_check", sql`status = ANY (ARRAY['active'::text, 'archived'::text, 'deleted'::text])`),
]);

export const permissionsInCore = core.table("permissions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	resource: text().notNull(),
	action: text().notNull(),
	moduleId: uuid("module_id"),
	description: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_permissions_module_id").using("btree", table.moduleId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.moduleId],
			foreignColumns: [modulesInCore.id],
			name: "permissions_module_id_fkey"
		}).onDelete("set null"),
	unique("permissions_name_key").on(table.name),
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

export const activityEventsInCore = core.table("activity_events", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	entityType: text("entity_type").notNull(),
	entityId: uuid("entity_id").notNull(),
	action: text().notNull(),
	metadata: jsonb(),
	createdBy: text("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_activity_events_created_at").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_activity_events_entity").using("btree", table.entityType.asc().nullsLast().op("text_ops"), table.entityId.asc().nullsLast().op("text_ops")),
]);

export const companyContactsInCore = core.table("company_contacts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id").notNull(),
	contactId: uuid("contact_id").notNull(),
	role: text(),
	isPrimary: boolean("is_primary").default(false),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by"),
}, (table) => [
	index("idx_company_contacts_company_id").using("btree", table.companyId.asc().nullsLast().op("uuid_ops")),
	index("idx_company_contacts_contact_id").using("btree", table.contactId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companiesInCore.id],
			name: "company_contacts_company_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.contactId],
			foreignColumns: [contactsInCore.id],
			name: "company_contacts_contact_id_fkey"
		}).onDelete("cascade"),
	unique("company_contacts_company_id_contact_id_key").on(table.companyId, table.contactId),
]);

export const enumRegistryInCore = core.table("enum_registry", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	category: text().notNull(),
	key: text().notNull(),
	label: text().notNull(),
	orderNo: integer("order_no").default(0),
	description: text(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_enum_registry_category").using("btree", table.category.asc().nullsLast().op("text_ops")),
	index("idx_enum_registry_category_key").using("btree", table.category.asc().nullsLast().op("text_ops"), table.key.asc().nullsLast().op("text_ops")),
	unique("enum_registry_category_key_key").on(table.category, table.key),
]);

export const departmentsInCore = core.table("departments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by"),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
});

export const modulesInCore = core.table("modules", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	orderNo: integer("order_no").default(0),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("modules_name_key").on(table.name),
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

export const rolePermissionsInCore = core.table("role_permissions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	roleId: uuid("role_id").notNull(),
	permissionId: uuid("permission_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_role_permissions_permission_id").using("btree", table.permissionId.asc().nullsLast().op("uuid_ops")),
	index("idx_role_permissions_role_id").using("btree", table.roleId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.permissionId],
			foreignColumns: [permissionsInCore.id],
			name: "role_permissions_permission_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.roleId],
			foreignColumns: [rolesInCore.id],
			name: "role_permissions_role_id_fkey"
		}).onDelete("cascade"),
	unique("role_permissions_role_id_permission_id_key").on(table.roleId, table.permissionId),
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

export const opportunitiesInCrm = crm.table("opportunities", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	leadId: uuid("lead_id").notNull(),
	pipelineId: uuid("pipeline_id"),
	stageId: uuid("stage_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by"),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_opportunities_deleted_at").using("btree", table.deletedAt.asc().nullsLast().op("timestamptz_ops")).where(sql`(deleted_at IS NULL)`),
	index("idx_opportunities_lead_id").using("btree", table.leadId.asc().nullsLast().op("uuid_ops")),
	index("idx_opportunities_pipeline_id").using("btree", table.pipelineId.asc().nullsLast().op("uuid_ops")),
	index("idx_opportunities_stage_id").using("btree", table.stageId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.leadId],
			foreignColumns: [leadsInCrm.id],
			name: "opportunities_lead_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.pipelineId],
			foreignColumns: [pipelinesInCrm.id],
			name: "opportunities_pipeline_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.stageId],
			foreignColumns: [stagesInCrm.id],
			name: "opportunities_stage_id_fkey"
		}).onDelete("set null"),
	unique("opportunities_lead_id_key").on(table.leadId),
]);

export const pipelinesInCrm = crm.table("pipelines", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	isDefault: boolean("is_default").default(false),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by"),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_pipelines_deleted_at").using("btree", table.deletedAt.asc().nullsLast().op("timestamptz_ops")).where(sql`(deleted_at IS NULL)`),
]);

export const statusHistoryInCrm = crm.table("status_history", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	leadId: uuid("lead_id").notNull(),
	status: text().notNull(),
	previousStatus: text("previous_status"),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by"),
}, (table) => [
	index("idx_status_history_created_at").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_status_history_lead_id").using("btree", table.leadId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.leadId],
			foreignColumns: [leadsInCrm.id],
			name: "status_history_lead_id_fkey"
		}).onDelete("cascade"),
]);

export const aiAgentsInCore = core.table("ai_agents", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	systemPrompt: text("system_prompt").notNull(),
	tone: text(),
	guidance: text(),
	model: text(),
	maxTokens: integer("max_tokens").default(2000),
	temperature: numeric({ precision: 3, scale:  2 }).default('0.7'),
	isDefault: boolean("is_default").default(false),
	isActive: boolean("is_active").default(true),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by"),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
	iconUrl: text("icon_url"),
}, (table) => [
	index("idx_ai_agents_deleted_at").using("btree", table.deletedAt.asc().nullsLast().op("timestamptz_ops")).where(sql`(deleted_at IS NULL)`),
	index("idx_ai_agents_is_active").using("btree", table.isActive.asc().nullsLast().op("bool_ops")).where(sql`((is_active = true) AND (deleted_at IS NULL))`),
	index("idx_ai_agents_is_default").using("btree", table.isDefault.asc().nullsLast().op("bool_ops")).where(sql`((is_default = true) AND (deleted_at IS NULL))`),
	unique("ai_agents_name_key").on(table.name),
]);

export const announcementViewsInCore = core.table("announcement_views", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	announcementId: uuid("announcement_id").notNull(),
	userId: text("user_id").notNull(),
	viewedAt: timestamp("viewed_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	dismissedAt: timestamp("dismissed_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_announcement_views_announcement").using("btree", table.announcementId.asc().nullsLast().op("uuid_ops")),
	index("idx_announcement_views_user").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.announcementId],
			foreignColumns: [announcementsInCore.id],
			name: "announcement_views_announcement_id_fkey"
		}).onDelete("cascade"),
	unique("announcement_views_announcement_id_user_id_key").on(table.announcementId, table.userId),
]);

export const announcementsInCore = core.table("announcements", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: text().notNull(),
	message: text().notNull(),
	announcementType: text("announcement_type").default('info'),
	priority: text().default('normal'),
	isActive: boolean("is_active").default(true),
	startDate: timestamp("start_date", { withTimezone: true, mode: 'string' }),
	endDate: timestamp("end_date", { withTimezone: true, mode: 'string' }),
	targetAudience: text("target_audience").default('all'),
	targetRoles: text("target_roles").array().default([""]),
	targetDepartments: uuid("target_departments").array().default([""]),
	dismissible: boolean().default(true),
	actionUrl: text("action_url"),
	actionLabel: text("action_label"),
	viewCount: integer("view_count").default(0),
	meta: jsonb().default({}),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by"),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
	verticalId: uuid("vertical_id"),
}, (table) => [
	index("idx_announcements_active").using("btree", table.isActive.asc().nullsLast().op("bool_ops")).where(sql`(deleted_at IS NULL)`),
	index("idx_announcements_dates").using("btree", table.startDate.asc().nullsLast().op("timestamptz_ops"), table.endDate.asc().nullsLast().op("timestamptz_ops")),
	index("idx_announcements_vertical").using("btree", table.verticalId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.verticalId],
			foreignColumns: [verticalsInCore.id],
			name: "announcements_vertical_id_fkey"
		}).onDelete("set null"),
	check("announcements_announcement_type_check", sql`announcement_type = ANY (ARRAY['info'::text, 'warning'::text, 'success'::text, 'error'::text, 'maintenance'::text])`),
	check("announcements_priority_check", sql`priority = ANY (ARRAY['low'::text, 'normal'::text, 'high'::text, 'urgent'::text])`),
	check("announcements_target_audience_check", sql`target_audience = ANY (ARRAY['all'::text, 'admin'::text, 'employee'::text, 'specific'::text])`),
]);

export const moduleFieldsInCore = core.table("module_fields", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	moduleId: uuid("module_id").notNull(),
	name: text().notNull(),
	label: text().notNull(),
	fieldType: text("field_type").notNull(),
	isRequired: boolean("is_required").default(false),
	defaultValue: text("default_value"),
	options: jsonb().default([]),
	validationRules: jsonb("validation_rules").default({}),
	orderNo: integer("order_no").default(0),
	isActive: boolean("is_active").default(true),
	meta: jsonb().default({}),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by"),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_module_fields_active").using("btree", table.isActive.asc().nullsLast().op("bool_ops")).where(sql`(deleted_at IS NULL)`),
	index("idx_module_fields_module").using("btree", table.moduleId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.moduleId],
			foreignColumns: [modulesInCore.id],
			name: "module_fields_module_id_fkey"
		}).onDelete("cascade"),
	check("module_fields_field_type_check", sql`field_type = ANY (ARRAY['text'::text, 'textarea'::text, 'number'::text, 'email'::text, 'phone'::text, 'date'::text, 'datetime'::text, 'boolean'::text, 'select'::text, 'multiselect'::text, 'file'::text, 'url'::text, 'json'::text])`),
]);

export const moduleRecordAssignmentsInCore = core.table("module_record_assignments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	recordId: uuid("record_id").notNull(),
	profileId: uuid("profile_id"),
	teamId: uuid("team_id"),
	role: text().default('viewer'),
	assignedAt: timestamp("assigned_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	assignedBy: text("assigned_by"),
}, (table) => [
	index("idx_module_record_assignments_profile").using("btree", table.profileId.asc().nullsLast().op("uuid_ops")),
	index("idx_module_record_assignments_record").using("btree", table.recordId.asc().nullsLast().op("uuid_ops")),
	index("idx_module_record_assignments_team").using("btree", table.teamId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [profilesInCore.id],
			name: "module_record_assignments_profile_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.recordId],
			foreignColumns: [moduleRecordsInCore.id],
			name: "module_record_assignments_record_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.teamId],
			foreignColumns: [teamsInCore.id],
			name: "module_record_assignments_team_id_fkey"
		}).onDelete("cascade"),
	check("module_record_assignments_check", sql`((profile_id IS NOT NULL) AND (team_id IS NULL)) OR ((profile_id IS NULL) AND (team_id IS NOT NULL))`),
	check("module_record_assignments_role_check", sql`role = ANY (ARRAY['viewer'::text, 'editor'::text, 'owner'::text])`),
]);

export const quotationStatusHistoryInCrm = crm.table("quotation_status_history", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	quotationId: uuid("quotation_id").notNull(),
	status: text().notNull(),
	previousStatus: text("previous_status"),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by"),
}, (table) => [
	index("idx_quotation_status_history_quotation").using("btree", table.quotationId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.quotationId],
			foreignColumns: [quotationsInCrm.id],
			name: "quotation_status_history_quotation_id_fkey"
		}).onDelete("cascade"),
]);

export const callNotesInCrm = crm.table("call_notes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	callId: uuid("call_id").notNull(),
	noteType: text("note_type").default('general'),
	content: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by"),
}, (table) => [
	index("idx_call_notes_call").using("btree", table.callId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.callId],
			foreignColumns: [callsInCrm.id],
			name: "call_notes_call_id_fkey"
		}).onDelete("cascade"),
	check("call_notes_note_type_check", sql`note_type = ANY (ARRAY['general'::text, 'transcript'::text, 'summary'::text, 'action_items'::text])`),
]);

export const quotationsInCrm = crm.table("quotations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	leadId: uuid("lead_id").notNull(),
	quoteNumber: text("quote_number").notNull(),
	title: text(),
	description: text(),
	totalAmount: numeric("total_amount", { precision: 15, scale:  2 }).notNull(),
	currency: text().default('USD'),
	taxAmount: numeric("tax_amount", { precision: 15, scale:  2 }).default('0'),
	discountAmount: numeric("discount_amount", { precision: 15, scale:  2 }).default('0'),
	status: text().default('draft'),
	validUntil: date("valid_until"),
	items: jsonb().default([]),
	terms: text(),
	notes: text(),
	pdfUrl: text("pdf_url"),
	meta: jsonb().default({}),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by"),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_quotations_created_at").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_quotations_lead").using("btree", table.leadId.asc().nullsLast().op("uuid_ops")),
	index("idx_quotations_quote_number").using("btree", table.quoteNumber.asc().nullsLast().op("text_ops")),
	index("idx_quotations_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.leadId],
			foreignColumns: [leadsInCrm.id],
			name: "quotations_lead_id_fkey"
		}).onDelete("cascade"),
	unique("quotations_quote_number_key").on(table.quoteNumber),
	check("quotations_status_check", sql`status = ANY (ARRAY['draft'::text, 'sent'::text, 'viewed'::text, 'accepted'::text, 'rejected'::text, 'expired'::text, 'cancelled'::text])`),
]);

export const stagesInCrm = crm.table("stages", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	pipelineId: uuid("pipeline_id").notNull(),
	name: text().notNull(),
	orderNo: integer("order_no").default(0).notNull(),
	description: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_stages_order").using("btree", table.pipelineId.asc().nullsLast().op("int4_ops"), table.orderNo.asc().nullsLast().op("uuid_ops")),
	index("idx_stages_pipeline_id").using("btree", table.pipelineId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.pipelineId],
			foreignColumns: [pipelinesInCrm.id],
			name: "stages_pipeline_id_fkey"
		}).onDelete("cascade"),
	unique("stages_pipeline_id_order_no_key").on(table.pipelineId, table.orderNo),
]);

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
export const aiAgents = pgView("ai_agents", {	id: uuid(),
	name: text(),
	description: text(),
	systemPrompt: text("system_prompt"),
	tone: text(),
	guidance: text(),
	model: text(),
	maxTokens: integer("max_tokens"),
	temperature: numeric({ precision: 3, scale:  2 }),
	isActive: boolean("is_active"),
	isDefault: boolean("is_default"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	createdBy: text("created_by"),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}).as(sql`SELECT id, name, description, system_prompt, tone, guidance, model, max_tokens, temperature, is_active, is_default, created_at, updated_at, created_by, deleted_at FROM core.ai_agents`);

export const roles = pgView("roles", {	id: uuid(),
	name: text(),
	description: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}).as(sql`SELECT id, name, description, created_at, updated_at, deleted_at FROM core.roles`);

export const enumRegistry = pgView("enum_registry", {	id: uuid(),
	category: text(),
	key: text(),
	label: text(),
	orderNo: integer("order_no"),
	description: text(),
	isActive: boolean("is_active"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}).as(sql`SELECT id, category, key, label, order_no, description, is_active, created_at, updated_at FROM core.enum_registry`);

export const departments = pgView("departments", {	id: uuid(),
	name: text(),
	description: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	createdBy: text("created_by"),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}).as(sql`SELECT id, name, description, created_at, updated_at, created_by, deleted_at FROM core.departments`);

export const tasks = pgView("tasks", {	id: uuid(),
	title: text(),
	description: text(),
	priority: text(),
	status: text(),
	departmentId: uuid("department_id"),
	verticalKey: text("vertical_key"),
	dueDate: timestamp("due_date", { withTimezone: true, mode: 'string' }),
	createdBy: text("created_by"),
	updatedBy: text("updated_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
	estimatedDuration: integer("estimated_duration"),
	importantLinks: jsonb("important_links"),
	isStarred: boolean("is_starred"),
	position: integer(),
}).as(sql`SELECT id, title, description, priority, status, department_id, vertical_key, due_date, created_by, updated_by, created_at, updated_at, deleted_at, estimated_duration, important_links, is_starred, "position" FROM common_util.tasks`);

export const taskAssignees = pgView("task_assignees", {	id: uuid(),
	taskId: uuid("task_id"),
	profileId: uuid("profile_id"),
	role: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }),
}).as(sql`SELECT id, task_id, profile_id, role, created_at FROM common_util.task_assignees`);

export const leads = pgView("leads", {	id: uuid(),
	contactId: uuid("contact_id"),
	companyId: uuid("company_id"),
	ownerId: uuid("owner_id"),
	status: text(),
	source: text(),
	value: numeric({ precision: 12, scale:  2 }),
	probability: integer(),
	expectedCloseDate: date("expected_close_date"),
	notes: text(),
	tags: text(),
	meta: jsonb(),
	verticalId: uuid("vertical_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	createdBy: text("created_by"),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}).as(sql`SELECT id, contact_id, company_id, owner_id, status, source, value, probability, expected_close_date, notes, tags, meta, vertical_id, created_at, updated_at, created_by, deleted_at FROM crm.leads`);

export const profiles = pgView("profiles", {	id: uuid(),
	userId: text("user_id"),
	firstName: text("first_name"),
	lastName: text("last_name"),
	email: text(),
	phone: text(),
	departmentId: uuid("department_id"),
	avatarUrl: text("avatar_url"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	createdBy: text("created_by"),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}).as(sql`SELECT id, user_id, first_name, last_name, email, phone, department_id, avatar_url, created_at, updated_at, created_by, deleted_at FROM core.profiles`);

export const userRoleBindings = pgView("user_role_bindings", {	id: uuid(),
	userId: text("user_id"),
	roleId: uuid("role_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	createdBy: text("created_by"),
}).as(sql`SELECT id, user_id, role_id, created_at, created_by FROM core.user_role_bindings`);

export const notifications = pgView("notifications", {	id: uuid(),
	userId: text("user_id"),
	type: text(),
	title: text(),
	message: text(),
	entityType: text("entity_type"),
	entityId: uuid("entity_id"),
	actionUrl: text("action_url"),
	metadata: jsonb(),
	readAt: timestamp("read_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}).as(sql`SELECT id, user_id, type, title, message, entity_type, entity_id, action_url, metadata, read_at, created_at, deleted_at FROM core.notifications`);

export const notificationPreferences = pgView("notification_preferences", {	id: uuid(),
	userId: text("user_id"),
	notificationType: text("notification_type"),
	enabled: boolean(),
	emailEnabled: boolean("email_enabled"),
	whatsappEnabled: boolean("whatsapp_enabled"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}).as(sql`SELECT id, user_id, notification_type, enabled, email_enabled, whatsapp_enabled, created_at, updated_at FROM core.notification_preferences`);

export const employees = pgView("employees", {	id: uuid(),
	profileId: uuid("profile_id"),
	employeeId: text("employee_id"),
	hireDate: date("hire_date"),
	terminationDate: date("termination_date"),
	status: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	createdBy: text("created_by"),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}).as(sql`SELECT id, profile_id, employee_id, hire_date, termination_date, status, created_at, updated_at, created_by, deleted_at FROM core.employees`);