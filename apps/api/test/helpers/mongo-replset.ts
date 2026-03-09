import type { INestApplication } from '@nestjs/common';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { MenuService } from '../../src/menu/application/menu.service';
import { DEFAULT_MENU } from '../../src/menu/infrastructure/default-menu';

export async function createMongoMemoryReplSet() {
  const replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1 },
  });

  return replSet;
}

export async function seedDefaultMenu(app: INestApplication) {
  const menuService = app.get(MenuService);
  await menuService.replaceMenu(DEFAULT_MENU as never);
}
