import { Link } from "wouter";
import { Nav } from "../components/layout/nav";
import { Button } from "../components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <Nav />
      <div className="mx-auto max-w-4xl px-4 py-24 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-gray-900">
          BuilderBlue²
        </h1>
        <p className="mt-6 text-lg text-gray-600">
          Build, deploy, and scale your projects with AI-powered compute.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link href="/register">
            <Button size="lg">Get started</Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg">
              Sign in
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
