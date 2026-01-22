import { getBorrowSlips } from "@/lib/actions/borrow-queries";
import BorrowClient from "@/app/borrow/BorrowClient";

export async function BorrowListSection() {
    const borrowSlips = await getBorrowSlips();
    return <BorrowClient initialBorrowSlips={borrowSlips} />;
}
