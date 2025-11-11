/**
 * CRM Schema
 * 
 * Auto-generated from database introspection.
 * Contains 14 tables from the crm schema.
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
import { profilesInCore, contactsInCore, companiesInCore, verticalsInCore } from './core'

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
