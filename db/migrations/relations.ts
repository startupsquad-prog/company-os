import { relations } from "drizzle-orm/relations";
import { modulesInCore, rolesInCore, userRoleBindingsInCore, userVerticalsInCore, verticalsInCore, profilesInCore, callsInCrm, contactsInCore, leadsInCrm, companiesInCore, passwordVaultDocumentsInCommonUtil, passwordVaultPasswordsInCommonUtil, taskAssigneesInCommonUtil, tasksInCommonUtil, ticketAssignmentsInCommonUtil, ticketsInCommonUtil, ticketCommentsInCommonUtil, departmentsInCore, teamsInCore, passwordVaultCardsInCommonUtil, employeesInCore, collectionsInCrm, productCollectionsInCrm, productsInCrm, productVariantsInCrm, messageThreadParticipantsInCommonUtil, messageThreadsInCommonUtil, eventsInCommonUtil, eventParticipantsInCommonUtil, messagesInCommonUtil, taskStatusHistoryInCommonUtil, moduleRecordsInCore, permissionsInCore, companyContactsInCore, documentsInCommonUtil, documentAssignmentsInCommonUtil, taskDeliverablesInCommonUtil, rolePermissionsInCore, ticketStatusHistoryInCommonUtil, taskCommentsInCommonUtil, taskSubtasksInCommonUtil, taskAttachmentsInCommonUtil, subscriptionsInCommonUtil, subscriptionRenewalsInCommonUtil, subscriptionUsersInCommonUtil, opportunitiesInCrm, pipelinesInCrm, stagesInCrm, statusHistoryInCrm, announcementsInCore, announcementViewsInCore, moduleFieldsInCore, moduleRecordAssignmentsInCore, quotationsInCrm, quotationStatusHistoryInCrm, callNotesInCrm, attendanceSessionsInHr, attendanceRecordsInHr, leaveRequestsInHr } from "./schema";

export const rolesInCoreRelations = relations(rolesInCore, ({one, many}) => ({
	modulesInCore: one(modulesInCore, {
		fields: [rolesInCore.moduleId],
		references: [modulesInCore.id]
	}),
	userRoleBindingsInCores: many(userRoleBindingsInCore),
	userVerticalsInCores: many(userVerticalsInCore),
	rolePermissionsInCores: many(rolePermissionsInCore),
}));

export const modulesInCoreRelations = relations(modulesInCore, ({many}) => ({
	rolesInCores: many(rolesInCore),
	moduleRecordsInCores: many(moduleRecordsInCore),
	permissionsInCores: many(permissionsInCore),
	moduleFieldsInCores: many(moduleFieldsInCore),
}));

export const userRoleBindingsInCoreRelations = relations(userRoleBindingsInCore, ({one}) => ({
	rolesInCore: one(rolesInCore, {
		fields: [userRoleBindingsInCore.roleId],
		references: [rolesInCore.id]
	}),
}));

export const userVerticalsInCoreRelations = relations(userVerticalsInCore, ({one}) => ({
	rolesInCore: one(rolesInCore, {
		fields: [userVerticalsInCore.roleId],
		references: [rolesInCore.id]
	}),
	verticalsInCore: one(verticalsInCore, {
		fields: [userVerticalsInCore.verticalId],
		references: [verticalsInCore.id]
	}),
}));

export const verticalsInCoreRelations = relations(verticalsInCore, ({many}) => ({
	userVerticalsInCores: many(userVerticalsInCore),
	leadsInCrms: many(leadsInCrm),
	tasksInCommonUtils: many(tasksInCommonUtil),
	announcementsInCores: many(announcementsInCore),
}));

export const callsInCrmRelations = relations(callsInCrm, ({one, many}) => ({
	profilesInCore: one(profilesInCore, {
		fields: [callsInCrm.callerId],
		references: [profilesInCore.id]
	}),
	contactsInCore: one(contactsInCore, {
		fields: [callsInCrm.contactId],
		references: [contactsInCore.id]
	}),
	leadsInCrm: one(leadsInCrm, {
		fields: [callsInCrm.leadId],
		references: [leadsInCrm.id]
	}),
	callNotesInCrms: many(callNotesInCrm),
}));

