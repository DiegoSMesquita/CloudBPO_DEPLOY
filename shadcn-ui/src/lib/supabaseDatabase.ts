import { supabase, TABLES, handleSupabaseError } from './supabase';
import type { 
  User, 
  Company, 
  CompanySubscription,
  Sector, 
  Product, 
  ProductCategory, 
  Counting, 
  CountingItem, 
  Task,
  Message,
  Notification 
} from './types';

class SupabaseDatabase {
  // Company methods
  async getCompanies(): Promise<Company[]> {
    try {
      const { data, error } = await supabase
        .from(TABLES.COMPANIES)
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      return (data || []).map(company => ({
        id: company.id,
        name: company.name,
        cnpj: company.cnpj,
        type: company.type,
        address: company.address,
        phone: company.phone,
        email: company.email,
        description: company.description,
        createdAt: company.created_at,
        updatedAt: company.updated_at
      }));
    } catch (error) {
      handleSupabaseError(error, 'getCompanies');
      return [];
    }
  }

  async getCompanyById(id: string): Promise<Company | null> {
    try {
      const { data, error } = await supabase
        .from(TABLES.COMPANIES)
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      if (!data) return null;
      
      return {
        id: data.id,
        name: data.name,
        cnpj: data.cnpj,
        type: data.type,
        address: data.address,
        phone: data.phone,
        email: data.email,
        description: data.description,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      handleSupabaseError(error, 'getCompanyById');
      return null;
    }
  }

  async saveCompany(company: Company): Promise<void> {
    try {
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
          created_at: company.createdAt,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
    } catch (error) {
      handleSupabaseError(error, 'saveCompany');
    }
  }

  async deleteCompany(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(TABLES.COMPANIES)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      handleSupabaseError(error, 'deleteCompany');
    }
  }

