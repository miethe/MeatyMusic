/**
 * Cost Calculator Component - Phase 2 Models Integration
 *
 * Interactive component for calculating AI model costs based on usage patterns.
 * Provides real-time cost estimation for different token volumes.
 *
 * Architecture:
 * - Uses @meaty/ui components for consistent design
 * - Real-time calculations with debounced updates
 * - Supports different input/output token ratios
 * - Visualizes cost breakdowns and comparisons
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../Card';
import { Input } from '../Input';
import { Label } from '../Label';
import { Badge } from '../Badge';
import { Separator } from '../Separator';
import { Slider } from '../Slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../Tabs';
import { Button } from '../Button';
import { CalculatorIcon, RotateCcwIcon } from 'lucide-react';

// ===== TYPE DEFINITIONS =====

export interface CostCalculatorProps {
  /** Cost per 1k input tokens */
  inputCostPer1k: number;
  /** Cost per 1k output tokens */
  outputCostPer1k: number;
  /** Model name for display */
  modelName: string;
  /** Tier information */
  tier?: 'free' | 'budget' | 'standard' | 'premium';
  /** Custom className */
  className?: string;
  /** Callback when calculation changes */
  onCalculationChange?: (calculation: CostCalculation) => void;
}

export interface CostCalculation {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
  costPer1kAverage: number;
  estimatedMonthly: number;
}

// ===== UTILITY FUNCTIONS =====

const formatCurrency = (amount: number): string => {
  if (amount === 0) return '$0.00';
  if (amount < 0.01) return `$${amount.toFixed(4)}`;
  return `$${amount.toFixed(2)}`;
};

const formatTokens = (tokens: number): string => {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(1)}M`;
  }
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(0)}k`;
  }
  return tokens.toString();
};

