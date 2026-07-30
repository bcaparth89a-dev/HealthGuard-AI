import supabase from '../config/supabase.js';
import logger from '../utils/logger.js';

/**
 * Fetch all family members for the authenticated owner
 */
export const getFamilyMembers = async (req, res, next) => {
  try {
    const userId = req.user.id;
    logger.info(`Fetching family members for owner user ID: ${userId}`);

    const { data, error } = await supabase
      .from('family_members')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      logger.error('Failed to retrieve family members:', error.message);
      return res.status(500).json({ error: error.message });
    }

    return res.json(data || []);
  } catch (error) {
    next(error);
  }
};

/**
 * Add a new family member
 */
export const addFamilyMember = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      full_name,
      gender,
      age,
      dob,
      blood_group,
      relationship,
      phone,
      photo,
      height,
      weight,
      emergency_contact
    } = req.body;

    if (!full_name || !relationship || !gender) {
      return res.status(400).json({ error: 'Name, relationship, and gender are required.' });
    }

    logger.info(`Adding new family member: ${full_name} (${relationship}) for user ID: ${userId}`);

    const memberPayload = {
      user_id: userId,
      full_name,
      gender,
      age: parseInt(age, 10) || 0,
      dob: dob || null,
      blood_group: blood_group || null,
      relationship,
      phone: phone || null,
      photo: photo || null,
      height: height ? parseFloat(height) : null,
      weight: weight ? parseFloat(weight) : null,
      emergency_contact: emergency_contact || null
    };

    const { data, error } = await supabase
      .from('family_members')
      .insert([memberPayload])
      .select();

    if (error) {
      logger.error('Failed to create family member:', error.message);
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json(data[0]);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a family member from EMR
 */
export const deleteFamilyMember = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    logger.info(`Deleting family member: ${id} for owner user ID: ${userId}`);

    const { data, error } = await supabase
      .from('family_members')
      .delete()
      .eq('member_id', id)
      .eq('user_id', userId)
      .select();

    if (error) {
      logger.error('Failed to delete family member:', error.message);
      return res.status(500).json({ error: error.message });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Family member not found or unauthorized.' });
    }

    return res.json({ message: 'Family member successfully removed from EMR.', deleted: data[0] });
  } catch (error) {
    next(error);
  }
};
