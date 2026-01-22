import { Suspense } from 'react';
import { UsersListSection } from "@/components/users-list-section";
import { Loader2 } from 'lucide-react';

export default function UsersPage() {
  return (
    <div className="h-full">
      <Suspense fallback={
        <div className="flex h-full items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      }>
        <UsersListSection />
      </Suspense>
    </div>
  );
}