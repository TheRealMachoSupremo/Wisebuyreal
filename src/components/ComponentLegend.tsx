import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface ComponentMapping {
  section: string;
  card: string;
  blocks: string[];
  description: string;
}

const ComponentLegend: React.FC = () => {
  const componentMappings: ComponentMapping[] = [
    {
      section: 'quote-start',
      card: 'quote-start-customer-card',
      blocks: ['name-input', 'phone-input', 'email-input', 'address-input', 'next-button'],
      description: 'Customer information collection step'
    },
    {
      section: 'quote-item',
      card: 'quote-item-details-card',
      blocks: ['metal-type-select', 'weight-input', 'description-textarea', 'photo-upload', 'next-button'],
      description: 'Item details and metal information'
    },
    {
      section: 'quote-stone',
      card: 'quote-stone-prompt-card',
      blocks: ['add-stone-button', 'skip-stone-button'],
      description: 'Center stone evaluation prompt'
    },
    {
      section: 'quote-stone',
      card: 'quote-stone-details-card',
      blocks: ['cut-select', 'color-select', 'clarity-select', 'carat-input', 'rap-price-input', 'next-button'],
      description: 'Stone details form'
    },
    {
      section: 'quote-melee',
      card: 'quote-melee-prompt-card',
      blocks: ['add-melee-button', 'skip-melee-button'],
      description: 'Melee evaluation prompt'
    },
    {
      section: 'quote-summary',
      card: 'quote-summary-item-card',
      blocks: ['edit-metal-button', 'edit-stones-button', 'edit-melee-button', 'add-item-button'],
      description: 'Item summary and editing options'
    },
    {
      section: 'quote-summary',
      card: 'quote-summary-final-card',
      blocks: ['total-offer-display', 'save-button', 'print-button', 'new-quote-button'],
      description: 'Final quote summary and actions'
    },
    {
      section: 'admin-dashboard',
      card: 'admin-overview-card',
      blocks: ['active-stores-count', 'pending-stores-count', 'rejected-stores-count'],
      description: 'Admin dashboard overview statistics'
    },
    {
      section: 'admin-pricing',
      card: 'admin-pricing-panel-card',
      blocks: ['sync-button', 'backfill-button', 'market-prices-table'],
      description: 'Metal pricing management panel'
    },
    {
      section: 'store-home',
      card: 'store-home-actions-card',
      blocks: ['create-quote-button', 'review-pending-button', 'review-approved-button'],
      description: 'Store homepage action buttons'
    },
    {
      section: 'store-settings',
      card: 'store-settings-pricing-card',
      blocks: ['pricing-basis-select', 'discount-input', 'gold-markup-input', 'silver-markup-input'],
      description: 'Store pricing configuration'
    }
  ];

  const exportToCSV = () => {
    const headers = ['Section', 'Card', 'Blocks', 'Description'];
    const csvContent = [
      headers.join(','),
      ...componentMappings.map(mapping => [
        mapping.section,
        mapping.card,
        `"${mapping.blocks.join(', ')}"`,
        mapping.description
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'component-legend.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Component Legend</CardTitle>
          <div className="flex justify-end">
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-blue-50">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Section</h3>
                  <p className="text-sm text-blue-800">A major step in the user flow (e.g., quote-start, quote-item, quote-summary)</p>
                </CardContent>
              </Card>
              <Card className="bg-green-50">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-green-900 mb-2">Card</h3>
                  <p className="text-sm text-green-800">A container component within a section that holds related UI elements</p>
                </CardContent>
              </Card>
              <Card className="bg-purple-50">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-purple-900 mb-2">Block</h3>
                  <p className="text-sm text-purple-800">A single input, button, label, or element inside a card</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Component Mapping</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Section</TableHead>
                      <TableHead>Card</TableHead>
                      <TableHead>Blocks</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {componentMappings.map((mapping, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{mapping.section}</TableCell>
                        <TableCell>{mapping.card}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {mapping.blocks.map((block, blockIndex) => (
                              <span key={blockIndex} className="bg-gray-100 px-2 py-1 rounded text-xs">
                                {block}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">{mapping.description}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComponentLegend;