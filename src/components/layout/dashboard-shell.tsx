interface DashboardShellProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}

export function DashboardShell({ title, description, children, action }: DashboardShellProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && <p className="text-muted-foreground mt-1">{description}</p>}
        </div>
        {action && <div className="flex items-center gap-2">{action}</div>}
      </div>
      {children}
    </div>
  );
}
