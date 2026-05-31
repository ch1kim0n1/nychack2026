import { cn } from '@/lib/utils'

interface Column<T> {
  key: string
  header: string
  render: (row: T) => React.ReactNode
  mono?: boolean
  width?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  className?: string
  getRowKey: (row: T) => string
}

export function DataTable<T>({ columns, rows, className, getRowKey }: DataTableProps<T>) {
  return (
    <div className={cn('overflow-x-auto border border-[var(--cl-border)] rounded', className)}>
      <table className="w-full text-body border-collapse">
        <thead>
          <tr className="bg-navy-800 text-white">
            {columns.map(col => (
              <th
                key={col.key}
                className="text-left px-3 py-2 text-label uppercase tracking-[0.06em] font-semibold whitespace-nowrap"
                style={col.width ? { width: col.width } : undefined}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={getRowKey(row)}
              className={cn(
                'border-t border-[var(--cl-border-subtle)]',
                i % 2 === 1 && 'bg-canvas',
                'hover:bg-navy-50 transition-colors duration-[120ms]',
              )}
            >
              {columns.map(col => (
                <td
                  key={col.key}
                  className={cn('px-3 py-2 align-top', col.mono && 'font-mono text-data')}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
