import { Router } from 'express';
import { db } from '@db';
import { invoices, invoiceAttachments } from '@db/schema';
import { eq } from 'drizzle-orm';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

const router = Router();

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads', 'invoices');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common document and image types
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/gif'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

/**
 * @openapi
 * /invoices:
 *   post:
 *     summary: Create a new invoice with attachments
 *     tags:
 *       - Invoices
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               vendorId:
 *                 type: string
 *               customerId:
 *                 type: string
 *               issueDate:
 *                 type: string
 *                 format: date
 *               dueDate:
 *                 type: string
 *                 format: date
 *               totalAmount:
 *                 type: number
 *               notes:
 *                 type: string
 *               wastePointIds:
 *                 type: string
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Invoice created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Missing required fields or invalid data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *   get:
 *     summary: List invoices with attachments
 *     tags:
 *       - Invoices
 *     responses:
 *       200:
 *         description: List of invoices
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
// Create new invoice with attachments
router.post('/', upload.array('attachments'), async (req, res) => {
  try {
    console.log('Received invoice creation request:', {
      body: req.body,
      files: req.files
    });

    const {
      vendorId,
      customerId,
      issueDate,
      dueDate,
      totalAmount,
      notes,
      wastePointIds
    } = req.body;

    console.log('Parsed request data:', {
      vendorId,
      customerId,
      issueDate,
      dueDate,
      totalAmount,
      notes,
      wastePointIds
    });

    // Validate required fields
    if (!vendorId || !issueDate || !dueDate || !totalAmount) {
      console.log('Missing required fields:', { vendorId, issueDate, dueDate, totalAmount });
      return res.status(400).json({ 
        message: 'Missing required fields: vendorId, issueDate, dueDate, and totalAmount are required' 
      });
    }

    // Generate invoice number (simple implementation)
    const invoiceNumber = `INV-${Date.now()}`;

    // Parse wastePointIds if it's a string
    let parsedWastePoints: number[] = [];
    try {
      parsedWastePoints = typeof wastePointIds === 'string' 
        ? JSON.parse(wastePointIds) 
        : wastePointIds || [];
      console.log('Parsed waste points:', parsedWastePoints);
    } catch (error) {
      console.error('Error parsing wastePointIds:', error);
      return res.status(400).json({ 
        message: 'Invalid wastePointIds format' 
      });
    }

    // Validate dates
    const issueDateObj = new Date(issueDate);
    const dueDateObj = new Date(dueDate);
    
    console.log('Parsed dates:', {
      issueDate: issueDateObj,
      dueDate: dueDateObj
    });

    if (isNaN(issueDateObj.getTime()) || isNaN(dueDateObj.getTime())) {
      console.log('Invalid date format');
      return res.status(400).json({ 
        message: 'Invalid date format for issueDate or dueDate' 
      });
    }

    // Validate total amount
    const parsedAmount = parseFloat(totalAmount);
    console.log('Parsed amount:', parsedAmount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      console.log('Invalid total amount');
      return res.status(400).json({ 
        message: 'Invalid total amount' 
      });
    }

    // Validate vendor exists
    const vendor = await db.query.vendors.findFirst({
      where: (vendors, { eq }) => eq(vendors.id, parseInt(vendorId))
    });

    if (!vendor) {
      console.log('Vendor not found:', vendorId);
      return res.status(400).json({ 
        message: 'Invalid vendor ID' 
      });
    }

    console.log('Attempting to create invoice with data:', {
      invoiceNumber,
      vendorId: parseInt(vendorId),
      customerName: customerId || null,
      issueDate: issueDateObj,
      dueDate: dueDateObj,
      totalAmount: parsedAmount.toString(),
      status: 'pending',
      notes: notes || null,
      wastePoints: parsedWastePoints
    });

    const [invoice] = await db.insert(invoices).values({
      invoiceNumber,
      vendorId: parseInt(vendorId),
      customerName: customerId || null,
      issueDate: issueDateObj,
      dueDate: dueDateObj,
      totalAmount: parsedAmount.toString(),
      status: 'pending',
      notes: notes || null,
      wastePoints: parsedWastePoints
    }).returning();

    console.log('Successfully created invoice:', invoice);

    // Handle file attachments
    if (req.files && Array.isArray(req.files)) {
      console.log('Processing attachments:', req.files);
      const attachments = req.files.map((file: Express.Multer.File) => ({
        invoiceId: invoice.id,
        fileName: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
        fileUrl: `/uploads/invoices/${file.filename}`,
        uploadedBy: req.user?.id || null // Make uploadedBy optional
      }));

      console.log('Inserting attachments:', attachments);
      try {
        await db.insert(invoiceAttachments).values(attachments);
        console.log('Successfully inserted attachments');
      } catch (error: any) {
        console.error('Failed to insert attachments:', error);
        // Don't fail the whole request if attachments fail
        // Just log the error and continue
      }
    }

    // Return the invoice with its attachments
    const createdInvoice = await db.query.invoices.findFirst({
      where: (invoices, { eq }) => eq(invoices.id, invoice.id),
      with: {
        attachments: true
      }
    });

    res.json(createdInvoice);
  } catch (error: any) {
    console.error('Failed to create invoice. Full error:', error);
    console.error('Error stack:', error.stack);
    
    // Handle specific database errors
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ 
        message: 'An invoice with this number already exists' 
      });
    }
    
    if (error.code === '23503') { // Foreign key violation
      return res.status(400).json({ 
        message: 'Invalid vendor ID or customer ID' 
      });
    }

    res.status(500).json({ 
      message: 'Failed to create invoice',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// List invoices with attachments
router.get('/', async (req, res) => {
  try {
    console.log('Fetching invoices...');
    
    const allInvoices = await db.query.invoices.findMany({
      with: {
        vendor: true,
        attachments: true
      }
    });

    console.log('Found invoices:', allInvoices.length);

    // Transform the response to include vendor name and ensure totalAmount is a number
    const transformedInvoices = allInvoices.map(invoice => {
      // Ensure totalAmount is a number
      let totalAmount = 0;
      if (typeof invoice.totalAmount === 'string') {
        const parsed = parseFloat(invoice.totalAmount);
        if (!isNaN(parsed)) {
          totalAmount = parsed;
        } else {
          console.warn(`Invalid totalAmount for invoice ${invoice.id}:`, invoice.totalAmount);
        }
      } else if (typeof invoice.totalAmount === 'number') {
        totalAmount = invoice.totalAmount;
      }

      return {
        ...invoice,
        vendorName: invoice.vendor?.name || 'Unknown Vendor',
        totalAmount
      };
    });

    console.log('Transformed invoices:', transformedInvoices.length);
    res.json(transformedInvoices);
  } catch (error: any) {
    console.error('Failed to fetch invoices. Full error:', error);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({ 
      message: 'Failed to fetch invoices',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update invoice status
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const [updatedInvoice] = await db
      .update(invoices)
      .set({ status })
      .where(eq(invoices.id, parseInt(id)))
      .returning();

    if (!updatedInvoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.json(updatedInvoice);
  } catch (error) {
    console.error('Failed to update invoice:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Failed to update invoice' 
    });
  }
});

// Update invoice
router.put('/:id', upload.array('attachments'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      vendorId,
      customerId,
      issueDate,
      dueDate,
      totalAmount,
      notes,
      wastePointIds
    } = req.body;

    console.log('Received invoice update request:', {
      id,
      body: req.body,
      files: req.files
    });

    // Validate required fields
    if (!vendorId || !issueDate || !dueDate || !totalAmount) {
      console.log('Missing required fields:', { vendorId, issueDate, dueDate, totalAmount });
      return res.status(400).json({ 
        message: 'Missing required fields: vendorId, issueDate, dueDate, and totalAmount are required' 
      });
    }

    // Parse wastePointIds if it's a string
    let parsedWastePoints: number[] = [];
    try {
      parsedWastePoints = typeof wastePointIds === 'string' 
        ? JSON.parse(wastePointIds) 
        : wastePointIds || [];
      console.log('Parsed waste points:', parsedWastePoints);
    } catch (error) {
      console.error('Error parsing wastePointIds:', error);
      return res.status(400).json({ 
        message: 'Invalid wastePointIds format' 
      });
    }

    // Validate dates
    const issueDateObj = new Date(issueDate);
    const dueDateObj = new Date(dueDate);
    
    if (isNaN(issueDateObj.getTime()) || isNaN(dueDateObj.getTime())) {
      console.log('Invalid date format');
      return res.status(400).json({ 
        message: 'Invalid date format for issueDate or dueDate' 
      });
    }

    // Validate total amount
    const parsedAmount = parseFloat(totalAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      console.log('Invalid total amount');
      return res.status(400).json({ 
        message: 'Invalid total amount' 
      });
    }

    // Validate vendor exists
    const vendor = await db.query.vendors.findFirst({
      where: (vendors, { eq }) => eq(vendors.id, parseInt(vendorId))
    });

    if (!vendor) {
      console.log('Vendor not found:', vendorId);
      return res.status(400).json({ 
        message: 'Invalid vendor ID' 
      });
    }

    // Update the invoice
    const [updatedInvoice] = await db
      .update(invoices)
      .set({
        vendorId: parseInt(vendorId),
        customerName: customerId || null,
        issueDate: issueDateObj,
        dueDate: dueDateObj,
        totalAmount: parsedAmount.toString(),
        notes: notes || null,
        wastePoints: parsedWastePoints,
        updatedAt: new Date()
      })
      .where(eq(invoices.id, parseInt(id)))
      .returning();

    if (!updatedInvoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Handle file attachments
    if (req.files && Array.isArray(req.files)) {
      console.log('Processing attachments:', req.files);
      const attachments = req.files.map((file: Express.Multer.File) => ({
        invoiceId: updatedInvoice.id,
        fileName: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
        fileUrl: `/uploads/invoices/${file.filename}`,
        uploadedBy: req.user?.id || null
      }));

      try {
        await db.insert(invoiceAttachments).values(attachments);
        console.log('Successfully inserted attachments');
      } catch (error: any) {
        console.error('Failed to insert attachments:', error);
        // Don't fail the whole request if attachments fail
      }
    }

    // Return the updated invoice with its attachments
    const finalInvoice = await db.query.invoices.findFirst({
      where: (invoices, { eq }) => eq(invoices.id, updatedInvoice.id),
      with: {
        vendor: true,
        attachments: true
      }
    });

    res.json(finalInvoice);
  } catch (error: any) {
    console.error('Failed to update invoice. Full error:', error);
    console.error('Error stack:', error.stack);
    
    // Handle specific database errors
    if (error.code === '23503') { // Foreign key violation
      return res.status(400).json({ 
        message: 'Invalid vendor ID or customer ID' 
      });
    }

    res.status(500).json({ 
      message: 'Failed to update invoice',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;