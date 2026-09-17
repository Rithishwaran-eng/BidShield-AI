interface BadgeProps {
  status: string;
  label?: string;
}

const STATUS_MAP: Record<string, { className: string; label: string }> = {
  verified: { className: "badge-verified", label: "Verified" },
  issue_detected: { className: "badge-issue", label: "Issue Detected" },
  missing: { className: "badge-missing", label: "Missing" },
  pending: { className: "badge-pending", label: "Pending" },
  done: { className: "badge-verified", label: "Done" },
  failed: { className: "badge-issue", label: "Failed" },
  draft: { className: "badge-pending", label: "Draft" },
  active: { className: "badge-verified", label: "Active" },
  rules_pending: { className: "badge-missing", label: "Rules Pending" },
};

export default function StatusBadge({ status, label }: BadgeProps) {
  const mapped = STATUS_MAP[status] || {
    className: "badge-pending",
    label: status,
  };

  return (
    <span className={`badge ${mapped.className}`}>
      {label || mapped.label}
    </span>
  );
}
