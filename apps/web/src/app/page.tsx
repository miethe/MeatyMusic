import Link from 'next/link';

import { Music2, Sparkles, Target, CheckCircle2 } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <header className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Music2 className="w-12 h-12 text-primary" />
            <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
              MeatyMusic
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Agentic Music Creation System
          </p>
          <p className="text-lg text-muted-foreground mt-2 max-w-3xl mx-auto">
            Transform structured creative intent into validated musical artifacts with full traceability and reproducibility
          </p>
        </header>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <FeatureCard
            icon={<Target className="w-8 h-8" />}
            title="Deterministic"
            description="Same inputs + seed = same outputs. Full reproducibility guaranteed."
          />
          <FeatureCard
            icon={<Sparkles className="w-8 h-8" />}
            title="Constraint-Driven"
            description="Satisfy blueprint/rubric + policy constraints before render."
          />
          <FeatureCard
            icon={<CheckCircle2 className="w-8 h-8" />}
            title="Traceable"
            description="Every decision carries provenance, hashes, and scores."
          />
        </div>

        {/* Workflow Overview */}
        <section className="bg-card rounded-lg border p-8 mb-12">
          <h2 className="text-2xl font-semibold mb-4">Workflow</h2>
          <div className="flex flex-wrap gap-2 items-center justify-center text-sm">
            {[
              'PLAN',
              'STYLE',
              'LYRICS',
              'PRODUCER',
              'COMPOSE',
              'VALIDATE',
              'RENDER',
              'REVIEW',
            ].map((step, idx, arr) => (
              <div key={step} className="flex items-center">
                <div className="px-4 py-2 bg-primary/10 text-primary rounded-md font-mono">
                  {step}
                </div>
                {idx < arr.length - 1 && (
                  <div className="mx-2 text-muted-foreground">→</div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            <Music2 className="w-5 h-5" />
            Go to Dashboard
          </Link>
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-sm text-muted-foreground">
          <p>Phase 2: Infrastructure Preservation - Bootstrap Complete</p>
          <p className="mt-2">
            Next: Phase 3 - Database Schema and Entity Implementation
          </p>
        </footer>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-card rounded-lg border p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center gap-3 mb-3">
        <div className="text-primary">{icon}</div>
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
