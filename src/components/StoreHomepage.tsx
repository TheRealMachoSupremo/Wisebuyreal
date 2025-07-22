import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Menu, FileText, Clock, CheckCircle } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { QuoteFlow } from './QuoteFlow';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface StoreHomepageProps {
  onShowAdminPanel: () => void;
}

const StoreHomepage: React.FC<StoreHomepageProps> = ({ onShowAdminPanel }) => {
  const { currentUser, logout } = useAppContext();
  const [showQuoteFlow, setShowQuoteFlow] = useState(false);

  const handleCreateQuote = () => {
    setShowQuoteFlow(true);
  };

  const handleReviewPending = () => {
    console.log('Review pending quotes');
  };

  const handleReviewApproved = () => {
    console.log('Review approved quotes');
  };

  if (showQuoteFlow) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Button variant="ghost" onClick={() => setShowQuoteFlow(false)}>
                ← Back to Dashboard
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">
                Create Quote
              </h1>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onShowAdminPanel}>
                    Admin Panel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout}>
                    Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <QuoteFlow />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">
              Welcome, {currentUser?.name}
            </h1>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onShowAdminPanel}>
                  Admin Panel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout}>
                  Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={handleCreateQuote}>
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-lg">Create New Quote</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">
                  Calculate purchase offers with live metal pricing
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={handleReviewPending}>
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <CardTitle className="text-lg">Review Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">
                  Review quotes awaiting approval
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={handleReviewApproved}>
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle className="text-lg">Review Approved</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">
                  View approved quotes and orders
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StoreHomepage;