  // Company Subscription methods - FIXED: Add proper table name
  async getCompanySubscriptions(): Promise<CompanySubscription[]> {
    try {
      const { data, error } = await supabase
        .from('app_0bcfd220f3_company_subscriptions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map(sub => ({
        id: sub.id,
        companyId: sub.company_id,
        plan: sub.plan,
        status: sub.status,
        startDate: sub.start_date,
        endDate: sub.end_date,
        createdAt: sub.created_at,
        updatedAt: sub.updated_at
      }));
    } catch (error) {
      handleSupabaseError(error, 'getCompanySubscriptions');
      return [];
    }
  }

  async saveCompanySubscription(subscription: CompanySubscription): Promise<void> {
    try {
      const { error } = await supabase
        .from('app_0bcfd220f3_company_subscriptions')
        .upsert({
          id: subscription.id,
          company_id: subscription.companyId,
          plan: subscription.plan,
          status: subscription.status,
          start_date: subscription.startDate,
          end_date: subscription.endDate,
          created_at: subscription.createdAt,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
    } catch (error) {
      handleSupabaseError(error, 'saveCompanySubscription');
    }
  }

  async deleteCompanySubscription(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('app_0bcfd220f3_company_subscriptions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      handleSupabaseError(error, 'deleteCompanySubscription');
    }
  }

  // User methods - 🚨 FIXED: Use INSERT instead of UPSERT to avoid updated_at column issue
  async getUsers(): Promise<User[]> {
    try {
      console.log('🔍 GETTING USERS - Table:', TABLES.USERS);
      
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .order('name');
      
      if (error) {
        console.error('❌ GET USERS ERROR:', error);
        throw error;
      }
      
      console.log('✅ GET USERS SUCCESS - Count:', data?.length || 0);
      
      return (data || []).map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.company_id,
        accessibleCompanies: user.accessible_companies || [user.company_id],
        password: user.password || user.password_hash, // Support both column names
        createdAt: user.created_at,
        updatedAt: user.updated_at || user.created_at // Fallback if no updated_at
      }));
    } catch (error) {
      handleSupabaseError(error, 'getUsers');
      return [];
    }
  }

  async getUserById(id: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      if (!data) return null;
      
      return {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        companyId: data.company_id,
        accessibleCompanies: data.accessible_companies || [data.company_id],
        password: data.password || data.password_hash,
        createdAt: data.created_at,
        updatedAt: data.updated_at || data.created_at
      };
    } catch (error) {
      handleSupabaseError(error, 'getUserById');
      return null;
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .eq('email', email)
        .single();
      
      if (error) throw error;
      if (!data) return null;
      
      return {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        companyId: data.company_id,
        accessibleCompanies: data.accessible_companies || [data.company_id],
        password: data.password || data.password_hash,
        createdAt: data.created_at,
        updatedAt: data.updated_at || data.created_at
      };
    } catch (error) {
      handleSupabaseError(error, 'getUserByEmail');
      return null;
    }
  }

  // 🚨 FIXED: Use INSERT instead of UPSERT to avoid updated_at column requirement
  async saveUser(user: User): Promise<void> {
    try {
      console.log('🚨 SUPABASE saveUser - STARTING CORRECTED FLOW');
      console.log('📊 Table name:', TABLES.USERS);
      console.log('📊 User data to save:', {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        accessibleCompanies: user.accessibleCompanies,
        password: user.password ? '***' : 'NO PASSWORD',
        createdAt: user.createdAt
      });

      // 🚨 STEP 1: Test table accessibility
      console.log('🔍 STEP 1: Testing table accessibility...');
      const { data: testData, error: testError } = await supabase
        .from(TABLES.USERS)
        .select('count')
        .limit(1);
      
      if (testError) {
        console.error('❌ TABLE ACCESS TEST FAILED:', testError);
        throw new Error(`Table access failed: ${testError.message}`);
      }
      
      console.log('✅ STEP 1: Table accessible');

      // 🚨 STEP 2: Check if user already exists (for update vs insert)
      console.log('🔍 STEP 2: Checking if user exists...');
      const { data: existingUser } = await supabase
        .from(TABLES.USERS)
        .select('id')
        .eq('id', user.id)
        .single();

      const isUpdate = !!existingUser;
      console.log(isUpdate ? '📝 STEP 2: User exists - will UPDATE' : '📝 STEP 2: New user - will INSERT');

      // 🚨 STEP 3: Prepare data without updated_at dependency
      const insertData = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        company_id: user.companyId,
        accessible_companies: user.accessibleCompanies,
        password: user.password, // Use password field as-is
        created_at: user.createdAt || new Date().toISOString()
      };
      
      console.log('📝 STEP 3: Data prepared:', {
        ...insertData,
        password: insertData.password ? '***' : 'NO PASSWORD'
      });

      let data, error;

      if (isUpdate) {
        // 🚨 UPDATE existing user (without updated_at)
        console.log('💾 STEP 4: Performing UPDATE operation...');
        const updateResult = await supabase
          .from(TABLES.USERS)
          .update({
            name: insertData.name,
            email: insertData.email,
            role: insertData.role,
            company_id: insertData.company_id,
            accessible_companies: insertData.accessible_companies,
            password: insertData.password
          })
          .eq('id', user.id)
          .select()
          .single();
        
        data = updateResult.data;
        error = updateResult.error;
      } else {
        // 🚨 INSERT new user (simple insert, no upsert)
        console.log('💾 STEP 4: Performing INSERT operation...');
        const insertResult = await supabase
          .from(TABLES.USERS)
          .insert([insertData])
          .select()
          .single();
        
        data = insertResult.data;
        error = insertResult.error;
      }
      
      if (error) {
        console.error('❌ OPERATION FAILED:', {
          error,
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        
        // 🚨 Specific error handling
        if (error.code === '42P01') {
          console.error('❌ TABLE DOES NOT EXIST:', TABLES.USERS);
        } else if (error.code === '23505') {
          console.error('❌ UNIQUE CONSTRAINT VIOLATION - Email already exists');
        } else if (error.code === '23502') {
          console.error('❌ NOT NULL CONSTRAINT VIOLATION - Missing required field');
        }
        
        throw error;
      }
      
      console.log('✅ STEP 4: Operation successful, returned data:', {
        ...data,
        password: data?.password ? '***' : 'NO PASSWORD'
      });

      // 🚨 STEP 5: Verify the user was actually saved
      console.log('🔍 STEP 5: Verifying user was saved...');
      const { data: verifyData, error: verifyError } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .eq('email', user.email)
        .single();
      
      if (verifyError) {
        console.error('❌ VERIFICATION FAILED:', verifyError);
        throw new Error(`User verification failed: ${verifyError.message}`);
      }
      
      if (!verifyData) {
        console.error('❌ USER NOT FOUND AFTER SAVE');
        throw new Error('User was not found in database after save operation');
      }
      
      console.log('✅ STEP 5: User verified in database:', {
        id: verifyData.id,
        name: verifyData.name,
        email: verifyData.email,
        created_at: verifyData.created_at
      });
      
      console.log('🎉 SUPABASE saveUser - COMPLETED SUCCESSFULLY!');
      
    } catch (error) {
      console.error('❌ SUPABASE saveUser - CRITICAL FAILURE:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      
      // 🚨 Re-throw the error so the calling code knows it failed
      throw error;
    }
  }

  async deleteUser(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(TABLES.USERS)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      handleSupabaseError(error, 'deleteUser');
    }
  }

  // Sector methods
  async getSectors(companyId: string): Promise<Sector[]> {
    try {
      const { data, error } = await supabase
        .from(TABLES.SECTORS)
        .select('*')
        .eq('company_id', companyId)
        .order('name');
      
      if (error) throw error;
      
      return (data || []).map(sector => ({
        id: sector.id,
        name: sector.name,
        description: sector.description,
        companyId: sector.company_id,
        createdAt: sector.created_at,
        updatedAt: sector.updated_at
      }));
    } catch (error) {
      handleSupabaseError(error, 'getSectors');
      return [];
    }
  }

  async saveSector(sector: Sector): Promise<void> {
    try {
      const { error } = await supabase
        .from(TABLES.SECTORS)
        .upsert({
          id: sector.id,
          name: sector.name,
          description: sector.description,
          company_id: sector.companyId,
          created_at: sector.createdAt,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
    } catch (error) {
      handleSupabaseError(error, 'saveSector');
    }
  }

  async deleteSector(id: string, companyId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(TABLES.SECTORS)
        .delete()
        .eq('id', id)
        .eq('company_id', companyId);
      
      if (error) throw error;
    } catch (error) {
      handleSupabaseError(error, 'deleteSector');
    }
  }

  // Product Category methods
  async getProductCategories(companyId: string): Promise<ProductCategory[]> {
    try {
      const { data, error } = await supabase
        .from(TABLES.PRODUCT_CATEGORIES)
        .select('*')
        .eq('company_id', companyId)
        .order('name');
      
      if (error) throw error;
      
      return (data || []).map(category => ({
        id: category.id,
        name: category.name,
        companyId: category.company_id,
        createdAt: category.created_at,
        updatedAt: category.updated_at
      }));
    } catch (error) {
      handleSupabaseError(error, 'getProductCategories');
      return [];
    }
  }

  // Alias for compatibility with Products.tsx
  async getCategories(companyId?: string): Promise<ProductCategory[]> {
    if (companyId) {
      return this.getProductCategories(companyId);
    }
    return [];
  }

  async saveProductCategory(category: ProductCategory): Promise<void> {
    try {
      const { error } = await supabase
        .from(TABLES.PRODUCT_CATEGORIES)
        .upsert({
          id: category.id,
          name: category.name,
          company_id: category.companyId,
          created_at: category.createdAt,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
    } catch (error) {
      handleSupabaseError(error, 'saveProductCategory');
    }
  }

  async deleteProductCategory(id: string, companyId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(TABLES.PRODUCT_CATEGORIES)
        .delete()
        .eq('id', id)
        .eq('company_id', companyId);
      
      if (error) throw error;
    } catch (error) {
      handleSupabaseError(error, 'deleteProductCategory');
    }
  }

  // Product methods
  async getProducts(companyId?: string): Promise<Product[]> {
    try {
      let query = supabase
        .from(TABLES.PRODUCTS)
        .select('*')
        .order('name');
      
      if (companyId) {
        query = query.eq('company_id', companyId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return (data || []).map(product => ({
        id: product.id,
        name: product.name,
        code: product.code,
        description: product.description,
        categoryId: product.category_id,
        sectorId: product.sector_id,
        unit: product.unit,
        conversionFactor: product.conversion_factor,
        alternativeUnit: product.alternative_unit,
        minStock: product.min_stock,
        maxStock: product.max_stock,
        currentStock: product.current_stock,
        unitCost: product.unit_cost,
        companyId: product.company_id,
        createdAt: product.created_at,
        updatedAt: product.updated_at,
        // Legacy fields for backward compatibility
        category_id: product.category_id,
        sector_id: product.sector_id,
        conversion_factor: product.conversion_factor,
        alternative_unit: product.alternative_unit,
        min_stock: product.min_stock,
        max_stock: product.max_stock,
        current_stock: product.current_stock,
        unit_cost: product.unit_cost,
        company_id: product.company_id,
        created_at: product.created_at,
        updated_at: product.updated_at
      }));
    } catch (error) {
      handleSupabaseError(error, 'getProducts');
      return [];
    }
  }

  async createProduct(productData: any): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from(TABLES.PRODUCTS)
        .insert({
          name: productData.name,
          code: productData.code,
          description: productData.description,
          category_id: productData.category_id,
          sector_id: productData.sector_id,
          unit: productData.unit,
          conversion_factor: productData.conversion_factor,
          alternative_unit: productData.alternative_unit,
          min_stock: productData.min_stock,
          max_stock: productData.max_stock,
          current_stock: productData.current_stock,
          unit_cost: productData.unit_cost,
          company_id: productData.company_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return data ? {
        id: data.id,
        name: data.name,
        code: data.code,
        description: data.description,
        categoryId: data.category_id,
        sectorId: data.sector_id,
        unit: data.unit,
        conversionFactor: data.conversion_factor,
        alternativeUnit: data.alternative_unit,
        minStock: data.min_stock,
        maxStock: data.max_stock,
        currentStock: data.current_stock,
        unitCost: data.unit_cost,
        companyId: data.company_id,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        // Legacy fields
        category_id: data.category_id,
        sector_id: data.sector_id,
        conversion_factor: data.conversion_factor,
        alternative_unit: data.alternative_unit,
        min_stock: data.min_stock,
        max_stock: data.max_stock,
        current_stock: data.current_stock,
        unit_cost: data.unit_cost,
        company_id: data.company_id,
        created_at: data.created_at,
        updated_at: data.updated_at
      } : null;
    } catch (error) {
      handleSupabaseError(error, 'createProduct');
      return null;
    }
  }

  async updateProduct(id: string, productData: any): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from(TABLES.PRODUCTS)
        .update({
          name: productData.name,
          code: productData.code,
          description: productData.description,
          category_id: productData.category_id,
          sector_id: productData.sector_id,
          unit: productData.unit,
          conversion_factor: productData.conversion_factor,
          alternative_unit: productData.alternative_unit,
          min_stock: productData.min_stock,
          max_stock: productData.max_stock,
          current_stock: productData.current_stock,
          unit_cost: productData.unit_cost,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return data ? {
        id: data.id,
        name: data.name,
        code: data.code,
        description: data.description,
        categoryId: data.category_id,
        sectorId: data.sector_id,
        unit: data.unit,
        conversionFactor: data.conversion_factor,
        alternativeUnit: data.alternative_unit,
        minStock: data.min_stock,
        maxStock: data.max_stock,
        currentStock: data.current_stock,
        unitCost: data.unit_cost,
        companyId: data.company_id,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        // Legacy fields
        category_id: data.category_id,
        sector_id: data.sector_id,
        conversion_factor: data.conversion_factor,
        alternative_unit: data.alternative_unit,
        min_stock: data.min_stock,
        max_stock: data.max_stock,
        current_stock: data.current_stock,
        unit_cost: data.unit_cost,
        company_id: data.company_id,
        created_at: data.created_at,
        updated_at: data.updated_at
      } : null;
    } catch (error) {
      handleSupabaseError(error, 'updateProduct');
      return null;
    }
  }

  async saveProduct(product: Product): Promise<void> {
    try {
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
          created_at: product.createdAt,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
    } catch (error) {
      handleSupabaseError(error, 'saveProduct');
    }
  }

  async deleteProduct(id: string, companyId?: string): Promise<boolean> {
    try {
      let query = supabase
        .from(TABLES.PRODUCTS)
        .delete()
        .eq('id', id);
      
      if (companyId) {
        query = query.eq('company_id', companyId);
      }
      
      const { error } = await query;
      
      if (error) throw error;
      return true;
    } catch (error) {
      handleSupabaseError(error, 'deleteProduct');
      return false;
    }
  }

  // Stock Movement methods
  async getStockMovements(companyId?: string): Promise<any[]> {
    try {
      let query = supabase
        .from(TABLES.STOCK_MOVEMENTS || 'stock_movements')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (companyId) {
        query = query.eq('company_id', companyId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      handleSupabaseError(error, 'getStockMovements');
      return [];
    }
  }

  async createStockMovement(movementData: any): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from(TABLES.STOCK_MOVEMENTS || 'stock_movements')
        .insert({
          product_id: movementData.product_id,
          type: movementData.type,
          quantity: movementData.quantity,
          reason: movementData.reason,
          reference: movementData.reference,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      handleSupabaseError(error, 'createStockMovement');
      return null;
    }
  }

  // Counting methods
  async getCountings(companyId: string): Promise<Counting[]> {
    try {
      const { data, error } = await supabase
        .from(TABLES.COUNTINGS)
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map(counting => ({
        id: counting.id,
        internalId: counting.internal_id,
        name: counting.name,
        description: counting.description,
        status: counting.status,
        type: counting.type,
        sectorId: counting.sector_id,
        createdBy: counting.created_by,
        shareLink: counting.share_link,
        companyId: counting.company_id,
        createdAt: counting.created_at,
        updatedAt: counting.updated_at
      }));
    } catch (error) {
      handleSupabaseError(error, 'getCountings');
      return [];
    }
  }

  async saveCounting(counting: Counting): Promise<void> {
    try {
      const { error } = await supabase
        .from(TABLES.COUNTINGS)
        .upsert({
          id: counting.id,
          internal_id: counting.internalId,
          name: counting.name,
          description: counting.description,
          status: counting.status,
          type: counting.type,
          sector_id: counting.sectorId,
          created_by: counting.createdBy,
          share_link: counting.shareLink,
          company_id: counting.companyId,
          created_at: counting.createdAt,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
    } catch (error) {
      handleSupabaseError(error, 'saveCounting');
    }
  }

  async deleteCounting(id: string, companyId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(TABLES.COUNTINGS)
        .delete()
        .eq('id', id)
        .eq('company_id', companyId);
      
      if (error) throw error;
    } catch (error) {
      handleSupabaseError(error, 'deleteCounting');
    }
  }

  async getCountingByShareLink(shareLink: string): Promise<Counting | null> {
    try {
      const { data, error } = await supabase
        .from(TABLES.COUNTINGS)
        .select('*')
        .eq('share_link', shareLink)
        .single();
      
      if (error) throw error;
      if (!data) return null;
      
      return {
        id: data.id,
        internalId: data.internal_id,
        name: data.name,
        description: data.description,
        status: data.status,
        type: data.type,
        sectorId: data.sector_id,
        createdBy: data.created_by,
        shareLink: data.share_link,
        companyId: data.company_id,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      handleSupabaseError(error, 'getCountingByShareLink');
      return null;
    }
  }

  // Task methods - FIXED: Add proper table name
  async getTasks(companyId: string): Promise<Task[]> {
    try {
      const { data, error } = await supabase
        .from('app_0bcfd220f3_tasks')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assignedTo: task.assigned_to,
        companyId: task.company_id,
        dueDate: task.due_date,
        createdAt: task.created_at,
        updatedAt: task.updated_at
      }));
    } catch (error) {
      handleSupabaseError(error, 'getTasks');
      return [];
    }
  }

  async saveTask(task: Task): Promise<void> {
    try {
      const { error } = await supabase
        .from('app_0bcfd220f3_tasks')
        .upsert({
          id: task.id,
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          assigned_to: task.assignedTo,
          company_id: task.companyId,
          due_date: task.dueDate,
          created_at: task.createdAt,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
    } catch (error) {
      handleSupabaseError(error, 'saveTask');
    }
  }

  async deleteTask(id: string, companyId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('app_0bcfd220f3_tasks')
        .delete()
        .eq('id', id)
        .eq('company_id', companyId);
      
      if (error) throw error;
    } catch (error) {
      handleSupabaseError(error, 'deleteTask');
    }
  }

  // Message methods
  async getMessages(companyId: string): Promise<Message[]> {
    try {
      const { data, error } = await supabase
        .from(TABLES.MESSAGES)
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map(message => ({
        id: message.id,
        title: message.title,
        content: message.content,
        type: message.type,
        priority: message.priority,
        senderId: message.sender_id,
        companyId: message.company_id,
        createdAt: message.created_at,
        updatedAt: message.updated_at
      }));
    } catch (error) {
      handleSupabaseError(error, 'getMessages');
      return [];
    }
  }

  async saveMessage(message: Message): Promise<void> {
    try {
      const { error } = await supabase
        .from(TABLES.MESSAGES)
        .upsert({
          id: message.id,
          title: message.title,
          content: message.content,
          type: message.type,
          priority: message.priority,
          sender_id: message.senderId,
          company_id: message.companyId,
          created_at: message.createdAt,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
    } catch (error) {
      handleSupabaseError(error, 'saveMessage');
    }
  }

  async deleteMessage(id: string, companyId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(TABLES.MESSAGES)
        .delete()
        .eq('id', id)
        .eq('company_id', companyId);
      
      if (error) throw error;
    } catch (error) {
      handleSupabaseError(error, 'deleteMessage');
    }
  }

  // Notification methods
  async getNotifications(companyId: string, userId?: string): Promise<Notification[]> {
    try {
      let query = supabase
        .from(TABLES.NOTIFICATIONS)
        .select('*')
        .eq('company_id', companyId);
      
      if (userId) {
        query = query.eq('user_id', userId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map(notification => ({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        userId: notification.user_id,
        companyId: notification.company_id,
        read: notification.read,
        readAt: notification.read_at,
        createdAt: notification.created_at,
        updatedAt: notification.updated_at
      }));
    } catch (error) {
      handleSupabaseError(error, 'getNotifications');
      return [];
    }
  }

  async getUnreadNotifications(companyId: string, userId?: string): Promise<Notification[]> {
    try {
      let query = supabase
        .from(TABLES.NOTIFICATIONS)
        .select('*')
        .eq('company_id', companyId)
        .eq('read', false);
      
      if (userId) {
        query = query.eq('user_id', userId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map(notification => ({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        userId: notification.user_id,
        companyId: notification.company_id,
        read: notification.read,
        readAt: notification.read_at,
        createdAt: notification.created_at,
        updatedAt: notification.updated_at
      }));
    } catch (error) {
      handleSupabaseError(error, 'getUnreadNotifications');
      return [];
    }
  }

  async saveNotification(notification: Notification): Promise<void> {
    try {
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
          created_at: notification.createdAt,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
    } catch (error) {
      handleSupabaseError(error, 'saveNotification');
    }
  }

  async markNotificationAsRead(notificationId: string, companyId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(TABLES.NOTIFICATIONS)
        .update({
          read: true,
          read_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', notificationId)
        .eq('company_id', companyId);
      
      if (error) throw error;
    } catch (error) {
      handleSupabaseError(error, 'markNotificationAsRead');
    }
  }

  async markAllNotificationsAsRead(companyId: string, userId?: string): Promise<void> {
    try {
      let query = supabase
        .from(TABLES.NOTIFICATIONS)
        .update({
          read: true,
          read_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('company_id', companyId)
        .eq('read', false);
      
      if (userId) {
        query = query.eq('user_id', userId);
      }
      
      const { error } = await query;
      
      if (error) throw error;
    } catch (error) {
      handleSupabaseError(error, 'markAllNotificationsAsRead');
    }
  }

  async deleteNotification(notificationId: string, companyId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(TABLES.NOTIFICATIONS)
        .delete()
        .eq('id', notificationId)
        .eq('company_id', companyId);
      
      if (error) throw error;
    } catch (error) {
      handleSupabaseError(error, 'deleteNotification');
    }
  }
}

export const supabaseDb = new SupabaseDatabase();
export const supabaseDatabase = supabaseDb;
// Also export the class for direct instantiation if needed
export { SupabaseDatabase };