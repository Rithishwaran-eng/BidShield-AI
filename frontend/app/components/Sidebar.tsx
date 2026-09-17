"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps {
  tenderId: string;
}

export default function Sidebar({ tenderId }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { label: "Tender Details", href: `/tenders/${tenderId}` },
    { label: "Bidders", href: `/tenders/${tenderId}/bidders` },
    { label: "Dashboard", href: `/tenders/${tenderId}/dashboard` },
    { label: "Audit Log", href: `/tenders/${tenderId}/audit` },
  ];

  const isActive = (href: string) => {
    if (href === `/tenders/${tenderId}`) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-section">Tender Navigation</div>
      <ul className="sidebar-nav">
        {navItems.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={`sidebar-nav-item${isActive(item.href) ? " active" : ""}`}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
      <hr className="sidebar-divider" />
      <div className="sidebar-section">Advanced</div>
      <ul className="sidebar-nav">
        <li>
          <Link
            href={`/tenders/${tenderId}/verification-sources`}
            className={`sidebar-nav-item${pathname.includes("verification-sources") ? " active" : ""}`}
          >
            Verification Sources
          </Link>
        </li>
      </ul>
    </aside>
  );
}
