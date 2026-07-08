import React from 'react';
import { PageHeader } from '@/components/layout/PageHeader';

export default function DashboardPage() {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Welcome to SurveyOS. Dashboard metrics coming soon."
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Placeholder cards for future metrics */}
        <div className="rounded-xl border bg-card text-card-foreground shadow h-32 flex items-center justify-center p-6 text-muted-foreground">
          Live Projects
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow h-32 flex items-center justify-center p-6 text-muted-foreground">
          Total Completes
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow h-32 flex items-center justify-center p-6 text-muted-foreground">
          Average Conversion
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow h-32 flex items-center justify-center p-6 text-muted-foreground">
          Active Suppliers
        </div>
      </div>
    </div>
  );
}
