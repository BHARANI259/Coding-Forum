export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api";

export type UserRole = "STUDENT" | "FACULTY" | "SUPER_ADMIN";

export type AuthUser = {
  token: string;
  userId: number;
  studentId: number | null;
  facultyId: number | null;
  email: string;
  name: string;
  role: UserRole;
  firstLoginRequired: boolean;
  deptMonitoringEnabled: boolean | null;
};

export type CurrentUser = Omit<AuthUser, "token">;

export type Department = {
  id: number;
  code: string;
  name: string;
  active: boolean;
};

export type DepartmentSummary = {
  id: number;
  code: string;
  name: string;
};

export type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

export type Student = {
  id: number;
  registerNumber: string;
  name: string;
  email: string;
  contactNumber: string | null;
  department: DepartmentSummary | null;
  year: number;
  section: string | null;
  technicalArea: "SOFTWARE" | "HARDWARE";
  placementWilling: boolean;
  active: boolean;
  linkedUserId: number | null;
};

export type Faculty = {
  id: number;
  facultyCode: string | null;
  name: string;
  email: string;
  department: DepartmentSummary | null;
  deptMonitoringEnabled: boolean;
  active: boolean;
  linkedUserId: number | null;
};

export type StudentProfile = {
  id: number;
  registerNumber: string;
  name: string;
  email: string;
  contactNumber: string | null;
  department: DepartmentSummary | null;
  year: number;
  section: string | null;
  technicalArea: "SOFTWARE" | "HARDWARE";
  placementWilling: boolean;
  active: boolean;
};

export type UpdateStudentProfilePayload = {
  name: string;
  email: string;
  contactNumber: string;
  section: string;
  technicalArea: "SOFTWARE" | "HARDWARE";
  placementWilling: boolean;
};

export type FacultyProfile = {
  id: number;
  facultyCode: string | null;
  name: string;
  email: string;
  contactNumber: string | null;
  department: DepartmentSummary | null;
  deptMonitoringEnabled: boolean;
  active: boolean;
};

export type UpdateFacultyProfilePayload = {
  name: string;
  email: string;
  contactNumber: string;
};

export type CreateStudentPayload = {
  registerNumber: string;
  name: string;
  email: string;
  departmentId: number;
  year: number;
  section: string;
  technicalArea: "SOFTWARE" | "HARDWARE";
  placementWilling: boolean;
};

export type CreateFacultyPayload = {
  facultyCode: string;
  name: string;
  email: string;
  departmentId: number;
  deptMonitoringEnabled: boolean;
};

export type ImportErrorRow = {
  rowNumber: number;
  message: string;
};

export type StudentImportCreated = {
  registerNumber: string;
  email: string;
  temporaryPassword: string;
};

export type FacultyImportCreated = {
  facultyCode: string | null;
  email: string;
  temporaryPassword: string;
};

export type StudentImportResult = {
  totalRows: number;
  successCount: number;
  failedCount: number;
  created: StudentImportCreated[];
  errors: ImportErrorRow[];
};

export type FacultyImportResult = {
  totalRows: number;
  successCount: number;
  failedCount: number;
  created: FacultyImportCreated[];
  errors: ImportErrorRow[];
};

export type EventCategory = {
  id: number;
  name: string;
  weightage: number;
  active: boolean;
};

export type EventOption = {
  id: number;
  label: string;
  secondaryLabel: string | null;
};

export type EventItem = {
  id: number;
  title: string;
  description?: string | null;
  category: EventCategory | null;
  eventType: "TEAM" | "INDIVIDUAL";
  venue: string | null;
  startDatetime: string | null;
  endDatetime: string | null;
  registrationOpen: boolean;
  registrationStart: string | null;
  registrationEnd: string | null;
  status: string;
  placementWillingOnly: boolean;
  minTeamSize: number | null;
  maxTeamSize: number | null;
  maxParticipants: number | null;
  maxTeams: number | null;
  allowedDepartments: EventOption[];
  allowedYears: number[];
  allowedSections: string[];
  incharges: EventOption[];
  allowedTechnicalAreas: string[];
  roundsCount: number;
  problemStatementCount: number;
  resultsPublished: boolean;
};

