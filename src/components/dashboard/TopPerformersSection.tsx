import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

interface TopItemData {
  name: string;
  totalDisbursement: number;
  count: number;
}

interface TopPerformersProps {
  data: {
    topConnectors?: TopItemData[];
    topDSAs?: TopItemData[];
    topBanks?: TopItemData[];
    topLoanTypes?: TopItemData[];
    topBackOffice?: TopItemData[];
    topLeadOwners?: TopItemData[];
  };
  currentMonth: number;
  currentYear: number;
  userRole?: string;
}

export default function TopPerformersSection({
  data,
  currentMonth,
  currentYear,
  userRole = 'admin',
}: TopPerformersProps) {
  // Define which tabs are visible for each role
  const getVisibleTabs = () => {
    switch (userRole) {
      case 'superadmin':
        return ['topConnector', 'topDSA', 'topBank', 'topLoanType', 'topBackOffice'];
      case 'admin':
        return ['topConnector', 'topDSA', 'topBank', 'topLoanType', 'topBackOffice'];
      case 'backoffice':
        return ['topDSA', 'topBank', 'topLoanType', 'topLeadOwner'];
      case 'connector':
        return ['topBank', 'topLoanType'];
      default:
        return ['topConnector', 'topDSA', 'topBank', 'topLoanType', 'topBackOffice'];
    }
  };

  const visibleTabs = getVisibleTabs();
  const [activeTab, setActiveTab] = useState(visibleTabs[0] || 'topConnector');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Reset to page 1 when tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  // Currency formatter
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Get month name
  const getMonthName = (month: number) => {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return months[month - 1];
  };

  // Get current tab data
  const getCurrentData = (): TopItemData[] => {
    switch (activeTab) {
      case 'topConnector':
        return data.topConnectors || [];
      case 'topDSA':
        return data.topDSAs || [];
      case 'topBank':
        return data.topBanks || [];
      case 'topLoanType':
        return data.topLoanTypes || [];
      case 'topBackOffice':
        return data.topBackOffice || [];
      case 'topLeadOwner':
        return data.topLeadOwners || [];
      default:
        return [];
    }
  };

  const currentData = getCurrentData();
  const totalPages = Math.ceil(currentData.length / itemsPerPage);
  const paginatedData = currentData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calculate starting rank for current page
  const startRank = (currentPage - 1) * itemsPerPage;

  // Render table content
  const renderTableContent = () => {
    if (currentData.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No data available for this category
        </div>
      );
    }

    return (
      <>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Rank</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-center">Number of Loans</TableHead>
              <TableHead className="text-right">Total Disbursement</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((item, index) => (
              <TableRow
                key={index}
                className="hover:bg-gray-50 transition-colors"
              >
                <TableCell>
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold">
                    {startRank + index + 1}
                  </div>
                </TableCell>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell className="text-center">
                  {item.count} {item.count === 1 ? 'loan' : 'loans'}
                </TableCell>
                <TableCell className="text-right font-semibold text-green-600">
                  {formatCurrency(item.totalDisbursement)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Pagination - only show if more than 5 records */}
        {currentData.length > itemsPerPage && (
          <div className="mt-6">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    className={
                      currentPage === 1
                        ? 'pointer-events-none opacity-50'
                        : 'cursor-pointer'
                    }
                  />
                </PaginationItem>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => setCurrentPage(page)}
                      isActive={currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    className={
                      currentPage === totalPages
                        ? 'pointer-events-none opacity-50'
                        : 'cursor-pointer'
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </>
    );
  };

  return (
    <Card className="shadow">
      <CardHeader>
        <CardTitle className="text-2xl">Top Performers</CardTitle>
        <CardDescription>
          Monthly rankings by disbursement amount for {getMonthName(currentMonth)}{' '}
          {currentYear}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start mb-6 h-auto flex-wrap">
            {visibleTabs.includes('topConnector') && (
              <TabsTrigger
                value="topConnector"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                Top Connector
              </TabsTrigger>
            )}
            {visibleTabs.includes('topDSA') && (
              <TabsTrigger
                value="topDSA"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                Top DSA
              </TabsTrigger>
            )}
            {visibleTabs.includes('topBank') && (
              <TabsTrigger
                value="topBank"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                Top Bank
              </TabsTrigger>
            )}
            {visibleTabs.includes('topLoanType') && (
              <TabsTrigger
                value="topLoanType"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                Top Loan Type
              </TabsTrigger>
            )}
            {visibleTabs.includes('topBackOffice') && (
              <TabsTrigger
                value="topBackOffice"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                Top Back Office Users
              </TabsTrigger>
            )}
            {visibleTabs.includes('topLeadOwner') && (
              <TabsTrigger
                value="topLeadOwner"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                Top Lead Owner
              </TabsTrigger>
            )}
          </TabsList>

          {visibleTabs.includes('topConnector') && (
            <TabsContent value="topConnector">{renderTableContent()}</TabsContent>
          )}
          {visibleTabs.includes('topDSA') && (
            <TabsContent value="topDSA">{renderTableContent()}</TabsContent>
          )}
          {visibleTabs.includes('topBank') && (
            <TabsContent value="topBank">{renderTableContent()}</TabsContent>
          )}
          {visibleTabs.includes('topLoanType') && (
            <TabsContent value="topLoanType">{renderTableContent()}</TabsContent>
          )}
          {visibleTabs.includes('topBackOffice') && (
            <TabsContent value="topBackOffice">{renderTableContent()}</TabsContent>
          )}
          {visibleTabs.includes('topLeadOwner') && (
            <TabsContent value="topLeadOwner">{renderTableContent()}</TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}
