import {
  BorrowSlipModel,
  UserModel,
  BorrowItemModel,
  FileModel,
} from '@/app/generated/prisma/models';

export type BorrowSlipWithDetails = BorrowSlipModel & {
  lender: UserModel;
  items: (BorrowItemModel & { file: FileModel })[];
};
