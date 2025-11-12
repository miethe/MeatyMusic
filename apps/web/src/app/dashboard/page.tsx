import { Music2, Folder, User, Settings, Library } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Music2 className="w-8 h-8 text-primary" />
              <h1 className="text-2xl font-bold">MeatyMusic AMCS</h1>
            </div>
            <nav className="flex items-center gap-4">
              <a
                href="/dashboard"
                className="text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                Dashboard
              </a>
              <a
                href="/settings"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Settings
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Dashboard</h2>
          <p className="text-muted-foreground">
            Welcome to the MeatyMusic Agentic Music Creation System
          </p>
        </div>

        {/* Status Banner */}
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="bg-primary/20 rounded-full p-3">
              <Settings className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">
                Phase 2: Infrastructure Preservation Complete
              </h3>
              <p className="text-sm text-muted-foreground mb-2">
                Bootstrap from MeatyPrompts infrastructure successful. All
                services configured and validated.
              </p>
              <ul className="text-sm space-y-1">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Backend infrastructure (FastAPI, PostgreSQL, Redis)
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Frontend infrastructure (Next.js 14, React Query)
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Observability stack (OpenTelemetry, logging, metrics)
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Configuration and documentation
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Feature Modules Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ModuleCard
            icon={<Folder className="w-8 h-8" />}
            title="Songs"
            description="Create and manage song design specs (SDS)"
            status="Coming in Phase 3"
            href="/songs"
          />
          <ModuleCard
            icon={<User className="w-8 h-8" />}
            title="Personas"
            description="Define artist profiles and vocal characteristics"
            status="Coming in Phase 3"
            href="/personas"
          />
          <ModuleCard
            icon={<Library className="w-8 h-8" />}
            title="Blueprints"
            description="Browse genre-specific composition rules"
            status="Coming in Phase 4"
            href="/blueprints"
          />
        </div>

        {/* Next Steps */}
        <section className="mt-12 bg-card rounded-lg border p-6">
          <h3 className="text-xl font-semibold mb-4">Next Steps</h3>
          <div className="space-y-3">
            <NextStep
              phase="Phase 3"
              title="Database Schema Design"
              description="Implement Song, Style, Lyrics, Persona, and ProducerNotes entities"
            />
            <NextStep
              phase="Phase 4"
              title="Domain Implementation"
              description="Build repository and service layers with business logic"
            />
            <NextStep
              phase="Phase 5"
              title="Frontend Integration"
              description="Create UI components for song creation and workflow execution"
            />
          </div>
        </section>
      </main>
    </div>
  );
}

function ModuleCard({
  icon,
  title,
  description,
  status,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  status: string;
  href: string;
}) {
  return (
    <div className="bg-card rounded-lg border p-6 hover:shadow-lg transition-all hover:border-primary/50">
      <div className="flex items-center gap-3 mb-3">
        <div className="text-primary">{icon}</div>
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-3">{description}</p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium">
          {status}
        </span>
        <span className="text-xs text-primary font-medium opacity-50">
          {href}
        </span>
      </div>
    </div>
  );
}

function NextStep({
  phase,
  title,
  description,
}: {
  phase: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
      <div className="bg-primary/10 px-3 py-1 rounded-md text-sm font-semibold text-primary">
        {phase}
      </div>
      <div className="flex-1">
        <h4 className="font-semibold mb-1">{title}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