export const profilesInCoreRelations = relations(profilesInCore, ({one, many}) => ({
	callsInCrms: many(callsInCrm),
	taskAssigneesInCommonUtils: many(taskAssigneesInCommonUtil),
	ticketAssignmentsInCommonUtils: many(ticketAssignmentsInCommonUtil),
	ticketCommentsInCommonUtils: many(ticketCommentsInCommonUtil),
	ticketsInCommonUtils_assigneeId: many(ticketsInCommonUtil, {
		relationName: "ticketsInCommonUtil_assigneeId_profilesInCore_id"
	}),
	ticketsInCommonUtils_resolvedBy: many(ticketsInCommonUtil, {
		relationName: "ticketsInCommonUtil_resolvedBy_profilesInCore_id"
	}),
	leadsInCrms: many(leadsInCrm),
	employeesInCores: many(employeesInCore),
	departmentsInCore: one(departmentsInCore, {
		fields: [profilesInCore.departmentId],
		references: [departmentsInCore.id]
	}),
	messageThreadParticipantsInCommonUtils: many(messageThreadParticipantsInCommonUtil),
	eventParticipantsInCommonUtils: many(eventParticipantsInCommonUtil),
	eventsInCommonUtils: many(eventsInCommonUtil),
	messagesInCommonUtils: many(messagesInCommonUtil),
	documentAssignmentsInCommonUtils: many(documentAssignmentsInCommonUtil),
	subscriptionUsersInCommonUtils: many(subscriptionUsersInCommonUtil),
	subscriptionsInCommonUtils: many(subscriptionsInCommonUtil),
	moduleRecordAssignmentsInCores: many(moduleRecordAssignmentsInCore),
	attendanceSessionsInHrs_approvedBy: many(attendanceSessionsInHr, {
		relationName: "attendanceSessionsInHr_approvedBy_profilesInCore_id"
	}),
	attendanceSessionsInHrs_employeeId: many(attendanceSessionsInHr, {
		relationName: "attendanceSessionsInHr_employeeId_profilesInCore_id"
	}),
	leaveRequestsInHrs_approvedBy: many(leaveRequestsInHr, {
		relationName: "leaveRequestsInHr_approvedBy_profilesInCore_id"
	}),
	leaveRequestsInHrs_employeeId: many(leaveRequestsInHr, {
		relationName: "leaveRequestsInHr_employeeId_profilesInCore_id"
	}),
}));

export const contactsInCoreRelations = relations(contactsInCore, ({many}) => ({
	callsInCrms: many(callsInCrm),
	ticketsInCommonUtils: many(ticketsInCommonUtil),
	leadsInCrms: many(leadsInCrm),
	productsInCrms: many(productsInCrm),
	companyContactsInCores: many(companyContactsInCore),
	subscriptionsInCommonUtils: many(subscriptionsInCommonUtil),
}));

export const leadsInCrmRelations = relations(leadsInCrm, ({one, many}) => ({
	callsInCrms: many(callsInCrm),
	companiesInCore: one(companiesInCore, {
		fields: [leadsInCrm.companyId],
		references: [companiesInCore.id]
	}),
	contactsInCore: one(contactsInCore, {
		fields: [leadsInCrm.contactId],
		references: [contactsInCore.id]
	}),
	profilesInCore: one(profilesInCore, {
		fields: [leadsInCrm.ownerId],
		references: [profilesInCore.id]
	}),
	verticalsInCore: one(verticalsInCore, {
		fields: [leadsInCrm.verticalId],
		references: [verticalsInCore.id]
	}),
	eventsInCommonUtils: many(eventsInCommonUtil),
	messageThreadsInCommonUtils: many(messageThreadsInCommonUtil),
	opportunitiesInCrms: many(opportunitiesInCrm),
	statusHistoryInCrms: many(statusHistoryInCrm),
	quotationsInCrms: many(quotationsInCrm),
}));

