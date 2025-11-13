import * as React from "react";
import { User, FileText, Target, ListChecks } from "lucide-react";
import { cn } from "../../../lib/utils";
import { Badge } from "../../Badge";

export interface BlockChipsRowProps {
  chips: {
    persona?: string;
    context?: string;
    output?: string;
    instructions?: string;
  };
  className?: string;
}

interface ChipConfig {
  key: keyof BlockChipsRowProps["chips"];
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  variant: "default" | "secondary" | "info" | "warning";
  ariaLabel: string;
}

const chipConfigs: ChipConfig[] = [
  {
    key: "persona",
    icon: User,
    label: "Persona",
    variant: "default", // Uses primary color
    ariaLabel: "Persona block",
  },
  {
    key: "context",
    icon: FileText,
    label: "Context",
    variant: "secondary", // Uses secondary color
    ariaLabel: "Context block",
  },
  {
    key: "output",
    icon: Target,
    label: "Output",
    variant: "warning", // Uses accent color (warning maps to accent in tokens)
    ariaLabel: "Output block",
  },
  {
    key: "instructions",
    icon: ListChecks,
    label: "Instructions",
    variant: "info", // Uses info color
    ariaLabel: "Instructions block",
  },
];

export function BlockChipsRow({ chips, className }: BlockChipsRowProps) {
  // Filter out chips that don't have content
  const visibleChips = chipConfigs.filter(config =>
    chips[config.key] && chips[config.key]?.trim()
  );

  // Don't render anything if no chips have content
  if (visibleChips.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 flex-wrap",
        className
      )}
      role="group"
      aria-label="Prompt block types"
    >
      {visibleChips.map((config) => {
        const IconComponent = config.icon;

        const content = chips[config.key]!;

        return (
          <Badge
            key={config.key}
            variant={config.variant}
            className="flex items-center gap-1.5 text-xs font-medium max-w-xs"
            aria-label={config.ariaLabel}
            title={content} // Full content on hover
          >
            <IconComponent className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
            <span className="truncate">{content}</span>
          </Badge>
        );
      })}
    </div>
  );
}

BlockChipsRow.displayName = "BlockChipsRow";
