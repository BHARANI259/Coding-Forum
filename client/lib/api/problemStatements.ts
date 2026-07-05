export {
  getAdminProblemStatements,
  createProblemStatement as createAdminProblemStatement,
  updateProblemStatement as updateAdminProblemStatement,
  updateProblemStatementStatus as updateAdminProblemStatementStatus,
  deleteProblemStatement as deleteAdminProblemStatement,
  getFacultyProblemStatements,
  getStudentProblemStatements
} from "@/lib/api";

export type {
  ProblemStatement,
  ProblemStatementLink,
  ProblemStatementPayload
} from "@/lib/api";