export type EventDetail = EventItem & {
  description: string | null;
  createdByUserId: number | null;
  createdAt: string;
  updatedAt: string;
  resultsPublishedAt: string | null;
};

export type EventPayload = {
  title: string;
  description: string;
  categoryId: number;
  eventType: "TEAM" | "INDIVIDUAL";
  venue: string;
  startDatetime: string | null;
  endDatetime: string | null;
  registrationOpen: boolean;
  registrationStart: string | null;
  registrationEnd: string | null;
  minTeamSize: number | null;
  maxTeamSize: number | null;
  maxParticipants: number | null;
  maxTeams: number | null;
  placementWillingOnly: boolean;
  status: string;
  allowedDepartmentIds: number[];
  allowedYears: number[];
  allowedSections: string[];
  allowedTechnicalAreas: string[];
  inchargeFacultyIds: number[];
};

export type ProblemStatement = {
  id: number;
  eventId: number;
  title: string;
  description: string | null;
  referenceLink: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type EventRound = {
  id: number;
  eventId: number;
  roundName: string;
  roundOrder: number;
  status: string;
  finalRound: boolean;
  description: string | null;
  scheduledAt: string | null;
};

export type RoundPayload = {
  roundName: string;
  roundOrder: number;
  finalRound: boolean;
  description: string;
  scheduledAt: string | null;
};

export type RoundResult = {
  id: number;
  eventId: number;
  roundId: number;
  finalRound: boolean;
  teamId: number | null;
  teamName: string | null;
  teamCode: string | null;
  studentId: number | null;
  studentName: string | null;
  registerNumber: string | null;
  status: string;
  declaredByUserId: number | null;
  declaredAt: string;
};

export type ProblemStatementPayload = {
  title: string;
  description: string;
  referenceLink: string;
  active: boolean;
};

export type TeamMember = {
  studentId: number;
  registerNumber: string;
  name: string;
  email: string;
  departmentCode: string | null;
  year: number;
  section: string | null;
  leader: boolean;
  joinedAt: string;
};

export type TeamEventSummary = {
  id: number;
  title: string;
  eventType: string;
  status: string;
  registrationOpen: boolean;
  minTeamSize: number | null;
  maxTeamSize: number | null;
};

export type TeamDetail = {
  id: number;
  eventId: number;
  event: TeamEventSummary;
  teamName: string;
  teamCode: string;
  leaderStudentId: number;
  lockedAfterRegistration: boolean;
  registrationStatus: string;
  problemStatementId: number | null;
  problemStatementTitle: string | null;
  members: TeamMember[];
};

export type TeamRegistrationResponse = {
  teamId: number;
  eventId: number;
  status: string;
  problemStatementId: number | null;
  problemStatementTitle: string | null;
  registeredMembers: TeamMember[];
};

export type MyRegistration = {
  id: number;
  eventId: number;
  eventTitle: string;
  categoryName: string | null;
  eventType: string;
  teamName: string | null;
  registrationType: string;
  status: string;
  registeredAt: string;
  problemStatementId: number | null;
  problemStatementTitle: string | null;
};

export type EventRegistration = {
  id: number;
  studentId: number;
  studentName: string;
  registerNumber: string;
  email: string;
  departmentCode: string | null;
  teamId: number | null;
  teamName: string | null;
  teamCode: string | null;
  registrationType: string;
  status: string;
  registeredAt: string;
  problemStatementId: number | null;
  problemStatementTitle: string | null;
};

export type PublishResultsResponse = {
  eventId: number;
  resultsPublished: boolean;
  resultsPublishedAt: string | null;
  status: string;
  registrationOpen: boolean;
  message: string;
};

export type ResultMember = {
  studentId: number;
  name: string;
  registerNumber: string;
  departmentCode: string | null;
};

export type ResultItem = {
  id: number;
  eventId: number;
  eventTitle: string;
  eventType: string;
  studentId: number | null;
  studentName: string | null;
  registerNumber: string | null;
  departmentCode: string | null;
  teamId: number | null;
  teamName: string | null;
  teamCode: string | null;
  resultType: string;
  pointsAwarded: number;
  declaredByUserId: number | null;
  declaredByEmail: string | null;
  declaredAt: string;
  members: ResultMember[];
};

export type EventResultSummary = {
  eventId: number;
  eventTitle: string;
  eventType: string;
  categoryName: string | null;
  results: ResultItem[];
};

export type StudentResult = {
  resultId: number;
  eventId: number;
  eventTitle: string;
  categoryName: string | null;
  eventType: string;
  teamName: string | null;
  resultType: string;
  pointsEarned: number;
  declaredAt: string;
};

export type StudentLeaderboardRow = {
  rank: number;
  studentId: number;
  registerNumber: string;
  studentName: string;
  departmentCode: string | null;
  departmentName: string | null;
  totalPoints: number;
  eventsParticipated: number;
  wins: number;
  runnerUps: number;
};

export type DepartmentLeaderboardRow = {
  rank: number;
  departmentId: number;
  departmentCode: string;
  departmentName: string;
  totalPoints: number;
  totalParticipants: number;
  wins: number;
};

export type AnalyticsPage<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
};

