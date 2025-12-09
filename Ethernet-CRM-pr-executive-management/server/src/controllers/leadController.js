// controllers/expenseController.js
import Expense from '../models/Expense.js';
import Survey from '../models/Survey.js';
import path from 'path'
import Role from '../models/Role.js'
import User from '../models/User.js'
import Module from '../models/Module.js'
import Lead from '../models/Lead.js';
import CustomerDetails from '../models/CustomerDetails.js';
import GIS from '../models/GIS.js';
import LeadKyc from '../models/LeadKyc.js';
import fs from 'fs'
import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import { Op, Sequelize } from 'sequelize';
import { leadStatus, gisStatus } from '../utils/leadHelpers.js';

// Add Expense
export const addExpense = async (req, res) => {
  try {
    const { user, category, amount, distanceTravelled } = req.body;
    const billImages = req.files.map(file => {
      const filePath = path.join(file.destination, file.filename);
      const fileData = fs.readFileSync(filePath);
      const base64 = `data:${file.mimetype};base64,${fileData.toString('base64')}`;
      return base64;
    });
    // ✅ Delete files after reading
    req.files.forEach(file => {
      fs.unlink(file.path, err => {
        if (err) console.error(`Failed to delete file ${file.path}:`, err);
      });
    });
    if (category === 'Food') {
      if (distanceTravelled < 30) {
        const hour = new Date().getHours();
        if (hour >= 21) {
          return res.status(400).json({ message: 'Less than 30 Km travelled, bill rejected.' });
        }
        return res.status(400).json({ message: 'Food expense allowed only if distance travelled > 30 km' });
      }
      if (amount > 120) return res.status(400).json({ message: 'Max amount for food is Rs. 120' });
    }
    // user is already a JSON string from the frontend (e.g., '{"employeCode":"ABC123","name":"John"}')
    // Check if it's already a valid JSON string - if so, store it directly without stringifying again
    let userToStore = user;
    if (typeof user === 'string') {
      // Try to parse it to see if it's already valid JSON
      try {
        JSON.parse(user); // If this succeeds, it's already valid JSON
        userToStore = user; // Store as-is
      } catch (e) {
        // If parsing fails, it might be a plain string, so stringify it
        userToStore = JSON.stringify(user);
      }
    } else {
      // If it's an object, stringify it
      userToStore = JSON.stringify(user);
    }
    
    const expense = await Expense.create({
      category, 
      amount, 
      distanceTravelled, 
      billImages: JSON.stringify(billImages), 
      user: userToStore
    });

    res.json({ message: 'Expense added', expense });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Issue in adding Expense- ' + err });
  }
};

// Get Expenses (paginated + optional employeCode filter)
export const getExpenses = async (req, res) => {
  try {
    const { employeCode, page = 1, limit = 10 } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause - if employeCode is provided, filter by it in the user JSON field
    // The user field is stored as TEXT containing JSON string: {"employeCode":"ABC123","name":"John"}
    // But it might be double-stringified with escaped quotes: "{\"employeCode\":\"ABC123\",\"name\":\"John\"}"
    let whereClause = {};
    if (employeCode) {
      console.log('Filtering expenses by employeCode:', employeCode);
      
      // Use LIKE to search for employeCode in the JSON string
      // Try multiple patterns to handle both escaped and unescaped quotes
      // Pattern 1: "employeCode":"VALUE" (unescaped quotes - normal JSON string)
      // Pattern 2: \"employeCode\":\"VALUE\" (escaped quotes - double-stringified)
      whereClause = {
        [Op.or]: [
          { user: { [Op.like]: `%"employeCode":"${employeCode}"%` } }, // Normal JSON
          { user: { [Op.like]: `%\\"employeCode\\":\\"${employeCode}\\"%` } }, // Escaped quotes
          { user: { [Op.like]: `%"employeCode": "${employeCode}"%` } }, // With space
        ]
      };
    }

    // Get both data and total count
    const { rows: expenses, count: total } = await Expense.findAndCountAll({
      where: whereClause,
      order: [['date', 'DESC']],
      offset,
      limit: parseInt(limit)
    });

    console.log(`Found ${expenses.length} expenses (total: ${total}) for employeCode: ${employeCode || 'all'}`);
    if (expenses.length > 0) {
      console.log('Sample expense user field:', expenses[0].user);
    }

    res.json({
      expenses,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (err) {
    console.error('Error in getExpenses:', err);
    res.status(500).json({ message: 'Error in fetching - ' + err.message });
  }
};


// Get Expenses (all or by employeCode)
export const getSurvey = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { rows, count: total } = await Survey.findAndCountAll({
      order: [['createdAt', 'DESC']],
      offset,
      limit: parseInt(limit)
    });

    res.json({
      survey: rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Error fetching surveys', error });
  }

}

export const getSurveyById = async (req, res) => {
  try {
    const { id } = req.params;
    const survey = await Survey.findByPk(id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'employeCode', 'phoneNumber', 'email'] }
      ]
    });

    if (!survey) {
      return res.status(404).json({ message: 'Survey not found' });
    }

    res.json(survey);
  } catch (error) {
    console.error('Error fetching survey by id:', error);
    res.status(500).json({ message: 'Error fetching survey', error });
  }
}

