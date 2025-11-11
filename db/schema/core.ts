/**
 * CORE Schema
 * 
 * Auto-generated from database introspection.
 * Contains 24 tables from the core schema.
 */

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
