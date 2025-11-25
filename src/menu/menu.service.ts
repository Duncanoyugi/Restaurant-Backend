import { 
  Injectable, 
  NotFoundException, 
  BadRequestException,
  ConflictException 
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like, In, FindOptionsWhere } from 'typeorm';
import { MenuItem } from './entities/menu.entity';
import { Category } from './entities/category.entity';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { MenuSearchDto } from './dto/menu-search.dto';
import { CategorySearchDto } from './dto/category-search.dto';
import { BulkMenuItemsDto } from './dto/bulk-menu-items.dto';

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(MenuItem)
    private menuItemRepository: Repository<MenuItem>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  // Category CRUD operations
  async createCategory(createCategoryDto: CreateCategoryDto): Promise<Category> {
    // Check if category name already exists
    const existingCategory = await this.categoryRepository.findOne({
      where: { name: createCategoryDto.name }
    });

    if (existingCategory) {
      throw new ConflictException('Category with this name already exists');
    }

    const category = this.categoryRepository.create(createCategoryDto);
    return await this.categoryRepository.save(category);
  }

  async findAllCategories(searchDto: CategorySearchDto): Promise<Category[]> {
    const { name, active } = searchDto;

    const where: FindOptionsWhere<Category> = {};

    if (name) {
      where.name = Like(`%${name}%`);
    }

    if (active !== undefined) {
      where.active = active;
    }

    return await this.categoryRepository.find({
      where,
      relations: ['menuItems'],
      order: { sortOrder: 'ASC', name: 'ASC' }
    });
  }

  async findCategoryById(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['menuItems', 'menuItems.restaurant']
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async updateCategory(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findCategoryById(id);

    // Check if name is being updated and if it already exists
    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const existingCategory = await this.categoryRepository.findOne({
        where: { name: updateCategoryDto.name }
      });

      if (existingCategory) {
        throw new ConflictException('Category with this name already exists');
      }
    }

    Object.assign(category, updateCategoryDto);
    return await this.categoryRepository.save(category);
  }

  async removeCategory(id: string): Promise<void> {
    const category = await this.findCategoryById(id);
    
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
  async createMenuItem(createMenuItemDto: CreateMenuItemDto): Promise<MenuItem> {
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

  async findMenuItemById(id: string): Promise<MenuItem> {
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

  async updateMenuItem(id: string, updateMenuItemDto: UpdateMenuItemDto): Promise<MenuItem> {
    const menuItem = await this.findMenuItemById(id);

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

  async removeMenuItem(id: string): Promise<void> {
    const menuItem = await this.findMenuItemById(id);
    await this.menuItemRepository.softRemove(menuItem);
  }

  // Bulk operations
  async createBulkMenuItems(bulkDto: BulkMenuItemsDto): Promise<MenuItem[]> {
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
  async getRestaurantMenu(restaurantId: string, categoryId?: string): Promise<{ categories: Category[], menuItems: MenuItem[] }> {
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

  async getFeaturedMenuItems(restaurantId?: string, limit: number = 10): Promise<MenuItem[]> {
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
  async searchMenuItems(query: string, restaurantId?: string): Promise<MenuItem[]> {
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

  async getMenuItemsByAllergens(restaurantId: string, allergens: string[]): Promise<MenuItem[]> {
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
  async getMenuPriceRange(restaurantId: string): Promise<{ min: number, max: number }> {
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
  async updateMenuItemRating(menuItemId: string, newRating: number): Promise<MenuItem> {
    const menuItem = await this.findMenuItemById(menuItemId);
    
    // In a real scenario, you'd calculate this based on all reviews
    menuItem.averageRating = newRating;
    
    return await this.menuItemRepository.save(menuItem);
  }

  // Toggle menu item availability
  async toggleMenuItemAvailability(id: string): Promise<MenuItem> {
    const menuItem = await this.findMenuItemById(id);
    menuItem.available = !menuItem.available;
    
    const updatedItem = await this.menuItemRepository.save(menuItem);
    
    // Parse allergens for response
    return {
      ...updatedItem,
      allergens: updatedItem.allergens ? JSON.parse(updatedItem.allergens) : []
    };
  }

  // Get menu statistics
  async getMenuStatistics(restaurantId: string): Promise<any> {
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
}