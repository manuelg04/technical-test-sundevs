import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  MenuItemDocument,
  MenuItemDocumentModel,
  MENU_ITEM_MODEL,
} from '../infrastructure/menu-item.schema';

@Injectable()
export class MenuService {
  constructor(
    @InjectModel(MENU_ITEM_MODEL)
    private readonly menuItemModel: Model<MenuItemDocumentModel>,
  ) {}

  async getMenu() {
    const items = await this.menuItemModel
      .find()
      .sort({ category: 1, name: 1 })
      .lean<MenuItemDocument[]>();
    const categories = Array.from(new Set(items.map((item) => item.category)));

    return {
      categories,
      items,
    };
  }

  async getMenuItemsByCodes(codes: string[]) {
    const items = await this.menuItemModel
      .find({ code: { $in: codes } })
      .lean<MenuItemDocument[]>();
    const itemsByCode = new Map(items.map((item) => [item.code, item]));

    for (const code of codes) {
      if (!itemsByCode.has(code)) {
        throw new NotFoundException(`Menu item ${code} not found`);
      }
    }

    return itemsByCode;
  }

  async replaceMenu(items: MenuItemDocumentModel[]) {
    await this.menuItemModel.deleteMany({});
    await this.menuItemModel.insertMany(items);
  }
}
