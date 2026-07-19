'use client';

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table';
import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeftIcon, ChevronRightIcon, SearchIcon } from '@/components/icons';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  pageSize?: number;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = 'Search...',
  pageSize = 10,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  // Map legacy accessor to TanStack Table v8 format dynamically
  const mappedColumns = columns.map((col: any, index: number) => {
    if (col.accessor && !col.accessorKey && !col.accessorFn) {
      const id = col.id || `col_${index}`;
      if (typeof col.accessor === 'function') {
        return {
          ...col,
          id,
          accessorFn: col.accessor,
          cell: (info: any) => info.getValue(),
        };
      } else if (typeof col.accessor === 'string') {
        return {
          ...col,
          id,
          accessorKey: col.accessor,
        };
      }
    }
    return col;
  });

  const table = useReactTable({
    data,
    columns: mappedColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: { sorting, columnFilters },
    initialState: { pagination: { pageSize } },
  });

  return (
    <div className="space-y-4">
      {searchKey && (
        <div className="relative max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ''}
            onChange={(e) => table.getColumn(searchKey)?.setFilterValue(e.target.value)}
            className="pl-9"
          />
        </div>
      )}
      {/* Desktop view */}
      <div className="hidden md:block rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Stack view */}
      <div className="md:hidden space-y-3">
        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row) => {
            const cells = row.getVisibleCells();
            const primaryCell = cells[0];
            if (!primaryCell) return null;
            const lastCell = cells[cells.length - 1];
            const isLastCellActions = lastCell && (
              lastCell.column.id.toLowerCase().includes('action') ||
              (typeof lastCell.column.columnDef.header === 'string' && lastCell.column.columnDef.header.toLowerCase().includes('action'))
            );
            const actionCell = isLastCellActions ? lastCell : null;
            const otherCells = cells.filter(c => c !== primaryCell && c !== actionCell);

            return (
              <div key={row.id} className="p-4 rounded-xl border bg-card shadow-sm space-y-3">
                {/* Header row */}
                <div className="flex justify-between items-start gap-4">
                  <div className="font-bold text-foreground text-sm">
                    {flexRender(primaryCell.column.columnDef.cell, primaryCell.getContext())}
                  </div>
                  {actionCell && (
                    <div className="flex items-center shrink-0">
                      {flexRender(actionCell.column.columnDef.cell, actionCell.getContext())}
                    </div>
                  )}
                </div>

                {/* Details grid */}
                {otherCells.length > 0 && (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-2 border-t border-border/50 text-xs">
                    {otherCells.map((cell) => {
                      const headerVal = cell.column.columnDef.header;
                      return (
                        <div key={cell.id} className="min-w-0">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">
                            {typeof headerVal === 'string' ? headerVal : cell.column.id}
                          </span>
                          <span className="text-foreground mt-0.5 block truncate">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-muted-foreground border rounded-xl bg-card">
            No results found.
          </div>
        )}
      </div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            <ChevronLeftIcon className="h-4 w-4" />
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
