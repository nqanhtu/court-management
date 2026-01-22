import useSWR from 'swr'
import { BorrowSlipModel, UserModel, BorrowItemModel, FileModel } from '@/app/generated/prisma/models'

const fetcher = (url: string) => fetch(url).then(r => r.json())

type BorrowSlipWithDetails = BorrowSlipModel & {
    lender: UserModel;
    items: (BorrowItemModel & { file: FileModel })[];
};

export function useBorrowSlips() {
    const { data, error, isLoading, mutate } = useSWR<BorrowSlipWithDetails[]>(
        '/api/borrow',
        fetcher
    )

    return {
        borrowSlips: data || [],
        isLoading,
        isError: error,
        mutate
    }
}
