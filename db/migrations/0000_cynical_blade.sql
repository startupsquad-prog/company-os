-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE SCHEMA "common_util";
--> statement-breakpoint
CREATE SCHEMA "crm";
--> statement-breakpoint
CREATE SCHEMA "core";
--> statement-breakpoint
CREATE SCHEMA "hr";
--> statement-breakpoint
CREATE SCHEMA "ats";
--> statement-breakpoint
CREATE SCHEMA "import_ops";
--> statement-breakpoint
CREATE SCHEMA "ops";
--> statement-breakpoint
CREATE TABLE "core"."roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"module_id" uuid,
	"is_system" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "roles_name_key" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "core"."user_role_bindings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"role_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	CONSTRAINT "user_role_bindings_user_id_role_id_key" UNIQUE("user_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "core"."user_verticals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"vertical_id" uuid NOT NULL,
	"role_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	CONSTRAINT "user_verticals_user_id_vertical_id_key" UNIQUE("user_id","vertical_id")
);
--> statement-breakpoint
CREATE TABLE "crm"."calls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid,
	"contact_id" uuid,
	"caller_id" uuid,
	"call_type" text NOT NULL,
	"direction" text,
	"phone_number" text,
	"duration_seconds" integer DEFAULT 0,
	"status" text DEFAULT 'completed',
	"outcome" text,
	"subject" text,
	"notes" text,
	"recording_url" text,
	"scheduled_at" timestamp with time zone,
	"started_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"meta" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "calls_call_type_check" CHECK (call_type = ANY (ARRAY['inbound'::text, 'outbound'::text, 'missed'::text])),
	CONSTRAINT "calls_direction_check" CHECK (direction = ANY (ARRAY['incoming'::text, 'outgoing'::text])),
	CONSTRAINT "calls_status_check" CHECK (status = ANY (ARRAY['completed'::text, 'no_answer'::text, 'busy'::text, 'failed'::text, 'cancelled'::text]))
);
--> statement-breakpoint
CREATE TABLE "common_util"."password_vault_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"document_type" text,
	"document_number_encrypted" text,
	"issuer" text,
	"issue_date" date,
	"expiry_date" date,
	"file_url" text,
	"file_name" text,
	"category" text,
	"company_id" uuid,
	"notes" text,
	"tags" text[],
	"is_favorite" boolean DEFAULT false,
	"last_accessed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "password_vault_documents_document_type_check" CHECK (document_type = ANY (ARRAY['passport'::text, 'license'::text, 'certificate'::text, 'contract'::text, 'other'::text]))
);
--> statement-breakpoint
ALTER TABLE "common_util"."password_vault_documents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "common_util"."password_vault_passwords" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"username" text,
	"password_encrypted" text NOT NULL,
	"url" text,
	"category" text,
	"company_id" uuid,
	"notes" text,
	"tags" text[],
	"is_favorite" boolean DEFAULT false,
	"last_accessed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "common_util"."password_vault_passwords" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "common_util"."task_assignees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"role" text DEFAULT 'collaborator' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "task_assignees_task_id_profile_id_key" UNIQUE("task_id","profile_id"),
	CONSTRAINT "task_assignees_role_check" CHECK (role = ANY (ARRAY['owner'::text, 'collaborator'::text, 'watcher'::text]))
);
--> statement-breakpoint
CREATE TABLE "common_util"."ticket_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"assignee_id" uuid NOT NULL,
	"role" text DEFAULT 'assignee',
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"assigned_by" text,
	CONSTRAINT "ticket_assignments_ticket_id_assignee_id_key" UNIQUE("ticket_id","assignee_id"),
	CONSTRAINT "ticket_assignments_role_check" CHECK (role = ANY (ARRAY['assignee'::text, 'watcher'::text, 'collaborator'::text]))
);
--> statement-breakpoint
CREATE TABLE "common_util"."ticket_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"content" text NOT NULL,
	"is_internal" boolean DEFAULT false,
	"attachments" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "common_util"."tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_number" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"client_id" uuid,
	"client_email" text,
	"client_name" text,
	"status" text DEFAULT 'new',
	"priority" text DEFAULT 'medium',
	"category" text,
	"assignee_id" uuid,
	"due_date" timestamp with time zone,
	"resolution" text,
	"resolved_at" timestamp with time zone,
	"resolved_by" uuid,
	"meta" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "tickets_ticket_number_key" UNIQUE("ticket_number"),
	CONSTRAINT "tickets_priority_check" CHECK (priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text])),
	CONSTRAINT "tickets_status_check" CHECK (status = ANY (ARRAY['new'::text, 'open'::text, 'in_progress'::text, 'waiting'::text, 'resolved'::text, 'closed'::text, 'cancelled'::text]))
);
--> statement-breakpoint
CREATE TABLE "crm"."collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"image_url" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "crm"."interactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"type" text NOT NULL,
	"subject" text,
	"notes" text,
	"scheduled_at" timestamp with time zone,
	"duration_minutes" integer,
	"outcome" text,
	"meta" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "interactions_type_check" CHECK (type = ANY (ARRAY['call'::text, 'email'::text, 'meeting'::text, 'note'::text, 'task'::text]))
);
--> statement-breakpoint
CREATE TABLE "core"."companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"legal_name" text,
	"tax_id" text,
	"website" text,
	"industry" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "core"."teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"department_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "core"."verticals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "verticals_code_key" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "common_util"."password_vault_cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"cardholder_name" text,
	"card_number_encrypted" text NOT NULL,
	"expiry_month" integer,
	"expiry_year" integer,
	"cvv_encrypted" text,
	"card_type" text,
	"bank_name" text NOT NULL,
	"billing_address" text,
	"category" text,
	"company_id" uuid,
	"notes" text,
	"tags" text[],
	"is_favorite" boolean DEFAULT false,
	"last_accessed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "password_vault_cards_card_type_check" CHECK (card_type = ANY (ARRAY['debit'::text, 'credit'::text])),
	CONSTRAINT "password_vault_cards_expiry_month_check" CHECK ((expiry_month >= 1) AND (expiry_month <= 12)),
	CONSTRAINT "password_vault_cards_expiry_year_check" CHECK (expiry_year >= 2024)
);
--> statement-breakpoint
ALTER TABLE "common_util"."password_vault_cards" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "crm"."leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contact_id" uuid,
	"company_id" uuid,
	"owner_id" uuid,
	"status" text DEFAULT 'new' NOT NULL,
	"source" text,
	"value" numeric(12, 2),
	"probability" integer DEFAULT 0,
	"expected_close_date" date,
	"notes" text,
	"tags" text[],
	"meta" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"deleted_at" timestamp with time zone,
	"vertical_id" uuid,
	CONSTRAINT "leads_probability_check" CHECK ((probability >= 0) AND (probability <= 100)),
	CONSTRAINT "leads_status_check" CHECK (status = ANY (ARRAY['new'::text, 'contacted'::text, 'qualified'::text, 'proposal'::text, 'negotiation'::text, 'won'::text, 'lost'::text]))
);
--> statement-breakpoint
CREATE TABLE "core"."employees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"employee_id" text,
	"hire_date" date,
	"termination_date" date,
	"status" text DEFAULT 'active',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "employees_employee_id_key" UNIQUE("employee_id")
);
--> statement-breakpoint
CREATE TABLE "core"."notification_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"notification_type" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"email_enabled" boolean DEFAULT false NOT NULL,
	"whatsapp_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_preferences_user_id_notification_type_key" UNIQUE("user_id","notification_type")
);
--> statement-breakpoint
CREATE TABLE "core"."notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"entity_type" text,
	"entity_id" uuid,
	"read_at" timestamp with time zone,
	"action_url" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "crm"."product_collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"collection_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	CONSTRAINT "product_collections_product_id_collection_id_key" UNIQUE("product_id","collection_id")
);
--> statement-breakpoint
CREATE TABLE "core"."contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"contact_type" text DEFAULT 'person',
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "core"."profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"email" text,
	"phone" text,
	"department_id" uuid,
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "profiles_user_id_key" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "crm"."product_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"name" text NOT NULL,
	"sku" text,
	"price" numeric(15, 2),
	"cost_price" numeric(15, 2),
	"stock_quantity" integer DEFAULT 0,
	"attributes" jsonb DEFAULT '{}'::jsonb,
	"image_url" text,
	"is_default" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "product_variants_sku_key" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "crm"."products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"sku" text,
	"description" text,
	"category" text,
	"brand" text,
	"supplier_id" uuid,
	"manufacturer_id" uuid,
	"base_price" numeric(15, 2),
	"currency" text DEFAULT 'USD',
	"cost_price" numeric(15, 2),
	"image_url" text,
	"images" text[] DEFAULT '{""}',
	"tags" text[] DEFAULT '{""}',
	"meta" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "products_sku_key" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "common_util"."message_thread_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"last_read_at" timestamp with time zone,
	"is_muted" boolean DEFAULT false,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "message_thread_participants_thread_id_profile_id_key" UNIQUE("thread_id","profile_id")
);
--> statement-breakpoint
CREATE TABLE "common_util"."event_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"status" text DEFAULT 'pending',
	"response_at" timestamp with time zone,
	CONSTRAINT "event_participants_event_id_profile_id_key" UNIQUE("event_id","profile_id"),
	CONSTRAINT "event_participants_status_check" CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'declined'::text, 'tentative'::text]))
);
--> statement-breakpoint
CREATE TABLE "common_util"."events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"event_type" text DEFAULT 'meeting',
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"all_day" boolean DEFAULT false,
	"location" text,
	"organizer_id" uuid NOT NULL,
	"lead_id" uuid,
	"status" text DEFAULT 'scheduled',
	"reminder_minutes" integer[],
	"meta" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "events_event_type_check" CHECK (event_type = ANY (ARRAY['meeting'::text, 'call'::text, 'task'::text, 'reminder'::text, 'other'::text])),
	CONSTRAINT "events_status_check" CHECK (status = ANY (ARRAY['scheduled'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text]))
);
--> statement-breakpoint
CREATE TABLE "common_util"."messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"content" text NOT NULL,
	"message_type" text DEFAULT 'text',
	"file_url" text,
	"file_name" text,
	"file_size" bigint,
	"is_edited" boolean DEFAULT false,
	"edited_at" timestamp with time zone,
	"meta" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "messages_message_type_check" CHECK (message_type = ANY (ARRAY['text'::text, 'file'::text, 'system'::text]))
);
--> statement-breakpoint
CREATE TABLE "common_util"."task_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"from_status" text,
	"to_status" text NOT NULL,
	"changed_by" text,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "core"."module_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"module_id" uuid NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" text DEFAULT 'active',
	"meta" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "module_records_status_check" CHECK (status = ANY (ARRAY['active'::text, 'archived'::text, 'deleted'::text]))
);
--> statement-breakpoint
CREATE TABLE "core"."permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"resource" text NOT NULL,
	"action" text NOT NULL,
	"module_id" uuid,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "permissions_name_key" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "common_util"."tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"priority" text,
	"status" text,
	"department_id" uuid,
	"vertical_key" text,
	"due_date" timestamp with time zone,
	"created_by" text,
	"updated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"estimated_duration" integer,
	"important_links" jsonb DEFAULT '[]'::jsonb,
	"is_starred" boolean DEFAULT false,
	"position" integer DEFAULT 0,
	"vertical_id" uuid
);
--> statement-breakpoint
CREATE TABLE "core"."activity_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"action" text NOT NULL,
	"metadata" jsonb,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "core"."company_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"contact_id" uuid NOT NULL,
	"role" text,
	"is_primary" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	CONSTRAINT "company_contacts_company_id_contact_id_key" UNIQUE("company_id","contact_id")
);
--> statement-breakpoint
CREATE TABLE "core"."enum_registry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" text NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"order_no" integer DEFAULT 0,
	"description" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "enum_registry_category_key_key" UNIQUE("category","key")
);
--> statement-breakpoint
CREATE TABLE "core"."departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "core"."modules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"order_no" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "modules_name_key" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "common_util"."document_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"can_view" boolean DEFAULT true,
	"can_download" boolean DEFAULT true,
	"can_edit" boolean DEFAULT false,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"assigned_by" text,
	CONSTRAINT "document_assignments_document_id_profile_id_key" UNIQUE("document_id","profile_id")
);
--> statement-breakpoint
CREATE TABLE "common_util"."documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"file_name" text NOT NULL,
	"file_url" text NOT NULL,
	"file_size" bigint,
	"mime_type" text,
	"category" text,
	"status" text DEFAULT 'active',
	"download_count" integer DEFAULT 0,
	"view_count" integer DEFAULT 0,
	"meta" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "documents_status_check" CHECK (status = ANY (ARRAY['active'::text, 'archived'::text, 'deleted'::text]))
);
--> statement-breakpoint
CREATE TABLE "common_util"."message_threads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject" text,
	"thread_type" text DEFAULT 'direct',
	"lead_id" uuid,
	"last_message_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "message_threads_thread_type_check" CHECK (thread_type = ANY (ARRAY['direct'::text, 'group'::text, 'lead'::text]))
);
--> statement-breakpoint
CREATE TABLE "common_util"."task_deliverables" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"title" text NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "core"."role_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role_id" uuid NOT NULL,
	"permission_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "role_permissions_role_id_permission_id_key" UNIQUE("role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "common_util"."ticket_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"status" text NOT NULL,
	"previous_status" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text
);
--> statement-breakpoint
CREATE TABLE "common_util"."task_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"author_id" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "common_util"."task_subtasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"title" text NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "common_util"."task_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"file_name" text NOT NULL,
	"file_path" text NOT NULL,
	"file_size" bigint NOT NULL,
	"mime_type" text,
	"uploaded_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "common_util"."subscription_renewals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subscription_id" uuid NOT NULL,
	"renewal_date" date NOT NULL,
	"amount" numeric(15, 2),
	"currency" text DEFAULT 'USD',
	"billing_cycle" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text
);
--> statement-breakpoint
CREATE TABLE "common_util"."subscription_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subscription_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"access_level" text DEFAULT 'user',
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	"added_by" text,
	CONSTRAINT "subscription_users_subscription_id_profile_id_key" UNIQUE("subscription_id","profile_id"),
	CONSTRAINT "subscription_users_access_level_check" CHECK (access_level = ANY (ARRAY['admin'::text, 'user'::text, 'viewer'::text]))
);
--> statement-breakpoint
CREATE TABLE "common_util"."subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subscription_name" text NOT NULL,
	"vendor_id" uuid,
	"vendor_name" text,
	"plan_tier" text,
	"cost_per_period" numeric(15, 2),
	"cost_per_user" numeric(15, 2),
	"billing_cycle" text,
	"currency" text DEFAULT 'USD',
	"auto_renewal_status" text DEFAULT 'enabled',
	"owner_id" uuid,
	"team_id" uuid,
	"start_date" date,
	"expiry_date" date,
	"renewal_date" date,
	"status" text DEFAULT 'active',
	"number_of_users" integer DEFAULT 1,
	"portal_url" text,
	"category" text,
	"notes" text,
	"credentials_encrypted" jsonb,
	"meta" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"deleted_at" timestamp with time zone,
	"icon_url" text,
	CONSTRAINT "subscriptions_auto_renewal_status_check" CHECK (auto_renewal_status = ANY (ARRAY['enabled'::text, 'disabled'::text, 'cancelled'::text])),
	CONSTRAINT "subscriptions_billing_cycle_check" CHECK (billing_cycle = ANY (ARRAY['monthly'::text, 'quarterly'::text, 'yearly'::text, 'one_time'::text])),
	CONSTRAINT "subscriptions_status_check" CHECK (status = ANY (ARRAY['active'::text, 'expired'::text, 'cancelled'::text, 'pending'::text, 'trial'::text]))
);
--> statement-breakpoint
CREATE TABLE "crm"."opportunities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"pipeline_id" uuid,
	"stage_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "opportunities_lead_id_key" UNIQUE("lead_id")
);
--> statement-breakpoint
CREATE TABLE "crm"."pipelines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "crm"."status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"status" text NOT NULL,
	"previous_status" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text
);
--> statement-breakpoint
CREATE TABLE "core"."ai_agents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"system_prompt" text NOT NULL,
	"tone" text,
	"guidance" text,
	"model" text,
	"max_tokens" integer DEFAULT 2000,
	"temperature" numeric(3, 2) DEFAULT '0.7',
	"is_default" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"deleted_at" timestamp with time zone,
	"icon_url" text,
	CONSTRAINT "ai_agents_name_key" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "core"."announcement_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"announcement_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"viewed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"dismissed_at" timestamp with time zone,
	CONSTRAINT "announcement_views_announcement_id_user_id_key" UNIQUE("announcement_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "core"."announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"announcement_type" text DEFAULT 'info',
	"priority" text DEFAULT 'normal',
	"is_active" boolean DEFAULT true,
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"target_audience" text DEFAULT 'all',
	"target_roles" text[] DEFAULT '{""}',
	"target_departments" uuid[] DEFAULT '{""}',
	"dismissible" boolean DEFAULT true,
	"action_url" text,
	"action_label" text,
	"view_count" integer DEFAULT 0,
	"meta" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"deleted_at" timestamp with time zone,
	"vertical_id" uuid,
	CONSTRAINT "announcements_announcement_type_check" CHECK (announcement_type = ANY (ARRAY['info'::text, 'warning'::text, 'success'::text, 'error'::text, 'maintenance'::text])),
	CONSTRAINT "announcements_priority_check" CHECK (priority = ANY (ARRAY['low'::text, 'normal'::text, 'high'::text, 'urgent'::text])),
	CONSTRAINT "announcements_target_audience_check" CHECK (target_audience = ANY (ARRAY['all'::text, 'admin'::text, 'employee'::text, 'specific'::text]))
);
--> statement-breakpoint
CREATE TABLE "core"."module_fields" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"module_id" uuid NOT NULL,
	"name" text NOT NULL,
	"label" text NOT NULL,
	"field_type" text NOT NULL,
	"is_required" boolean DEFAULT false,
	"default_value" text,
	"options" jsonb DEFAULT '[]'::jsonb,
	"validation_rules" jsonb DEFAULT '{}'::jsonb,
	"order_no" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"meta" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "module_fields_field_type_check" CHECK (field_type = ANY (ARRAY['text'::text, 'textarea'::text, 'number'::text, 'email'::text, 'phone'::text, 'date'::text, 'datetime'::text, 'boolean'::text, 'select'::text, 'multiselect'::text, 'file'::text, 'url'::text, 'json'::text]))
);
--> statement-breakpoint
CREATE TABLE "core"."module_record_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"record_id" uuid NOT NULL,
	"profile_id" uuid,
	"team_id" uuid,
	"role" text DEFAULT 'viewer',
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"assigned_by" text,
	CONSTRAINT "module_record_assignments_check" CHECK (((profile_id IS NOT NULL) AND (team_id IS NULL)) OR ((profile_id IS NULL) AND (team_id IS NOT NULL))),
	CONSTRAINT "module_record_assignments_role_check" CHECK (role = ANY (ARRAY['viewer'::text, 'editor'::text, 'owner'::text]))
);
--> statement-breakpoint
CREATE TABLE "crm"."quotation_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quotation_id" uuid NOT NULL,
	"status" text NOT NULL,
	"previous_status" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text
);
--> statement-breakpoint
CREATE TABLE "crm"."call_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"call_id" uuid NOT NULL,
	"note_type" text DEFAULT 'general',
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	CONSTRAINT "call_notes_note_type_check" CHECK (note_type = ANY (ARRAY['general'::text, 'transcript'::text, 'summary'::text, 'action_items'::text]))
);
--> statement-breakpoint
CREATE TABLE "crm"."quotations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"quote_number" text NOT NULL,
	"title" text,
	"description" text,
	"total_amount" numeric(15, 2) NOT NULL,
	"currency" text DEFAULT 'USD',
	"tax_amount" numeric(15, 2) DEFAULT '0',
	"discount_amount" numeric(15, 2) DEFAULT '0',
	"status" text DEFAULT 'draft',
	"valid_until" date,
	"items" jsonb DEFAULT '[]'::jsonb,
	"terms" text,
	"notes" text,
	"pdf_url" text,
	"meta" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "quotations_quote_number_key" UNIQUE("quote_number"),
	CONSTRAINT "quotations_status_check" CHECK (status = ANY (ARRAY['draft'::text, 'sent'::text, 'viewed'::text, 'accepted'::text, 'rejected'::text, 'expired'::text, 'cancelled'::text]))
);
--> statement-breakpoint
CREATE TABLE "crm"."stages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pipeline_id" uuid NOT NULL,
	"name" text NOT NULL,
	"order_no" integer DEFAULT 0 NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stages_pipeline_id_order_no_key" UNIQUE("pipeline_id","order_no")
);
--> statement-breakpoint
CREATE TABLE "hr"."attendance_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"record_type" text NOT NULL,
	"timestamp" timestamp with time zone NOT NULL,
	"location" text,
	"device_info" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	CONSTRAINT "attendance_records_record_type_check" CHECK (record_type = ANY (ARRAY['check_in'::text, 'check_out'::text, 'break_start'::text, 'break_end'::text, 'manual_entry'::text]))
);
--> statement-breakpoint
CREATE TABLE "hr"."attendance_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"date" date NOT NULL,
	"check_in_time" timestamp with time zone,
	"check_out_time" timestamp with time zone,
	"break_duration_minutes" integer DEFAULT 0,
	"total_hours" numeric(5, 2),
	"status" text DEFAULT 'pending',
	"notes" text,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"meta" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "attendance_sessions_employee_id_date_key" UNIQUE("employee_id","date"),
	CONSTRAINT "attendance_sessions_status_check" CHECK (status = ANY (ARRAY['pending'::text, 'present'::text, 'absent'::text, 'half_day'::text, 'leave'::text, 'holiday'::text]))
);
--> statement-breakpoint
CREATE TABLE "hr"."leave_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"leave_type" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"days_count" numeric(5, 2) NOT NULL,
	"reason" text,
	"status" text DEFAULT 'pending',
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"rejection_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "leave_requests_leave_type_check" CHECK (leave_type = ANY (ARRAY['sick'::text, 'vacation'::text, 'personal'::text, 'maternity'::text, 'paternity'::text, 'other'::text])),
	CONSTRAINT "leave_requests_status_check" CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'cancelled'::text]))
);
--> statement-breakpoint
ALTER TABLE "core"."roles" ADD CONSTRAINT "roles_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "core"."modules"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."user_role_bindings" ADD CONSTRAINT "user_role_bindings_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "core"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."user_verticals" ADD CONSTRAINT "user_verticals_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "core"."roles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."user_verticals" ADD CONSTRAINT "user_verticals_vertical_id_fkey" FOREIGN KEY ("vertical_id") REFERENCES "core"."verticals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm"."calls" ADD CONSTRAINT "calls_caller_id_fkey" FOREIGN KEY ("caller_id") REFERENCES "core"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm"."calls" ADD CONSTRAINT "calls_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "core"."contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm"."calls" ADD CONSTRAINT "calls_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "crm"."leads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common_util"."password_vault_documents" ADD CONSTRAINT "password_vault_documents_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common_util"."password_vault_passwords" ADD CONSTRAINT "password_vault_passwords_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common_util"."task_assignees" ADD CONSTRAINT "task_assignees_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "core"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common_util"."task_assignees" ADD CONSTRAINT "task_assignees_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "common_util"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common_util"."ticket_assignments" ADD CONSTRAINT "ticket_assignments_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "core"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common_util"."ticket_assignments" ADD CONSTRAINT "ticket_assignments_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "common_util"."tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common_util"."ticket_comments" ADD CONSTRAINT "ticket_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "core"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common_util"."ticket_comments" ADD CONSTRAINT "ticket_comments_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "common_util"."tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common_util"."tickets" ADD CONSTRAINT "tickets_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "core"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common_util"."tickets" ADD CONSTRAINT "tickets_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "core"."contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common_util"."tickets" ADD CONSTRAINT "tickets_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "core"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."teams" ADD CONSTRAINT "teams_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "core"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common_util"."password_vault_cards" ADD CONSTRAINT "password_vault_cards_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm"."leads" ADD CONSTRAINT "leads_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm"."leads" ADD CONSTRAINT "leads_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "core"."contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm"."leads" ADD CONSTRAINT "leads_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "core"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm"."leads" ADD CONSTRAINT "leads_vertical_id_fkey" FOREIGN KEY ("vertical_id") REFERENCES "core"."verticals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."employees" ADD CONSTRAINT "employees_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "core"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm"."product_collections" ADD CONSTRAINT "product_collections_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "crm"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm"."product_collections" ADD CONSTRAINT "product_collections_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "crm"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."profiles" ADD CONSTRAINT "profiles_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "core"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm"."product_variants" ADD CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "crm"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm"."products" ADD CONSTRAINT "products_manufacturer_id_fkey" FOREIGN KEY ("manufacturer_id") REFERENCES "core"."companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm"."products" ADD CONSTRAINT "products_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "core"."contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common_util"."message_thread_participants" ADD CONSTRAINT "message_thread_participants_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "core"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common_util"."message_thread_participants" ADD CONSTRAINT "message_thread_participants_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "common_util"."message_threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common_util"."event_participants" ADD CONSTRAINT "event_participants_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "common_util"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common_util"."event_participants" ADD CONSTRAINT "event_participants_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "core"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common_util"."events" ADD CONSTRAINT "events_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "crm"."leads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common_util"."events" ADD CONSTRAINT "events_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "core"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common_util"."messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "core"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common_util"."messages" ADD CONSTRAINT "messages_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "common_util"."message_threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common_util"."task_status_history" ADD CONSTRAINT "task_status_history_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "common_util"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."module_records" ADD CONSTRAINT "module_records_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "core"."modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."permissions" ADD CONSTRAINT "permissions_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "core"."modules"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common_util"."tasks" ADD CONSTRAINT "tasks_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "core"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common_util"."tasks" ADD CONSTRAINT "tasks_vertical_id_fkey" FOREIGN KEY ("vertical_id") REFERENCES "core"."verticals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."company_contacts" ADD CONSTRAINT "company_contacts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."company_contacts" ADD CONSTRAINT "company_contacts_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "core"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common_util"."document_assignments" ADD CONSTRAINT "document_assignments_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "common_util"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common_util"."document_assignments" ADD CONSTRAINT "document_assignments_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "core"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common_util"."message_threads" ADD CONSTRAINT "message_threads_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "crm"."leads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common_util"."task_deliverables" ADD CONSTRAINT "task_deliverables_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "common_util"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "core"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "core"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common_util"."ticket_status_history" ADD CONSTRAINT "ticket_status_history_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "common_util"."tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common_util"."task_comments" ADD CONSTRAINT "task_comments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "common_util"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common_util"."task_subtasks" ADD CONSTRAINT "task_subtasks_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "common_util"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common_util"."task_attachments" ADD CONSTRAINT "task_attachments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "common_util"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common_util"."subscription_renewals" ADD CONSTRAINT "subscription_renewals_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "common_util"."subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common_util"."subscription_users" ADD CONSTRAINT "subscription_users_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "core"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common_util"."subscription_users" ADD CONSTRAINT "subscription_users_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "common_util"."subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common_util"."subscriptions" ADD CONSTRAINT "subscriptions_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "core"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common_util"."subscriptions" ADD CONSTRAINT "subscriptions_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "core"."teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "common_util"."subscriptions" ADD CONSTRAINT "subscriptions_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "core"."contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm"."opportunities" ADD CONSTRAINT "opportunities_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "crm"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm"."opportunities" ADD CONSTRAINT "opportunities_pipeline_id_fkey" FOREIGN KEY ("pipeline_id") REFERENCES "crm"."pipelines"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm"."opportunities" ADD CONSTRAINT "opportunities_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "crm"."stages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm"."status_history" ADD CONSTRAINT "status_history_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "crm"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."announcement_views" ADD CONSTRAINT "announcement_views_announcement_id_fkey" FOREIGN KEY ("announcement_id") REFERENCES "core"."announcements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."announcements" ADD CONSTRAINT "announcements_vertical_id_fkey" FOREIGN KEY ("vertical_id") REFERENCES "core"."verticals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."module_fields" ADD CONSTRAINT "module_fields_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "core"."modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."module_record_assignments" ADD CONSTRAINT "module_record_assignments_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "core"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."module_record_assignments" ADD CONSTRAINT "module_record_assignments_record_id_fkey" FOREIGN KEY ("record_id") REFERENCES "core"."module_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."module_record_assignments" ADD CONSTRAINT "module_record_assignments_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "core"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm"."quotation_status_history" ADD CONSTRAINT "quotation_status_history_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "crm"."quotations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm"."call_notes" ADD CONSTRAINT "call_notes_call_id_fkey" FOREIGN KEY ("call_id") REFERENCES "crm"."calls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm"."quotations" ADD CONSTRAINT "quotations_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "crm"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm"."stages" ADD CONSTRAINT "stages_pipeline_id_fkey" FOREIGN KEY ("pipeline_id") REFERENCES "crm"."pipelines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr"."attendance_records" ADD CONSTRAINT "attendance_records_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "hr"."attendance_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr"."attendance_sessions" ADD CONSTRAINT "attendance_sessions_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "core"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr"."attendance_sessions" ADD CONSTRAINT "attendance_sessions_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "core"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr"."leave_requests" ADD CONSTRAINT "leave_requests_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "core"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr"."leave_requests" ADD CONSTRAINT "leave_requests_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "core"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_roles_module_id" ON "core"."roles" USING btree ("module_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_user_role_bindings_role_id" ON "core"."user_role_bindings" USING btree ("role_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_user_role_bindings_user_id" ON "core"."user_role_bindings" USING btree ("user_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_user_verticals_user" ON "core"."user_verticals" USING btree ("user_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_user_verticals_vertical" ON "core"."user_verticals" USING btree ("vertical_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_calls_caller" ON "crm"."calls" USING btree ("caller_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_calls_contact" ON "crm"."calls" USING btree ("contact_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_calls_created_at" ON "crm"."calls" USING btree ("created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_calls_lead" ON "crm"."calls" USING btree ("lead_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_calls_scheduled_at" ON "crm"."calls" USING btree ("scheduled_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_calls_status" ON "crm"."calls" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_calls_type" ON "crm"."calls" USING btree ("call_type" text_ops);--> statement-breakpoint
CREATE INDEX "idx_password_vault_documents_category" ON "common_util"."password_vault_documents" USING btree ("category" text_ops);--> statement-breakpoint
CREATE INDEX "idx_password_vault_documents_company" ON "common_util"."password_vault_documents" USING btree ("company_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_password_vault_documents_created_by" ON "common_util"."password_vault_documents" USING btree ("created_by" text_ops);--> statement-breakpoint
CREATE INDEX "idx_password_vault_documents_deleted" ON "common_util"."password_vault_documents" USING btree ("deleted_at" timestamptz_ops) WHERE (deleted_at IS NULL);--> statement-breakpoint
CREATE INDEX "idx_password_vault_documents_expiry" ON "common_util"."password_vault_documents" USING btree ("expiry_date" date_ops);--> statement-breakpoint
CREATE INDEX "idx_password_vault_documents_favorite" ON "common_util"."password_vault_documents" USING btree ("is_favorite" bool_ops);--> statement-breakpoint
CREATE INDEX "idx_password_vault_passwords_category" ON "common_util"."password_vault_passwords" USING btree ("category" text_ops);--> statement-breakpoint
CREATE INDEX "idx_password_vault_passwords_company" ON "common_util"."password_vault_passwords" USING btree ("company_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_password_vault_passwords_created_by" ON "common_util"."password_vault_passwords" USING btree ("created_by" text_ops);--> statement-breakpoint
CREATE INDEX "idx_password_vault_passwords_deleted" ON "common_util"."password_vault_passwords" USING btree ("deleted_at" timestamptz_ops) WHERE (deleted_at IS NULL);--> statement-breakpoint
CREATE INDEX "idx_password_vault_passwords_favorite" ON "common_util"."password_vault_passwords" USING btree ("is_favorite" bool_ops);--> statement-breakpoint
CREATE INDEX "idx_task_assignees_profile_id" ON "common_util"."task_assignees" USING btree ("profile_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_task_assignees_role" ON "common_util"."task_assignees" USING btree ("role" text_ops);--> statement-breakpoint
CREATE INDEX "idx_task_assignees_task_id" ON "common_util"."task_assignees" USING btree ("task_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_ticket_assignments_assignee" ON "common_util"."ticket_assignments" USING btree ("assignee_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_ticket_assignments_ticket" ON "common_util"."ticket_assignments" USING btree ("ticket_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_ticket_comments_author" ON "common_util"."ticket_comments" USING btree ("author_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_ticket_comments_ticket" ON "common_util"."ticket_comments" USING btree ("ticket_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_tickets_assignee" ON "common_util"."tickets" USING btree ("assignee_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_tickets_client" ON "common_util"."tickets" USING btree ("client_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_tickets_priority" ON "common_util"."tickets" USING btree ("priority" text_ops);--> statement-breakpoint
CREATE INDEX "idx_tickets_status" ON "common_util"."tickets" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_tickets_ticket_number" ON "common_util"."tickets" USING btree ("ticket_number" text_ops);--> statement-breakpoint
CREATE INDEX "idx_interactions_created_at" ON "crm"."interactions" USING btree ("created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_interactions_deleted_at" ON "crm"."interactions" USING btree ("deleted_at" timestamptz_ops) WHERE (deleted_at IS NULL);--> statement-breakpoint
CREATE INDEX "idx_interactions_entity" ON "crm"."interactions" USING btree ("entity_type" uuid_ops,"entity_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_interactions_type" ON "crm"."interactions" USING btree ("type" text_ops);--> statement-breakpoint
CREATE INDEX "idx_companies_deleted_at" ON "core"."companies" USING btree ("deleted_at" timestamptz_ops) WHERE (deleted_at IS NULL);--> statement-breakpoint
CREATE INDEX "idx_password_vault_cards_category" ON "common_util"."password_vault_cards" USING btree ("category" text_ops);--> statement-breakpoint
CREATE INDEX "idx_password_vault_cards_company" ON "common_util"."password_vault_cards" USING btree ("company_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_password_vault_cards_created_by" ON "common_util"."password_vault_cards" USING btree ("created_by" text_ops);--> statement-breakpoint
CREATE INDEX "idx_password_vault_cards_deleted" ON "common_util"."password_vault_cards" USING btree ("deleted_at" timestamptz_ops) WHERE (deleted_at IS NULL);--> statement-breakpoint
CREATE INDEX "idx_password_vault_cards_expiry" ON "common_util"."password_vault_cards" USING btree ("expiry_year" int4_ops,"expiry_month" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_password_vault_cards_favorite" ON "common_util"."password_vault_cards" USING btree ("is_favorite" bool_ops);--> statement-breakpoint
CREATE INDEX "idx_crm_leads_vertical" ON "crm"."leads" USING btree ("vertical_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_leads_company_id" ON "crm"."leads" USING btree ("company_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_leads_contact_id" ON "crm"."leads" USING btree ("contact_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_leads_created_at" ON "crm"."leads" USING btree ("created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_leads_deleted_at" ON "crm"."leads" USING btree ("deleted_at" timestamptz_ops) WHERE (deleted_at IS NULL);--> statement-breakpoint
CREATE INDEX "idx_leads_owner_id" ON "crm"."leads" USING btree ("owner_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_leads_source" ON "crm"."leads" USING btree ("source" text_ops);--> statement-breakpoint
CREATE INDEX "idx_leads_status" ON "crm"."leads" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_employees_deleted_at" ON "core"."employees" USING btree ("deleted_at" timestamptz_ops) WHERE (deleted_at IS NULL);--> statement-breakpoint
CREATE INDEX "idx_employees_profile_id" ON "core"."employees" USING btree ("profile_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_notification_preferences_user_id" ON "core"."notification_preferences" USING btree ("user_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_notifications_created_at" ON "core"."notifications" USING btree ("created_at" timestamptz_ops) WHERE (deleted_at IS NULL);--> statement-breakpoint
CREATE INDEX "idx_notifications_entity" ON "core"."notifications" USING btree ("entity_type" text_ops,"entity_id" text_ops) WHERE (deleted_at IS NULL);--> statement-breakpoint
CREATE INDEX "idx_notifications_read" ON "core"."notifications" USING btree ("user_id" text_ops,"read_at" text_ops) WHERE (deleted_at IS NULL);--> statement-breakpoint
CREATE INDEX "idx_notifications_type" ON "core"."notifications" USING btree ("type" text_ops) WHERE (deleted_at IS NULL);--> statement-breakpoint
CREATE INDEX "idx_notifications_user_id" ON "core"."notifications" USING btree ("user_id" text_ops) WHERE (deleted_at IS NULL);--> statement-breakpoint
CREATE INDEX "idx_product_collections_collection" ON "crm"."product_collections" USING btree ("collection_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_product_collections_product" ON "crm"."product_collections" USING btree ("product_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_contacts_deleted_at" ON "core"."contacts" USING btree ("deleted_at" timestamptz_ops) WHERE (deleted_at IS NULL);--> statement-breakpoint
CREATE INDEX "idx_contacts_email" ON "core"."contacts" USING btree ("email" text_ops) WHERE (email IS NOT NULL);--> statement-breakpoint
CREATE INDEX "idx_profiles_deleted_at" ON "core"."profiles" USING btree ("deleted_at" timestamptz_ops) WHERE (deleted_at IS NULL);--> statement-breakpoint
CREATE INDEX "idx_profiles_department_id" ON "core"."profiles" USING btree ("department_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_profiles_user_id" ON "core"."profiles" USING btree ("user_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_product_variants_product" ON "crm"."product_variants" USING btree ("product_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_product_variants_sku" ON "crm"."product_variants" USING btree ("sku" text_ops);--> statement-breakpoint
CREATE INDEX "idx_products_active" ON "crm"."products" USING btree ("is_active" bool_ops) WHERE (deleted_at IS NULL);--> statement-breakpoint
CREATE INDEX "idx_products_category" ON "crm"."products" USING btree ("category" text_ops);--> statement-breakpoint
CREATE INDEX "idx_products_manufacturer" ON "crm"."products" USING btree ("manufacturer_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_products_sku" ON "crm"."products" USING btree ("sku" text_ops);--> statement-breakpoint
CREATE INDEX "idx_products_supplier" ON "crm"."products" USING btree ("supplier_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_message_thread_participants_profile" ON "common_util"."message_thread_participants" USING btree ("profile_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_message_thread_participants_thread" ON "common_util"."message_thread_participants" USING btree ("thread_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_event_participants_event" ON "common_util"."event_participants" USING btree ("event_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_event_participants_profile" ON "common_util"."event_participants" USING btree ("profile_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_events_lead" ON "common_util"."events" USING btree ("lead_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_events_organizer" ON "common_util"."events" USING btree ("organizer_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_events_start_time" ON "common_util"."events" USING btree ("start_time" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_events_status" ON "common_util"."events" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_messages_created_at" ON "common_util"."messages" USING btree ("created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_messages_sender" ON "common_util"."messages" USING btree ("sender_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_messages_thread" ON "common_util"."messages" USING btree ("thread_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_task_status_history_changed_at" ON "common_util"."task_status_history" USING btree ("changed_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_task_status_history_task_id" ON "common_util"."task_status_history" USING btree ("task_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_module_records_module" ON "core"."module_records" USING btree ("module_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_module_records_status" ON "core"."module_records" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_permissions_module_id" ON "core"."permissions" USING btree ("module_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_tasks_created_by" ON "common_util"."tasks" USING btree ("created_by" text_ops);--> statement-breakpoint
CREATE INDEX "idx_tasks_deleted_at" ON "common_util"."tasks" USING btree ("deleted_at" timestamptz_ops) WHERE (deleted_at IS NULL);--> statement-breakpoint
CREATE INDEX "idx_tasks_department_id" ON "common_util"."tasks" USING btree ("department_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_tasks_due_date" ON "common_util"."tasks" USING btree ("due_date" timestamptz_ops) WHERE ((deleted_at IS NULL) AND (due_date IS NOT NULL));--> statement-breakpoint
CREATE INDEX "idx_tasks_is_starred" ON "common_util"."tasks" USING btree ("is_starred" bool_ops) WHERE ((is_starred = true) AND (deleted_at IS NULL));--> statement-breakpoint
CREATE INDEX "idx_tasks_priority" ON "common_util"."tasks" USING btree ("priority" text_ops) WHERE (deleted_at IS NULL);--> statement-breakpoint
CREATE INDEX "idx_tasks_status" ON "common_util"."tasks" USING btree ("status" text_ops) WHERE (deleted_at IS NULL);--> statement-breakpoint
CREATE INDEX "idx_tasks_status_position" ON "common_util"."tasks" USING btree ("status" int4_ops,"position" text_ops) WHERE (deleted_at IS NULL);--> statement-breakpoint
CREATE INDEX "idx_tasks_updated_by" ON "common_util"."tasks" USING btree ("updated_by" text_ops);--> statement-breakpoint
CREATE INDEX "idx_tasks_vertical" ON "common_util"."tasks" USING btree ("vertical_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_tasks_vertical_key" ON "common_util"."tasks" USING btree ("vertical_key" text_ops) WHERE (vertical_key IS NOT NULL);--> statement-breakpoint
CREATE INDEX "idx_activity_events_created_at" ON "core"."activity_events" USING btree ("created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_activity_events_entity" ON "core"."activity_events" USING btree ("entity_type" text_ops,"entity_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_company_contacts_company_id" ON "core"."company_contacts" USING btree ("company_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_company_contacts_contact_id" ON "core"."company_contacts" USING btree ("contact_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_enum_registry_category" ON "core"."enum_registry" USING btree ("category" text_ops);--> statement-breakpoint
CREATE INDEX "idx_enum_registry_category_key" ON "core"."enum_registry" USING btree ("category" text_ops,"key" text_ops);--> statement-breakpoint
CREATE INDEX "idx_document_assignments_document" ON "common_util"."document_assignments" USING btree ("document_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_document_assignments_profile" ON "common_util"."document_assignments" USING btree ("profile_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_documents_category" ON "common_util"."documents" USING btree ("category" text_ops);--> statement-breakpoint
CREATE INDEX "idx_documents_status" ON "common_util"."documents" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_message_threads_last_message" ON "common_util"."message_threads" USING btree ("last_message_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_message_threads_lead" ON "common_util"."message_threads" USING btree ("lead_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_task_deliverables_position" ON "common_util"."task_deliverables" USING btree ("task_id" int4_ops,"position" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_task_deliverables_task_id" ON "common_util"."task_deliverables" USING btree ("task_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_role_permissions_permission_id" ON "core"."role_permissions" USING btree ("permission_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_role_permissions_role_id" ON "core"."role_permissions" USING btree ("role_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_ticket_status_history_ticket" ON "common_util"."ticket_status_history" USING btree ("ticket_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_task_comments_author_id" ON "common_util"."task_comments" USING btree ("author_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_task_comments_created_at" ON "common_util"."task_comments" USING btree ("created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_task_comments_task_id" ON "common_util"."task_comments" USING btree ("task_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_task_subtasks_position" ON "common_util"."task_subtasks" USING btree ("task_id" int4_ops,"position" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_task_subtasks_task_id" ON "common_util"."task_subtasks" USING btree ("task_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_task_attachments_task_id" ON "common_util"."task_attachments" USING btree ("task_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_task_attachments_uploaded_by" ON "common_util"."task_attachments" USING btree ("uploaded_by" text_ops);--> statement-breakpoint
CREATE INDEX "idx_subscription_renewals_date" ON "common_util"."subscription_renewals" USING btree ("renewal_date" date_ops);--> statement-breakpoint
CREATE INDEX "idx_subscription_renewals_subscription" ON "common_util"."subscription_renewals" USING btree ("subscription_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_subscription_users_profile" ON "common_util"."subscription_users" USING btree ("profile_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_subscription_users_subscription" ON "common_util"."subscription_users" USING btree ("subscription_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_subscriptions_category" ON "common_util"."subscriptions" USING btree ("category" text_ops);--> statement-breakpoint
CREATE INDEX "idx_subscriptions_expiry_date" ON "common_util"."subscriptions" USING btree ("expiry_date" date_ops);--> statement-breakpoint
CREATE INDEX "idx_subscriptions_owner" ON "common_util"."subscriptions" USING btree ("owner_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_subscriptions_renewal_date" ON "common_util"."subscriptions" USING btree ("renewal_date" date_ops);--> statement-breakpoint
CREATE INDEX "idx_subscriptions_status" ON "common_util"."subscriptions" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_subscriptions_team" ON "common_util"."subscriptions" USING btree ("team_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_subscriptions_vendor" ON "common_util"."subscriptions" USING btree ("vendor_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_opportunities_deleted_at" ON "crm"."opportunities" USING btree ("deleted_at" timestamptz_ops) WHERE (deleted_at IS NULL);--> statement-breakpoint
CREATE INDEX "idx_opportunities_lead_id" ON "crm"."opportunities" USING btree ("lead_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_opportunities_pipeline_id" ON "crm"."opportunities" USING btree ("pipeline_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_opportunities_stage_id" ON "crm"."opportunities" USING btree ("stage_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_pipelines_deleted_at" ON "crm"."pipelines" USING btree ("deleted_at" timestamptz_ops) WHERE (deleted_at IS NULL);--> statement-breakpoint
CREATE INDEX "idx_status_history_created_at" ON "crm"."status_history" USING btree ("created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_status_history_lead_id" ON "crm"."status_history" USING btree ("lead_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_ai_agents_deleted_at" ON "core"."ai_agents" USING btree ("deleted_at" timestamptz_ops) WHERE (deleted_at IS NULL);--> statement-breakpoint
CREATE INDEX "idx_ai_agents_is_active" ON "core"."ai_agents" USING btree ("is_active" bool_ops) WHERE ((is_active = true) AND (deleted_at IS NULL));--> statement-breakpoint
CREATE INDEX "idx_ai_agents_is_default" ON "core"."ai_agents" USING btree ("is_default" bool_ops) WHERE ((is_default = true) AND (deleted_at IS NULL));--> statement-breakpoint
CREATE INDEX "idx_announcement_views_announcement" ON "core"."announcement_views" USING btree ("announcement_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_announcement_views_user" ON "core"."announcement_views" USING btree ("user_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_announcements_active" ON "core"."announcements" USING btree ("is_active" bool_ops) WHERE (deleted_at IS NULL);--> statement-breakpoint
CREATE INDEX "idx_announcements_dates" ON "core"."announcements" USING btree ("start_date" timestamptz_ops,"end_date" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_announcements_vertical" ON "core"."announcements" USING btree ("vertical_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_module_fields_active" ON "core"."module_fields" USING btree ("is_active" bool_ops) WHERE (deleted_at IS NULL);--> statement-breakpoint
CREATE INDEX "idx_module_fields_module" ON "core"."module_fields" USING btree ("module_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_module_record_assignments_profile" ON "core"."module_record_assignments" USING btree ("profile_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_module_record_assignments_record" ON "core"."module_record_assignments" USING btree ("record_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_module_record_assignments_team" ON "core"."module_record_assignments" USING btree ("team_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_quotation_status_history_quotation" ON "crm"."quotation_status_history" USING btree ("quotation_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_call_notes_call" ON "crm"."call_notes" USING btree ("call_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_quotations_created_at" ON "crm"."quotations" USING btree ("created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_quotations_lead" ON "crm"."quotations" USING btree ("lead_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_quotations_quote_number" ON "crm"."quotations" USING btree ("quote_number" text_ops);--> statement-breakpoint
CREATE INDEX "idx_quotations_status" ON "crm"."quotations" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_stages_order" ON "crm"."stages" USING btree ("pipeline_id" int4_ops,"order_no" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_stages_pipeline_id" ON "crm"."stages" USING btree ("pipeline_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_attendance_records_session" ON "hr"."attendance_records" USING btree ("session_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_attendance_records_timestamp" ON "hr"."attendance_records" USING btree ("timestamp" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_attendance_sessions_date" ON "hr"."attendance_sessions" USING btree ("date" date_ops);--> statement-breakpoint
CREATE INDEX "idx_attendance_sessions_employee" ON "hr"."attendance_sessions" USING btree ("employee_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_attendance_sessions_status" ON "hr"."attendance_sessions" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_leave_requests_dates" ON "hr"."leave_requests" USING btree ("start_date" date_ops,"end_date" date_ops);--> statement-breakpoint
CREATE INDEX "idx_leave_requests_employee" ON "hr"."leave_requests" USING btree ("employee_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_leave_requests_status" ON "hr"."leave_requests" USING btree ("status" text_ops);--> statement-breakpoint
CREATE VIEW "public"."ai_agents" AS (SELECT id, name, description, system_prompt, tone, guidance, model, max_tokens, temperature, is_active, is_default, created_at, updated_at, created_by, deleted_at FROM core.ai_agents);--> statement-breakpoint
CREATE VIEW "public"."roles" AS (SELECT id, name, description, created_at, updated_at, deleted_at FROM core.roles);--> statement-breakpoint
CREATE VIEW "public"."enum_registry" AS (SELECT id, category, key, label, order_no, description, is_active, created_at, updated_at FROM core.enum_registry);--> statement-breakpoint
CREATE VIEW "public"."departments" AS (SELECT id, name, description, created_at, updated_at, created_by, deleted_at FROM core.departments);--> statement-breakpoint
CREATE VIEW "public"."tasks" AS (SELECT id, title, description, priority, status, department_id, vertical_key, due_date, created_by, updated_by, created_at, updated_at, deleted_at, estimated_duration, important_links, is_starred, "position" FROM common_util.tasks);--> statement-breakpoint
CREATE VIEW "public"."task_assignees" AS (SELECT id, task_id, profile_id, role, created_at FROM common_util.task_assignees);--> statement-breakpoint
CREATE VIEW "public"."leads" AS (SELECT id, contact_id, company_id, owner_id, status, source, value, probability, expected_close_date, notes, tags, meta, vertical_id, created_at, updated_at, created_by, deleted_at FROM crm.leads);--> statement-breakpoint
CREATE VIEW "public"."profiles" AS (SELECT id, user_id, first_name, last_name, email, phone, department_id, avatar_url, created_at, updated_at, created_by, deleted_at FROM core.profiles);--> statement-breakpoint
CREATE VIEW "public"."user_role_bindings" AS (SELECT id, user_id, role_id, created_at, created_by FROM core.user_role_bindings);--> statement-breakpoint
CREATE VIEW "public"."notifications" AS (SELECT id, user_id, type, title, message, entity_type, entity_id, action_url, metadata, read_at, created_at, deleted_at FROM core.notifications);--> statement-breakpoint
CREATE VIEW "public"."notification_preferences" AS (SELECT id, user_id, notification_type, enabled, email_enabled, whatsapp_enabled, created_at, updated_at FROM core.notification_preferences);--> statement-breakpoint
CREATE VIEW "public"."employees" AS (SELECT id, profile_id, employee_id, hire_date, termination_date, status, created_at, updated_at, created_by, deleted_at FROM core.employees);--> statement-breakpoint
CREATE POLICY "Users can view password vault documents" ON "common_util"."password_vault_documents" AS PERMISSIVE FOR SELECT TO public USING (((core.get_clerk_user_id() IS NOT NULL) AND (deleted_at IS NULL) AND (created_by = core.get_clerk_user_id())));--> statement-breakpoint
CREATE POLICY "Users can create password vault documents" ON "common_util"."password_vault_documents" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Users can update own password vault documents" ON "common_util"."password_vault_documents" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Users can delete own password vault documents" ON "common_util"."password_vault_documents" AS PERMISSIVE FOR DELETE TO public;--> statement-breakpoint
CREATE POLICY "Users can view password vault passwords" ON "common_util"."password_vault_passwords" AS PERMISSIVE FOR SELECT TO public USING (((core.get_clerk_user_id() IS NOT NULL) AND (deleted_at IS NULL) AND (created_by = core.get_clerk_user_id())));--> statement-breakpoint
CREATE POLICY "Users can create password vault passwords" ON "common_util"."password_vault_passwords" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Users can update own password vault passwords" ON "common_util"."password_vault_passwords" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Users can delete own password vault passwords" ON "common_util"."password_vault_passwords" AS PERMISSIVE FOR DELETE TO public;--> statement-breakpoint
CREATE POLICY "Users can view password vault cards" ON "common_util"."password_vault_cards" AS PERMISSIVE FOR SELECT TO public USING (((core.get_clerk_user_id() IS NOT NULL) AND (deleted_at IS NULL) AND (created_by = core.get_clerk_user_id())));--> statement-breakpoint
CREATE POLICY "Users can create password vault cards" ON "common_util"."password_vault_cards" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Users can update own password vault cards" ON "common_util"."password_vault_cards" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Users can delete own password vault cards" ON "common_util"."password_vault_cards" AS PERMISSIVE FOR DELETE TO public;
*/