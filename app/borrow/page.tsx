import { getBorrowSlips } from "@/lib/actions/borrow-queries";
import BorrowClient from "./BorrowClient";

export default async function BorrowPage() {
  const borrowSlips = await getBorrowSlips();

  return <BorrowClient initialBorrowSlips={borrowSlips} />;
}