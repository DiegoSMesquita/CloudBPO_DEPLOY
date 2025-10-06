import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://djqcowblopblhbrndkmx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqcWNvd2Jsb3BibGhicm5ka214Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MTkzMTcsImV4cCI6MjA3MzE5NTMxN30.nEPbPSGQs6dgRfU8HWWlqglj7R9XfRCHxavFEST5-BU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database table names
export const TABLES = {
  COMPANIES: 'app_0bcfd220f3_companies',
  USERS: 'app_0bcfd220f3_users',
  SECTORS: 'app_0bcfd220f3_sectors',
  PRODUCT_CATEGORIES: 'app_0bcfd220f3_product_categories',
  PRODUCTS: 'app_0bcfd220f3_products',
  COUNTINGS: 'app_0bcfd220f3_countings',
  COUNTING_ITEMS: 'app_0bcfd220f3_counting_items',
  MESSAGES: 'app_0bcfd220f3_messages',
  NOTIFICATIONS: 'app_0bcfd220f3_notifications',
  STOCK_MOVEMENTS: 'app_0bcfd220f3_stock_movements',
};

// Helper function to handle Supabase errors
export const handleSupabaseError = (error: unknown, operation: string) => {
  console.error(`Supabase ${operation} error:`, error);
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  throw new Error(`${operation} failed: ${errorMessage}`);
};

// Authentication helper functions
export const authenticateUser = async (email: string, password: string) => {
  try {
    console.log('🔐 Authenticating user:', email);
    
    // Query user from custom users table
    const { data: userData, error: userError } = await supabase
      .from(TABLES.USERS)
      .select('*')
      .eq('email', email)
      .single();
    
    if (userError) {
      console.error('User query error:', userError);
      return null;
    }
    
    if (!userData) {
      console.log('❌ User not found');
      return null;
    }
    
    // Validate password (simple string comparison for now)
    if (userData.password !== password) {
      console.log('❌ Invalid password');
      return null;
    }
    
    console.log('✅ User authenticated successfully');
    return {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      companyId: userData.company_id,
      accessibleCompanies: userData.accessible_companies || [userData.company_id],
      password: userData.password,
      createdAt: userData.created_at,
      updatedAt: userData.updated_at
    };
  } catch (error) {
    console.error('❌ Authentication error:', error);
    return null;
  }
};

// Test Supabase connection
export const testSupabaseConnection = async () => {
  try {
    console.log('🔄 Testing Supabase connection...');
    
    const { data, error } = await supabase
      .from(TABLES.COMPANIES)
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Supabase connection failed:', error);
      return false;
    }
    
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection test failed:', error);
    return false;
  }
};

