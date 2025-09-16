'use client';

import { useState } from 'react';
import { Calculator, DollarSign, Percent, Calendar } from 'lucide-react';

interface MortgageResult {
  monthlyPayment: number;
  totalInterest: number;
  totalPayment: number;
}

export default function MortgageCalculator() {
  const [homePrice, setHomePrice] = useState<string>('400000');
  const [downPayment, setDownPayment] = useState<string>('80000');
  const [interestRate, setInterestRate] = useState<string>('7.0');
  const [loanTerm, setLoanTerm] = useState<string>('30');
  const [result, setResult] = useState<MortgageResult | null>(null);

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
    const totalPayment = monthlyPayment * months;
    const totalInterest = totalPayment - principal;

    setResult({
      monthlyPayment,
      totalInterest,
      totalPayment: totalPayment // This is just the loan payments, not including down payment
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
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Principal & Interest:</span>
                <span className="font-semibold text-brand text-lg">
                  {formatCurrency(result.monthlyPayment)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Interest:</span>
                <span>{formatCurrency(result.totalInterest)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total of Loan Payments:</span>
                <span>{formatCurrency(result.totalPayment)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Cost (with down payment):</span>
                <span>{formatCurrency(result.totalPayment + parseFloat(downPayment))}</span>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-2">
                *This calculation does not include taxes, insurance, or HOA fees.
              </p>
              <a
                href="/contact"
                className="block w-full text-center bg-brand text-white py-2 px-4 rounded-md hover:bg-brand/90 transition-colors text-sm font-medium"
              >
                Get Pre-Approved Today
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