export const addSurvey = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        message: 'User authentication required',
        debug: {
          hasReqUser: !!req.user,
          userId: req.user?.id
        }
      });
    }

    const {
      id,
      likedFeatures,
      latitude,
      longitude,
      ...restOfBody
    } = req.body;

    const surveyData = {
      ...restOfBody,
      userId: req.user.id, // Extract userId from authenticated user
      // Convert likedFeatures array to string if it's an array
      likedFeatures: Array.isArray(likedFeatures)
        ? JSON.stringify(likedFeatures)
        : likedFeatures,
      latitude:
        latitude === undefined || latitude === null || latitude === ''
          ? null
          : parseFloat(latitude),
      longitude:
        longitude === undefined || longitude === null || longitude === ''
          ? null
          : parseFloat(longitude)
    };

    let survey;
    let isUpdate = false;

    // If id exists in payload, update existing survey
    if (id) {
      survey = await Survey.findByPk(id);
      if (!survey) {
        return res.status(404).json({ message: 'Survey not found' });
      }

      // Update the survey
      await survey.update(surveyData);
      await survey.reload(); // Reload to get updated data
      isUpdate = true;
    } else {
      // Create new survey
      survey = await Survey.create(surveyData);
    }

    // Calculate survey counts and payout (only for new surveys or if needed for updates)
    const userId = req.user.id;
    const payoutPerSurvey = 0.30; // Rs. 0.30 per survey

    // Get current date ranges
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // Count surveys for today
    const surveysToday = await Survey.count({
      where: {
        userId: userId,
        createdAt: {
          [Op.gte]: todayStart,
          [Op.lt]: todayEnd
        }
      }
    });

    // Count surveys for this month
    const surveysThisMonth = await Survey.count({
      where: {
        userId: userId,
        createdAt: {
          [Op.gte]: monthStart,
          [Op.lt]: monthEnd
        }
      }
    });

    // Calculate payouts
    const payoutToday = (surveysToday * payoutPerSurvey).toFixed(2);
    const payoutThisMonth = (surveysThisMonth * payoutPerSurvey).toFixed(2);

    res.status(isUpdate ? 200 : 201).json({
      message: isUpdate ? 'Survey updated successfully' : 'Survey saved successfully',
      survey,
      stats: {
        surveysToday,
        surveysThisMonth,
        payoutToday: parseFloat(payoutToday),
        payoutThisMonth: parseFloat(payoutThisMonth),
        payoutPerSurvey
      }
    });
  } catch (error) {
    console.error('Error in addSurvey:', error);
    res.status(500).json({ message: 'Error saving survey', error });
  }
}
export const getSummary = async (req, res) => {
  try {
    const surveys = await Survey.findAll();
    const totalResponses = surveys.length;

    const ratings = { Excellent: 0, Good: 0, Average: 0, Poor: 0 };
    const heardFrom = {};
    const likedFeaturesCount = {};

    surveys.forEach(s => {
      ratings[s.serviceRating] = (ratings[s.serviceRating] || 0) + 1;
      heardFrom[s.heardFrom] = (heardFrom[s.heardFrom] || 0) + 1;
      const feature = s.likedFeatures?.replaceAll("]", "")?.replaceAll("[", "")?.split(",") || []
      if (Array.isArray(feature)) {
        console.log(feature, "<feature")
        feature.forEach(k => {
          const f = k?.replaceAll("'", "")
          likedFeaturesCount[f] = (likedFeaturesCount[f] || 0) + 1;
        });
      }
    });

    // Get top 5 payout users
    const payoutPerSurvey = 0.30;
    const topPayoutUsers = await Survey.findAll({
      attributes: [
        'userId',
        [Survey.sequelize.fn('COUNT', Survey.sequelize.col('user_id')), 'surveyCount']
      ],
      where: {
        userId: { [Op.ne]: null }
      },
      group: ['user_id'],
      order: [[Survey.sequelize.fn('COUNT', Survey.sequelize.col('user_id')), 'DESC']],
      limit: 5,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'employeCode', 'phoneNumber']
      }],
      raw: false
    });

    // Format top payout users with calculated payout
    const formattedTopUsers = topPayoutUsers.map(record => {
      const surveyCount = record.dataValues.surveyCount;
      const payout = (surveyCount * payoutPerSurvey).toFixed(2);

      return {
        userId: record.userId,
        name: record.user?.name || 'Unknown',
        employeCode: record.user?.employeCode || null,
        phoneNumber: record.user?.phoneNumber || null,
        surveyCount: parseInt(surveyCount),
        payout: parseFloat(payout)
      };
    });

    res.json({
      totalResponses,
      ratings,
      heardFrom,
      likedFeaturesCount,
      topPayoutUsers: formattedTopUsers
    });
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({ message: 'Error fetching summary', error });
  }
}
// Approve or Reject Expense
export const approveExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'Approved' or 'Rejected'
    if (!['Approved', 'Rejected'].includes(status))
      return res.status(400).json({ message: 'Invalid status' });

    const expense = await Expense.findByPk(id);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });

    expense.status = status;
    await expense.save();

    res.json({ message: 'Expense updated', expense });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' + err });
  }
};

