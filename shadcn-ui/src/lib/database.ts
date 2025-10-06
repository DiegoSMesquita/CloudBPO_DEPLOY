import { 
  User, 
  Company, 
  CompanySubscription,
  Sector, 
  Product, 
  ProductCategory, 
  StockMovement, 
  Counting, 
  CountingItem, 
  Task,
  Message,
  Notification,
  DEFAULT_PRODUCT_CATEGORIES 
} from './types';
import { supabaseDb } from './supabaseDatabase';
import { migrateLocalStorageToSupabase } from './supabase';

class Database {
  private initialized = false;
  private useSupabase = true; // Always use Supabase now
  private migrationCompleted = false;

  constructor() {
    if (!this.initialized) {
      this.initializeDatabase();
      this.initialized = true;
    }
  }

  private async initializeDatabase() {
    try {
      console.log('🔄 Initializing database with Supabase...');

      // Check if migration has been completed
      const migrationFlag = localStorage.getItem('supabase_migration_completed');
      
      if (!migrationFlag) {
        console.log('🔄 Starting migration from localStorage to Supabase...');
        
        // Migrate existing localStorage data to Supabase
        const migrationSuccess = await migrateLocalStorageToSupabase();
        
        if (migrationSuccess) {
          localStorage.setItem('supabase_migration_completed', 'true');
          this.migrationCompleted = true;
          console.log('✅ Migration completed successfully!');
        } else {
          console.log('❌ Migration failed, falling back to localStorage');
          this.useSupabase = false;
        }
      } else {
        this.migrationCompleted = true;
        console.log('✅ Migration already completed, using Supabase');
      }

      // Initialize default data if needed (only for new installations)
      await this.initializeDefaultData();

    } catch (error) {
      console.error('Error initializing database:', error);
      console.log('❌ Falling back to localStorage');
      this.useSupabase = false;
      this.initializeLocalStorage();
    }
  }

  private async initializeDefaultData() {
    try {
      // Check if we have any companies
      const companies = await this.getCompaniesAsync();
      
      if (companies.length === 0) {
        console.log('🔄 Creating default company...');
        
        // Create default company
        const defaultCompany: Company = {
          id: '1',
          name: 'CloudBPO Sistemas',
          cnpj: '12.345.678/0001-90',
          type: 'other',
          createdAt: new Date().toISOString()
        };
        await this.saveCompanyAsync(defaultCompany);

        // Create super admin user
        const superAdmin: User = {
          id: 'super-admin-1',
          name: 'Super Administrador',
          email: 'superadmin@cloudbpo.com',
          role: 'admin',
          companyId: '1',
          accessibleCompanies: ['1'],
          password: 'admin123',
          createdAt: new Date().toISOString()
        };
        await this.saveUserAsync(superAdmin);

        // Create default sectors
        const defaultSectors: Sector[] = [
          {
            id: '1',
            name: 'Cozinha',
            description: 'Área de preparo de alimentos',
            companyId: '1',
            createdAt: new Date().toISOString()
          },
          {
            id: '2',
            name: 'Estoque Seco',
            description: 'Produtos não perecíveis',
            companyId: '1',
            createdAt: new Date().toISOString()
          },
          {
            id: '3',
            name: 'Geladeira',
            description: 'Produtos refrigerados',
            companyId: '1',
            createdAt: new Date().toISOString()
          }
        ];

        for (const sector of defaultSectors) {
          await this.saveSectorAsync(sector);
        }

        // Create default product categories
        const defaultCategories: ProductCategory[] = DEFAULT_PRODUCT_CATEGORIES.map((name, index) => ({
          id: (index + 1).toString(),
          name,
          companyId: '1',
          createdAt: new Date().toISOString()
        }));

        for (const category of defaultCategories) {
          await this.saveProductCategoryAsync(category);
        }

        console.log('✅ Default data created successfully!');
      }
    } catch (error) {
      console.error('Error initializing default data:', error);
    }
  }

