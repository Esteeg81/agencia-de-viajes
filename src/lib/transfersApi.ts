import type { TransferSearchParams, TransferSearchResult } from '../types/travel'

export async function searchTransfers(params: TransferSearchParams): Promise<TransferSearchResult> {
  const res = await fetch('/api/transfers/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Error desconocido' }))
    throw new Error((err as { message?: string }).message ?? 'Error al buscar traslados')
  }
  return res.json() as Promise<TransferSearchResult>
}
