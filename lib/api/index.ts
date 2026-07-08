export { ApiClient, ApiClientError, apiClient, getApiClientErrorMessage } from '@/lib/api/client'
export {
  createAdminRole,
  fetchAdminPermissions,
  fetchAdminRoles,
  updateAdminRolePermissions,
} from '@/lib/api/admin-rbac.service'
export {
  createAdminModelConfig,
  fetchAdminModelConfigs,
  updateAdminModelConfig,
} from '@/lib/api/admin-model-config.service'
export { fetchAdminPlans } from '@/lib/api/admin-plans.service'
export {
  adjustAdminCredits,
  cancelAdminUserSubscription,
  changeAdminUserPlan,
  fetchAdminUserBilling,
  fetchAdminUserCreditHistory,
  fetchAdminUserDetails,
  fetchAdminUsers,
  updateAdminUser,
} from '@/lib/api/admin-users.service'
export {
  createFirebaseSession,
  deleteCurrentSession,
  getPortalRouteByRole,
  refreshAccessToken,
} from '@/lib/api/auth.service'
export {
  cancelCurrentSubscription,
  createCreditPackCheckout,
  createSubscriptionCheckout,
  fetchCreditPacks,
  fetchCreditBalance,
  fetchCurrentSubscription,
  fetchSubscriptionPlans,
} from '@/lib/api/billing.service'
export {
  getLatestStudySetGenerationMeta,
  getLatestStudySetUploadMeta,
  getStudySetGenerationMeta,
  getStudySetUploadMeta,
  saveStudySetGenerationMeta,
  saveStudySetUploadMeta,
  updateStudySetGenerationMeta,
} from '@/lib/api/study-sets.storage'
export {
  fetchCompletedStudySetOutput,
  fetchStudySetFlashcards,
  fetchStudySetFillInTheBlanks,
  fetchStudySetGenerationBatchStatus,
  fetchStudySetMultipleChoice,
  fetchStudySetNotes,
  fetchStudySetPodcast,
  fetchStudySetTutorLesson,
  fetchStudySetWrittenTest,
  generateStudySet,
  uploadStudySetPdf,
  uploadStudySetText,
} from '@/lib/api/study-sets.service'
export { fetchSyllabusById, uploadSyllabusPdf, uploadSyllabusText } from '@/lib/api/syllabus.service'
export {
  PERSONALIZATION_INSTRUCTIONS_MAX_LENGTH,
  fetchPersonalization,
  updatePersonalization,
} from '@/lib/api/user-settings.service'
export { fetchGraderResult, submitGraderAssignment } from '@/lib/api/paper-grader.service'
export {
  clearAuthBrowserState,
  clearStoredAuthObject,
  getStoredAccessToken,
  getStoredAuthObject,
  isStoredAccessTokenExpired,
  isStoredRefreshTokenUsable,
  replaceStoredAuthObject,
  saveAuthObject,
} from '@/lib/api/session-storage'
export type { FirebaseSessionResponse, SessionAuth, UserRole } from '@/lib/api/auth.service'
export type { AdminPlan } from '@/lib/api/admin-plans.service'
export type {
  AdminPermission,
  AdminRole,
  CreateAdminRolePayload,
  UpdateAdminRolePermissionsPayload,
} from '@/lib/api/admin-rbac.service'
export type {
  AdminModelConfig,
  CreateAdminModelConfigPayload,
  ModelProvider,
  UpdateAdminModelConfigPayload,
} from '@/lib/api/admin-model-config.service'
export type {
  AdjustAdminCreditsPayload,
  AdminUserBilling,
  AdminUserBillingInvoice,
  AdminUserCreditHistoryEntry,
  ChangeAdminUserPlanPayload,
  AdminUser,
  AdminUserDetails,
  AdminUserSubscription,
  FetchAdminUsersParams,
  FetchAdminUsersResult,
  UpdateAdminUserPayload,
} from '@/lib/api/admin-users.service'
export type {
  CreditPack,
  CreditBalance,
  CurrentSubscription,
  RecentInvoice,
  SubscriptionCheckoutSession,
  SubscriptionPlan,
} from '@/lib/api/billing.service'
export type { StoredAuthObject } from '@/lib/api/session-storage'
export type { StoredStudySetGenerationJob, StoredStudySetGenerationMeta, StoredStudySetUploadMeta } from '@/lib/api/study-sets.storage'
export type {
  BatchCompletedEvent,
  ConnectedEvent,
  JobCompletedEvent,
  JobFailedEvent,
  JobStartedEvent,
  StudySetBatchStatusJob,
  StudySetBatchStatusResponse,
  StudySetGenerateResponse,
  StudySetGenerateType,
  StudySetGenerationBatch,
  StudySetGenerationJob,
  StudySetGenerationSocketEvent,
  StudySetGenerationWebsocket,
  StudySetFlashcardsResponse,
  StudySetFillInTheBlanksResponse,
  StudySetMultipleChoiceResponse,
  StudySetNotesResponse,
  StudySetPodcastResponse,
  StudySetTutorLessonResponse,
  StudySetUploadDocument,
  StudySetUploadResponse,
  StudySetWrittenTestResponse,
} from '@/lib/api/study-sets.service'
export type {
  GraderCriterion,
  GraderResult,
  GraderResultResponse,
  GraderResultSubmission,
  GraderSubmission,
  GraderSubmitResponse,
  GraderWebsocket,
} from '@/lib/api/paper-grader.service'
export type {
  PersonalizationProfile,
  PersonalizationSettings,
  UpdatePersonalizationPayload,
} from '@/lib/api/user-settings.service'
export type {
  SyllabusAnalysisResponse,
  SyllabusDetailCourseworkItem,
  SyllabusDetailModule,
  SyllabusDetailPriorityTopic,
  SyllabusDetailResponse,
  SyllabusDetailTimelineItem,
  SyllabusSocketSnapshotEvent,
  SyllabusSocketSnapshotPayload,
  SyllabusUploadResponse,
  SyllabusUploadWebsocket,
} from '@/lib/api/syllabus.service'
