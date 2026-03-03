export interface PaginationMeta {
    current: number;
    pageSize: number;
    total: number;
    totalPages: number;
}


export interface PaginatedResponse<T> {
    data: T[];
    meta: PaginationMeta;
}

export function formatPaginatedResponse<T>(
    data: T[],
    total: number,
    current: number | string,
    pageSize: number | string,
): PaginatedResponse<T> {
    const currentNum = Number(current);
    const pageSizeNum = Number(pageSize);

    return {
        data,
        meta: {
            current: currentNum,
            pageSize: pageSizeNum,
            total,
            totalPages: Math.ceil(total / pageSizeNum) || 0,
        },
    };
}