export const postExecutiveManagement = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { id } = req.params; // if present, means update
    const { name, employeCode, phoneNumber, email, password, roleId, moduleIds, isActive } = req.body;

    // Check role
    const role = await Role.findByPk(roleId);
    if (!role) return res.status(404).json({ message: 'Role not found' });

    let user;

    if (id) {
      // ✏️ UPDATE
      user = await User.findByPk(id);
      if (!user) return res.status(404).json({ message: 'User not found' });

      const updateData = { name, employeCode, phoneNumber, email, password, role_id: roleId };
      // Allow updating isActive if provided
      if (isActive !== undefined) {
        updateData.isActive = isActive;
      }

      await user.update(updateData);

      // Update modules if provided
      if (moduleIds && moduleIds.length) {
        const modules = await Module.findAll({ where: { id: moduleIds } });
        if (modules.length !== moduleIds.length) {
          return res.status(404).json({ message: 'Some modules not found' });
        }
        await user.setModules(modules);
      }
    } else {
      // 🆕 CREATE
      user = await User.create({
        name,
        employeCode,
        phoneNumber,
        email,
        password,
        role_id: roleId,
        isActive: isActive !== undefined ? isActive : true // Default to true for new users
      });

      if (moduleIds && moduleIds.length) {
        const modules = await Module.findAll({ where: { id: moduleIds } });
        if (modules.length !== moduleIds.length) {
          return res.status(404).json({ message: 'Some modules not found' });
        }
        await user.setModules(modules);
      }
    }

    const userData = await User.findByPk(user.id, {
      include: [
        { model: Role, attributes: ['id', 'name'] },
        { model: Module, attributes: ['id', 'name'], through: { attributes: [] } }
      ]
    });

    res.status(id ? 200 : 201).json(userData);
  } catch (err) {
    console.error(err);

    // Handle duplicate entry errors
    if (err.name === 'SequelizeUniqueConstraintError') {
      const field = err.fields;
      let message = 'User already exists with this ';

      if (field.phone_number) {
        message += 'phone number';
      } else if (field.email) {
        message += 'email';
      } else if (field.employee_code) {
        message += 'employee code';
      } else {
        message = 'User already exists';
      }

      return res.status(409).json({
        success: false,
        message,
        field
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// 🗑️ Delete Executive Management (Soft Delete - sets isActive to false)
export const deleteExecutiveManagement = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Set isActive to false instead of destroying the user
    await user.update({ isActive: false });
    res.json({ message: 'User deactivated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

export async function resetPassword(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const userId = req.params.id;
  const { oldPassword, newPassword } = req.body;

  try {
    // Sequelize method to find user by primary key
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ message: 'Cannot reset password for inactive user' });
    }

    // Compare old password with hashed password in DB
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Old password is incorrect' });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password and save
    user.password = hashedPassword;
    await user.save();

    return res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

export const getExecutiveManagement = async (req, res) => {
  try {
    const users = await User.findAll({
      where: { isActive: true }, // Only return active users
      order: [['createdAt', 'DESC']],
      include: [
        { model: Role, attributes: ['id', 'name'] },
        { model: Module, attributes: ['id', 'name'], through: { attributes: [] } }
      ]
    });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
}
export const getEMById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      include: [
        { model: Role, attributes: ['id', 'name'] },
        { model: Module, attributes: ['id', 'name'], through: { attributes: [] } }
      ]
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
}

// Create or Update Lead
export const createLead = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    const {
      id,
      name,
      phone_number,
      address,
      source,
      sales_executive,
      service_type
    } = req.body;

    // Get sales_executive from token (authenticated user) or from request body if provided
    const salesExecutiveId = sales_executive || req.user.id;

    // Validate required fields
    if (!name || !phone_number || !address || !source || !service_type) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, phone_number, address, source, service_type are required'
      });
    }

    // Validate service_type enum
    const validServiceTypes = ['SME', 'BROADBAND', 'LEASEDLINE'];
    if (!validServiceTypes.includes(service_type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid service_type. Must be one of: ${validServiceTypes.join(', ')}`
      });
    }

    // Verify sales_executive (user) exists
    const salesExecutive = await User.findByPk(salesExecutiveId);
    if (!salesExecutive) {
      return res.status(404).json({
        success: false,
        message: 'Sales executive (user) not found'
      });
    }

    // Check for duplicate phone number
    if (id) {
      // For updates: check if another lead (with different id) has the same phone number
      const existingLead = await Lead.findOne({
        where: {
          phone_number: phone_number,
          id: { [Op.ne]: id } // Exclude the current lead being updated
        }
      });

      if (existingLead) {
        return res.status(409).json({
          success: false,
          message: 'A lead with this phone number already exists'
        });
      }
    } else {
      // For new leads: check if a lead with the same phone number already exists
      const existingLead = await Lead.findOne({
        where: { phone_number: phone_number }
      });

      if (existingLead) {
        return res.status(409).json({
          success: false,
          message: 'A lead with this phone number already exists'
        });
      }
    }

    let lead;
    let isUpdate = false;

    // If id is provided, update existing lead
    if (id) {
      lead = await Lead.findByPk(id);
      if (!lead) {
        return res.status(404).json({
          success: false,
          message: 'Lead not found'
        });
      }

      // Update lead - build update data
      const updateData = {
        name,
        phone_number,
        address,
        source,
        sales_executive: salesExecutiveId,
        service_type
      };
      
      // Only include org_id if it's explicitly provided
      if (req.body.org_id !== undefined && req.body.org_id !== null) {
        updateData.org_id = req.body.org_id;
      }

      await lead.update(updateData, {
        omitNull: true
      });

      await lead.reload(); // Reload to get updated data
      isUpdate = true;
    } else {
      // Create new lead - build data object conditionally
      // unique_id will be auto-generated by the database
      const leadData = {
        name,
        phone_number,
        address,
        source,
        sales_executive: salesExecutiveId,
        service_type,
        status: req.body.status || leadStatus.OPEN // Default to OPEN if not provided
      };

      // Only include unique_id if explicitly provided (for testing or special cases)
      if (req.body.unique_id !== undefined && req.body.unique_id !== null) {
        leadData.unique_id = req.body.unique_id;
      }


      // Only include org_id if it's explicitly provided in the request
      // Don't include it if not provided - let database handle it
      if (req.body.org_id !== undefined && req.body.org_id !== null) {
        leadData.org_id = req.body.org_id;
      }

      // Create lead - explicitly specify fields to exclude org_id if not provided
      const fieldsToInclude = Object.keys(leadData);
      lead = await Lead.create(leadData, {
        fields: fieldsToInclude
      });
    }

    // Fetch lead with sales executive details
    const leadWithDetails = await Lead.findByPk(lead.id, {
      include: [
        {
          model: User,
          as: 'salesExecutive',
          attributes: ['id', 'name', 'employeCode', 'phoneNumber', 'email']
        }
      ]
    });

    res.status(isUpdate ? 200 : 201).json({
      success: true,
      message: isUpdate ? 'Lead updated successfully' : 'Lead created successfully',
      data: leadWithDetails
    });
  } catch (err) {
    console.error('Error creating/updating lead:', err);
    res.status(500).json({
      success: false,
      message: 'Error creating/updating lead',
      error: err.message
    });
  }
};

// Get Lead by Unique ID
export const getLeadByUniqueId = async (req, res) => {
  try {
    const { unique_id } = req.params;

    if (!unique_id) {
      return res.status(400).json({
        success: false,
        message: 'Unique ID is required'
      });
    }

    const lead = await Lead.findOne({
      where: { unique_id },
      include: [
        {
          model: User,
          as: 'salesExecutive',
          attributes: ['id', 'name', 'employeCode', 'phoneNumber', 'email']
        },
        {
          model: CustomerDetails,
          as: 'customerDetails',
          required: false // Left join - include even if no customer details exist
        },
        {
          model: GIS,
          as: 'gisRecord',
          required: false, // Left join - include even if no GIS record exists
          include: [
            {
              model: User,
              as: 'gisStatusCapturedBy',
              attributes: ['id', 'name', 'employeCode', 'phoneNumber', 'email'],
              required: false
            }
          ]
        }
      ]
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found with the provided unique ID'
      });
    }

    res.status(200).json({
      success: true,
      data: lead
    });
  } catch (err) {
    console.error('Error fetching lead by unique ID:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching lead',
      error: err.message
    });
  }
};

// Get All Leads with Pagination
export const getAllLeads = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      service_type = '',
      sales_executive = '',
      source = '',
      status = '',
      gis_status = '',
      captured_by_me = '',
      assigned_to_me = '',
      all_assigned = ''
    } = req.query;

    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const limitNumber = Math.max(parseInt(limit, 10) || 10, 1);
    const offset = (pageNumber - 1) * limitNumber;

    // Get current user ID if authenticated
    const currentUserId = req.user?.id;

    // Build where clause
    const whereClause = {};

    // Search filter - searches in all relevant fields including related tables
    if (search) {
      const searchPattern = `%${search}%`;
      whereClause[Op.or] = [
        // Direct Lead fields
        { name: { [Op.like]: searchPattern } },
        { phone_number: { [Op.like]: searchPattern } },
        { address: { [Op.like]: searchPattern } },
        { source: { [Op.like]: searchPattern } },
        { unique_id: { [Op.like]: searchPattern } },
        { service_type: { [Op.like]: searchPattern } },
        { status: { [Op.like]: searchPattern } }
      ];
    }

    // Service type filter
    if (service_type && ['SME', 'BROADBAND', 'LEASEDLINE'].includes(service_type)) {
      whereClause.service_type = service_type;
    }

    // Source (lead type) filter
    if (source) {
      whereClause.source = source;
    }

    // Status filter
    if (status) {
      const validStatuses = Object.values(leadStatus);
      if (validStatuses.includes(status)) {
        whereClause.status = status;
      }
    }

    // Sales executive filter
    if (sales_executive) {
      whereClause.sales_executive = parseInt(sales_executive, 10);
    }

    // Captured by me / Assigned to me filter
    if (captured_by_me === 'true' || assigned_to_me === 'true') {
      if (currentUserId) {
        whereClause.sales_executive = currentUserId;
      } else {
        // If not authenticated, return empty results
        return res.status(200).json({
          success: true,
          data: {
            leads: [],
            pagination: {
              currentPage: pageNumber,
              totalPages: 0,
              totalItems: 0,
              itemsPerPage: limitNumber
            }
          }
        });
      }
    }

    // All assigned filter - leads that have a sales_executive assigned
    if (all_assigned === 'true') {
      whereClause.sales_executive = { [Op.ne]: null };
    }

    // Build sales executive include
    const salesExecutiveInclude = {
      model: User,
      as: 'salesExecutive',
      attributes: ['id', 'name', 'employeCode', 'phoneNumber', 'email'],
      required: false
    };

    // Build GIS include with optional status filter
    const gisInclude = {
      model: GIS,
      as: 'gisRecord',
      required: false, // Left join - include even if no GIS record exists
      include: [
        {
          model: User,
          as: 'gisStatusCapturedBy',
          attributes: ['id', 'name', 'employeCode', 'phoneNumber', 'email'],
          required: false
        }
      ]
    };

    // GIS status filter - filter by GIS record status
    if (gis_status) {
      const validGisStatuses = Object.values(gisStatus);
      if (validGisStatuses.includes(gis_status)) {
        gisInclude.where = { status: gis_status };
      }
    }

    // Prepare replacements for Sequelize.literal if search is used
    const replacements = search ? { searchPattern: `%${search}%` } : {};

    // Get leads with pagination
    const { count, rows: leads } = await Lead.findAndCountAll({
      where: whereClause,
      limit: limitNumber,
      offset: offset,
      order: [['createdAt', 'DESC']],
      include: [
        salesExecutiveInclude,
        gisInclude
      ],
      distinct: true,
      replacements: replacements
    });

    // Filter results based on search in related tables and GIS status
    let filteredLeads = leads;
    let finalCount = count;
    
    // If search is provided, also filter by related table fields
    if (search) {
      const searchLower = search.toLowerCase();
      filteredLeads = leads.filter(lead => {
        // Check direct Lead fields (already filtered by whereClause, but double-check)
        const matchesDirect = 
          (lead.name && lead.name.toLowerCase().includes(searchLower)) ||
          (lead.phone_number && lead.phone_number.includes(search)) ||
          (lead.address && lead.address.toLowerCase().includes(searchLower)) ||
          (lead.source && lead.source.toLowerCase().includes(searchLower)) ||
          (lead.unique_id && lead.unique_id.toLowerCase().includes(searchLower)) ||
          (lead.service_type && lead.service_type.toLowerCase().includes(searchLower)) ||
          (lead.status && lead.status.toLowerCase().includes(searchLower));
        
        // Check sales executive fields
        const matchesSalesExecutive = lead.salesExecutive && (
          (lead.salesExecutive.name && lead.salesExecutive.name.toLowerCase().includes(searchLower)) ||
          (lead.salesExecutive.employeCode && lead.salesExecutive.employeCode.toLowerCase().includes(searchLower)) ||
          (lead.salesExecutive.phoneNumber && lead.salesExecutive.phoneNumber.includes(search)) ||
          (lead.salesExecutive.email && lead.salesExecutive.email.toLowerCase().includes(searchLower))
        );
        
        // Check GIS fields
        const matchesGIS = lead.gisRecord && (
          (lead.gisRecord.status && lead.gisRecord.status.toLowerCase().includes(searchLower)) ||
          (lead.gisRecord.optical_type && lead.gisRecord.optical_type.toLowerCase().includes(searchLower)) ||
          (lead.gisRecord.remark && lead.gisRecord.remark.toLowerCase().includes(searchLower)) ||
          (lead.gisRecord.distance && String(lead.gisRecord.distance).includes(search))
        );
        
        return matchesDirect || matchesSalesExecutive || matchesGIS;
      });
      finalCount = filteredLeads.length;
    } else if (gis_status) {
      // If only GIS status filter is applied
      const validGisStatuses = Object.values(gisStatus);
      if (validGisStatuses.includes(gis_status)) {
        filteredLeads = leads.filter(lead => {
          return lead.gisRecord && lead.gisRecord.status === gis_status;
        });
        finalCount = filteredLeads.length;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        leads: filteredLeads,
        pagination: {
          currentPage: pageNumber,
          totalPages: Math.ceil(finalCount / limitNumber),
          totalItems: finalCount,
          itemsPerPage: limitNumber
        }
      }
    });
  } catch (err) {
    console.error('Error fetching leads:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching leads',
      error: err.message
    });
  }
};

// Update Lead Status
export const updateLeadStatus = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    const { unique_id } = req.params; // Lead unique_id from URL
    const { status } = req.body;

    // Validate status is provided
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    // Validate status is a valid enum value
    const validStatuses = Object.values(leadStatus);
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Find lead by unique_id
    const lead = await Lead.findOne({ where: { unique_id } });
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    // Update status
    await lead.update({ status });

    // Reload to get updated data
    await lead.reload();

    // Fetch lead with sales executive details
    const leadWithDetails = await Lead.findByPk(lead.id, {
      include: [
        {
          model: User,
          as: 'salesExecutive',
          attributes: ['id', 'name', 'employeCode', 'phoneNumber', 'email']
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Lead status updated successfully',
      data: leadWithDetails
    });
  } catch (err) {
    console.error('Error updating lead status:', err);
    res.status(500).json({
      success: false,
      message: 'Error updating lead status',
      error: err.message
    });
  }
};

// Create or Update Customer Details
export const createOrUpdateCustomerDetails = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    const { unique_id } = req.params;
    const {
      id, // Customer details ID for update
      // Basic Details
      first_name,
      last_name,
      email,
      alternate_phone,
      date_of_birth,
      gender,
      // Contact Details
      contact_phone,
      contact_email,
      // Present Address
      present_address_line1,
      present_address_line2,
      present_city,
      present_state,
      present_pincode,
      present_country,
      // Payment Address
      payment_address_same_as_present,
      payment_address_line1,
      payment_address_line2,
      payment_city,
      payment_state,
      payment_pincode,
      payment_country,
      // Geo Location
      latitude,
      longitude,
      // Plan
      plan_id,
      // Requirements
      static_ip_required,
      telephone_line_required
    } = req.body;

    // Validate required fields
    if (!unique_id) {
      return res.status(400).json({
        success: false,
        message: 'Unique ID is required'
      });
    }

    if (!first_name) {
      return res.status(400).json({
        success: false,
        message: 'First name is required'
      });
    }

    // Verify lead exists by unique_id
    const lead = await Lead.findOne({
      where: { unique_id }
    });
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    const lead_id = lead.id;

    let customerDetails;
    let isUpdate = false;

    // If id is provided, find and update that specific customer details record
    if (id) {
      customerDetails = await CustomerDetails.findByPk(id);
      if (!customerDetails) {
        return res.status(404).json({
          success: false,
          message: 'Customer details not found with the provided ID'
        });
      }
      // Verify that the customer details belong to the lead specified by unique_id
      if (customerDetails.lead_id !== lead_id) {
        return res.status(400).json({
          success: false,
          message: 'Customer details ID does not match the lead unique_id'
        });
      }
      isUpdate = true;
    } else {
      // Check if customer details already exist for this lead
      customerDetails = await CustomerDetails.findOne({
        where: { lead_id }
      });
      if (customerDetails) {
        isUpdate = true;
      }
    }

    // Prepare data object
    const customerData = {
      lead_id: parseInt(lead_id),
      first_name,
      last_name: last_name || null,
      email: email || null,
      alternate_phone: alternate_phone || null,
      date_of_birth: date_of_birth || null,
      gender: gender || null,
      contact_phone: contact_phone || null,
      contact_email: contact_email || null,
      present_address_line1: present_address_line1 || null,
      present_address_line2: present_address_line2 || null,
      present_city: present_city || null,
      present_state: present_state || null,
      present_pincode: present_pincode || null,
      present_country: present_country || 'India',
      payment_address_same_as_present: payment_address_same_as_present !== undefined ? payment_address_same_as_present : false,
      payment_address_line1: payment_address_line1 || null,
      payment_address_line2: payment_address_line2 || null,
      payment_city: payment_city || null,
      payment_state: payment_state || null,
      payment_pincode: payment_pincode || null,
      payment_country: payment_country || 'India',
      latitude: latitude !== undefined && latitude !== null ? parseFloat(latitude) : null,
      longitude: longitude !== undefined && longitude !== null ? parseFloat(longitude) : null,
      plan_id: plan_id || null,
      static_ip_required: static_ip_required !== undefined ? static_ip_required : false,
      telephone_line_required: telephone_line_required !== undefined ? telephone_line_required : false
    };

    // If payment address is same as present address, copy present address to payment address
    if (customerData.payment_address_same_as_present) {
      customerData.payment_address_line1 = customerData.present_address_line1;
      customerData.payment_address_line2 = customerData.present_address_line2;
      customerData.payment_city = customerData.present_city;
      customerData.payment_state = customerData.present_state;
      customerData.payment_pincode = customerData.present_pincode;
      customerData.payment_country = customerData.present_country;
    }

    if (isUpdate) {
      // Update existing customer details
      await customerDetails.update(customerData);
      await customerDetails.reload();
    } else {
      // Create new customer details
      customerDetails = await CustomerDetails.create(customerData);
    }

    // Update lead status to CUSTOMER_DETAILS_CAPTURED
    await lead.update({ status: leadStatus.CUSTOMER_DETAILS_CAPTURED });

    // Fetch customer details with lead information
    const customerDetailsWithLead = await CustomerDetails.findByPk(customerDetails.id, {
      include: [
        {
          model: Lead,
          as: 'lead',
          include: [
            {
              model: User,
              as: 'salesExecutive',
              attributes: ['id', 'name', 'employeCode', 'phoneNumber', 'email']
            },
            {
              model: GIS,
              as: 'gisRecord',
              required: false, // Left join - include even if no GIS record exists
              include: [
                {
                  model: User,
                  as: 'gisStatusCapturedBy',
                  attributes: ['id', 'name', 'employeCode', 'phoneNumber', 'email'],
                  required: false
                }
              ]
            }
          ]
        }
      ]
    });

    res.status(isUpdate ? 200 : 201).json({
      success: true,
      message: isUpdate ? 'Customer details updated successfully' : 'Customer details created successfully',
      data: customerDetailsWithLead
    });
  } catch (err) {
    console.error('Error creating/updating customer details:', err);
    res.status(500).json({
      success: false,
      message: 'Error creating/updating customer details',
      error: err.message
    });
  }
};

// Get Customer Details by Lead ID
export const getCustomerDetailsByLeadId = async (req, res) => {
  try {
    const { unique_id } = req.params;

    if (!unique_id) {
      return res.status(400).json({
        success: false,
        message: 'Lead unique ID is required'
      });
    }

    // First, find the lead by unique_id
    const lead = await Lead.findOne({
      where: { unique_id },
      include: [
        {
          model: User,
          as: 'salesExecutive',
          attributes: ['id', 'name', 'employeCode', 'phoneNumber', 'email']
        }
      ]
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    // Then find customer details by lead_id
    const customerDetails = await CustomerDetails.findOne({
      where: { lead_id: lead.id },
      include: [
        {
          model: Lead,
          as: 'lead',
          include: [
            {
              model: User,
              as: 'salesExecutive',
              attributes: ['id', 'name', 'employeCode', 'phoneNumber', 'email']
            },
            {
              model: GIS,
              as: 'gisRecord',
              required: false, // Left join - include even if no GIS record exists
              include: [
                {
                  model: User,
                  as: 'gisStatusCapturedBy',
                  attributes: ['id', 'name', 'employeCode', 'phoneNumber', 'email'],
                  required: false
                }
              ]
            }
          ]
        }
      ]
    });

    if (!customerDetails) {
      return res.status(404).json({
        success: false,
        message: 'Customer details not found for this lead'
      });
    }

    res.status(200).json({
      success: true,
      data: customerDetails
    });
  } catch (err) {
    console.error('Error fetching customer details:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching customer details',
      error: err.message
    });
  }
};

// Send Customer Details Link
export const sendCustomerDetailsFrom = async (req, res) => {
  try {
    const { leadId } = req.params;

    if (!leadId) {
      return res.status(400).json({
        success: false,
        message: 'Lead ID is required'
      });
    }

    // Find the lead by ID to get the unique_id
    const lead = await Lead.findByPk(leadId);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    // Update lead status to LINK_SHARED if status is OPEN
    if (lead.status === leadStatus.OPEN) {
      await lead.update({ status: leadStatus.LINK_SHARED });
    }

    // Construct the link for status check page
    const link = `customer/details/${lead.unique_id}`;

    res.status(200).json({
      success: true,
      link: link,
      unique_id: lead.unique_id,
      lead_id: lead.id
    });
  } catch (err) {
    console.error('Error sending customer details link:', err);
    res.status(500).json({
      success: false,
      message: 'Error sending customer details link',
      error: err.message
    });
  }
};

// Update GIS Status
export const gisStatusChange = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    const {
      status,
      remark,
      lead_id, // This is the unique_id
      distance,
      optical_type
    } = req.body;

    // Validate required fields
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    if (!lead_id) {
      return res.status(400).json({
        success: false,
        message: 'Lead ID (unique_id) is required'
      });
    }

    // Validate status enum
    const validStatuses = Object.values(gisStatus);
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Verify lead exists by unique_id
    const lead = await Lead.findOne({
      where: { unique_id: lead_id }
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found with the provided unique_id'
      });
    }

    // Validate distance if provided (should be a number)
    let distanceValue = null;
    if (distance !== undefined && distance !== null && distance !== '') {
      distanceValue = parseFloat(distance);
      if (isNaN(distanceValue) || distanceValue < 0) {
        return res.status(400).json({
          success: false,
          message: 'Distance must be a valid positive number'
        });
      }
    }

    // Validate optical_type if provided
    if (optical_type && !['GPON', 'EPON', 'Media convertor'].includes(optical_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid optical type. Must be one of: GPON, EPON, Media convertor'
      });
    }

    // Check if GIS record already exists for this lead
    let gisRecord = await GIS.findOne({
      where: { lead_id: lead_id }
    });

    let isUpdate = false;
    
    // Prepare data object for GIS record
    const gisData = {
      status: status,
      distance: distanceValue,
      optical_type: optical_type || null,
      remark: remark || null
    };

    // If status is FEASIBLE, capture user and timestamp
    if (status === gisStatus.FEASIBLE) {
      gisData.gis_status_captured_by = req.user.id;
      gisData.gis_status_captured_at = new Date();
    } else {
      // If status is not FEASIBLE, clear the captured by fields
      gisData.gis_status_captured_by = null;
      gisData.gis_status_captured_at = null;
    }

    if (gisRecord) {
      // Update existing GIS record
      await gisRecord.update(gisData);
      await gisRecord.reload();
      isUpdate = true;
    } else {
      // Create new GIS record
      gisRecord = await GIS.create({
        lead_id: lead_id,
        ...gisData
      });
    }

    // Update lead status based on GIS status
    // If FEASIBLE → QUALIFIED, else → UNQUALIFIED
    const newLeadStatus = status === gisStatus.FEASIBLE 
      ? leadStatus.QUALIFIED 
      : leadStatus.UNQUALIFIED;
    
    await lead.update({ status: newLeadStatus });

    // Fetch the GIS record with lead information
    const gisRecordWithLead = await GIS.findByPk(gisRecord.id, {
      include: [
        {
          model: Lead,
          as: 'lead',
          include: [
            {
              model: User,
              as: 'salesExecutive',
              attributes: ['id', 'name', 'employeCode', 'phoneNumber', 'email']
            }
          ]
        },
        {
          model: User,
          as: 'gisStatusCapturedBy',
          attributes: ['id', 'name', 'employeCode', 'phoneNumber', 'email'],
          required: false
        }
      ]
    });

    res.status(isUpdate ? 200 : 201).json({
      success: true,
      message: isUpdate ? 'GIS status updated successfully' : 'GIS status created successfully',
      data: gisRecordWithLead
    });
  } catch (err) {
    console.error('Error updating GIS status:', err);
    res.status(500).json({
      success: false,
      message: 'Error updating GIS status',
      error: err.message
    });
  }
};

// Submit KYC
export const submitKyc = async (req, res) => {
  try {
    const { unique_id } = req.params;
    const {
      id_type,
      id_number,
      address_proof_type,
      address_proof_number,
      terms_accepted
    } = req.body;

    // Get files from multer
    const files = req.files || {};
    const idDocumentFile = files.id_document?.[0];
    const addressProofFile = files.address_proof_document?.[0];
    const signatureFile = files.signature?.[0];

    // Validate required fields
    if (!id_type || !id_number) {
      return res.status(400).json({
        success: false,
        message: 'ID type and ID number are required'
      });
    }

    if (!idDocumentFile) {
      return res.status(400).json({
        success: false,
        message: 'ID document file is required'
      });
    }

    if (!address_proof_type) {
      return res.status(400).json({
        success: false,
        message: 'Address proof type is required'
      });
    }

    if (!addressProofFile) {
      return res.status(400).json({
        success: false,
        message: 'Address proof document file is required'
      });
    }

    if (!signatureFile) {
      return res.status(400).json({
        success: false,
        message: 'Signature file is required'
      });
    }

    // Handle terms_accepted (can be string 'true'/'false' from FormData or boolean)
    const isTermsAccepted = terms_accepted === true || terms_accepted === 'true' || terms_accepted === '1';
    if (!isTermsAccepted) {
      return res.status(400).json({
        success: false,
        message: 'Terms and conditions must be accepted'
      });
    }

    // Convert files to base64
    const fileToBase64 = (buffer, mimetype) => {
      const base64 = buffer.toString('base64');
      return `data:${mimetype};base64,${base64}`;
    };

    const id_document = fileToBase64(idDocumentFile.buffer, idDocumentFile.mimetype);
    const address_proof_document = fileToBase64(addressProofFile.buffer, addressProofFile.mimetype);
    const signature = fileToBase64(signatureFile.buffer, signatureFile.mimetype);

    // Verify lead exists by unique_id
    const lead = await Lead.findOne({
      where: { unique_id }
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found with the provided unique_id'
      });
    }

    // Check if KYC already exists for this lead
    let kycRecord = await LeadKyc.findOne({
      where: { lead_id: unique_id }
    });

    let isUpdate = false;
    if (kycRecord) {
      // Update existing KYC record
      await kycRecord.update({
        id_type,
        id_number,
        id_document,
        address_proof_type,
        address_proof_number: address_proof_number || null,
        address_proof_document,
        signature,
        terms_accepted: isTermsAccepted
      });
      await kycRecord.reload();
      isUpdate = true;
    } else {
      // Create new KYC record
      kycRecord = await LeadKyc.create({
        lead_id: unique_id,
        id_type,
        id_number,
        id_document,
        address_proof_type,
        address_proof_number: address_proof_number || null,
        address_proof_document,
        signature,
        terms_accepted: isTermsAccepted
      });
    }

    // Update lead status to KYC_COMPLETED
    await lead.update({ status: leadStatus.KYC_UPDATED });

    // Fetch the KYC record with lead information
    const kycRecordWithLead = await LeadKyc.findByPk(kycRecord.id, {
      include: [
        {
          model: Lead,
          as: 'lead',
          include: [
            {
              model: User,
              as: 'salesExecutive',
              attributes: ['id', 'name', 'employeCode', 'phoneNumber', 'email']
            }
          ]
        }
      ]
    });

    res.status(isUpdate ? 200 : 201).json({
      success: true,
      message: isUpdate ? 'KYC information updated successfully' : 'KYC information submitted successfully',
      data: kycRecordWithLead
    });
  } catch (err) {
    console.error('Error submitting KYC:', err);
    res.status(500).json({
      success: false,
      message: 'Error submitting KYC information',
      error: err.message
    });
  }
};