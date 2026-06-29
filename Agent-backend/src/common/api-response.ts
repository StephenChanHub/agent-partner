export type Pagination = {
  page: number;
  pageSize: number;
  total: number;
};

export function ok<T>(data: T, meta?: Record<string, unknown>) {
  return { success: true, data, message: 'OK', meta: meta ?? mockMeta() };
}

export function paginated<T>(items: T[], pagination?: Partial<Pagination>) {
  return ok({
    items,
    pagination: {
      page: pagination?.page ?? 1,
      pageSize: pagination?.pageSize ?? items.length,
      total: pagination?.total ?? items.length,
    },
  });
}

export function fail(code: string, message: string, details?: Record<string, unknown>) {
  return { success: false, error: { code, message, details: details ?? {} }, meta: mockMeta() };
}

export function mockMeta(traceId = `trace_${Date.now()}`) {
  return { traceId, mode: process.env.NODE_ENV === 'sandbox' ? 'sandbox' : 'mock' };
}
