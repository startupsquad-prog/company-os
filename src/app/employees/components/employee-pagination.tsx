'use client'

import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface EmployeePaginationProps {
  currentPage: number
  totalPages: number
  rowsPerPage: number
  totalEmployees: number
  onPageChange: (page: number) => void
  onRowsPerPageChange: (rows: number) => void
}

export function EmployeePagination({
  currentPage,
  totalPages,
  rowsPerPage,
  totalEmployees,
  onPageChange,
  onRowsPerPageChange,
}: EmployeePaginationProps) {
  const startIndex = (currentPage - 1) * rowsPerPage + 1
  const endIndex = Math.min(currentPage * rowsPerPage, totalEmployees)

  return (
    <div className="flex-shrink-0 bg-card rounded-b-lg border border-t-0 shadow-sm mt-4">
      <div className="flex items-center justify-between p-4">
        <div className="text-sm text-muted-foreground">
          Showing {startIndex} to {endIndex} of {totalEmployees} employees
        </div>
        <div className="flex items-center space-x-2">
          <Select
            value={rowsPerPage.toString()}
            onValueChange={(value) => onRowsPerPageChange(Number(value))}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Rows per page" />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 50, 100].map((pageSize) => (
                <SelectItem key={pageSize} value={pageSize.toString()}>
                  {pageSize} rows
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1}
            >
              First
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage === totalPages}
            >
              Last
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
        </div>
      </div>
    </div>
  )
}

