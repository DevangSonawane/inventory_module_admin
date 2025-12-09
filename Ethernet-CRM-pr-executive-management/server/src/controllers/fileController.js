import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import InwardEntry from '../models/InwardEntry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Download document/file
 */
export const downloadDocument = async (req, res, next) => {
  try {
    const { filename } = req.params;

    if (!filename) {
      return res.status(400).json({
        success: false,
        message: 'Filename is required',
      });
    }

    // Construct file path - documents are stored in uploads/inward
    const filePath = path.join(__dirname, '../../uploads/inward', filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }

    // Send file
    res.download(filePath, filename, (err) => {
      if (err) {
        console.error('Error downloading file:', err);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Error downloading file',
          });
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete document
 */
export const deleteDocument = async (req, res, next) => {
  try {
    const { filename } = req.params;

    if (!filename) {
      return res.status(400).json({
        success: false,
        message: 'Filename is required',
      });
    }

    const filePath = path.join(__dirname, '../../uploads/inward', filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }

    // Delete file
    fs.unlinkSync(filePath);

    // Also remove from any inward entries that reference it
    const inwardEntries = await InwardEntry.findAll({
      where: {
        is_active: true,
      },
    });

    for (const entry of inwardEntries) {
      if (entry.documents && Array.isArray(entry.documents)) {
        const updatedDocuments = entry.documents.filter(
          doc => doc !== filename && !doc.includes(filename)
        );
        if (updatedDocuments.length !== entry.documents.length) {
          await entry.update({ documents: updatedDocuments });
        }
      }
    }

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add documents to existing inward entry
 */
export const addDocumentsToInward = async (req, res, next) => {
  try {
    const { inwardId } = req.params;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded',
      });
    }

    const inward = await InwardEntry.findByPk(inwardId);

    if (!inward) {
      return res.status(404).json({
        success: false,
        message: 'Inward entry not found',
      });
    }

    // Get existing documents
    const existingDocuments = inward.documents && Array.isArray(inward.documents) 
      ? inward.documents 
      : [];

    // Add new file paths
    const newDocuments = files.map(file => `/uploads/inward/${file.filename}`);
    const updatedDocuments = [...existingDocuments, ...newDocuments];

    await inward.update({ documents: updatedDocuments });

    res.status(200).json({
      success: true,
      message: 'Documents added successfully',
      data: {
        documents: updatedDocuments,
      },
    });
  } catch (error) {
    next(error);
  }
};













