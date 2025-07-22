import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

interface CSVUploaderProps {
  shapeType: 'round' | 'fancy';
  onUploadComplete: () => void;
}

interface CSVRow {
  shape: string;
  clarity: string;
  color: string;
  carat_min: number;
  carat_max: number;
  price_per_carat: number;
}

const CSVUploader: React.FC<CSVUploaderProps> = ({ shapeType, onUploadComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const parseCSV = (csvText: string): CSVRow[] => {
    const lines = csvText.trim().split('\n');
    const rows: CSVRow[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length < 6) continue;
      
      // Column A = Shape, B = Clarity, C = Color, D = carat_min, E = carat_max, F = price_per_carat
      const row: CSVRow = {
        shape: values[0],
        clarity: values[1],
        color: values[2],
        carat_min: parseFloat(values[3]),
        carat_max: parseFloat(values[4]),
        price_per_carat: parseFloat(values[5])
      };
      
      // Validate the row
      if (row.shape && row.clarity && row.color && 
          !isNaN(row.carat_min) && !isNaN(row.carat_max) && !isNaN(row.price_per_carat)) {
        rows.push(row);
      }
    }
    
    if (rows.length === 0) {
      throw new Error('No valid data rows found. Please check CSV format.');
    }
    
    return rows;
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    setError(null);
    
    try {
      const csvText = await file.text();
      const rows = parseCSV(csvText);
      
      // Delete existing data for this shape type
      await supabase
        .from('diamond_pricing_lists')
        .delete()
        .eq('shape_type', shapeType);
      
      // Insert new data
      const dataToInsert = rows.map(row => ({
        shape: row.shape,
        clarity: row.clarity,
        color: row.color,
        carat_min: row.carat_min,
        carat_max: row.carat_max,
        price_per_carat: row.price_per_carat,
        shape_type: shapeType,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      
      const { error: insertError } = await supabase
        .from('diamond_pricing_lists')
        .insert(dataToInsert);
      
      if (insertError) throw insertError;
      
      toast({
        title: 'Upload Successful',
        description: `Uploaded ${rows.length} ${shapeType} diamond price entries`,
      });
      
      setFile(null);
      onUploadComplete();
    } catch (error: any) {
      setError(error.message);
      toast({
        title: 'Upload Failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Upload className="w-5 h-5" />
          <span>Upload {shapeType === 'round' ? 'Round' : 'Fancy'} Diamond Pricing</span>
        </CardTitle>
        <CardDescription>
          Upload a CSV file with columns: Shape, Clarity, Color, carat_min, carat_max, price_per_carat
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-2">
          <Label htmlFor={`csv-${shapeType}`}>Select CSV File</Label>
          <Input
            id={`csv-${shapeType}`}
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </div>
        
        <Button 
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full"
        >
          {uploading ? 'Uploading...' : 'Upload CSV'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default CSVUploader;