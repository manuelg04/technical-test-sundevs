import { Controller, Get } from '@nestjs/common';
import { MenuService } from '../application/menu.service';

@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get()
  getMenu() {
    return this.menuService.getMenu();
  }
}
