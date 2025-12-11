// backend\src\menu\menu.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like, In, FindOptionsWhere, IsNull } from 'typeorm';
import { MenuItem } from './entities/menu.entity';
import { Category } from './entities/category.entity';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { MenuSearchDto } from './dto/menu-search.dto';
import { CategorySearchDto } from './dto/category-search.dto';
import { BulkMenuItemsDto } from './dto/bulk-menu-items.dto';
import { User } from '../user/entities/user.entity';
import { UserRoleEnum } from '../user/entities/user.types';
import { Restaurant } from '../restaurant/entities/restaurant.entity';

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(MenuItem)
    private menuItemRepository: Repository<MenuItem>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(Restaurant)
    private restaurantRepository: Repository<Restaurant>,
  ) { }

  // Helper method to check restaurant ownership
  // Accepts either (user, restaurantId) or (restaurantId, user) to remain compatible with existing call sites.
  private async checkRestaurantAccess(userOrRestaurantId: User | number, restaurantIdOrUser?: number | User): Promise<void> {
    let user: User;
    let restaurantId: number;

    // Normalize arguments: callers may pass (user, restaurantId)
    // or (restaurantId, user) — handle both to avoid type errors.
    if (typeof userOrRestaurantId === 'number') {
      restaurantId = userOrRestaurantId;
      user = restaurantIdOrUser as User;
    } else {
      user = userOrRestaurantId;
      restaurantId = restaurantIdOrUser as number;
    }

    if (!user || !restaurantId) {
      throw new BadRequestException('User and restaurantId are required to check access');
    }

    if (user.role.name === UserRoleEnum.ADMIN) {
      return; // Admin has access to all restaurants
    }

    const restaurant = await this.restaurantRepository.findOne({
      where: { id: restaurantId },
      relations: ['owner']
    });

    if (!restaurant) {
      throw new NotFoundException(`Restaurant with ID ${restaurantId} not found`);
    }

    // Check if user is the restaurant owner
    if (user.role.name === UserRoleEnum.RESTAURANT_OWNER && restaurant.owner.id !== user.id) {
      throw new ForbiddenException('You can only manage menus for your own restaurant');
    }

    // Check if user is staff member of this restaurant
    if (user.role.name === UserRoleEnum.RESTAURANT_STAFF) {
      const staffRestaurant = await this.restaurantRepository
        .createQueryBuilder('restaurant')
        .innerJoin('restaurant.staff', 'staff')
        .where('restaurant.id = :restaurantId', { restaurantId })
        .andWhere('staff.userId = :userId', { userId: user.id })
        .getOne();

      if (!staffRestaurant) {
        throw new ForbiddenException('You can only manage menus for the restaurant you work at');
      }
    }
  }

  // Helper method to get user's restaurant ID
  private async getUserRestaurantId(user: User): Promise<number> {
    if (user.role.name === UserRoleEnum.RESTAURANT_OWNER) {
      const restaurant = await this.restaurantRepository.findOne({
        where: { owner: { id: user.id } }
      });

      if (!restaurant) {
        throw new NotFoundException('Restaurant not found for this user');
      }

      return restaurant.id;
    }

    if (user.role.name === UserRoleEnum.RESTAURANT_STAFF) {
      const staffRecord = await this.restaurantRepository
        .createQueryBuilder('restaurant')
        .innerJoin('restaurant.staff', 'staff')
        .where('staff.userId = :userId', { userId: user.id })
        .getOne();

      if (!staffRecord) {
        throw new ForbiddenException('You are not assigned to any restaurant');
      }

      return staffRecord.id;
    }

    throw new ForbiddenException('User does not have restaurant access');
  }

  // Category CRUD operations
  async createCategory(createCategoryDto: CreateCategoryDto, user?: User): Promise<Category> {
    // Check permissions for restaurant-specific categories
    if (createCategoryDto.restaurantId && user) {
      await this.checkRestaurantAccess(user, createCategoryDto.restaurantId);
    }

    // Check if category name already exists
    const categoryWhere: FindOptionsWhere<Category> = { name: createCategoryDto.name } as FindOptionsWhere<Category>;
    if (createCategoryDto.restaurantId !== undefined && createCategoryDto.restaurantId !== null) {
      // Use proper relation query syntax
      categoryWhere.restaurant = { id: createCategoryDto.restaurantId } as any;
    } else {
      // look for global categories where restaurant IS NULL
      categoryWhere.restaurant = IsNull();
    }
    const existingCategory = await this.categoryRepository.findOne({
      where: categoryWhere
    });

    if (existingCategory) {
      throw new ConflictException('Category with this name already exists');
    }

    const categoryData: any = { ...createCategoryDto };
    if (createCategoryDto.restaurantId) {
      categoryData.restaurant = { id: createCategoryDto.restaurantId };
      delete categoryData.restaurantId;
    }
    const category = this.categoryRepository.create(categoryData as any);
    const savedCategory = await this.categoryRepository.save(category);
    return savedCategory as unknown as Category;
  }

  async findAllCategories(searchDto: CategorySearchDto): Promise<Category[]> {
    const { name, active, restaurantId } = searchDto;

    const where: FindOptionsWhere<Category> = {};

    if (name) {
      where.name = Like(`%${name}%`);
    }

    if (active !== undefined) {
      where.active = active;
    }

    if (restaurantId && restaurantId !== '') {
      // filter by related restaurant id to satisfy TypeORM typing
      // Since restaurantId is now a relationship, we query by relation ID
      where.restaurant = { id: restaurantId } as any;
    }

    return await this.categoryRepository.find({
      where,
      relations: ['menuItems'],
      order: { sortOrder: 'ASC', name: 'ASC' }
    });
  }

  async findCategoryById(id: number): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['menuItems', 'menuItems.restaurant']
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async updateCategory(id: number, updateCategoryDto: UpdateCategoryDto, user?: User): Promise<Category> {
    const category = await this.findCategoryById(id);

    // Check permissions for restaurant-specific categories
    if (category.restaurantId && user) {
      await this.checkRestaurantAccess(user, category.restaurantId);
    }

    // Check if name is being updated and if it already exists
    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const existingCategory = await this.categoryRepository.findOne({
        where: {
          name: updateCategoryDto.name,
          restaurantId: category.restaurantId
        }
      });

      if (existingCategory) {
        throw new ConflictException('Category with this name already exists');
      }
    }

    Object.assign(category, updateCategoryDto);
    return await this.categoryRepository.save(category);
  }

  async removeCategory(id: number, user?: User): Promise<void> {
    const category = await this.findCategoryById(id);

    // Check permissions for restaurant-specific categories
    if (category.restaurantId && user) {
      await this.checkRestaurantAccess(user, category.restaurantId);
    }

    // Check if category has menu items
    const menuItemsCount = await this.menuItemRepository.count({
      where: { categoryId: id }
    });

    if (menuItemsCount > 0) {
      throw new BadRequestException('Cannot delete category with existing menu items');
    }

    await this.categoryRepository.remove(category);
  }

  // Menu Item CRUD operations
  async createMenuItem(createMenuItemDto: CreateMenuItemDto, user?: User): Promise<MenuItem> {
    // Check restaurant access permissions
    if (user) {
      await this.checkRestaurantAccess(user, createMenuItemDto.restaurantId);
    }

    // Check if menu item name already exists in the same restaurant
    const existingMenuItem = await this.menuItemRepository.findOne({
      where: {
        name: createMenuItemDto.name,
        restaurantId: createMenuItemDto.restaurantId
      }
    });

    if (existingMenuItem) {
      throw new ConflictException('Menu item with this name already exists in this restaurant');
    }

    const menuItem = this.menuItemRepository.create({
      ...createMenuItemDto,
      allergens: createMenuItemDto.allergens ? JSON.stringify(createMenuItemDto.allergens) : null
    });

    return await this.menuItemRepository.save(menuItem);
  }

  async findAllMenuItems(searchDto: MenuSearchDto): Promise<{ data: MenuItem[], total: number }> {
    const {
      restaurantId,
      categoryId,
      name,
      minPrice,
      maxPrice,
      available,
      isFeatured,
      page = 1,
      limit = 20
    } = searchDto;

    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<MenuItem> = {};

    if (restaurantId) {
      where.restaurantId = restaurantId;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (name) {
      where.name = Like(`%${name}%`);
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = Between(minPrice || 0, maxPrice || 999999);
    }

    if (available !== undefined) {
      where.available = available;
    }

    if (isFeatured !== undefined) {
      where.isFeatured = isFeatured;
    }

    const [data, total] = await this.menuItemRepository.findAndCount({
      where,
      relations: ['restaurant', 'category', 'reviews'],
      skip,
      take: limit,
      order: {
        isFeatured: 'DESC',
        averageRating: 'DESC',
        createdAt: 'DESC'
      }
    });

    // Parse allergens from JSON string
    const parsedData = data.map(item => ({
      ...item,
      allergens: item.allergens ? JSON.parse(item.allergens) : []
    }));

    return { data: parsedData, total };
  }

  async findMenuItemById(id: number): Promise<MenuItem> {
    const menuItem = await this.menuItemRepository.findOne({
      where: { id },
      relations: [
        'restaurant',
        'category',
        'reviews',
        'reviews.user'
      ],
    });

    if (!menuItem) {
      throw new NotFoundException(`Menu item with ID ${id} not found`);
    }

    // Parse allergens from JSON string
    return {
      ...menuItem,
      allergens: menuItem.allergens ? JSON.parse(menuItem.allergens) : []
    };
  }

  async updateMenuItem(id: number, updateMenuItemDto: UpdateMenuItemDto, user?: User): Promise<MenuItem> {
    const menuItem = await this.findMenuItemById(id);

    // Check restaurant access permissions
    if (user) {
      await this.checkRestaurantAccess(user, menuItem.restaurantId);
    }

    // Check if name is being updated and if it already exists in the same restaurant
    if (updateMenuItemDto.name && updateMenuItemDto.name !== menuItem.name) {
      const existingMenuItem = await this.menuItemRepository.findOne({
        where: {
          name: updateMenuItemDto.name,
          restaurantId: updateMenuItemDto.restaurantId || menuItem.restaurantId
        }
      });

      if (existingMenuItem) {
        throw new ConflictException('Menu item with this name already exists in this restaurant');
      }
    }

    const updateData: any = { ...updateMenuItemDto };

    // Handle allergens serialization
    if (updateMenuItemDto.allergens) {
      updateData.allergens = JSON.stringify(updateMenuItemDto.allergens);
    }

    Object.assign(menuItem, updateData);
    const updatedItem = await this.menuItemRepository.save(menuItem);

    // Parse allergens for response
    return {
      ...updatedItem,
      allergens: updatedItem.allergens ? JSON.parse(updatedItem.allergens) : []
    };
  }

  async removeMenuItem(id: number, user?: User): Promise<void> {
    const menuItem = await this.findMenuItemById(id);

    // Check restaurant access permissions
    if (user) {
      await this.checkRestaurantAccess(user, menuItem.restaurantId);
    }

    await this.menuItemRepository.softRemove(menuItem);
  }

  // Bulk operations
  async createBulkMenuItems(bulkDto: BulkMenuItemsDto, user?: User): Promise<MenuItem[]> {
    // Check restaurant access permissions for all items
    if (user) {
      for (const item of bulkDto.items) {
        await this.checkRestaurantAccess(user, item.restaurantId);
      }
    }

    const menuItems = bulkDto.items.map(item =>
      this.menuItemRepository.create({
        ...item,
        allergens: item.allergens ? JSON.stringify(item.allergens) : null
      })
    );

    const savedItems = await this.menuItemRepository.save(menuItems);

    // Parse allergens for response
    return savedItems.map(item => ({
      ...item,
      allergens: item.allergens ? JSON.parse(item.allergens) : []
    }));
  }

  // Restaurant-specific operations
  async getRestaurantMenu(restaurantId: number, categoryId?: number): Promise<{ categories: Category[], menuItems: MenuItem[] }> {
    const categories = await this.categoryRepository.find({
      where: { active: true },
      order: { sortOrder: 'ASC', name: 'ASC' }
    });

    const menuWhere: FindOptionsWhere<MenuItem> = {
      restaurantId,
      available: true
    };

    if (categoryId) {
      menuWhere.categoryId = categoryId;
    }

    const menuItems = await this.menuItemRepository.find({
      where: menuWhere,
      relations: ['category'],
      order: {
        category: { sortOrder: 'ASC' },
        isFeatured: 'DESC',
        averageRating: 'DESC'
      }
    });

    // Parse allergens
    const parsedMenuItems = menuItems.map(item => ({
      ...item,
      allergens: item.allergens ? JSON.parse(item.allergens) : []
    }));

    return { categories, menuItems: parsedMenuItems };
  }

  async getFeaturedMenuItems(restaurantId?: number, limit: number = 10): Promise<MenuItem[]> {
    const where: FindOptionsWhere<MenuItem> = {
      isFeatured: true,
      available: true
    };

    if (restaurantId) {
      where.restaurantId = restaurantId;
    }

    const menuItems = await this.menuItemRepository.find({
      where,
      relations: ['restaurant', 'category'],
      take: limit,
      order: { averageRating: 'DESC', createdAt: 'DESC' }
    });

    // Parse allergens
    return menuItems.map(item => ({
      ...item,
      allergens: item.allergens ? JSON.parse(item.allergens) : []
    }));
  }

  // Search and filter operations
  async searchMenuItems(query: string, restaurantId?: number): Promise<MenuItem[]> {
    const menuItems = await this.menuItemRepository
      .createQueryBuilder('menuItem')
      .leftJoinAndSelect('menuItem.restaurant', 'restaurant')
      .leftJoinAndSelect('menuItem.category', 'category')
      .where('menuItem.available = :available', { available: true })
      .andWhere('(menuItem.name LIKE :query OR menuItem.description LIKE :query OR menuItem.ingredients LIKE :query)')
      .setParameter('query', `%${query}%`);

    if (restaurantId) {
      menuItems.andWhere('menuItem.restaurantId = :restaurantId', { restaurantId });
    }

    const results = await menuItems
      .orderBy('menuItem.isFeatured', 'DESC')
      .addOrderBy('menuItem.averageRating', 'DESC')
      .getMany();

    // Parse allergens
    return results.map(item => ({
      ...item,
      allergens: item.allergens ? JSON.parse(item.allergens) : []
    }));
  }

  async getMenuItemsByAllergens(restaurantId: number, allergens: string[]): Promise<MenuItem[]> {
    const menuItems = await this.menuItemRepository
      .createQueryBuilder('menuItem')
      .where('menuItem.restaurantId = :restaurantId', { restaurantId })
      .andWhere('menuItem.available = :available', { available: true })
      .getMany();

    // Filter items that don't contain any of the specified allergens
    const filteredItems = menuItems.filter(item => {
      if (!item.allergens) return true;

      const itemAllergens: string[] = JSON.parse(item.allergens);
      return !allergens.some(allergen =>
        itemAllergens.includes(allergen)
      );
    });

    // Parse allergens for response
    return filteredItems.map(item => ({
      ...item,
      allergens: item.allergens ? JSON.parse(item.allergens) : []
    }));
  }

  // Price range operations
  async getMenuPriceRange(restaurantId: number): Promise<{ min: number, max: number }> {
    const result = await this.menuItemRepository
      .createQueryBuilder('menuItem')
      .select('MIN(menuItem.price)', 'min')
      .addSelect('MAX(menuItem.price)', 'max')
      .where('menuItem.restaurantId = :restaurantId', { restaurantId })
      .andWhere('menuItem.available = :available', { available: true })
      .getRawOne();

    return {
      min: parseFloat(result.min) || 0,
      max: parseFloat(result.max) || 0
    };
  }

  // Update menu item rating
  async updateMenuItemRating(menuItemId: number, newRating: number): Promise<MenuItem> {
    const menuItem = await this.findMenuItemById(menuItemId);

    // In a real scenario, you'd calculate this based on all reviews
    menuItem.averageRating = newRating;

    return await this.menuItemRepository.save(menuItem);
  }

  // Toggle menu item availability
  async toggleMenuItemAvailability(id: number, user?: User): Promise<MenuItem> {
    const menuItem = await this.findMenuItemById(id);

    // Check restaurant access permissions
    if (user) {
      await this.checkRestaurantAccess(user, menuItem.restaurantId);
    }

    menuItem.available = !menuItem.available;

    const updatedItem = await this.menuItemRepository.save(menuItem);

    // Parse allergens for response
    return {
      ...updatedItem,
      allergens: updatedItem.allergens ? JSON.parse(updatedItem.allergens) : []
    };
  }

  // Get menu statistics
  async getMenuStatistics(restaurantId: number, user?: User): Promise<any> {
    // Check restaurant access permissions
    if (user) {
      await this.checkRestaurantAccess(user, restaurantId);
    }

    const [totalItems, availableItems, featuredItems, categoriesCount] = await Promise.all([
      this.menuItemRepository.count({ where: { restaurantId } }),
      this.menuItemRepository.count({ where: { restaurantId, available: true } }),
      this.menuItemRepository.count({ where: { restaurantId, isFeatured: true, available: true } }),
      this.menuItemRepository
        .createQueryBuilder('menuItem')
        .select('COUNT(DISTINCT menuItem.categoryId)', 'count')
        .where('menuItem.restaurantId = :restaurantId', { restaurantId })
        .andWhere('menuItem.available = :available', { available: true })
        .getRawOne()
    ]);

    const priceRange = await this.getMenuPriceRange(restaurantId);

    return {
      totalItems,
      availableItems,
      featuredItems,
      categoriesCount: parseInt(categoriesCount.count) || 0,
      priceRange
    };
  }

  // Restaurant Owner specific methods
  async getMyRestaurantMenu(user: User): Promise<{ categories: Category[], menuItems: MenuItem[] }> {
    const restaurantId = await this.getUserRestaurantId(user);
    return this.getRestaurantMenu(restaurantId);
  }

  async getMyRestaurantStatistics(user: User): Promise<any> {
    const restaurantId = await this.getUserRestaurantId(user);
    return this.getMenuStatistics(restaurantId, user);
  }
}