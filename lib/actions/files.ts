'use server';

import db from '@/lib/db';
import { FileModel as File } from '@/app/generated/prisma/models';

export async function getFiles() {
  try {
    const files = await db.file.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    return files;
  } catch (error) {
    console.error('Error fetching files:', error);
    return [];
  }
}

export async function getFile(id: string) {
  try {
    const file = await db.file.findUnique({
      where: { id },
    });
    return file;
  } catch (error) {
    console.error('Error fetching file:', error);
    return null;
  }
}

export async function createFile(
  data: Omit<File, 'id' | 'createdAt' | 'updatedAt'>
) {
  try {
    const file = await db.file.create({
      data,
    });
    return file;
  } catch (error) {
    console.error('Error creating file:', error);
    throw error;
  }
}

export async function updateFile(id: string, data: Partial<File>) {
  try {
    const file = await db.file.update({
      where: { id },
      data,
    });
    return file;
  } catch (error) {
    console.error('Error updating file:', error);
    throw error;
  }
}

export async function deleteFile(id: string) {
  try {
    const file = await db.file.delete({
      where: { id },
    });
    return file;
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
}
