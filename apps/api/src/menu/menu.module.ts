import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MenuService } from './application/menu.service';
import {
  MENU_ITEM_MODEL,
  MenuItemSchema,
} from './infrastructure/menu-item.schema';
import { MenuController } from './presentation/menu.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: MENU_ITEM_MODEL,
        schema: MenuItemSchema,
      },
    ]),
  ],
  controllers: [MenuController],
  providers: [MenuService],
  exports: [MenuService, MongooseModule],
})
export class MenuModule {}
