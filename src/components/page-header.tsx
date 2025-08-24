import { cn } from "@/lib/utils";
import { Breadcrumbs } from "./breadcrumbs";

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
        "flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-4",
        className
      )}
    >
      <div className="grid gap-2">
        <Breadcrumbs />
        <h1 className="text-2xl md:text-3xl font-black tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-muted-foreground max-w-lg">{description}</p>
        )}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

    