export const passwordVaultDocumentsInCommonUtilRelations = relations(passwordVaultDocumentsInCommonUtil, ({one}) => ({
	companiesInCore: one(companiesInCore, {
		fields: [passwordVaultDocumentsInCommonUtil.companyId],
		references: [companiesInCore.id]
	}),
}));

export const companiesInCoreRelations = relations(companiesInCore, ({many}) => ({
	passwordVaultDocumentsInCommonUtils: many(passwordVaultDocumentsInCommonUtil),
	passwordVaultPasswordsInCommonUtils: many(passwordVaultPasswordsInCommonUtil),
	passwordVaultCardsInCommonUtils: many(passwordVaultCardsInCommonUtil),
	leadsInCrms: many(leadsInCrm),
	productsInCrms: many(productsInCrm),
	companyContactsInCores: many(companyContactsInCore),
}));

export const passwordVaultPasswordsInCommonUtilRelations = relations(passwordVaultPasswordsInCommonUtil, ({one}) => ({
	companiesInCore: one(companiesInCore, {
		fields: [passwordVaultPasswordsInCommonUtil.companyId],
		references: [companiesInCore.id]
	}),
}));

export const taskAssigneesInCommonUtilRelations = relations(taskAssigneesInCommonUtil, ({one}) => ({
	profilesInCore: one(profilesInCore, {
		fields: [taskAssigneesInCommonUtil.profileId],
		references: [profilesInCore.id]
	}),
	tasksInCommonUtil: one(tasksInCommonUtil, {
		fields: [taskAssigneesInCommonUtil.taskId],
		references: [tasksInCommonUtil.id]
	}),
}));

export const tasksInCommonUtilRelations = relations(tasksInCommonUtil, ({one, many}) => ({
	taskAssigneesInCommonUtils: many(taskAssigneesInCommonUtil),
	taskStatusHistoryInCommonUtils: many(taskStatusHistoryInCommonUtil),
	departmentsInCore: one(departmentsInCore, {
		fields: [tasksInCommonUtil.departmentId],
		references: [departmentsInCore.id]
	}),
	verticalsInCore: one(verticalsInCore, {
		fields: [tasksInCommonUtil.verticalId],
		references: [verticalsInCore.id]
	}),
	taskDeliverablesInCommonUtils: many(taskDeliverablesInCommonUtil),
	taskCommentsInCommonUtils: many(taskCommentsInCommonUtil),
	taskSubtasksInCommonUtils: many(taskSubtasksInCommonUtil),
	taskAttachmentsInCommonUtils: many(taskAttachmentsInCommonUtil),
}));

export const ticketAssignmentsInCommonUtilRelations = relations(ticketAssignmentsInCommonUtil, ({one}) => ({
	profilesInCore: one(profilesInCore, {
		fields: [ticketAssignmentsInCommonUtil.assigneeId],
		references: [profilesInCore.id]
	}),
	ticketsInCommonUtil: one(ticketsInCommonUtil, {
		fields: [ticketAssignmentsInCommonUtil.ticketId],
		references: [ticketsInCommonUtil.id]
	}),
}));

export const ticketsInCommonUtilRelations = relations(ticketsInCommonUtil, ({one, many}) => ({
	ticketAssignmentsInCommonUtils: many(ticketAssignmentsInCommonUtil),
	ticketCommentsInCommonUtils: many(ticketCommentsInCommonUtil),
	profilesInCore_assigneeId: one(profilesInCore, {
		fields: [ticketsInCommonUtil.assigneeId],
		references: [profilesInCore.id],
		relationName: "ticketsInCommonUtil_assigneeId_profilesInCore_id"
	}),
	contactsInCore: one(contactsInCore, {
		fields: [ticketsInCommonUtil.clientId],
		references: [contactsInCore.id]
	}),
	profilesInCore_resolvedBy: one(profilesInCore, {
		fields: [ticketsInCommonUtil.resolvedBy],
		references: [profilesInCore.id],
		relationName: "ticketsInCommonUtil_resolvedBy_profilesInCore_id"
	}),
	ticketStatusHistoryInCommonUtils: many(ticketStatusHistoryInCommonUtil),
}));

