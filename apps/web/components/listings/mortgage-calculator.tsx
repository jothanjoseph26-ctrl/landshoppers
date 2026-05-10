'use client'

import { useState, useMemo } from 'react'
import { Calculator, Info } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface MortgageCalculatorProps {
  propertyPrice: number
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(value)
}

export function MortgageCalculator({ propertyPrice }: MortgageCalculatorProps) {
  const [downPaymentPercent, setDownPaymentPercent] = useState(20)
  const [interestRate, setInterestRate] = useState(18) // Nigerian mortgage rates ~18-25%
  const [loanTerm, setLoanTerm] = useState(20)

  const calculations = useMemo(() => {
    const downPayment = (propertyPrice * downPaymentPercent) / 100
    const loanAmount = propertyPrice - downPayment
    const monthlyRate = interestRate / 100 / 12
    const numberOfPayments = loanTerm * 12

    // Monthly payment formula: M = P * [r(1+r)^n] / [(1+r)^n - 1]
    const monthlyPayment =
      (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1)

    const totalPayment = monthlyPayment * numberOfPayments
    const totalInterest = totalPayment - loanAmount

    return {
      downPayment,
      loanAmount,
      monthlyPayment: isNaN(monthlyPayment) ? 0 : monthlyPayment,
      totalPayment: isNaN(totalPayment) ? 0 : totalPayment,
      totalInterest: isNaN(totalInterest) ? 0 : totalInterest,
    }
  }, [propertyPrice, downPaymentPercent, interestRate, loanTerm])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calculator className="h-5 w-5 text-primary" />
          Mortgage Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Property Price (Fixed) */}
        <div>
          <Label className="text-sm text-muted-foreground">Property Price</Label>
          <p className="text-2xl font-bold text-foreground">
            {formatCurrency(propertyPrice)}
          </p>
        </div>

        {/* Down Payment */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-1">
              Down Payment
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Most Nigerian banks require 20-30% down payment</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <span className="text-sm font-medium">
              {downPaymentPercent}% ({formatCurrency(calculations.downPayment)})
            </span>
          </div>
          <Slider
            value={[downPaymentPercent]}
            onValueChange={(value) => setDownPaymentPercent(value[0])}
            min={10}
            max={50}
            step={5}
            className="w-full"
          />
        </div>

        {/* Interest Rate */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-1">
              Interest Rate
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Nigerian mortgage rates typically range from 15-25%</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <span className="text-sm font-medium">{interestRate}% per year</span>
          </div>
          <Slider
            value={[interestRate]}
            onValueChange={(value) => setInterestRate(value[0])}
            min={10}
            max={30}
            step={0.5}
            className="w-full"
          />
        </div>

        {/* Loan Term */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Loan Term</Label>
            <span className="text-sm font-medium">{loanTerm} years</span>
          </div>
          <Slider
            value={[loanTerm]}
            onValueChange={(value) => setLoanTerm(value[0])}
            min={5}
            max={30}
            step={5}
            className="w-full"
          />
        </div>

        {/* Results */}
        <div className="space-y-4 rounded-lg bg-primary/5 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Loan Amount</span>
            <span className="font-medium">
              {formatCurrency(calculations.loanAmount)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Interest</span>
            <span className="font-medium">
              {formatCurrency(calculations.totalInterest)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Payment</span>
            <span className="font-medium">
              {formatCurrency(calculations.totalPayment)}
            </span>
          </div>
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground">
                Monthly Payment
              </span>
              <span className="text-2xl font-bold text-primary">
                {formatCurrency(calculations.monthlyPayment)}
              </span>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          * This is an estimate only. Contact a mortgage provider for accurate quotes.
        </p>
      </CardContent>
    </Card>
  )
}
