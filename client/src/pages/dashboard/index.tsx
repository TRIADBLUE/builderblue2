import { AppShell } from "../../components/layout/app-shell";
import { useAuth } from "../../hooks/useAuth";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <AppShell>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Welcome back{user?.name ? `, ${user.name}` : ""}.
        </p>

        <div className="mt-8 rounded-lg border border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-500">
            Your projects and compute usage will appear here.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
