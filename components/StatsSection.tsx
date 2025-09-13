'use client';

import { useEffect, useState } from 'react';
import { Home, Users, Award, Clock } from 'lucide-react';

interface StatItem {
  icon: React.ReactNode;
  value: number;
  label: string;
  suffix?: string;
}

const stats: StatItem[] = [
  {
    icon: <Home className="h-8 w-8" />,
    value: 50,
    label: "Properties Sold",
    suffix: "+"
  },
  {
    icon: <Users className="h-8 w-8" />,
    value: 100,
    label: "Happy Clients",
    suffix: "+"
  },
  {
    icon: <Award className="h-8 w-8" />,
    value: 98,
    label: "Client Satisfaction",
    suffix: "%"
  },
  {
    icon: <Clock className="h-8 w-8" />,
    value: 24,
    label: "Average Days to Close",
    suffix: ""
  }
];

function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 2000; // 2 seconds
    const steps = 60;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <span className="text-4xl font-bold text-white">
      {count}{suffix}
    </span>
  );
}

export default function StatsSection() {
  return (
    <section className="bg-gradient-to-r from-brand to-brand/80 py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">
            Proven Track Record
          </h2>
          <p className="text-white/90 text-lg max-w-2xl mx-auto">
            Building trust through results and dedicated service to every client
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="flex justify-center mb-4 text-white/80">
                {stat.icon}
              </div>
              <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              <p className="text-white/90 mt-2 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