export const ticketCommentsInCommonUtilRelations = relations(ticketCommentsInCommonUtil, ({one}) => ({
	profilesInCore: one(profilesInCore, {
		fields: [ticketCommentsInCommonUtil.authorId],
		references: [profilesInCore.id]
	}),
	ticketsInCommonUtil: one(ticketsInCommonUtil, {
		fields: [ticketCommentsInCommonUtil.ticketId],
		references: [ticketsInCommonUtil.id]
	}),
}));

export const teamsInCoreRelations = relations(teamsInCore, ({one, many}) => ({
	departmentsInCore: one(departmentsInCore, {
		fields: [teamsInCore.departmentId],
		references: [departmentsInCore.id]
	}),
	subscriptionsInCommonUtils: many(subscriptionsInCommonUtil),
	moduleRecordAssignmentsInCores: many(moduleRecordAssignmentsInCore),
}));

export const departmentsInCoreRelations = relations(departmentsInCore, ({many}) => ({
	teamsInCores: many(teamsInCore),
	profilesInCores: many(profilesInCore),
	tasksInCommonUtils: many(tasksInCommonUtil),
}));

export const passwordVaultCardsInCommonUtilRelations = relations(passwordVaultCardsInCommonUtil, ({one}) => ({
	companiesInCore: one(companiesInCore, {
		fields: [passwordVaultCardsInCommonUtil.companyId],
		references: [companiesInCore.id]
	}),
}));

export const employeesInCoreRelations = relations(employeesInCore, ({one}) => ({
	profilesInCore: one(profilesInCore, {
		fields: [employeesInCore.profileId],
		references: [profilesInCore.id]
	}),
}));

export const productCollectionsInCrmRelations = relations(productCollectionsInCrm, ({one}) => ({
	collectionsInCrm: one(collectionsInCrm, {
		fields: [productCollectionsInCrm.collectionId],
		references: [collectionsInCrm.id]
	}),
	productsInCrm: one(productsInCrm, {
		fields: [productCollectionsInCrm.productId],
		references: [productsInCrm.id]
	}),
}));

export const collectionsInCrmRelations = relations(collectionsInCrm, ({many}) => ({
	productCollectionsInCrms: many(productCollectionsInCrm),
}));

export const productsInCrmRelations = relations(productsInCrm, ({one, many}) => ({
	productCollectionsInCrms: many(productCollectionsInCrm),
	productVariantsInCrms: many(productVariantsInCrm),
	companiesInCore: one(companiesInCore, {
		fields: [productsInCrm.manufacturerId],
		references: [companiesInCore.id]
	}),
	contactsInCore: one(contactsInCore, {
		fields: [productsInCrm.supplierId],
		references: [contactsInCore.id]
	}),
}));

export const productVariantsInCrmRelations = relations(productVariantsInCrm, ({one}) => ({
	productsInCrm: one(productsInCrm, {
		fields: [productVariantsInCrm.productId],
		references: [productsInCrm.id]
	}),
}));

export const messageThreadParticipantsInCommonUtilRelations = relations(messageThreadParticipantsInCommonUtil, ({one}) => ({
	profilesInCore: one(profilesInCore, {
		fields: [messageThreadParticipantsInCommonUtil.profileId],
		references: [profilesInCore.id]
	}),
	messageThreadsInCommonUtil: one(messageThreadsInCommonUtil, {
		fields: [messageThreadParticipantsInCommonUtil.threadId],
		references: [messageThreadsInCommonUtil.id]
	}),
}));

export const messageThreadsInCommonUtilRelations = relations(messageThreadsInCommonUtil, ({one, many}) => ({
	messageThreadParticipantsInCommonUtils: many(messageThreadParticipantsInCommonUtil),
	messagesInCommonUtils: many(messagesInCommonUtil),
	leadsInCrm: one(leadsInCrm, {
		fields: [messageThreadsInCommonUtil.leadId],
		references: [leadsInCrm.id]
	}),
}));