export type CategoryPointSummary = {
  categoryId: number;
  categoryName: string;
  totalPoints: number;
  eventsParticipated: number;
};

export type StudentStatistics = {
  studentId: number;
  studentName: string;
  registerNumber: string;
  departmentCode: string | null;
  totalPoints: number;
  totalEventsRegistered: number;
  totalResultsDeclared: number;
  winsCount: number;
  runnerUpCount: number;
  secondRunnerUpCount: number;
  participationCount: number;
  categoryWisePoints: CategoryPointSummary[];
};

export type StudentPointHistory = {
  id: number;
  eventId: number;
  eventTitle: string;
  categoryId: number;
  categoryName: string;
  pointType: string;
  points: number;
  reason: string;
  createdAt: string;
};

export type AdminAnalyticsSummary = {
  totalStudents: number;
  totalFaculty: number;
  totalDepartments: number;
  totalEvents: number;
  publishedEvents: number;
  activeEvents: number;
  totalRegistrations: number;
  totalTeams: number;
  totalResults: number;
  totalPointsAwarded: number;
};

export type DepartmentAnalytics = {
  departmentId: number;
  departmentCode: string;
  departmentName: string;
  totalPoints: number;
  totalStudents: number;
  activeStudents: number;
  totalEventParticipations: number;
  averageParticipationPerStudent: number;
  winsCount: number;
};

export type CategoryAnalytics = {
  categoryId: number;
  categoryName: string;
  totalPoints: number;
  totalResults: number;
  participantCount: number;
};

export type RecentActivity = {
  activityType: string;
  title: string;
  subtitle: string;
  points: number;
  occurredAt: string;
};

export type FacultyDepartmentSummary = {
  departmentId: number;
  departmentCode: string;
  departmentName: string;
  departmentStudents: number;
  departmentTotalPoints: number;
  departmentParticipations: number;
};

export type DepartmentStudentStats = {
  studentId: number;
  registerNumber: string;
  studentName: string;
  totalPoints: number;
  eventsParticipated: number;
  wins: number;
};

export type NotificationItem = {
  id: number;
  title: string;
  message: string;
  notificationType: string;
  relatedEntityType: string | null;
  relatedEntityId: number | null;
  read: boolean;
  emailSent: boolean;
  emailError: string | null;
  createdAt: string;
  readAt: string | null;
};

