/**
 * Drizzle ORM Schema
 * 
 * This file exports all schema definitions for the database.
 * 
 * Schemas are organized by domain:
 * - core: Foundation tables (profiles, contacts, companies, RBAC, etc.)
 * - crm: Sales and lead management
 * - ats: Applicant tracking system
 * - ops: Operations and order management
 * - common_util: Shared utilities (tasks, SOPs, files, etc.)
 * - import_ops: Import business vertical
 * - hr: Human resources management
 */

// Core schema (foundation)
export * from './core'

// CRM schema
export * from './crm'

// Common utilities schema
export * from './common_util'

// HR schema
export * from './hr'

// ATS schema (if exists)
// export * from "./ats" // No tables yet

// Ops schema (if exists)
// export * from "./ops" // No tables yet

// Import Ops schema (if exists)
// export * from "./import_ops" // No tables yet
