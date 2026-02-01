'use client'

import { useBorrowSlips } from '@/lib/hooks/use-borrow'
import BorrowClient from "@/app/(main)/borrow/BorrowClient";
import { Loader2 } from 'lucide-react';

export default function BorrowPage() {
    const { borrowSlips, isLoading, mutate } = useBorrowSlips();

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        )
    }

    return <BorrowClient initialBorrowSlips={borrowSlips} onDataChange={mutate} />;
}