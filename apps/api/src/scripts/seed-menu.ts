import 'dotenv/config';
import { connect, disconnect, model } from 'mongoose';
import { DEFAULT_MENU } from '../menu/infrastructure/default-menu';
import {
  MENU_ITEM_MODEL,
  MenuItemSchema,
} from '../menu/infrastructure/menu-item.schema';

async function seedMenu() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI is required');
  }

  await connect(mongoUri);
  const MenuItemModel = model(MENU_ITEM_MODEL, MenuItemSchema);
  await MenuItemModel.deleteMany({});
  await MenuItemModel.insertMany(DEFAULT_MENU);
  await disconnect();

  console.log(`Seeded ${DEFAULT_MENU.length} menu items`);
}

void seedMenu();
