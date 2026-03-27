import { Route, Switch } from "wouter";
import { AuthProvider } from "./src/hooks/useAuth";
import Landing from "./src/pages/landing";
import Login from "./src/pages/login";
import Register from "./src/pages/register";
import MagicLinkVerify from "./src/pages/magic-link-verify";
import Onboarding from "./src/pages/onboarding";
import Dashboard from "./src/pages/dashboard/index";
import IDEPage from "./src/pages/ide/index";
import ProjectSettings from "./src/pages/project-settings/index";

export default function App() {
  return (
    <AuthProvider>
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/auth/magic-link/verify" component={MagicLinkVerify} />
        <Route path="/onboarding" component={Onboarding} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/project/:id/settings" component={ProjectSettings} />
        <Route path="/ide/:id" component={IDEPage} />
        <Route>
          <div className="flex items-center justify-center min-h-screen">
            <h1 className="text-2xl font-semibold text-gray-600">404 — Not Found</h1>
          </div>
        </Route>
      </Switch>
    </AuthProvider>
  );
}
