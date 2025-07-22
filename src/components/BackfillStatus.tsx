import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Clock, Play } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface BackfillStatusProps {
  onBackfillComplete?: () => void;
}

interface MissingData {
  metal: string;
  count: number;
}

interface BackfillResult {
  fetched: number;
  skipped: number;
  success: boolean;
  message: string;
}

const BackfillStatus: React.FC<BackfillStatusProps> = ({ onBackfillComplete }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [lastRun, setLastRun] = useState<string | null>(null);
  const [missingEntries, setMissingEntries] = useState<MissingData[]>([]);
  const [lastResult, setLastResult] = useState<BackfillResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkMissingEntries();
  }, []);

  const checkMissingEntries = async () => {
    try {
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - 179);
      
      const metals = ['XAU', 'XAG', 'XPT', 'XPD'];
      const missing: MissingData[] = [];
      
      for (const metal of metals) {
        const { data, error } = await supabase
          .from('price_history')
          .select('date')
          .eq('metal_type', metal)
          .gte('date', startDate.toISOString().split('T')[0]);
        
        if (!error) {
          const expectedDays = 180;
          const actualDays = data?.length || 0;
          const missingCount = expectedDays - actualDays;
          
          if (missingCount > 0) {
            missing.push({ metal, count: missingCount });
          }
        }
      }
      
      setMissingEntries(missing);
    } catch (error) {
      console.error('Error checking missing entries:', error);
    }
  };

  const runBackfill = async () => {
    setIsRunning(true);
    setError(null);
    
    try {
      const response = await fetch('https://xhojfxzqbxbhvaysqtle.supabase.co/functions/v1/backfill-price-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhob2pmeHpxYnhiaHZheXNxdGxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1MjI4ODQsImV4cCI6MjA2ODA5ODg4NH0.aD6MITEklTjgnc07fKttG0tb6gMn99hXHK33TwQueCQ`,
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhob2pmeHpxYnhiaHZheXNxdGxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1MjI4ODQsImV4cCI6MjA2ODA5ODg4NH0.aD6MITEklTjgnc07fKttG0tb6gMn99hXHK33TwQueCQ'
        },
        body: JSON.stringify({})
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        setError(`Function error: ${data.error || 'Unknown error'}`);
        return;
      }
      
      setLastResult(data);
      setLastRun(new Date().toISOString());
      await checkMissingEntries();
      
      if (onBackfillComplete) {
        onBackfillComplete();
      }
    } catch (error: any) {
      console.error('Backfill error:', error);
      setError(`Network error: ${error.message || 'Failed to connect to function'}`);
    } finally {
      setIsRunning(false);
    }
  };

  const totalMissing = missingEntries.reduce((sum, entry) => sum + entry.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Price History Backfill</span>
          <Button 
            onClick={runBackfill} 
            disabled={isRunning}
            className="flex items-center space-x-2"
          >
            <Play className="w-4 h-4" />
            <span>{isRunning ? 'Running...' : 'Run Backfill'}</span>
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Missing Entries</p>
            <div className="flex items-center space-x-2">
              {totalMissing > 0 ? (
                <AlertCircle className="w-4 h-4 text-yellow-500" />
              ) : (
                <CheckCircle className="w-4 h-4 text-green-500" />
              )}
              <span className="font-semibold">{totalMissing}</span>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600">Last Run</p>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm">
                {lastRun ? new Date(lastRun).toLocaleString() : 'Never'}
              </span>
            </div>
          </div>
        </div>
        
        {missingEntries.length > 0 && (
          <div>
            <p className="text-sm text-gray-600 mb-2">Missing by Metal:</p>
            <div className="flex flex-wrap gap-2">
              {missingEntries.map((entry) => (
                <Badge key={entry.metal} variant="secondary">
                  {entry.metal}: {entry.count}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {lastResult && (
          <div className="text-sm text-gray-600">
            <p>Last run: {lastResult.fetched} fetched, {lastResult.skipped} skipped</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BackfillStatus;