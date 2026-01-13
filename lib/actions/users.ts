'use server';

import db from '@/lib/db';
import { UserModel } from '@/app/generated/prisma/models';

export async function getUsers() {
  try {
    const users = await db.user.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

export async function getUser(id: string) {
  try {
    const user = await db.user.findUnique({
      where: { id },
    });
    return user;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

export async function createUser(
  data: Omit<UserModel, 'id' | 'createdAt' | 'updatedAt'>
) {
  try {
    const user = await db.user.create({
      data,
    });
    return user;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

export async function updateUser(id: string, data: Partial<UserModel>) {
  try {
    const user = await db.user.update({
      where: { id },
      data,
    });
    return user;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

export async function deleteUser(id: string) {
  try {
    const user = await db.user.delete({
      where: { id },
    });
    return user;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}
