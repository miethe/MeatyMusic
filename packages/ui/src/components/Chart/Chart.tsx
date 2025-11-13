/**
 * Base Chart component wrapper with consistent theming and accessibility
 */

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../Card"
import { Skeleton } from "../Skeleton"
import { Alert, AlertDescription } from "../Alert"
import { Button } from "../Button"
import { RefreshCw } from "lucide-react"
import { cn } from "../../lib/utils"

export interface ChartProps {
  title?: string
  description?: string
  children: React.ReactNode
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  className?: string
  height?: number | string
  isEmpty?: boolean
  emptyMessage?: string
  emptyAction?: React.ReactNode
}

const Chart = React.forwardRef<HTMLDivElement, ChartProps>(
  ({
    title,
    description,
    children,
    loading = false,
    error = null,
    onRetry,
    className,
    height = 300,
    isEmpty = false,
    emptyMessage = "No data available for the selected period",
    emptyAction,
    ...props
  }, ref) => {
    const chartHeight = typeof height === 'number' ? `${height}px` : height

    if (loading) {
      return (
        <Card className={cn("w-full", className)} ref={ref} {...props}>
          {(title || description) && (
            <CardHeader>
              {title && <CardTitle>{title}</CardTitle>}
              {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
          )}
          <CardContent>
            <div className="space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className={`w-full`} style={{ height: chartHeight }} />
            </div>
          </CardContent>
        </Card>
      )
    }

    if (error) {
      return (
        <Card className={cn("w-full", className)} ref={ref} {...props}>
          {(title || description) && (
            <CardHeader>
              {title && <CardTitle>{title}</CardTitle>}
              {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
          )}
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription className="flex items-center justify-between">
                <span>{error}</span>
                {onRetry && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onRetry}
                    className="shrink-0 ml-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Retry
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )
    }

    if (isEmpty) {
      return (
        <Card className={cn("w-full", className)} ref={ref} {...props}>
          {(title || description) && (
            <CardHeader>
              {title && <CardTitle>{title}</CardTitle>}
              {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
          )}
          <CardContent>
            <div
              className="flex flex-col items-center justify-center space-y-4 text-muted-foreground"
              style={{ height: chartHeight }}
            >
              <div className="text-center space-y-2">
                <p className="text-sm">{emptyMessage}</p>
                {emptyAction}
              </div>
            </div>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card className={cn("w-full", className)} ref={ref} {...props}>
        {(title || description) && (
          <CardHeader>
            {title && <CardTitle>{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
        )}
        <CardContent>
          <div style={{ height: chartHeight, minHeight: chartHeight }}>
            {children}
          </div>
        </CardContent>
      </Card>
    )
  }
)

Chart.displayName = "Chart"

export { Chart }
