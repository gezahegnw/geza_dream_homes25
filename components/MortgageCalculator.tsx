'use client';

import { useState, useEffect } from 'react';
import { Calculator, DollarSign, Percent, Calendar } from 'lucide-react';

interface MortgageResult {
  monthlyPayment: number;
  monthlyInterest: number;
  monthlyPrincipal: number;
  totalInterest: number;
  totalPayment: number;
}

interface MortgageCalculatorProps {
  price: number;
}

export default function MortgageCalculator({ price }: MortgageCalculatorProps) {
  const [homePrice, setHomePrice] = useState<string>(String(price || 400000));
  const [downPayment, setDownPayment] = useState<string>('80000');
  const [interestRate, setInterestRate] = useState<string>('7.0');
  const [loanTerm, setLoanTerm] = useState<string>('30');
  const [result, setResult] = useState<MortgageResult | null>(null);

  useEffect(() => {
    calculateMortgage();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const calculateMortgage = () => {
    const price = parseFloat(homePrice);
    const down = parseFloat(downPayment);
    const rate = parseFloat(interestRate) / 100 / 12; // Monthly rate
    const months = parseInt(loanTerm) * 12;
    const principal = price - down;

    if (principal <= 0 || rate <= 0 || months <= 0) {
      setResult(null);
      return;
    }

    const monthlyPayment = (principal * rate * Math.pow(1 + rate, months)) / (Math.pow(1 + rate, months) - 1);
    
    // Calculate first month's principal and interest breakdown
    const firstMonthInterest = principal * rate;
    const firstMonthPrincipal = monthlyPayment - firstMonthInterest;
    
    const totalPayment = monthlyPayment * months;
    const totalInterest = totalPayment - principal;

    setResult({
      monthlyPayment,
      monthlyInterest: firstMonthInterest,
      monthlyPrincipal: firstMonthPrincipal,
      totalInterest,
      totalPayment: totalPayment
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <div className="flex items-center mb-6">
        <Calculator className="h-6 w-6 text-brand mr-2" />
        <h3 className="text-xl font-bold text-gray-900">Mortgage Calculator</h3>
      </div>

      <div className="space-y-4">
        {/* Home Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <DollarSign className="inline h-4 w-4 mr-1" />
            Home Price
          </label>
          <input
            type="number"
            value={homePrice}
            onChange={(e) => setHomePrice(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
            placeholder="400,000"
          />
        </div>

        {/* Down Payment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <DollarSign className="inline h-4 w-4 mr-1" />
            Down Payment
          </label>
          <input
            type="number"
            value={downPayment}
            onChange={(e) => setDownPayment(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
            placeholder="80,000"
          />
        </div>

        {/* Interest Rate */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Percent className="inline h-4 w-4 mr-1" />
            Interest Rate (%)
          </label>
          <input
            type="number"
            step="0.1"
            value={interestRate}
            onChange={(e) => setInterestRate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
            placeholder="7.0"
          />
        </div>

        {/* Loan Term */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Calendar className="inline h-4 w-4 mr-1" />
            Loan Term (years)
          </label>
          <select
            value={loanTerm}
            onChange={(e) => setLoanTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
          >
            <option value="15">15 years</option>
            <option value="20">20 years</option>
            <option value="25">25 years</option>
            <option value="30">30 years</option>
          </select>
        </div>

        {/* Calculate Button */}
        <button
          onClick={calculateMortgage}
          className="w-full bg-brand text-white py-2 px-4 rounded-md hover:bg-brand/90 transition-colors font-medium"
        >
          Calculate Payment
        </button>

        {/* Results */}
        {result && (
          <div className="mt-6 p-4 bg-gray-50 rounded-md">
            <h4 className="font-semibold text-gray-900 mb-3">Your Monthly Payment</h4>
            <div className="text-center mb-4">
              <div className="text-4xl font-bold text-brand mb-2">
                {formatCurrency(result.monthlyPayment)}
              </div>
              <p className="text-sm text-gray-600">
                Total monthly payment
              </p>
            </div>
            
            {/* Payment Breakdown */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Principal:</span>
                <span className="font-medium">{formatCurrency(result.monthlyPrincipal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Interest:</span>
                <span className="font-medium">{formatCurrency(result.monthlyInterest)}</span>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                *This calculation does not include taxes, insurance, or HOA fees. Principal/Interest amounts shown are for the first payment.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