export const eventParticipantsInCommonUtilRelations = relations(eventParticipantsInCommonUtil, ({one}) => ({
	eventsInCommonUtil: one(eventsInCommonUtil, {
		fields: [eventParticipantsInCommonUtil.eventId],
		references: [eventsInCommonUtil.id]
	}),
	profilesInCore: one(profilesInCore, {
		fields: [eventParticipantsInCommonUtil.profileId],
		references: [profilesInCore.id]
	}),
}));

export const eventsInCommonUtilRelations = relations(eventsInCommonUtil, ({one, many}) => ({
	eventParticipantsInCommonUtils: many(eventParticipantsInCommonUtil),
	leadsInCrm: one(leadsInCrm, {
		fields: [eventsInCommonUtil.leadId],
		references: [leadsInCrm.id]
	}),
	profilesInCore: one(profilesInCore, {
		fields: [eventsInCommonUtil.organizerId],
		references: [profilesInCore.id]
	}),
}));

export const messagesInCommonUtilRelations = relations(messagesInCommonUtil, ({one}) => ({
	profilesInCore: one(profilesInCore, {
		fields: [messagesInCommonUtil.senderId],
		references: [profilesInCore.id]
	}),
	messageThreadsInCommonUtil: one(messageThreadsInCommonUtil, {
		fields: [messagesInCommonUtil.threadId],
		references: [messageThreadsInCommonUtil.id]
	}),
}));

export const taskStatusHistoryInCommonUtilRelations = relations(taskStatusHistoryInCommonUtil, ({one}) => ({
	tasksInCommonUtil: one(tasksInCommonUtil, {
		fields: [taskStatusHistoryInCommonUtil.taskId],
		references: [tasksInCommonUtil.id]
	}),
}));

export const moduleRecordsInCoreRelations = relations(moduleRecordsInCore, ({one, many}) => ({
	modulesInCore: one(modulesInCore, {
		fields: [moduleRecordsInCore.moduleId],
		references: [modulesInCore.id]
	}),
	moduleRecordAssignmentsInCores: many(moduleRecordAssignmentsInCore),
}));

export const permissionsInCoreRelations = relations(permissionsInCore, ({one, many}) => ({
	modulesInCore: one(modulesInCore, {
		fields: [permissionsInCore.moduleId],
		references: [modulesInCore.id]
	}),
	rolePermissionsInCores: many(rolePermissionsInCore),
}));

export const companyContactsInCoreRelations = relations(companyContactsInCore, ({one}) => ({
	companiesInCore: one(companiesInCore, {
		fields: [companyContactsInCore.companyId],
		references: [companiesInCore.id]
	}),
	contactsInCore: one(contactsInCore, {
		fields: [companyContactsInCore.contactId],
		references: [contactsInCore.id]
	}),
}));

export const documentAssignmentsInCommonUtilRelations = relations(documentAssignmentsInCommonUtil, ({one}) => ({
	documentsInCommonUtil: one(documentsInCommonUtil, {
		fields: [documentAssignmentsInCommonUtil.documentId],
		references: [documentsInCommonUtil.id]
	}),
	profilesInCore: one(profilesInCore, {
		fields: [documentAssignmentsInCommonUtil.profileId],
		references: [profilesInCore.id]
	}),
}));

export const documentsInCommonUtilRelations = relations(documentsInCommonUtil, ({many}) => ({
	documentAssignmentsInCommonUtils: many(documentAssignmentsInCommonUtil),
}));

export const taskDeliverablesInCommonUtilRelations = relations(taskDeliverablesInCommonUtil, ({one}) => ({
	tasksInCommonUtil: one(tasksInCommonUtil, {
		fields: [taskDeliverablesInCommonUtil.taskId],
		references: [tasksInCommonUtil.id]
	}),
}));

export const rolePermissionsInCoreRelations = relations(rolePermissionsInCore, ({one}) => ({
	permissionsInCore: one(permissionsInCore, {
		fields: [rolePermissionsInCore.permissionId],
		references: [permissionsInCore.id]
	}),
	rolesInCore: one(rolesInCore, {
		fields: [rolePermissionsInCore.roleId],
		references: [rolesInCore.id]
	}),
}));

