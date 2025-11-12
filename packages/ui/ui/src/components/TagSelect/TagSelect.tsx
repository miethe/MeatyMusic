import * as React from "react";
import { X, Plus } from "lucide-react";
import { Badge } from "../Badge";
import { Input } from "../Input";
import { Button } from "../Button";
import { cn } from "../../lib/utils";

export interface Tag {
  value: string;
  label: string;
}

export interface TagSelectProps {
  /** Available tags to select from */
  options?: Tag[];
  /** Currently selected tags */
  value?: Tag[];
  /** Callback when tags change */
  onChange?: (tags: Tag[]) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Whether new tags can be created */
  allowCreate?: boolean;
  /** Maximum number of tags that can be selected */
  maxTags?: number;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Whether the component is in a loading state */
  isLoading?: boolean;
  /** Error state */
  error?: boolean;
}

const TagSelect = React.forwardRef<HTMLDivElement, TagSelectProps>(
  (
    {
      options = [],
      value = [],
      onChange,
      placeholder = "Select tags...",
      allowCreate = true,
      maxTags,
      disabled = false,
      className,
      isLoading = false,
      error = false,
    },
    ref
  ) => {
    const [inputValue, setInputValue] = React.useState("");
    const [isOpen, setIsOpen] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Filter options based on input and already selected tags
    const filteredOptions = React.useMemo(() => {
      const selectedValues = value.map(tag => tag.value);
      return options.filter(
        option =>
          !selectedValues.includes(option.value) &&
          option.label.toLowerCase().includes(inputValue.toLowerCase())
      );
    }, [options, value, inputValue]);

    // Check if we can add the current input as a new tag
    const canAddNewTag = React.useMemo(() => {
      if (!allowCreate || !inputValue.trim()) return false;
      const exists = options.some(
        opt => opt.value.toLowerCase() === inputValue.toLowerCase()
      );
      const alreadySelected = value.some(
        tag => tag.value.toLowerCase() === inputValue.toLowerCase()
      );
      return !exists && !alreadySelected;
    }, [allowCreate, inputValue, options, value]);

    const handleAddTag = (tag: Tag) => {
      if (disabled || (maxTags && value.length >= maxTags)) return;

      const newTags = [...value, tag];
      onChange?.(newTags);
      setInputValue("");
      setIsOpen(false);
      inputRef.current?.focus();
    };

    const handleRemoveTag = (tagToRemove: Tag) => {
      if (disabled) return;

      const newTags = value.filter(tag => tag.value !== tagToRemove.value);
      onChange?.(newTags);
    };

    const handleCreateTag = () => {
      if (!canAddNewTag) return;

      const newTag: Tag = {
        value: inputValue.trim(),
        label: inputValue.trim(),
      };
      handleAddTag(newTag);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();

        if (filteredOptions.length > 0) {
          handleAddTag(filteredOptions[0]);
        } else if (canAddNewTag) {
          handleCreateTag();
        }
      } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
        handleRemoveTag(value[value.length - 1]);
      } else if (e.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    const isMaxTagsReached = maxTags ? value.length >= maxTags : false;

    return (
      <div
        ref={ref}
        className={cn("relative", className)}
      >
        <div
          className={cn(
            "min-h-[2.5rem] w-full rounded-sm border bg-surface px-3 py-2 text-sm shadow-sm transition-colors",
            "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
            error && "border-destructive focus-within:ring-destructive",
            disabled && "cursor-not-allowed opacity-50",
            !error && "border-border"
          )}
          onClick={() => !disabled && inputRef.current?.focus()}
        >
          <div className="flex flex-wrap gap-1.5 items-center">
            {/* Selected Tags */}
            {value.map((tag) => (
              <Badge
                key={tag.value}
                variant="secondary"
                className="gap-1"
              >
                {tag.label}
                {!disabled && (
                  <span
                    role="button"
                    tabIndex={0}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRemoveTag(tag);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRemoveTag(tag);
                      }
                    }}
                    className="ml-1 hover:text-destructive cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 rounded-sm"
                    aria-label={`Remove ${tag.label}`}
                  >
                    <X className="h-3 w-3" />
                  </span>
                )}
              </Badge>
            ))}

            {/* Input Field - Fixed text color */}
            {!isMaxTagsReached && !disabled && (
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                onBlur={() => {
                  // Delay to allow click on dropdown items
                  setTimeout(() => setIsOpen(false), 200);
                }}
                onKeyDown={handleKeyDown}
                placeholder={value.length === 0 ? placeholder : ""}
                className="flex-1 min-w-[120px] bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
                disabled={disabled || isLoading}
              />
            )}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
            )}
          </div>
        </div>

        {/* Dropdown */}
        {isOpen && (filteredOptions.length > 0 || canAddNewTag) && (
          <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-1 shadow-md">
            <div className="max-h-60 overflow-auto">
              {/* Existing Options */}
              {filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleAddTag(option)}
                  className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-muted transition-colors text-left"
                >
                  {option.label}
                </button>
              ))}

              {/* Create New Tag Option */}
              {canAddNewTag && (
                <button
                  type="button"
                  onClick={handleCreateTag}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-muted transition-colors text-left text-primary"
                >
                  <Plus className="h-3 w-3" />
                  Create "{inputValue}"
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
);

TagSelect.displayName = "TagSelect";

export { TagSelect };
