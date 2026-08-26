import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export type ResponsiveRecordColumn<T> = {
  key: string
  header: string
  render: (row: T) => ReactNode
}

export type ResponsiveRecordListProps<T> = {
  caption: string
  columns: readonly ResponsiveRecordColumn<T>[]
  rows: readonly T[]
  getRowKey: (row: T) => string
  empty: ReactNode
  className?: string
}

/**
 * Table on md+; stacked definition list on small screens. Avoids horizontal overflow.
 */
export function ResponsiveRecordList<T>({
  caption,
  columns,
  rows,
  getRowKey,
  empty,
  className,
}: ResponsiveRecordListProps<T>) {
  if (rows.length === 0) {
    return <div className={className}>{empty}</div>
  }

  return (
    <div className={cn('w-full', className)}>
      <div className="md:hidden">
        <p className="sr-only">{caption}</p>
        <ul className="divide-y divide-border">
          {rows.map((row) => (
            <li key={getRowKey(row)} className="py-4">
              <dl className="grid gap-2">
                {columns.map((column) => (
                  <div key={column.key} className="min-w-0">
                    <dt className="text-xs font-medium text-muted-foreground">{column.header}</dt>
                    <dd className="mt-1 break-words text-sm text-foreground">
                      {column.render(row)}
                    </dd>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </ul>
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full caption-bottom text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-border">
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className="h-11 px-3 text-start font-medium text-muted-foreground"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={getRowKey(row)} className="border-b border-border">
                {columns.map((column) => (
                  <td key={column.key} className="px-3 py-3 text-start text-foreground">
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