export const ticketStatusHistoryInCommonUtilRelations = relations(ticketStatusHistoryInCommonUtil, ({one}) => ({
	ticketsInCommonUtil: one(ticketsInCommonUtil, {
		fields: [ticketStatusHistoryInCommonUtil.ticketId],
		references: [ticketsInCommonUtil.id]
	}),
}));

export const taskCommentsInCommonUtilRelations = relations(taskCommentsInCommonUtil, ({one}) => ({
	tasksInCommonUtil: one(tasksInCommonUtil, {
		fields: [taskCommentsInCommonUtil.taskId],
		references: [tasksInCommonUtil.id]
	}),
}));

export const taskSubtasksInCommonUtilRelations = relations(taskSubtasksInCommonUtil, ({one}) => ({
	tasksInCommonUtil: one(tasksInCommonUtil, {
		fields: [taskSubtasksInCommonUtil.taskId],
		references: [tasksInCommonUtil.id]
	}),
}));

export const taskAttachmentsInCommonUtilRelations = relations(taskAttachmentsInCommonUtil, ({one}) => ({
	tasksInCommonUtil: one(tasksInCommonUtil, {
		fields: [taskAttachmentsInCommonUtil.taskId],
		references: [tasksInCommonUtil.id]
	}),
}));

export const subscriptionRenewalsInCommonUtilRelations = relations(subscriptionRenewalsInCommonUtil, ({one}) => ({
	subscriptionsInCommonUtil: one(subscriptionsInCommonUtil, {
		fields: [subscriptionRenewalsInCommonUtil.subscriptionId],
		references: [subscriptionsInCommonUtil.id]
	}),
}));

export const subscriptionsInCommonUtilRelations = relations(subscriptionsInCommonUtil, ({one, many}) => ({
	subscriptionRenewalsInCommonUtils: many(subscriptionRenewalsInCommonUtil),
	subscriptionUsersInCommonUtils: many(subscriptionUsersInCommonUtil),
	profilesInCore: one(profilesInCore, {
		fields: [subscriptionsInCommonUtil.ownerId],
		references: [profilesInCore.id]
	}),
	teamsInCore: one(teamsInCore, {
		fields: [subscriptionsInCommonUtil.teamId],
		references: [teamsInCore.id]
	}),
	contactsInCore: one(contactsInCore, {
		fields: [subscriptionsInCommonUtil.vendorId],
		references: [contactsInCore.id]
	}),
}));

export const subscriptionUsersInCommonUtilRelations = relations(subscriptionUsersInCommonUtil, ({one}) => ({
	profilesInCore: one(profilesInCore, {
		fields: [subscriptionUsersInCommonUtil.profileId],
		references: [profilesInCore.id]
	}),
	subscriptionsInCommonUtil: one(subscriptionsInCommonUtil, {
		fields: [subscriptionUsersInCommonUtil.subscriptionId],
		references: [subscriptionsInCommonUtil.id]
	}),
}));

export const opportunitiesInCrmRelations = relations(opportunitiesInCrm, ({one}) => ({
	leadsInCrm: one(leadsInCrm, {
		fields: [opportunitiesInCrm.leadId],
		references: [leadsInCrm.id]
	}),
	pipelinesInCrm: one(pipelinesInCrm, {
		fields: [opportunitiesInCrm.pipelineId],
		references: [pipelinesInCrm.id]
	}),
	stagesInCrm: one(stagesInCrm, {
		fields: [opportunitiesInCrm.stageId],
		references: [stagesInCrm.id]
	}),
}));

export const pipelinesInCrmRelations = relations(pipelinesInCrm, ({many}) => ({
	opportunitiesInCrms: many(opportunitiesInCrm),
	stagesInCrms: many(stagesInCrm),
}));

export const stagesInCrmRelations = relations(stagesInCrm, ({one, many}) => ({
	opportunitiesInCrms: many(opportunitiesInCrm),
	pipelinesInCrm: one(pipelinesInCrm, {
		fields: [stagesInCrm.pipelineId],
		references: [pipelinesInCrm.id]
	}),
}));

