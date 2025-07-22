import React from 'react';

interface PurityBreakdownProps {
  metalType: string;
  avg90Days: number;
  avg180Days: number;
}

const PURITY_MAPS = {
  XAU: {
    '24k': 1.000,
    '22k': 0.917,
    '18k': 0.750,
    '14k': 0.585,
    '10k': 0.417,
    '9k': 0.375
  },
  XAG: {
    '0.999': 0.999,
    '0.925': 0.925
  },
  XPT: {
    '950': 0.950,
    '850': 0.850
  },
  XPD: {
    '950': 0.950,
    '850': 0.850
  }
};

const PurityBreakdown: React.FC<PurityBreakdownProps> = ({ metalType, avg90Days, avg180Days }) => {
  const purities = PURITY_MAPS[metalType as keyof typeof PURITY_MAPS];
  
  if (!purities) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  return (
    <div className="mt-4 pt-4 border-t">
      <h4 className="font-medium text-sm mb-3 text-gray-700">By Purity</h4>
      <div className="space-y-2">
        {Object.entries(purities).map(([purity, multiplier]) => {
          const price90 = avg90Days * multiplier;
          const price180 = avg180Days * multiplier;
          
          return (
            <div key={purity} className="flex justify-between items-center text-sm">
              <span className="font-medium">{purity}</span>
              <div className="text-right">
                <div>
                  90d: {formatPrice(price90)} | 180d: {formatPrice(price180)}
                </div>
                <div className="text-xs text-gray-500">
                  (×{multiplier.toFixed(3)})
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PurityBreakdown;