const debounce = (func: Function, wait: number) => {
  let timeout: ReturnType<typeof setTimeout>;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// ===== PRESET CONFIGURATIONS =====

const USAGE_PRESETS = [
  {
    name: 'Light Usage',
    description: 'Personal projects',
    totalTokens: 10000,
    inputRatio: 0.7,
    frequency: 'month'
  },
  {
    name: 'Development',
    description: 'Active development',
    totalTokens: 100000,
    inputRatio: 0.6,
    frequency: 'month'
  },
  {
    name: 'Production',
    description: 'Production app',
    totalTokens: 1000000,
    inputRatio: 0.5,
    frequency: 'month'
  },
  {
    name: 'Enterprise',
    description: 'High volume',
    totalTokens: 10000000,
    inputRatio: 0.4,
    frequency: 'month'
  }
];

// ===== MAIN COMPONENT =====

export const CostCalculator: React.FC<CostCalculatorProps> = ({
  inputCostPer1k,
  outputCostPer1k,
  modelName,
  tier = 'standard',
  className = '',
  onCalculationChange,
}) => {
  // ===== STATE =====
  const [totalTokens, setTotalTokens] = useState(100000);
  const [inputRatio, setInputRatio] = useState(70); // Percentage
  const [frequency, setFrequency] = useState<'day' | 'week' | 'month'>('month');

  // ===== CALCULATIONS =====
  const calculation = useMemo((): CostCalculation => {
    const inputTokens = Math.round(totalTokens * (inputRatio / 100));
    const outputTokens = totalTokens - inputTokens;

    const inputCost = (inputTokens / 1000) * inputCostPer1k;
    const outputCost = (outputTokens / 1000) * outputCostPer1k;
    const totalCost = inputCost + outputCost;

    const costPer1kAverage = totalTokens > 0 ? (totalCost / totalTokens) * 1000 : 0;

    // Convert to monthly estimate
    let estimatedMonthly = totalCost;
    if (frequency === 'day') {
      estimatedMonthly = totalCost * 30;
    } else if (frequency === 'week') {
      estimatedMonthly = totalCost * 4.33;
    }

    return {
      inputTokens,
      outputTokens,
      totalTokens,
      inputCost,
      outputCost,
      totalCost,
      costPer1kAverage,
      estimatedMonthly
    };
  }, [totalTokens, inputRatio, frequency, inputCostPer1k, outputCostPer1k]);

  // ===== EFFECTS =====

  // Debounced callback for calculation changes
  const debouncedCallback = useMemo(
    () => debounce((calc: CostCalculation) => {
      onCalculationChange?.(calc);
    }, 300),
    [onCalculationChange]
  );

  useEffect(() => {
    debouncedCallback(calculation);
  }, [calculation, debouncedCallback]);

  // ===== EVENT HANDLERS =====

  const applyPreset = (preset: typeof USAGE_PRESETS[0]) => {
    setTotalTokens(preset.totalTokens);
    setInputRatio(preset.inputRatio * 100);
    setFrequency(preset.frequency as 'month');
  };

  const resetCalculator = () => {
    setTotalTokens(100000);
    setInputRatio(70);
    setFrequency('month');
  };

  // ===== RENDER =====

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <CalculatorIcon className="h-5 w-5" />
          <span>Cost Calculator</span>
          <Badge variant="outline" className="ml-auto capitalize">
            {tier}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Quick Presets */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Quick Presets</Label>
          <div className="grid grid-cols-2 gap-2">
            {USAGE_PRESETS.map((preset, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="justify-start h-auto p-3"
                onClick={() => applyPreset(preset)}
              >
                <div className="text-left">
                  <div className="font-medium text-sm">{preset.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatTokens(preset.totalTokens)}/{preset.frequency}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Custom Configuration */}
        <Tabs defaultValue="tokens" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tokens">Token Usage</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="tokens" className="space-y-4">
            {/* Total Tokens */}
            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span>Total Tokens per {frequency}</span>
                <span className="font-mono text-sm">{formatTokens(totalTokens)}</span>
              </Label>
              <Slider
                value={[totalTokens]}
                onValueChange={([value]) => setTotalTokens(value)}
                min={1000}
                max={10000000}
                step={1000}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1k</span>
                <span>10M</span>
              </div>
            </div>

            {/* Input/Output Ratio */}
            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span>Input Tokens</span>
                <span className="font-mono text-sm">{inputRatio}%</span>
              </Label>
              <Slider
                value={[inputRatio]}
                onValueChange={([value]) => setInputRatio(value)}
                min={10}
                max={90}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>10% Input</span>
                <span>90% Input</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            {/* Frequency */}
            <div className="space-y-2">
              <Label>Usage Frequency</Label>
              <div className="grid grid-cols-3 gap-2">
                {(['day', 'week', 'month'] as const).map((freq) => (
                  <Button
                    key={freq}
                    variant={frequency === freq ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFrequency(freq)}
                    className="capitalize"
                  >
                    Per {freq}
                  </Button>
                ))}
              </div>
            </div>

            {/* Direct Token Inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Input Tokens</Label>
                <Input
                  type="number"
                  value={calculation.inputTokens}
                  onChange={(e) => {
                    const inputTokens = parseInt(e.target.value) || 0;
                    const newTotal = inputTokens + calculation.outputTokens;
                    setTotalTokens(newTotal);
                    setInputRatio(newTotal > 0 ? (inputTokens / newTotal) * 100 : 70);
                  }}
                  min={0}
                />
              </div>
              <div className="space-y-2">
                <Label>Output Tokens</Label>
                <Input
                  type="number"
                  value={calculation.outputTokens}
                  onChange={(e) => {
                    const outputTokens = parseInt(e.target.value) || 0;
                    const newTotal = calculation.inputTokens + outputTokens;
                    setTotalTokens(newTotal);
                    setInputRatio(newTotal > 0 ? (calculation.inputTokens / newTotal) * 100 : 70);
                  }}
                  min={0}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <Separator />

        {/* Cost Breakdown */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">Cost Breakdown</Label>
            <Button variant="ghost" size="sm" onClick={resetCalculator}>
              <RotateCcwIcon className="h-4 w-4 mr-1" />
              Reset
            </Button>
          </div>

          <div className="grid gap-3">
            {/* Per-frequency cost */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <div className="font-medium">Cost per {frequency}</div>
                <div className="text-sm text-muted-foreground">
                  {formatTokens(calculation.inputTokens)} input + {formatTokens(calculation.outputTokens)} output
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-lg font-medium">
                  {formatCurrency(calculation.totalCost)}
                </div>
              </div>
            </div>

            {/* Monthly estimate if not monthly */}
            {frequency !== 'month' && (
              <div className="flex items-center justify-between p-2 rounded-lg border border-dashed">
                <div className="text-sm">Estimated monthly</div>
                <div className="font-mono text-sm">
                  {formatCurrency(calculation.estimatedMonthly)}
                </div>
              </div>
            )}

            {/* Detailed breakdown */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Input cost ({formatTokens(calculation.inputTokens)} × {formatCurrency(inputCostPer1k)}/1k)</span>
                <span className="font-mono">{formatCurrency(calculation.inputCost)}</span>
              </div>
              <div className="flex justify-between">
                <span>Output cost ({formatTokens(calculation.outputTokens)} × {formatCurrency(outputCostPer1k)}/1k)</span>
                <span className="font-mono">{formatCurrency(calculation.outputCost)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-medium">
                <span>Total per {frequency}</span>
                <span className="font-mono">{formatCurrency(calculation.totalCost)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CostCalculator;
