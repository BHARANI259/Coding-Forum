import RoleLoginForm from "@/components/auth/RoleLoginForm";

export default function StudentLoginPage() {
  return (
    <RoleLoginForm
      roleLabel="STUDENT"
      title="Student Login"
      subtitle="Sign in with your Kongu student mail ID"
      endpoint="/auth/student/login"
      redirectPath="/student/dashboard"
    />
  );
}