  private initializeLocalStorage() {
    // Fallback to original localStorage implementation
    try {
      // Initialize companies if not exists
      if (!localStorage.getItem('companies')) {
        const defaultCompany: Company = {
          id: '1',
          name: 'CloudBPO Sistemas',
          cnpj: '12.345.678/0001-90',
          type: 'other',
          createdAt: new Date().toISOString()
        };
        localStorage.setItem('companies', JSON.stringify([defaultCompany]));
      }

      // Initialize users if not exists or update existing
      const existingUsers = localStorage.getItem('users');
      let users: User[] = existingUsers ? JSON.parse(existingUsers) : [];
      
      // Check if super admin exists
      const superAdminExists = users.find(u => u.email === 'superadmin@cloudbpo.com');
      
      if (!superAdminExists) {
        // Create super admin user
        const superAdmin: User = {
          id: 'super-admin-1',
          name: 'Super Administrador',
          email: 'superadmin@cloudbpo.com',
          role: 'admin',
          companyId: '1',
          accessibleCompanies: ['1'],
          password: 'admin123',
          createdAt: new Date().toISOString()
        };
        
        // Remove old demo user if exists
        users = users.filter(u => u.email !== 'admin@demo.com');
        
        // Add super admin
        users.push(superAdmin);
        
        localStorage.setItem('users', JSON.stringify(users));
        console.log('Super admin created:', superAdmin);
      }

      // Ensure existing users have password field for compatibility
      let usersUpdated = false;
      users = users.map(user => {
        if (!user.password) {
          user.password = 'demo123';
          usersUpdated = true;
        }
        if (!user.accessibleCompanies) {
          user.accessibleCompanies = [user.companyId];
          usersUpdated = true;
        }
        return user;
      });

      if (usersUpdated) {
        localStorage.setItem('users', JSON.stringify(users));
        console.log('Users updated with password and accessibleCompanies fields');
      }

      // Initialize default sectors for company 1
      const sectorKey = 'sectors_1';
      if (!localStorage.getItem(sectorKey)) {
        const defaultSectors: Sector[] = [
          {
            id: '1',
            name: 'Cozinha',
            description: 'Área de preparo de alimentos',
            companyId: '1',
            createdAt: new Date().toISOString()
          },
          {
            id: '2',
            name: 'Estoque Seco',
            description: 'Produtos não perecíveis',
            companyId: '1',
            createdAt: new Date().toISOString()
          },
          {
            id: '3',
            name: 'Geladeira',
            description: 'Produtos refrigerados',
            companyId: '1',
            createdAt: new Date().toISOString()
          }
        ];
        localStorage.setItem(sectorKey, JSON.stringify(defaultSectors));
      }

      // Initialize default product categories for company 1
      const categoryKey = 'categories_1';
      if (!localStorage.getItem(categoryKey)) {
        const defaultCategories: ProductCategory[] = DEFAULT_PRODUCT_CATEGORIES.map((name, index) => ({
          id: (index + 1).toString(),
          name,
          companyId: '1',
          createdAt: new Date().toISOString()
        }));
        localStorage.setItem(categoryKey, JSON.stringify(defaultCategories));
      }

    } catch (error) {
      console.error('Error initializing localStorage database:', error);
    }
  }

  // ASYNC METHODS (Primary - Use these for all operations)
  
  // Company methods
  async getCompaniesAsync(): Promise<Company[]> {
    if (this.useSupabase) {
      return await supabaseDb.getCompanies();
    }
    
    try {
      const companies = localStorage.getItem('companies');
      return companies ? JSON.parse(companies) : [];
    } catch (error) {
      console.error('Error getting companies:', error);
      return [];
    }
  }

  async getCompanyByIdAsync(id: string): Promise<Company | null> {
    if (this.useSupabase) {
      return await supabaseDb.getCompanyById(id);
    }
    
    const companies = await this.getCompaniesAsync();
    return companies.find(c => c.id === id) || null;
  }

