import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Eye, Search, Filter } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface PricingEntry {
  id: string;
  shape: string;
  color: string;
  clarity: string;
  carat_min: number;
  carat_max: number;
  price_per_carat: number;
  shape_type: string;
  updated_at: string;
}

interface PricingDataViewerProps {
  shapeType: 'round' | 'fancy';
}

const PricingDataViewer: React.FC<PricingDataViewerProps> = ({ shapeType }) => {
  const [data, setData] = useState<PricingEntry[]>([]);
  const [filteredData, setFilteredData] = useState<PricingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchShape, setSearchShape] = useState('');
  const [searchColor, setSearchColor] = useState('');
  const [searchClarity, setSearchClarity] = useState('');
  const [caratFilter, setCaratFilter] = useState('');

  useEffect(() => {
    loadData();
  }, [shapeType]);

  useEffect(() => {
    applyFilters();
  }, [data, searchShape, searchColor, searchClarity, caratFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: pricingData, error } = await supabase
        .from('diamond_pricing_lists')
        .select('*')
        .eq('shape_type', shapeType)
        .order('shape')
        .order('color')
        .order('clarity')
        .order('carat_min');
      
      if (error) throw error;
      setData(pricingData || []);
    } catch (error) {
      console.error('Error loading pricing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = data;
    
    if (searchShape) {
      filtered = filtered.filter(item => 
        item.shape.toLowerCase().includes(searchShape.toLowerCase())
      );
    }
    
    if (searchColor) {
      filtered = filtered.filter(item => 
        item.color.toLowerCase().includes(searchColor.toLowerCase())
      );
    }
    
    if (searchClarity) {
      filtered = filtered.filter(item => 
        item.clarity.toLowerCase().includes(searchClarity.toLowerCase())
      );
    }
    
    if (caratFilter) {
      const carat = parseFloat(caratFilter);
      if (!isNaN(carat)) {
        filtered = filtered.filter(item => 
          carat >= item.carat_min && carat <= item.carat_max
        );
      }
    }
    
    setFilteredData(filtered);
  };

  const clearFilters = () => {
    setSearchShape('');
    setSearchColor('');
    setSearchClarity('');
    setCaratFilter('');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading pricing data...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Eye className="w-5 h-5" />
          <span>{shapeType === 'round' ? 'Round' : 'Fancy'} Diamond Pricing Data</span>
          <Badge variant="outline">{filteredData.length} entries</Badge>
        </CardTitle>
        <CardDescription>
          View and filter diamond pricing entries
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="space-y-2">
            <label className="text-sm font-medium">Shape</label>
            <Input
              placeholder="e.g., Round, Princess"
              value={searchShape}
              onChange={(e) => setSearchShape(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Color</label>
            <Input
              placeholder="e.g., H, I, J"
              value={searchColor}
              onChange={(e) => setSearchColor(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Clarity</label>
            <Input
              placeholder="e.g., SI1, VS2"
              value={searchClarity}
              onChange={(e) => setSearchClarity(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Carat Weight</label>
            <Input
              placeholder="e.g., 1.5"
              type="number"
              step="0.01"
              value={caratFilter}
              onChange={(e) => setCaratFilter(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button variant="outline" onClick={clearFilters} className="w-full">
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Data Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Shape</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Clarity</TableHead>
                <TableHead>Carat Min</TableHead>
                <TableHead>Carat Max</TableHead>
                <TableHead>Price/Carat</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    {data.length === 0 ? 'No pricing data available' : 'No entries match your filters'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{entry.shape}</TableCell>
                    <TableCell>{entry.color}</TableCell>
                    <TableCell>{entry.clarity}</TableCell>
                    <TableCell>{entry.carat_min}</TableCell>
                    <TableCell>{entry.carat_max}</TableCell>
                    <TableCell>${entry.price_per_carat.toLocaleString()}</TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {new Date(entry.updated_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default PricingDataViewer;