// Migration helper to move localStorage data to Supabase
export const migrateLocalStorageToSupabase = async () => {
  try {
    console.log('🔄 Starting migration from localStorage to Supabase...');

    // Test connection first
    const connectionOk = await testSupabaseConnection();
    if (!connectionOk) {
      console.log('❌ Supabase connection failed, skipping migration');
      return false;
    }

    // Migrate companies
    const companiesData = localStorage.getItem('companies');
    if (companiesData) {
      const companies = JSON.parse(companiesData);
      for (const company of companies) {
        const { error } = await supabase
          .from(TABLES.COMPANIES)
          .upsert({
            id: company.id,
            name: company.name,
            cnpj: company.cnpj,
            type: company.type,
            address: company.address,
            phone: company.phone,
            email: company.email,
            description: company.description,
            created_at: company.createdAt
          });
        
        if (error) console.error('Company migration error:', error);
      }
      console.log('✅ Companies migrated');
    }

    // Migrate users
    const usersData = localStorage.getItem('users');
    if (usersData) {
      const users = JSON.parse(usersData);
      for (const user of users) {
        const { error } = await supabase
          .from(TABLES.USERS)
          .upsert({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            company_id: user.companyId,
            accessible_companies: user.accessibleCompanies || [user.companyId],
            password: user.password,
            created_at: user.createdAt
          });
        
        if (error) console.error('User migration error:', error);
      }
      console.log('✅ Users migrated');
    }

    // Migrate sectors for each company
    const companies = JSON.parse(localStorage.getItem('companies') || '[]');
    for (const company of companies) {
      const sectorsData = localStorage.getItem(`sectors_${company.id}`);
      if (sectorsData) {
        const sectors = JSON.parse(sectorsData);
        for (const sector of sectors) {
          const { error } = await supabase
            .from(TABLES.SECTORS)
            .upsert({
              id: sector.id,
              name: sector.name,
              description: sector.description,
              company_id: sector.companyId,
              created_at: sector.createdAt
            });
          
          if (error) console.error('Sector migration error:', error);
        }
      }

      // Migrate product categories
      const categoriesData = localStorage.getItem(`categories_${company.id}`);
      if (categoriesData) {
        const categories = JSON.parse(categoriesData);
        for (const category of categories) {
          const { error } = await supabase
            .from(TABLES.PRODUCT_CATEGORIES)
            .upsert({
              id: category.id,
              name: category.name,
              company_id: category.companyId,
              created_at: category.createdAt
            });
          
          if (error) console.error('Category migration error:', error);
        }
      }

      // Migrate products
      const productsData = localStorage.getItem(`products_${company.id}`);
      if (productsData) {
        const products = JSON.parse(productsData);
        for (const product of products) {
          const { error } = await supabase
            .from(TABLES.PRODUCTS)
            .upsert({
              id: product.id,
              name: product.name,
              description: product.description,
              category_id: product.categoryId,
              unit: product.unit,
              min_stock: product.minStock,
              max_stock: product.maxStock,
              current_stock: product.currentStock,
              cost_price: product.costPrice,
              sale_price: product.salePrice,
              barcode: product.barcode,
              company_id: product.companyId,
              created_at: product.createdAt
            });
          
          if (error) console.error('Product migration error:', error);
        }
      }

      // Migrate countings
      const countingsData = localStorage.getItem(`countings_${company.id}`);
      if (countingsData) {
        const countings = JSON.parse(countingsData);
        for (const counting of countings) {
          const { error } = await supabase
            .from(TABLES.COUNTINGS)
            .upsert({
              id: counting.id,
              name: counting.name,
              description: counting.description,
              status: counting.status,
              type: counting.type,
              sector_id: counting.sectorId,
              created_by: counting.createdBy,
              share_link: counting.shareLink,
              company_id: counting.companyId,
              created_at: counting.createdAt,
              updated_at: counting.updatedAt
            });
          
          if (error) console.error('Counting migration error:', error);

          // Migrate counting items
          if (counting.items) {
            for (const item of counting.items) {
              const { error: itemError } = await supabase
                .from(TABLES.COUNTING_ITEMS)
                .upsert({
                  id: item.id,
                  counting_id: counting.id,
                  product_id: item.productId,
                  expected_quantity: item.expectedQuantity,
                  counted_quantity: item.countedQuantity,
                  difference: item.difference,
                  notes: item.notes,
                  counted_by: item.countedBy,
                  counted_at: item.countedAt,
                  created_at: item.createdAt
                });
              
              if (itemError) console.error('Counting item migration error:', itemError);
            }
          }
        }
      }

      // Migrate messages
      const messagesData = localStorage.getItem(`messages_${company.id}`);
      if (messagesData) {
        const messages = JSON.parse(messagesData);
        for (const message of messages) {
          const { error } = await supabase
            .from(TABLES.MESSAGES)
            .upsert({
              id: message.id,
              title: message.title,
              content: message.content,
              type: message.type,
              priority: message.priority,
              sender_id: message.senderId,
              company_id: company.id,
              created_at: message.createdAt
            });
          
          if (error) console.error('Message migration error:', error);
        }
      }

      // Migrate notifications
      const notificationsData = localStorage.getItem(`notifications_${company.id}`);
      if (notificationsData) {
        const notifications = JSON.parse(notificationsData);
        for (const notification of notifications) {
          const { error } = await supabase
            .from(TABLES.NOTIFICATIONS)
            .upsert({
              id: notification.id,
              title: notification.title,
              message: notification.message,
              type: notification.type,
              user_id: notification.userId,
              company_id: notification.companyId,
              read: notification.read,
              read_at: notification.readAt,
              created_at: notification.createdAt
            });
          
          if (error) console.error('Notification migration error:', error);
        }
      }
    }

    console.log('✅ Migration completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return false;
  }
};