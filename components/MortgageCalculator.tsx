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
  price?: number;
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
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
        <div className="flex items-center text-white">
          <div className="p-2 bg-white/20 rounded-lg mr-3">
            <Calculator className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold">Mortgage Calculator</h3>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Home Price */}
        <div className="space-y-2">
          <label className="flex items-center text-sm font-semibold text-gray-700">
            <DollarSign className="h-4 w-4 mr-2 text-green-600" />
            Home Price
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 text-sm">$</span>
            </div>
            <input
              type="number"
              value={homePrice}
              onChange={(e) => setHomePrice(e.target.value)}
              className="w-full pl-8 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg font-medium"
              placeholder="400,000"
            />
          </div>
        </div>

        {/* Down Payment */}
        <div className="space-y-2">
          <label className="flex items-center text-sm font-semibold text-gray-700">
            <DollarSign className="h-4 w-4 mr-2 text-green-600" />
            Down Payment
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 text-sm">$</span>
            </div>
            <input
              type="number"
              value={downPayment}
              onChange={(e) => setDownPayment(e.target.value)}
              className="w-full pl-8 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg font-medium"
              placeholder="80,000"
            />
          </div>
        </div>

        {/* Interest Rate */}
        <div className="space-y-2">
          <label className="flex items-center text-sm font-semibold text-gray-700">
            <Percent className="h-4 w-4 mr-2 text-orange-600" />
            Interest Rate
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.1"
              value={interestRate}
              onChange={(e) => setInterestRate(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg font-medium"
              placeholder="7.0"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-500 text-sm">%</span>
            </div>
          </div>
        </div>

        {/* Loan Term */}
        <div className="space-y-2">
          <label className="flex items-center text-sm font-semibold text-gray-700">
            <Calendar className="h-4 w-4 mr-2 text-purple-600" />
            Loan Term
          </label>
          <select
            value={loanTerm}
            onChange={(e) => setLoanTerm(e.target.value)}
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg font-medium bg-white"
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
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 font-semibold text-lg shadow-lg"
        >
          Calculate Payment
        </button>

        {/* Results */}
        {result && (
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
            <h4 className="font-bold text-gray-900 mb-4 text-center text-lg">Your Monthly Payment</h4>
            
            {/* Main Payment Display */}
            <div className="text-center mb-6 p-4 bg-white rounded-lg shadow-sm">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {formatCurrency(result.monthlyPayment)}
              </div>
              <p className="text-sm text-gray-600 font-medium">
                Principal & Interest
              </p>
            </div>
            
            {/* Payment Breakdown */}
            <div className="space-y-3 mb-4">
              <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                <span className="text-sm font-medium text-gray-700">Principal:</span>
                <span className="font-bold text-green-600">{formatCurrency(result.monthlyPrincipal)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                <span className="text-sm font-medium text-gray-700">Interest:</span>
                <span className="font-bold text-orange-600">{formatCurrency(result.monthlyInterest)}</span>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-300">
              <p className="text-xs text-gray-600 text-center leading-relaxed">
                *This calculation does not include taxes, insurance, or HOA fees.<br/>
                Principal/Interest amounts shown are for the first payment.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
