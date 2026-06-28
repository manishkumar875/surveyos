import { APP_NAME } from '@surveyos/shared';

import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background px-6 py-16 text-foreground">
      <section className="mx-auto flex max-w-4xl flex-col gap-8">
        <div className="space-y-4">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-muted-foreground">
            Phase 1 Foundation
          </p>
          <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">{APP_NAME}</h1>
          <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
            Monorepo foundation is ready. Business modules will be added one phase at a time after
            approval.
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Foundation includes</h2>
          <ul className="mt-4 grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
            <li>Next.js 15 + TypeScript</li>
            <li>Tailwind CSS + shadcn/ui-ready setup</li>
            <li>Express API shell</li>
            <li>Prisma + PostgreSQL setup</li>
            <li>Logging and error handling</li>
            <li>Docker Compose infrastructure</li>
          </ul>
        </div>

        <div>
          <Button type="button">SurveyOS Foundation</Button>
        </div>
      </section>
    </main>
  );
}
