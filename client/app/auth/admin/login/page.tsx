import RoleLoginForm from "@/components/auth/RoleLoginForm";

export default function AdminLoginPage() {
  return (
    <RoleLoginForm
      roleLabel="SUPER_ADMIN"
      title="Admin Login"
      subtitle="Authorized administration access only"
      endpoint="/auth/admin/login"
      redirectPath="/admin/dashboard"
    />
  );
}
