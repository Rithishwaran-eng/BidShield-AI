import Link from "next/link";

interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  breadcrumbs?: Breadcrumb[];
  action?: React.ReactNode;
}

export default function PageHeader({
  title,
  breadcrumbs,
  action,
}: PageHeaderProps) {
  return (
    <div className="mb-6">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="mb-2" aria-label="Breadcrumb">
          <ol style={{ display: "flex", gap: "var(--space-1)", listStyle: "none", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
            {breadcrumbs.map((crumb, i) => (
              <li key={i} style={{ display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
                {i > 0 && <span>/</span>}
                {crumb.href ? (
                  <Link href={crumb.href}>{crumb.label}</Link>
                ) : (
                  <span>{crumb.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1>{title}</h1>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
}
