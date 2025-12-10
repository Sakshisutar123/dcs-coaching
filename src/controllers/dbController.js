import User from '../models/User.js';
import { sequelize } from '../config/database.js';

// Database diagnostic endpoint
export const checkDatabase = async (req, res) => {
  try {
    // Test database connection
    await sequelize.authenticate();
    
    // Check if users table exists
    const [tableCheck] = await sequelize.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      ) as table_exists`
    );
    
    const tableExists = tableCheck[0]?.table_exists || false;
    
    let userCount = 0;
    let sampleUsers = [];
    let tableStructure = null;
    
    if (tableExists) {
      // Get user count
      userCount = await User.count();
      
      // Get sample users
      sampleUsers = await User.findAll({
        limit: 5,
        attributes: ['uniqueId', 'fullName', 'email', 'isRegistered'],
        raw: true
      });
      
      // Get table structure
      const [columns] = await sequelize.query(
        `SELECT column_name, data_type, is_nullable 
         FROM information_schema.columns 
         WHERE table_name = 'users' 
         ORDER BY ordinal_position`
      );
      tableStructure = columns;
    }
    
    res.json({
      status: 'connected',
      database: {
        connected: true,
        tableExists: tableExists,
        userCount: userCount,
        sampleUsers: sampleUsers,
        tableStructure: tableStructure
      },
      recommendations: !tableExists ? [
        'Run: CREATE TABLE users (...)',
        'Or set SYNC_DB=true in environment variables',
        'See migrations/check-and-fix-production.sql'
      ] : userCount === 0 ? [
        'Table exists but no users found',
        'Add a user: INSERT INTO users ("uniqueId", "fullName", email) VALUES (...)'
      ] : ['Database is ready']
    });
  } catch (err) {
    console.error('Database check error:', err);
    res.status(500).json({
      status: 'error',
      error: err.message,
      database: {
        connected: false
      }
    });
  }
};

