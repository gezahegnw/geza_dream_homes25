"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, DollarSign, Calendar, Loader2, AlertCircle } from "lucide-react";

interface PricePoint {
  price: number;
  date: string;
  status?: string;
}

interface PriceStats {
  currentPrice: number;
  originalPrice: number;
  highestPrice: number;
  lowestPrice: number;
  averagePrice: number;
  totalPriceDrops: number;
  totalPriceIncreases: number;
  daysOnMarket: number;
  priceChangePercent: number;
}

interface PriceHistoryProps {
  propertyId: string;
  currentPrice?: number;
}

export default function PriceHistory({ propertyId, currentPrice }: PriceHistoryProps) {
  const [history, setHistory] = useState<PricePoint[]>([]);
  const [stats, setStats] = useState<PriceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPriceHistory();
  }, [propertyId]);

  const fetchPriceHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/price-history?propertyId=${propertyId}`);
      if (!response.ok) throw new Error("Failed to fetch price history");
      
      const data = await response.json();
      setHistory(data.history || []);
      setStats(data.stats || null);
    } catch (err) {
      setError("Unable to load price history");
    } finally {
      setLoading(false);
    }
  };

  // Generate simple SVG chart
  const renderChart = () => {
    if (history.length < 2) return null;

    const prices = history.map(h => h.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;
    
    const chartWidth = 100;
    const chartHeight = 60;
    const padding = 5;

    // Generate path
    const points = history.map((point, index) => {
      const x = (index / (history.length - 1)) * (chartWidth - padding * 2) + padding;
      const y = chartHeight - padding - ((point.price - minPrice) / priceRange) * (chartHeight - padding * 2);
      return `${x},${y}`;
    });

    const pathD = `M ${points.join(' L ')}`;

    // Determine color based on trend
    const isUpward = history[history.length - 1].price > history[0].price;
    const strokeColor = isUpward ? "#059669" : "#dc2626";

    return (
      <div className="mb-6">
        <svg 
          viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
          className="w-full h-48"
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          {[0, 1, 2, 3].map(i => (
            <line
              key={i}
              x1={padding}
              y1={padding + (i * (chartHeight - padding * 2)) / 3}
              x2={chartWidth - padding}
              y2={padding + (i * (chartHeight - padding * 2)) / 3}
              stroke="#e5e7eb"
              strokeWidth="0.5"
            />
          ))}

          {/* Price line */}
          <path
            d={pathD}
            fill="none"
            stroke={strokeColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {points.map((point, index) => {
            const [x, y] = point.split(',').map(Number);
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="3"
                fill={strokeColor}
                stroke="white"
                strokeWidth="1"
              />
            );
          })}
        </svg>

        {/* Price labels */}
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>{new Date(history[0].date).toLocaleDateString()}</span>
          <span>Latest</span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-8 h-8 animate-spin text-brand" />
        </div>
      </div>
    );
  }

  if (error || history.length < 2) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center text-amber-600">
          <AlertCircle className="w-5 h-5 mr-2" />
          <p className="text-sm">Insufficient price history data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
        <TrendingUp className="w-5 h-5 mr-2 text-brand" />
        Price History & Trends
      </h2>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center text-gray-600 mb-1">
              <DollarSign className="w-4 h-4 mr-1" />
              <span className="text-sm">Current Price</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              ${stats.currentPrice.toLocaleString()}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center text-gray-600 mb-1">
              {stats.priceChangePercent >= 0 ? (
                <TrendingUp className="w-4 h-4 mr-1 text-red-500" />
              ) : (
                <TrendingDown className="w-4 h-4 mr-1 text-green-500" />
              )}
              <span className="text-sm">Price Change</span>
            </div>
            <p className={`text-2xl font-bold ${stats.priceChangePercent >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {stats.priceChangePercent >= 0 ? '+' : ''}{stats.priceChangePercent.toFixed(1)}%
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center text-gray-600 mb-1">
              <Calendar className="w-4 h-4 mr-1" />
              <span className="text-sm">Days Tracked</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {stats.daysOnMarket}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center text-gray-600 mb-1">
              <TrendingDown className="w-4 h-4 mr-1 text-green-500" />
              <span className="text-sm">Price Drops</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {stats.totalPriceDrops}
            </p>
          </div>
        </div>
      )}

      {/* Price Chart */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Price Trend</h3>
        {renderChart()}
      </div>

      {/* Price History Table */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Price History</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-gray-600 font-medium">Date</th>
                <th className="px-3 py-2 text-left text-gray-600 font-medium">Price</th>
                <th className="px-3 py-2 text-left text-gray-600 font-medium">Change</th>
                <th className="px-3 py-2 text-left text-gray-600 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {history.slice().reverse().map((point, index) => {
                const prevPoint = history[history.length - 1 - index + 1];
                const change = prevPoint ? point.price - prevPoint.price : 0;
                const changePercent = prevPoint ? (change / prevPoint.price) * 100 : 0;

                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-900">
                      {new Date(point.date).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2 font-medium text-gray-900">
                      ${point.price.toLocaleString()}
                    </td>
                    <td className="px-3 py-2">
                      {change !== 0 && (
                        <span className={`text-xs ${change > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {change > 0 ? '+' : ''}${Math.abs(change).toLocaleString()} ({changePercent > 0 ? '+' : ''}{changePercent.toFixed(1)}%)
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {point.status && (
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          {point.status}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-6 text-center">
        Price history is tracked from the date the listing was first seen. Data may not reflect the complete listing history.
      </p>
    </div>
  );
}