type ApiError = {
  message?: string;
};

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  attachToken = true
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (attachToken && typeof window !== "undefined") {
    const token = window.localStorage.getItem("kec_auth_token");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });
  } catch {
    throw new Error("Cannot reach the backend server. Please make sure Spring Boot is running on port 8080.");
  }

  if (!response.ok) {
    let error: ApiError = {};
    try {
      error = await response.json();
    } catch {
      error = {};
    }
    throw new Error(error.message ?? "Request failed. Please try again.");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function downloadFile(endpoint: string, fallbackFilename: string) {
  const headers = new Headers();
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem("kec_auth_token");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, { headers });
  if (!response.ok) {
    let error: ApiError = {};
    try {
      error = await response.json();
    } catch {
      error = {};
    }
    throw new Error(error.message ?? "Unable to download report.");
  }

  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition");
  const filename = filenameFromDisposition(disposition) ?? fallbackFilename;
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

export function login(endpoint: string, email: string, password: string) {
  return apiFetch<AuthUser>(
    endpoint,
    {
      method: "POST",
      body: JSON.stringify({ email, password })
    },
    false
  );
}

export function changePassword(oldPassword: string, newPassword: string) {
  return apiFetch<CurrentUser>("/auth/change-password", {
    method: "POST",
    body: JSON.stringify({ oldPassword, newPassword })
  });
}

export function getMe() {
  return apiFetch<CurrentUser>("/auth/me");
}

export function getStudentProfile() {
  return apiFetch<StudentProfile>("/student/profile");
}

export function updateStudentProfile(payload: UpdateStudentProfilePayload) {
  return apiFetch<StudentProfile>("/student/profile", {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function getFacultyProfile() {
  return apiFetch<FacultyProfile>("/faculty/profile");
}

export function updateFacultyProfile(payload: UpdateFacultyProfilePayload) {
  return apiFetch<FacultyProfile>("/faculty/profile", {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function getDepartments() {
  return apiFetch<Department[]>("/admin/departments");
}

export function createDepartment(payload: { code: string; name: string }) {
  return apiFetch<Department>("/admin/departments", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getStudents(params: Record<string, string | number | boolean | undefined>) {
  return apiFetch<PageResponse<Student>>(`/admin/students${toQuery(params)}`);
}

export function createStudent(payload: CreateStudentPayload) {
  return apiFetch<{ student: Student; temporaryPassword: string }>("/admin/students", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function importStudents(file: File) {
  const form = new FormData();
  form.append("file", file);
  return apiFetch<StudentImportResult>("/admin/students/import", {
    method: "POST",
    body: form
  });
}

export function getFaculty(params: Record<string, string | number | boolean | undefined>) {
  return apiFetch<PageResponse<Faculty>>(`/admin/faculty${toQuery(params)}`);
}

export function createFaculty(payload: CreateFacultyPayload) {
  return apiFetch<{ id: number; facultyCode: string | null; name: string; email: string; temporaryPassword: string }>(
    "/admin/faculty",
    {
      method: "POST",
      body: JSON.stringify(payload)
    }
  );
}

export function importFaculty(file: File) {
  const form = new FormData();
  form.append("file", file);
  return apiFetch<FacultyImportResult>("/admin/faculty/import", {
    method: "POST",
    body: form
  });
}

export function getEventCategories(params: Record<string, string | number | boolean | undefined> = {}) {
  return apiFetch<EventCategory[]>(`/admin/event-categories${toQuery(params)}`);
}

export function createEventCategory(payload: { name: string; weightage: number; active: boolean }) {
  return apiFetch<EventCategory>("/admin/event-categories", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateEventCategory(id: number, payload: { name: string; weightage: number; active: boolean }) {
  return apiFetch<EventCategory>(`/admin/event-categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function updateEventCategoryStatus(id: number, active: boolean) {
  return apiFetch<EventCategory>(`/admin/event-categories/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ active })
  });
}

export function getAdminEvents(params: Record<string, string | number | boolean | undefined> = {}) {
  return apiFetch<PageResponse<EventItem>>(`/admin/events${toQuery(params)}`);
}

export function getAdminEvent(id: number) {
  return apiFetch<EventDetail>(`/admin/events/${id}`);
}

export function createEvent(payload: EventPayload) {
  return apiFetch<EventDetail>("/admin/events", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateEvent(id: number, payload: EventPayload) {
  return apiFetch<EventDetail>(`/admin/events/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function updateEventStatus(id: number, status: string) {
  return apiFetch<EventDetail>(`/admin/events/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  });
}

export function updateEventRegistration(id: number, registrationOpen: boolean) {
  return apiFetch<EventDetail>(`/admin/events/${id}/registration`, {
    method: "PATCH",
    body: JSON.stringify({ registrationOpen })
  });
}

export function cancelEvent(id: number) {
  return apiFetch<EventDetail>(`/admin/events/${id}`, { method: "DELETE" });
}

export function getFacultyEvents() {
  return apiFetch<EventItem[]>("/faculty/events");
}

export function getFacultyEvent(id: number) {
  return apiFetch<EventDetail>(`/faculty/events/${id}`);
}

export function getStudentEvents() {
  return apiFetch<EventItem[]>("/student/events");
}

export function getStudentEvent(id: number) {
  return apiFetch<EventDetail>(`/student/events/${id}`);
}

export function getAdminProblemStatements(eventId: number) {
  return apiFetch<ProblemStatement[]>(`/admin/events/${eventId}/problem-statements`);
}

export function createProblemStatement(eventId: number, payload: ProblemStatementPayload) {
  return apiFetch<ProblemStatement>(`/admin/events/${eventId}/problem-statements`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateProblemStatement(eventId: number, problemStatementId: number, payload: ProblemStatementPayload) {
  return apiFetch<ProblemStatement>(`/admin/events/${eventId}/problem-statements/${problemStatementId}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function updateProblemStatementStatus(eventId: number, problemStatementId: number, active: boolean) {
  return apiFetch<ProblemStatement>(`/admin/events/${eventId}/problem-statements/${problemStatementId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ active })
  });
}

export function getStudentProblemStatements(eventId: number) {
  return apiFetch<ProblemStatement[]>(`/student/events/${eventId}/problem-statements`);
}

export function getFacultyProblemStatements(eventId: number) {
  return apiFetch<ProblemStatement[]>(`/faculty/events/${eventId}/problem-statements`);
}

export function getAdminRounds(eventId: number) {
  return apiFetch<EventRound[]>(`/admin/events/${eventId}/rounds`);
}

export function createAdminRound(eventId: number, payload: RoundPayload) {
  return apiFetch<EventRound>(`/admin/events/${eventId}/rounds`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateAdminRound(eventId: number, roundId: number, payload: RoundPayload) {
  return apiFetch<EventRound>(`/admin/events/${eventId}/rounds/${roundId}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function updateAdminRoundStatus(eventId: number, roundId: number, status: string) {
  return apiFetch<EventRound>(`/admin/events/${eventId}/rounds/${roundId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  });
}

export function deleteAdminRound(eventId: number, roundId: number) {
  return apiFetch<void>(`/admin/events/${eventId}/rounds/${roundId}`, { method: "DELETE" });
}

export function getFacultyRounds(eventId: number) {
  return apiFetch<EventRound[]>(`/faculty/events/${eventId}/rounds`);
}

export function createFacultyRound(eventId: number, payload: RoundPayload) {
  return apiFetch<EventRound>(`/faculty/events/${eventId}/rounds`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateFacultyRound(eventId: number, roundId: number, payload: RoundPayload) {
  return apiFetch<EventRound>(`/faculty/events/${eventId}/rounds/${roundId}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function updateFacultyRoundStatus(eventId: number, roundId: number, status: string) {
  return apiFetch<EventRound>(`/faculty/events/${eventId}/rounds/${roundId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  });
}

export function getStudentRounds(eventId: number) {
  return apiFetch<EventRound[]>(`/student/events/${eventId}/rounds`);
}

export function getAdminRoundResults(eventId: number, roundId: number) {
  return apiFetch<RoundResult[]>(`/admin/events/${eventId}/rounds/${roundId}/results`);
}

export function declareAdminRoundTeamResult(eventId: number, roundId: number, teamId: number, status: string) {
  return apiFetch<RoundResult>(`/admin/events/${eventId}/rounds/${roundId}/results/team`, {
    method: "POST",
    body: JSON.stringify({ teamId, status })
  });
}

export function declareAdminRoundStudentResult(eventId: number, roundId: number, studentId: number, status: string) {
  return apiFetch<RoundResult>(`/admin/events/${eventId}/rounds/${roundId}/results/individual`, {
    method: "POST",
    body: JSON.stringify({ studentId, status })
  });
}

export function getFacultyRoundResults(eventId: number, roundId: number) {
  return apiFetch<RoundResult[]>(`/faculty/events/${eventId}/rounds/${roundId}/results`);
}

export function declareFacultyRoundTeamResult(eventId: number, roundId: number, teamId: number, status: string) {
  return apiFetch<RoundResult>(`/faculty/events/${eventId}/rounds/${roundId}/results/team`, {
    method: "POST",
    body: JSON.stringify({ teamId, status })
  });
}

export function declareFacultyRoundStudentResult(eventId: number, roundId: number, studentId: number, status: string) {
  return apiFetch<RoundResult>(`/faculty/events/${eventId}/rounds/${roundId}/results/individual`, {
    method: "POST",
    body: JSON.stringify({ studentId, status })
  });
}

export function createTeam(eventId: number, payload: { teamName: string }) {
  return apiFetch<TeamDetail>(`/student/events/${eventId}/teams`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function joinTeamByCode(teamCode: string) {
  return apiFetch<TeamDetail>("/student/teams/join", {
    method: "POST",
    body: JSON.stringify({ teamCode })
  });
}

export function getMyTeams() {
  return apiFetch<TeamDetail[]>("/student/teams");
}

export function getTeamDetail(teamId: number) {
  return apiFetch<TeamDetail>(`/student/teams/${teamId}`);
}

export function leaveTeam(teamId: number) {
  return apiFetch<void>(`/student/teams/${teamId}/members/me`, { method: "DELETE" });
}

export function registerTeam(teamId: number, problemStatementId?: number | null) {
  return apiFetch<TeamRegistrationResponse>(`/student/teams/${teamId}/register`, {
    method: "POST",
    body: JSON.stringify({ problemStatementId: problemStatementId ?? null })
  });
}

export function registerIndividual(eventId: number, problemStatementId?: number | null) {
  return apiFetch<MyRegistration>(`/student/events/${eventId}/register`, {
    method: "POST",
    body: JSON.stringify({ problemStatementId: problemStatementId ?? null })
  });
}

export function getMyRegistrations() {
  return apiFetch<MyRegistration[]>("/student/registrations");
}

export function getAdminEventRegistrations(eventId: number) {
  return apiFetch<EventRegistration[]>(`/admin/events/${eventId}/registrations`);
}

export function getFacultyEventRegistrations(eventId: number) {
  return apiFetch<EventRegistration[]>(`/faculty/events/${eventId}/registrations`);
}

export function getAdminEventResults(eventId: number) {
  return apiFetch<EventResultSummary>(`/admin/events/${eventId}/results`);
}

export function declareAdminIndividualResult(eventId: number, studentId: number, resultType: string) {
  return apiFetch<ResultItem>(`/admin/events/${eventId}/results/individual`, {
    method: "POST",
    body: JSON.stringify({ studentId, resultType })
  });
}

export function declareAdminTeamResult(eventId: number, teamId: number, resultType: string) {
  return apiFetch<ResultItem>(`/admin/events/${eventId}/results/team`, {
    method: "POST",
    body: JSON.stringify({ teamId, resultType })
  });
}

export function clearAdminResult(resultId: number) {
  return apiFetch<void>(`/admin/results/${resultId}`, { method: "DELETE" });
}

export function publishAdminResults(eventId: number) {
  return apiFetch<PublishResultsResponse>(`/admin/events/${eventId}/results/publish`, { method: "POST" });
}

export function getFacultyEventResults(eventId: number) {
  return apiFetch<EventResultSummary>(`/faculty/events/${eventId}/results`);
}

export function declareFacultyIndividualResult(eventId: number, studentId: number, resultType: string) {
  return apiFetch<ResultItem>(`/faculty/events/${eventId}/results/individual`, {
    method: "POST",
    body: JSON.stringify({ studentId, resultType })
  });
}

export function declareFacultyTeamResult(eventId: number, teamId: number, resultType: string) {
  return apiFetch<ResultItem>(`/faculty/events/${eventId}/results/team`, {
    method: "POST",
    body: JSON.stringify({ teamId, resultType })
  });
}

export function publishFacultyResults(eventId: number) {
  return apiFetch<PublishResultsResponse>(`/faculty/events/${eventId}/results/publish`, { method: "POST" });
}

export function getMyResults() {
  return apiFetch<StudentResult[]>("/student/results");
}

export function getMyEventResult(eventId: number) {
  return apiFetch<StudentResult | null>(`/student/events/${eventId}/results`);
}

export function getStudentLeaderboard(filters: Record<string, string | number | boolean | undefined> = {}) {
  return apiFetch<AnalyticsPage<StudentLeaderboardRow>>(`/leaderboard/students${toQuery(filters)}`);
}

export function getDepartmentLeaderboard(filters: Record<string, string | number | boolean | undefined> = {}) {
  return apiFetch<DepartmentLeaderboardRow[]>(`/leaderboard/departments${toQuery(filters)}`);
}

export function getCategoryStudentLeaderboard(categoryId: number, filters: Record<string, string | number | boolean | undefined> = {}) {
  return apiFetch<AnalyticsPage<StudentLeaderboardRow>>(`/leaderboard/categories/${categoryId}/students${toQuery(filters)}`);
}

export function getBestCoders(filters: Record<string, string | number | boolean | undefined> = {}) {
  return apiFetch<AnalyticsPage<StudentLeaderboardRow>>(`/leaderboard/best-coders${toQuery(filters)}`);
}

export function getTopEngagingStudents(filters: Record<string, string | number | boolean | undefined> = {}) {
  return apiFetch<AnalyticsPage<StudentLeaderboardRow>>(`/leaderboard/top-engaging-students${toQuery(filters)}`);
}

export function getMyStatistics() {
  return apiFetch<StudentStatistics>("/student/statistics");
}

export function getMyPointHistory(filters: Record<string, string | number | boolean | undefined> = {}) {
  return apiFetch<AnalyticsPage<StudentPointHistory>>(`/student/points/history${toQuery(filters)}`);
}

export function getAdminAnalyticsSummary() {
  return apiFetch<AdminAnalyticsSummary>("/admin/analytics/summary");
}

export function getAdminDepartmentAnalytics() {
  return apiFetch<DepartmentAnalytics[]>("/admin/analytics/departments");
}

export function getAdminCategoryAnalytics() {
  return apiFetch<CategoryAnalytics[]>("/admin/analytics/categories");
}

export function getAdminRecentActivity() {
  return apiFetch<RecentActivity[]>("/admin/analytics/recent-activity");
}

export function getFacultyDepartmentSummary() {
  return apiFetch<FacultyDepartmentSummary>("/faculty/department-monitoring/summary");
}

export function getFacultyDepartmentStudents(filters: Record<string, string | number | boolean | undefined> = {}) {
  return apiFetch<AnalyticsPage<DepartmentStudentStats>>(`/faculty/department-monitoring/students${toQuery(filters)}`);
}

export function getFacultyDepartmentLeaderboard() {
  return apiFetch<AnalyticsPage<StudentLeaderboardRow>>("/faculty/department-monitoring/leaderboard");
}

export function downloadAdminEventPdf(eventId: number) {
  return downloadFile(`/admin/reports/events/${eventId}/pdf`, `event-report-${eventId}.pdf`);
}

export function downloadAdminEventStudentsExcel(eventId: number) {
  return downloadFile(`/admin/reports/events/${eventId}/students.xlsx`, `event-students-${eventId}.xlsx`);
}

export function downloadAdminEventTeamsExcel(eventId: number) {
  return downloadFile(`/admin/reports/events/${eventId}/teams.xlsx`, `event-teams-${eventId}.xlsx`);
}

export function downloadAdminEventResultsExcel(eventId: number) {
  return downloadFile(`/admin/reports/events/${eventId}/results.xlsx`, `event-results-${eventId}.xlsx`);
}

export function downloadAdminDepartmentPdf(departmentId: number, filters: Record<string, string | number | boolean | undefined> = {}) {
  return downloadFile(`/admin/reports/departments/${departmentId}/pdf${toQuery(filters)}`, `department-report-${departmentId}.pdf`);
}

export function downloadAdminDepartmentStudentsExcel(departmentId: number, filters: Record<string, string | number | boolean | undefined> = {}) {
  return downloadFile(`/admin/reports/departments/${departmentId}/students.xlsx${toQuery(filters)}`, `department-students-${departmentId}.xlsx`);
}

export function downloadAdminCollegeLeaderboardExcel(filters: Record<string, string | number | boolean | undefined> = {}) {
  return downloadFile(`/admin/reports/leaderboard/college.xlsx${toQuery(filters)}`, "college-leaderboard.xlsx");
}

export function downloadFacultyEventPdf(eventId: number) {
  return downloadFile(`/faculty/reports/events/${eventId}/pdf`, `event-report-${eventId}.pdf`);
}

export function downloadFacultyEventStudentsExcel(eventId: number) {
  return downloadFile(`/faculty/reports/events/${eventId}/students.xlsx`, `event-students-${eventId}.xlsx`);
}

export function downloadFacultyEventTeamsExcel(eventId: number) {
  return downloadFile(`/faculty/reports/events/${eventId}/teams.xlsx`, `event-teams-${eventId}.xlsx`);
}

export function downloadFacultyEventResultsExcel(eventId: number) {
  return downloadFile(`/faculty/reports/events/${eventId}/results.xlsx`, `event-results-${eventId}.xlsx`);
}

export function downloadFacultyDepartmentPdf(filters: Record<string, string | number | boolean | undefined> = {}) {
  return downloadFile(`/faculty/reports/department/pdf${toQuery(filters)}`, "department-report.pdf");
}

export function downloadFacultyDepartmentStudentsExcel(filters: Record<string, string | number | boolean | undefined> = {}) {
  return downloadFile(`/faculty/reports/department/students.xlsx${toQuery(filters)}`, "department-students.xlsx");
}

export function getRecentNotifications() {
  return apiFetch<NotificationItem[]>("/notifications/recent");
}

export function getNotifications(filters: Record<string, string | number | boolean | undefined> = {}) {
  return apiFetch<PageResponse<NotificationItem>>(`/notifications${toQuery(filters)}`);
}

export function getUnreadNotificationCount() {
  return apiFetch<{ count: number }>("/notifications/unread-count");
}

export function markNotificationRead(id: number) {
  return apiFetch<NotificationItem>(`/notifications/${id}/read`, { method: "PATCH" });
}

export function markAllNotificationsRead() {
  return apiFetch<void>("/notifications/read-all", { method: "PATCH" });
}

export function deleteNotification(id: number) {
  return apiFetch<void>(`/notifications/${id}`, { method: "DELETE" });
}

function toQuery(params: Record<string, string | number | boolean | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      query.set(key, String(value));
    }
  });
  const value = query.toString();
  return value ? `?${value}` : "";
}

function filenameFromDisposition(disposition: string | null) {
  if (!disposition) {
    return null;
  }
  const match = /filename="?([^"]+)"?/i.exec(disposition);
  return match?.[1] ?? null;
}
