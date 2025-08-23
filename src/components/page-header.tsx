import { cn } from "@/lib/utils";

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
}

export function PageHeader({
  title,
  description,
  className,
  children,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4",
        className
      )}
    >
      <div className="grid gap-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">
          {title}
        </h1>
        {description && (
          <p className="text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}
