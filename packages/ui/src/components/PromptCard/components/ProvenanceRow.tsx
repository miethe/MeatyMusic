import * as React from "react";
import { User, GitBranch, Edit, Calendar } from "lucide-react";
import { cn } from "../../../lib/utils";

export interface ProvenanceRowProps {
  originalAuthor?: string;
  forkSource?: string;
  lastEditor?: string;
  createdAt?: Date;
  className?: string;
}

interface ProvenanceItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  ariaLabel: string;
}

const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (years > 0) return `${years} year${years === 1 ? '' : 's'} ago`;
  if (months > 0) return `${months} month${months === 1 ? '' : 's'} ago`;
  if (weeks > 0) return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
  if (days > 0) return `${days} day${days === 1 ? '' : 's'} ago`;
  if (hours > 0) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  if (minutes > 0) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  return "Just now";
};

export function ProvenanceRow({
  originalAuthor,
  forkSource,
  lastEditor,
  createdAt,
  className,
}: ProvenanceRowProps) {
  // Build the provenance items array based on available data
  const provenanceItems: ProvenanceItem[] = React.useMemo(() => {
    const items: ProvenanceItem[] = [];

    if (originalAuthor) {
      items.push({
        icon: User,
        label: "Author",
        value: originalAuthor,
        ariaLabel: `Original author: ${originalAuthor}`,
      });
    }

    if (forkSource) {
      items.push({
        icon: GitBranch,
        label: "Forked from",
        value: forkSource,
        ariaLabel: `Forked from: ${forkSource}`,
      });
    }

    if (lastEditor && lastEditor !== originalAuthor) {
      items.push({
        icon: Edit,
        label: "Edited by",
        value: lastEditor,
        ariaLabel: `Last edited by: ${lastEditor}`,
      });
    }

    if (createdAt) {
      items.push({
        icon: Calendar,
        label: "Created",
        value: formatRelativeTime(createdAt),
        ariaLabel: `Created: ${formatRelativeTime(createdAt)}`,
      });
    }

    return items;
  }, [originalAuthor, forkSource, lastEditor, createdAt]);

  // Don't render if no provenance data is available
  if (provenanceItems.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-xs",
        className
      )}
      style={{ color: 'var(--mp-color-text-muted)' }}
      role="group"
      aria-label="Prompt provenance information"
    >
      {provenanceItems.map((item, index) => {
        const IconComponent = item.icon;
        const isLast = index === provenanceItems.length - 1;

        return (
          <React.Fragment key={`${item.label}-${index}`}>
            <div
              className="flex items-center gap-1.5 flex-shrink-0"
              aria-label={item.ariaLabel}
            >
              <IconComponent
                className="w-3 h-3 flex-shrink-0"
                aria-hidden="true"
              />
              <span className="font-medium text-nowrap">
                {item.label}:
              </span>
              <span className="truncate max-w-[120px] sm:max-w-none">
                {item.value}
              </span>
            </div>

            {/* Visual separator - only show on larger screens and not for last item */}
            {!isLast && (
              <span
                className="hidden sm:inline text-xs opacity-50 select-none"
                aria-hidden="true"
              >
                •
              </span>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

ProvenanceRow.displayName = "ProvenanceRow";