export const statusHistoryInCrmRelations = relations(statusHistoryInCrm, ({one}) => ({
	leadsInCrm: one(leadsInCrm, {
		fields: [statusHistoryInCrm.leadId],
		references: [leadsInCrm.id]
	}),
}));

export const announcementViewsInCoreRelations = relations(announcementViewsInCore, ({one}) => ({
	announcementsInCore: one(announcementsInCore, {
		fields: [announcementViewsInCore.announcementId],
		references: [announcementsInCore.id]
	}),
}));

export const announcementsInCoreRelations = relations(announcementsInCore, ({one, many}) => ({
	announcementViewsInCores: many(announcementViewsInCore),
	verticalsInCore: one(verticalsInCore, {
		fields: [announcementsInCore.verticalId],
		references: [verticalsInCore.id]
	}),
}));

export const moduleFieldsInCoreRelations = relations(moduleFieldsInCore, ({one}) => ({
	modulesInCore: one(modulesInCore, {
		fields: [moduleFieldsInCore.moduleId],
		references: [modulesInCore.id]
	}),
}));

export const moduleRecordAssignmentsInCoreRelations = relations(moduleRecordAssignmentsInCore, ({one}) => ({
	profilesInCore: one(profilesInCore, {
		fields: [moduleRecordAssignmentsInCore.profileId],
		references: [profilesInCore.id]
	}),
	moduleRecordsInCore: one(moduleRecordsInCore, {
		fields: [moduleRecordAssignmentsInCore.recordId],
		references: [moduleRecordsInCore.id]
	}),
	teamsInCore: one(teamsInCore, {
		fields: [moduleRecordAssignmentsInCore.teamId],
		references: [teamsInCore.id]
	}),
}));

export const quotationStatusHistoryInCrmRelations = relations(quotationStatusHistoryInCrm, ({one}) => ({
	quotationsInCrm: one(quotationsInCrm, {
		fields: [quotationStatusHistoryInCrm.quotationId],
		references: [quotationsInCrm.id]
	}),
}));

export const quotationsInCrmRelations = relations(quotationsInCrm, ({one, many}) => ({
	quotationStatusHistoryInCrms: many(quotationStatusHistoryInCrm),
	leadsInCrm: one(leadsInCrm, {
		fields: [quotationsInCrm.leadId],
		references: [leadsInCrm.id]
	}),
}));

export const callNotesInCrmRelations = relations(callNotesInCrm, ({one}) => ({
	callsInCrm: one(callsInCrm, {
		fields: [callNotesInCrm.callId],
		references: [callsInCrm.id]
	}),
}));

export const attendanceRecordsInHrRelations = relations(attendanceRecordsInHr, ({one}) => ({
	attendanceSessionsInHr: one(attendanceSessionsInHr, {
		fields: [attendanceRecordsInHr.sessionId],
		references: [attendanceSessionsInHr.id]
	}),
}));

export const attendanceSessionsInHrRelations = relations(attendanceSessionsInHr, ({one, many}) => ({
	attendanceRecordsInHrs: many(attendanceRecordsInHr),
	profilesInCore_approvedBy: one(profilesInCore, {
		fields: [attendanceSessionsInHr.approvedBy],
		references: [profilesInCore.id],
		relationName: "attendanceSessionsInHr_approvedBy_profilesInCore_id"
	}),
	profilesInCore_employeeId: one(profilesInCore, {
		fields: [attendanceSessionsInHr.employeeId],
		references: [profilesInCore.id],
		relationName: "attendanceSessionsInHr_employeeId_profilesInCore_id"
	}),
}));

export const leaveRequestsInHrRelations = relations(leaveRequestsInHr, ({one}) => ({
	profilesInCore_approvedBy: one(profilesInCore, {
		fields: [leaveRequestsInHr.approvedBy],
		references: [profilesInCore.id],
		relationName: "leaveRequestsInHr_approvedBy_profilesInCore_id"
	}),
	profilesInCore_employeeId: one(profilesInCore, {
		fields: [leaveRequestsInHr.employeeId],
		references: [profilesInCore.id],
		relationName: "leaveRequestsInHr_employeeId_profilesInCore_id"
	}),
}));