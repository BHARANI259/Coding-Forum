import RoleLoginForm from "@/components/auth/RoleLoginForm";

export default function FacultyLoginPage() {
  return (
    <RoleLoginForm
      roleLabel="FACULTY"
      title="Faculty Login"
      subtitle="Sign in with your Kongu faculty mail ID"
      endpoint="/auth/faculty/login"
      redirectPath="/faculty/dashboard"
    />
  );
}
