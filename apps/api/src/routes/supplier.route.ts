import { Router } from 'express';
import { z } from 'zod';
import { prisma, SupplierStatus, type Prisma } from '@surveyos/db';
import { Role } from '@surveyos/db';
import { authMiddleware } from '../middleware/auth.middleware.js';

export const supplierRouter: Router = Router({ mergeParams: true });

const orgParamsSchema = z.object({
  organizationId: z.string().uuid('Invalid organization ID'),
});

const supplierParamsSchema = z.object({
  organizationId: z.string().uuid('Invalid organization ID'),
  supplierId: z.string().uuid('Invalid supplier ID'),
});

const createSupplierSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  contactName: z.string().max(255).optional().nullable(),
  email: z.string().email('Invalid email format').optional().nullable().or(z.literal('')),
  phone: z.string().max(50).optional().nullable(),
  website: z.string().url('Invalid URL format').optional().nullable().or(z.literal('')),
  status: z.nativeEnum(SupplierStatus).optional(),
  notes: z.string().optional().nullable(),
});

const listSuppliersQuerySchema = z.object({
  status: z.nativeEnum(SupplierStatus).optional(),
  search: z.string().optional(),
});

// Create Supplier
// eslint-disable-next-line @typescript-eslint/no-misused-promises
supplierRouter.post('/', authMiddleware, (req, res) => {
  void (async () => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const paramsResult = orgParamsSchema.safeParse(req.params);
      if (!paramsResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid path parameters',
          details: paramsResult.error.errors,
        });
      }

      const bodyResult = createSupplierSchema.safeParse(req.body);
      if (!bodyResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: bodyResult.error.errors,
        });
      }

      const { organizationId } = paramsResult.data;
      const { name, contactName, email, phone, website, status, notes } = bodyResult.data;
      const requestingUserId = req.user.id;

      const membership = await prisma.membership.findFirst({
        where: {
          organizationId,
          userId: requestingUserId,
        },
      });

      if (!membership) {
        return res.status(404).json({ success: false, error: 'Organization not found' });
      }

      if (membership.role === Role.MEMBER) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Insufficient permissions to create a supplier',
        });
      }

      const existingSupplier = await prisma.supplier.findUnique({
        where: {
          organizationId_name: {
            organizationId,
            name,
          },
        },
      });

      if (existingSupplier) {
        return res.status(409).json({
          success: false,
          error: 'A supplier with this name already exists in the organization',
        });
      }

      const supplier = await prisma.supplier.create({
        data: {
          organizationId,
          name,
          contactName: contactName || null,
          email: email || null,
          phone: phone || null,
          website: website || null,
          status: status ?? SupplierStatus.ACTIVE,
          notes: notes || null,
        },
      });

      return res.status(201).json({ success: true, data: supplier });
    } catch (error) {
      console.error('Error creating supplier:', error);
      return res.status(500).json({ success: false, error: 'An internal server error occurred' });
    }
  })();
});

// List Suppliers
// eslint-disable-next-line @typescript-eslint/no-misused-promises
supplierRouter.get('/', authMiddleware, (req, res) => {
  void (async () => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const paramsResult = orgParamsSchema.safeParse(req.params);
      if (!paramsResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid path parameters',
          details: paramsResult.error.errors,
        });
      }

      const queryResult = listSuppliersQuerySchema.safeParse(req.query);
      if (!queryResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          details: queryResult.error.errors,
        });
      }

      const { organizationId } = paramsResult.data;
      const { status, search } = queryResult.data;
      const requestingUserId = req.user.id;

      const membership = await prisma.membership.findFirst({
        where: {
          organizationId,
          userId: requestingUserId,
        },
      });

      if (!membership) {
        return res.status(404).json({ success: false, error: 'Organization not found' });
      }

      const whereClause: Prisma.SupplierWhereInput = {
        organizationId,
      };

      if (status) {
        whereClause.status = status;
      }

      if (search) {
        whereClause.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { contactName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ];
      }

      const suppliers = await prisma.supplier.findMany({
        where: whereClause,
        orderBy: {
          createdAt: 'desc',
        },
      });

      return res.status(200).json({ success: true, data: suppliers });
    } catch (error) {
      console.error('Error listing suppliers:', error);
      return res.status(500).json({ success: false, error: 'An internal server error occurred' });
    }
  })();
});

// Get Supplier Details
// eslint-disable-next-line @typescript-eslint/no-misused-promises
supplierRouter.get('/:supplierId', authMiddleware, (req, res) => {
  void (async () => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const paramsResult = supplierParamsSchema.safeParse(req.params);
      if (!paramsResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid path parameters',
          details: paramsResult.error.errors,
        });
      }

      const { organizationId, supplierId } = paramsResult.data;
      const requestingUserId = req.user.id;

      const membership = await prisma.membership.findFirst({
        where: {
          organizationId,
          userId: requestingUserId,
        },
      });

      if (!membership) {
        return res.status(404).json({ success: false, error: 'Organization not found' });
      }

      const supplier = await prisma.supplier.findFirst({
        where: {
          id: supplierId,
          organizationId,
        },
      });

      if (!supplier) {
        return res.status(404).json({ success: false, error: 'Supplier not found' });
      }

      return res.status(200).json({ success: true, data: supplier });
    } catch (error) {
      console.error('Error fetching supplier details:', error);
      return res.status(500).json({ success: false, error: 'An internal server error occurred' });
    }
  })();
});
