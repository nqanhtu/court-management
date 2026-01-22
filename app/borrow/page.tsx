import { Suspense } from 'react';
import { BorrowListSection } from "@/components/borrow-list-section";
import { Loader2 } from 'lucide-react';

export default function BorrowPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    }>
      <BorrowListSection />
    </Suspense>
  );
}