  async saveCompanyAsync(company: Company): Promise<void> {
    if (this.useSupabase) {
      return await supabaseDb.saveCompany(company);
    }
    
    try {
      const companies = await this.getCompaniesAsync();
      const existingIndex = companies.findIndex(c => c.id === company.id);
      
      if (existingIndex >= 0) {
        companies[existingIndex] = company;
      } else {
        companies.push(company);
      }
      
      localStorage.setItem('companies', JSON.stringify(companies));
    } catch (error) {
      console.error('Error saving company:', error);
      throw error;
    }
  }

  async deleteCompanyAsync(id: string): Promise<void> {
    if (this.useSupabase) {
      return await supabaseDb.deleteCompany(id);
    }
    
    try {
      const companies = await this.getCompaniesAsync();
      const filteredCompanies = companies.filter(c => c.id !== id);
      localStorage.setItem('companies', JSON.stringify(filteredCompanies));
      
      // Clean up related data
      localStorage.removeItem(`sectors_${id}`);
      localStorage.removeItem(`categories_${id}`);
      localStorage.removeItem(`products_${id}`);
      localStorage.removeItem(`countings_${id}`);
    } catch (error) {
      console.error('Error deleting company:', error);
      throw error;
    }
  }

  // Company Subscription methods
  async getCompanySubscriptionsAsync(): Promise<CompanySubscription[]> {
    if (this.useSupabase) {
      return await supabaseDb.getCompanySubscriptions();
    }
    
    try {
      const subscriptions = localStorage.getItem('company_subscriptions');
      return subscriptions ? JSON.parse(subscriptions) : [];
    } catch (error) {
      console.error('Error getting company subscriptions:', error);
      return [];
    }
  }

  async saveCompanySubscriptionAsync(subscription: CompanySubscription): Promise<void> {
    if (this.useSupabase) {
      return await supabaseDb.saveCompanySubscription(subscription);
    }
    
    try {
      const subscriptions = await this.getCompanySubscriptionsAsync();
      const existingIndex = subscriptions.findIndex(s => s.id === subscription.id);
      
      if (existingIndex >= 0) {
        subscriptions[existingIndex] = subscription;
      } else {
        subscriptions.push(subscription);
      }
      
      localStorage.setItem('company_subscriptions', JSON.stringify(subscriptions));
    } catch (error) {
      console.error('Error saving company subscription:', error);
      throw error;
    }
  }

  async deleteCompanySubscriptionAsync(id: string): Promise<void> {
    if (this.useSupabase) {
      return await supabaseDb.deleteCompanySubscription(id);
    }
    
    try {
      const subscriptions = await this.getCompanySubscriptionsAsync();
      const filteredSubscriptions = subscriptions.filter(s => s.id !== id);
      localStorage.setItem('company_subscriptions', JSON.stringify(filteredSubscriptions));
    } catch (error) {
      console.error('Error deleting company subscription:', error);
      throw error;
    }
  }

