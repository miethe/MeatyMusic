/**
 * MetricCard component for displaying KPI metrics
 */

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../Card"
import { Skeleton } from "../Skeleton"
import { Badge } from "../Badge"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "../../lib/utils"

interface MetricCardProps {
  title: string
  value: string | number
  description?: string
  trend?: {
    value: number
    label?: string
    isPositive?: boolean
  }
  change?: {
    value: number
    label?: string
    period?: string
  }
  status?: "positive" | "negative" | "neutral" | "warning"
  loading?: boolean
  className?: string
  icon?: React.ReactNode
  suffix?: string
  prefix?: string
  valueClassName?: string
}

const MetricCard = React.forwardRef<HTMLDivElement, MetricCardProps>(
  ({
    title,
    value,
    description,
    trend,
    change,
    status,
    loading = false,
    className,
    icon,
    suffix,
    prefix,
    valueClassName,
    ...props
  }, ref) => {
    if (loading) {
      return (
        <Card className={cn("w-full", className)} ref={ref} {...props}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              {icon && <Skeleton className="h-5 w-5 rounded" />}
            </div>
            {description && <Skeleton className="h-3 w-32" />}
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          </CardContent>
        </Card>
      )
    }

    const formatValue = (val: string | number): string => {
      if (typeof val === 'number') {
        if (val >= 1000000) {
          return `${(val / 1000000).toFixed(1)}M`
        }
        if (val >= 1000) {
          return `${(val / 1000).toFixed(1)}K`
        }
        return val.toLocaleString()
      }
      return String(val)
    }

    const getTrendIcon = () => {
      if (!trend) return null

      if (trend.isPositive === undefined) {
        // Auto-determine based on value
        if (trend.value > 0) return <TrendingUp className="h-4 w-4" />
        if (trend.value < 0) return <TrendingDown className="h-4 w-4" />
        return <Minus className="h-4 w-4" />
      }

      return trend.isPositive
        ? <TrendingUp className="h-4 w-4" />
        : <TrendingDown className="h-4 w-4" />
    }

    const getTrendColor = () => {
      if (!trend) return "text-muted-foreground"

      if (trend.isPositive === undefined) {
        // Auto-determine based on value
        if (trend.value > 0) return "text-green-600"
        if (trend.value < 0) return "text-red-600"
        return "text-muted-foreground"
      }

      return trend.isPositive
        ? "text-green-600"
        : "text-red-600"
    }

    const getStatusColor = () => {
      switch (status) {
        case "positive":
          return "border-l-green-500 bg-green-50/50"
        case "negative":
          return "border-l-red-500 bg-red-50/50"
        case "warning":
          return "border-l-yellow-500 bg-yellow-50/50"
        case "neutral":
        default:
          return "border-l-transparent"
      }
    }

    return (
      <Card
        className={cn(
          "w-full border-l-4",
          getStatusColor(),
          className
        )}
        ref={ref}
        {...props}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {title}
            </CardTitle>
            {icon && (
              <div className="text-muted-foreground">
                {icon}
              </div>
            )}
          </div>
          {description && (
            <CardDescription className="text-xs">
              {description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className={cn(
              "text-2xl font-bold tracking-tight",
              valueClassName
            )}>
              {prefix}
              {formatValue(value)}
              {suffix}
            </div>

            <div className="flex items-center justify-between">
              {trend && (
                <div className={cn(
                  "flex items-center space-x-1 text-sm font-medium",
                  getTrendColor()
                )}>
                  {getTrendIcon()}
                  <span>
                    {Math.abs(trend.value)}%
                    {trend.label && ` ${trend.label}`}
                  </span>
                </div>
              )}

              {change && (
                <Badge variant="secondary" className="text-xs">
                  {change.value > 0 ? "+" : ""}
                  {change.value}
                  {change.label && ` ${change.label}`}
                  {change.period && ` ${change.period}`}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }
)

MetricCard.displayName = "MetricCard"

export { MetricCard }
export type { MetricCardProps }