  // User methods
  async getUsersAsync(): Promise<User[]> {
    if (this.useSupabase) {
      return await supabaseDb.getUsers();
    }
    
    try {
      const users = localStorage.getItem('users');
      return users ? JSON.parse(users) : [];
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  }

  async getUserByIdAsync(id: string): Promise<User | null> {
    if (this.useSupabase) {
      return await supabaseDb.getUserById(id);
    }
    
    const users = await this.getUsersAsync();
    return users.find(u => u.id === id) || null;
  }

  async getUserByEmailAsync(email: string): Promise<User | null> {
    if (this.useSupabase) {
      return await supabaseDb.getUserByEmail(email);
    }
    
    const users = await this.getUsersAsync();
    return users.find(u => u.email === email) || null;
  }

  async saveUserAsync(user: User): Promise<void> {
    if (this.useSupabase) {
      return await supabaseDb.saveUser(user);
    }
    
    try {
      const users = await this.getUsersAsync();
      const existingIndex = users.findIndex(u => u.id === user.id);
      
      if (existingIndex >= 0) {
        users[existingIndex] = user;
      } else {
        users.push(user);
      }
      
      localStorage.setItem('users', JSON.stringify(users));
      console.log('✅ User saved successfully:', {
        id: user.id,
        name: user.name,
        email: user.email,
        password: user.password ? '***' : 'NO PASSWORD',
        companyId: user.companyId,
        accessibleCompanies: user.accessibleCompanies
      });
    } catch (error) {
      console.error('Error saving user:', error);
      throw error;
    }
  }

  async deleteUserAsync(id: string): Promise<void> {
    if (this.useSupabase) {
      return await supabaseDb.deleteUser(id);
    }
    
    try {
      const users = await this.getUsersAsync();
      const filteredUsers = users.filter(u => u.id !== id);
      localStorage.setItem('users', JSON.stringify(filteredUsers));
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Sector methods
  async getSectorsAsync(companyId: string): Promise<Sector[]> {
    if (this.useSupabase) {
      return await supabaseDb.getSectors(companyId);
    }
    
    try {
      const sectors = localStorage.getItem(`sectors_${companyId}`);
      return sectors ? JSON.parse(sectors) : [];
    } catch (error) {
      console.error('Error getting sectors:', error);
      return [];
    }
  }

  async saveSectorAsync(sector: Sector): Promise<void> {
    if (this.useSupabase) {
      return await supabaseDb.saveSector(sector);
    }
    
    try {
      const sectors = await this.getSectorsAsync(sector.companyId);
      const existingIndex = sectors.findIndex(s => s.id === sector.id);
      
      if (existingIndex >= 0) {
        sectors[existingIndex] = sector;
      } else {
        sectors.push(sector);
      }
      
      localStorage.setItem(`sectors_${sector.companyId}`, JSON.stringify(sectors));
    } catch (error) {
      console.error('Error saving sector:', error);
      throw error;
    }
  }

  async deleteSectorAsync(id: string, companyId: string): Promise<void> {
    if (this.useSupabase) {
      return await supabaseDb.deleteSector(id, companyId);
    }
    
    try {
      const sectors = await this.getSectorsAsync(companyId);
      const filteredSectors = sectors.filter(s => s.id !== id);
      localStorage.setItem(`sectors_${companyId}`, JSON.stringify(filteredSectors));
    } catch (error) {
      console.error('Error deleting sector:', error);
      throw error;
    }
  }

  // Product Category methods
  async getProductCategoriesAsync(companyId: string): Promise<ProductCategory[]> {
    if (this.useSupabase) {
      return await supabaseDb.getProductCategories(companyId);
    }
    
    try {
      const categories = localStorage.getItem(`categories_${companyId}`);
      return categories ? JSON.parse(categories) : [];
    } catch (error) {
      console.error('Error getting product categories:', error);
      return [];
    }
  }

  async saveProductCategoryAsync(category: ProductCategory): Promise<void> {
    if (this.useSupabase) {
      return await supabaseDb.saveProductCategory(category);
    }
    
    try {
      const categories = await this.getProductCategoriesAsync(category.companyId);
      const existingIndex = categories.findIndex(c => c.id === category.id);
      
      if (existingIndex >= 0) {
        categories[existingIndex] = category;
      } else {
        categories.push(category);
      }
      
      localStorage.setItem(`categories_${category.companyId}`, JSON.stringify(categories));
    } catch (error) {
      console.error('Error saving product category:', error);
      throw error;
    }
  }

  async deleteProductCategoryAsync(id: string, companyId: string): Promise<void> {
    if (this.useSupabase) {
      return await supabaseDb.deleteProductCategory(id, companyId);
    }
    
    try {
      const categories = await this.getProductCategoriesAsync(companyId);
      const filteredCategories = categories.filter(c => c.id !== id);
      localStorage.setItem(`categories_${companyId}`, JSON.stringify(filteredCategories));
    } catch (error) {
      console.error('Error deleting product category:', error);
      throw error;
    }
  }

  // Product methods
  async getProductsAsync(companyId: string): Promise<Product[]> {
    if (this.useSupabase) {
      return await supabaseDb.getProducts(companyId);
    }
    
    try {
      const products = localStorage.getItem(`products_${companyId}`);
      return products ? JSON.parse(products) : [];
    } catch (error) {
      console.error('Error getting products:', error);
      return [];
    }
  }

  async saveProductAsync(product: Product): Promise<void> {
    if (this.useSupabase) {
      return await supabaseDb.saveProduct(product);
    }
    
    try {
      const products = await this.getProductsAsync(product.companyId);
      const existingIndex = products.findIndex(p => p.id === product.id);
      
      if (existingIndex >= 0) {
        products[existingIndex] = product;
      } else {
        products.push(product);
      }
      
      localStorage.setItem(`products_${product.companyId}`, JSON.stringify(products));
    } catch (error) {
      console.error('Error saving product:', error);
      throw error;
    }
  }

  async deleteProductAsync(id: string, companyId: string): Promise<void> {
    if (this.useSupabase) {
      return await supabaseDb.deleteProduct(id, companyId);
    }
    
    try {
      const products = await this.getProductsAsync(companyId);
      const filteredProducts = products.filter(p => p.id !== id);
      localStorage.setItem(`products_${companyId}`, JSON.stringify(filteredProducts));
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }

  // Counting methods
  async getCountingsAsync(companyId: string): Promise<Counting[]> {
    if (this.useSupabase) {
      return await supabaseDb.getCountings(companyId);
    }
    
    try {
      const countings = localStorage.getItem(`countings_${companyId}`);
      return countings ? JSON.parse(countings) : [];
    } catch (error) {
      console.error('Error getting countings:', error);
      return [];
    }
  }

  async saveCountingAsync(counting: Counting): Promise<void> {
    if (this.useSupabase) {
      return await supabaseDb.saveCounting(counting);
    }
    
    try {
      const countings = await this.getCountingsAsync(counting.companyId);
      const existingIndex = countings.findIndex(c => c.id === counting.id);
      
      if (existingIndex >= 0) {
        countings[existingIndex] = counting;
      } else {
        countings.push(counting);
      }
      
      localStorage.setItem(`countings_${counting.companyId}`, JSON.stringify(countings));
    } catch (error) {
      console.error('Error saving counting:', error);
      throw error;
    }
  }

  async deleteCountingAsync(id: string, companyId: string): Promise<void> {
    if (this.useSupabase) {
      return await supabaseDb.deleteCounting(id, companyId);
    }
    
    try {
      const countings = await this.getCountingsAsync(companyId);
      const filteredCountings = countings.filter(c => c.id !== id);
      localStorage.setItem(`countings_${companyId}`, JSON.stringify(filteredCountings));
    } catch (error) {
      console.error('Error deleting counting:', error);
      throw error;
    }
  }

  async getCountingByShareLinkAsync(shareLink: string): Promise<Counting | null> {
    if (this.useSupabase) {
      return await supabaseDb.getCountingByShareLink(shareLink);
    }
    
    try {
      // Search through all companies' countings
      const companies = await this.getCompaniesAsync();
      for (const company of companies) {
        const countings = await this.getCountingsAsync(company.id);
        const counting = countings.find(c => c.shareLink === shareLink);
        if (counting) {
          return counting;
        }
      }
      return null;
    } catch (error) {
      console.error('Error getting counting by share link:', error);
      return null;
    }
  }

  // Task methods
  async getTasksAsync(companyId: string): Promise<Task[]> {
    if (this.useSupabase) {
      return await supabaseDb.getTasks(companyId);
    }
    
    try {
      const tasks = localStorage.getItem(`tasks_${companyId}`);
      return tasks ? JSON.parse(tasks) : [];
    } catch (error) {
      console.error('Error getting tasks:', error);
      return [];
    }
  }

  async saveTaskAsync(task: Task): Promise<void> {
    if (this.useSupabase) {
      return await supabaseDb.saveTask(task);
    }
    
    try {
      const tasks = await this.getTasksAsync(task.companyId);
      const existingIndex = tasks.findIndex(t => t.id === task.id);
      
      if (existingIndex >= 0) {
        tasks[existingIndex] = task;
      } else {
        tasks.push(task);
      }
      
      localStorage.setItem(`tasks_${task.companyId}`, JSON.stringify(tasks));
    } catch (error) {
      console.error('Error saving task:', error);
      throw error;
    }
  }

  async deleteTaskAsync(id: string, companyId: string): Promise<void> {
    if (this.useSupabase) {
      return await supabaseDb.deleteTask(id, companyId);
    }
    
    try {
      const tasks = await this.getTasksAsync(companyId);
      const filteredTasks = tasks.filter(t => t.id !== id);
      localStorage.setItem(`tasks_${companyId}`, JSON.stringify(filteredTasks));
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }

  // Message methods
  async getMessagesAsync(companyId: string): Promise<Message[]> {
    if (this.useSupabase) {
      return await supabaseDb.getMessages(companyId);
    }
    
    try {
      const messages = localStorage.getItem(`messages_${companyId}`);
      return messages ? JSON.parse(messages) : [];
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  }

  async saveMessageAsync(message: Message): Promise<void> {
    if (this.useSupabase) {
      return await supabaseDb.saveMessage(message);
    }
    
    try {
      const messages = await this.getMessagesAsync(message.companyId);
      const existingIndex = messages.findIndex(m => m.id === message.id);
      
      if (existingIndex >= 0) {
        messages[existingIndex] = message;
      } else {
        messages.push(message);
      }
      
      localStorage.setItem(`messages_${message.companyId}`, JSON.stringify(messages));
    } catch (error) {
      console.error('Error saving message:', error);
      throw error;
    }
  }

  async deleteMessageAsync(id: string, companyId: string): Promise<void> {
    if (this.useSupabase) {
      return await supabaseDb.deleteMessage(id, companyId);
    }
    
    try {
      const messages = await this.getMessagesAsync(companyId);
      const filteredMessages = messages.filter(m => m.id !== id);
      localStorage.setItem(`messages_${companyId}`, JSON.stringify(filteredMessages));
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  // Notification methods
  async getNotificationsAsync(companyId: string, userId?: string): Promise<Notification[]> {
    if (this.useSupabase) {
      return await supabaseDb.getNotifications(companyId, userId);
    }
    
    try {
      const notifications = localStorage.getItem(`notifications_${companyId}`);
      let notificationList: Notification[] = notifications ? JSON.parse(notifications) : [];
      
      if (userId) {
        notificationList = notificationList.filter(notification => notification.userId === userId);
      }
      
      return notificationList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  async getUnreadNotificationsAsync(companyId: string, userId?: string): Promise<Notification[]> {
    if (this.useSupabase) {
      return await supabaseDb.getUnreadNotifications(companyId, userId);
    }
    
    const notifications = await this.getNotificationsAsync(companyId, userId);
    return notifications.filter(notification => !notification.read);
  }

  async saveNotificationAsync(notification: Notification): Promise<void> {
    if (this.useSupabase) {
      return await supabaseDb.saveNotification(notification);
    }
    
    try {
      const notifications = await this.getNotificationsAsync(notification.companyId);
      const existingIndex = notifications.findIndex(n => n.id === notification.id);
      
      if (existingIndex >= 0) {
        notifications[existingIndex] = notification;
      } else {
        notifications.push(notification);
      }
      
      localStorage.setItem(`notifications_${notification.companyId}`, JSON.stringify(notifications));
    } catch (error) {
      console.error('Error saving notification:', error);
      throw error;
    }
  }

  async markNotificationAsReadAsync(notificationId: string, companyId: string): Promise<void> {
    if (this.useSupabase) {
      return await supabaseDb.markNotificationAsRead(notificationId, companyId);
    }
    
    try {
      const notifications = await this.getNotificationsAsync(companyId);
      const notification = notifications.find(n => n.id === notificationId);
      if (notification) {
        notification.read = true;
        notification.readAt = new Date().toISOString();
        localStorage.setItem(`notifications_${companyId}`, JSON.stringify(notifications));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  async markAllNotificationsAsReadAsync(companyId: string, userId?: string): Promise<void> {
    if (this.useSupabase) {
      return await supabaseDb.markAllNotificationsAsRead(companyId, userId);
    }
    
    try {
      const notifications = await this.getNotificationsAsync(companyId);
      notifications
        .filter(n => !userId || n.userId === userId)
        .forEach(notification => {
          notification.read = true;
          notification.readAt = new Date().toISOString();
        });
      localStorage.setItem(`notifications_${companyId}`, JSON.stringify(notifications));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  async deleteNotificationAsync(notificationId: string, companyId: string): Promise<void> {
    if (this.useSupabase) {
      return await supabaseDb.deleteNotification(notificationId, companyId);
    }
    
    try {
      const notifications = await this.getNotificationsAsync(companyId);
      const filteredNotifications = notifications.filter(n => n.id !== notificationId);
      localStorage.setItem(`notifications_${companyId}`, JSON.stringify(filteredNotifications));
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // DEPRECATED SYNC METHODS (Keep for backward compatibility but warn)
  
  getCompanies(): Company[] {
    console.warn('⚠️ Using deprecated sync getCompanies, use getCompaniesAsync instead');
    return [];
  }

  getCompanyById(id: string): Company | null {
    console.warn('⚠️ Using deprecated sync getCompanyById, use getCompanyByIdAsync instead');
    return null;
  }

  saveCompany(company: Company): void {
    console.warn('⚠️ Using deprecated sync saveCompany, use saveCompanyAsync instead');
    this.saveCompanyAsync(company).catch(console.error);
  }

  deleteCompany(id: string): void {
    console.warn('⚠️ Using deprecated sync deleteCompany, use deleteCompanyAsync instead');
    this.deleteCompanyAsync(id).catch(console.error);
  }

  getUsers(): User[] {
    console.warn('⚠️ Using deprecated sync getUsers, use getUsersAsync instead');
    return [];
  }

  getUserById(id: string): User | null {
    console.warn('⚠️ Using deprecated sync getUserById, use getUserByIdAsync instead');
    return null;
  }

  getUserByEmail(email: string): User | null {
    console.warn('⚠️ Using deprecated sync getUserByEmail, use getUserByEmailAsync instead');
    return null;
  }

  saveUser(user: User): void {
    console.warn('⚠️ Using deprecated sync saveUser, use saveUserAsync instead');
    this.saveUserAsync(user).catch(console.error);
  }

  deleteUser(id: string): void {
    console.warn('⚠️ Using deprecated sync deleteUser, use deleteUserAsync instead');
    this.deleteUserAsync(id).catch(console.error);
  }

  getSectors(companyId: string): Sector[] {
    console.warn('⚠️ Using deprecated sync getSectors, use getSectorsAsync instead');
    return [];
  }

  saveSector(sector: Sector): void {
    console.warn('⚠️ Using deprecated sync saveSector, use saveSectorAsync instead');
    this.saveSectorAsync(sector).catch(console.error);
  }

  deleteSector(id: string, companyId: string): void {
    console.warn('⚠️ Using deprecated sync deleteSector, use deleteSectorAsync instead');
    this.deleteSectorAsync(id, companyId).catch(console.error);
  }

  getProductCategories(companyId: string): ProductCategory[] {
    console.warn('⚠️ Using deprecated sync getProductCategories, use getProductCategoriesAsync instead');
    return [];
  }

  saveProductCategory(category: ProductCategory): void {
    console.warn('⚠️ Using deprecated sync saveProductCategory, use saveProductCategoryAsync instead');
    this.saveProductCategoryAsync(category).catch(console.error);
  }

  deleteProductCategory(id: string, companyId: string): void {
    console.warn('⚠️ Using deprecated sync deleteProductCategory, use deleteProductCategoryAsync instead');
    this.deleteProductCategoryAsync(id, companyId).catch(console.error);
  }

  getProducts(companyId: string): Product[] {
    console.warn('⚠️ Using deprecated sync getProducts, use getProductsAsync instead');
    return [];
  }

  saveProduct(product: Product): void {
    console.warn('⚠️ Using deprecated sync saveProduct, use saveProductAsync instead');
    this.saveProductAsync(product).catch(console.error);
  }

  deleteProduct(id: string, companyId: string): void {
    console.warn('⚠️ Using deprecated sync deleteProduct, use deleteProductAsync instead');
    this.deleteProductAsync(id, companyId).catch(console.error);
  }

  getCountings(companyId: string): Counting[] {
    console.warn('⚠️ Using deprecated sync getCountings, use getCountingsAsync instead');
    return [];
  }

  saveCounting(counting: Counting): void {
    console.warn('⚠️ Using deprecated sync saveCounting, use saveCountingAsync instead');
    this.saveCountingAsync(counting).catch(console.error);
  }

  deleteCounting(id: string, companyId: string): void {
    console.warn('⚠️ Using deprecated sync deleteCounting, use deleteCountingAsync instead');
    this.deleteCountingAsync(id, companyId).catch(console.error);
  }

  getCountingByShareLink(shareLink: string): Counting | null {
    console.warn('⚠️ Using deprecated sync getCountingByShareLink, use getCountingByShareLinkAsync instead');
    return null;
  }

  getTasks(companyId: string): Task[] {
    console.warn('⚠️ Using deprecated sync getTasks, use getTasksAsync instead');
    return [];
  }

  saveTask(task: Task): void {
    console.warn('⚠️ Using deprecated sync saveTask, use saveTaskAsync instead');
    this.saveTaskAsync(task).catch(console.error);
  }

  deleteTask(id: string, companyId: string): void {
    console.warn('⚠️ Using deprecated sync deleteTask, use deleteTaskAsync instead');
    this.deleteTaskAsync(id, companyId).catch(console.error);
  }

  getMessages(companyId: string): Message[] {
    console.warn('⚠️ Using deprecated sync getMessages, use getMessagesAsync instead');
    return [];
  }

  saveMessage(message: Message): void {
    console.warn('⚠️ Using deprecated sync saveMessage, use saveMessageAsync instead');
    this.saveMessageAsync(message).catch(console.error);
  }

  deleteMessage(id: string, companyId: string): void {
    console.warn('⚠️ Using deprecated sync deleteMessage, use deleteMessageAsync instead');
    this.deleteMessageAsync(id, companyId).catch(console.error);
  }

  getNotifications(companyId: string, userId?: string): Notification[] {
    console.warn('⚠️ Using deprecated sync getNotifications, use getNotificationsAsync instead');
    return [];
  }

  getUnreadNotifications(companyId: string, userId?: string): Notification[] {
    console.warn('⚠️ Using deprecated sync getUnreadNotifications, use getUnreadNotificationsAsync instead');
    return [];
  }

  saveNotification(notification: Notification): void {
    console.warn('⚠️ Using deprecated sync saveNotification, use saveNotificationAsync instead');
    this.saveNotificationAsync(notification).catch(console.error);
  }

  markNotificationAsRead(notificationId: string, companyId: string): void {
    console.warn('⚠️ Using deprecated sync markNotificationAsRead, use markNotificationAsReadAsync instead');
    this.markNotificationAsReadAsync(notificationId, companyId).catch(console.error);
  }

  markAllNotificationsAsRead(companyId: string, userId?: string): void {
    console.warn('⚠️ Using deprecated sync markAllNotificationsAsRead, use markAllNotificationsAsReadAsync instead');
    this.markAllNotificationsAsReadAsync(companyId, userId).catch(console.error);
  }

  deleteNotification(notificationId: string, companyId: string): void {
    console.warn('⚠️ Using deprecated sync deleteNotification, use deleteNotificationAsync instead');
    this.deleteNotificationAsync(notificationId, companyId).catch(console.error);
  }
}

export const db = new Database();