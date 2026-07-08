/* eslint-disable @typescript-eslint/no-misused-promises */
import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import {
  prisma,
  Role,
  type ProjectStatus,
  type SupplierStatus,
  type RespondentSessionStatus,
  type CallbackEventStatus,
  type QuotaStatus,
  type FraudSignalStatus,
} from '@surveyos/db';
import { authMiddleware } from '../middleware/auth.middleware.js';

export const reportRouter: Router = Router({ mergeParams: true });

const organizationParamsSchema = z.object({
  organizationId: z.string().uuid('Invalid organization ID'),
});

const reportExportQuerySchema = z.object({
  reportType: z.enum([
    'projects',
    'suppliers',
    'respondentSessions',
    'callbacks',
    'quotas',
    'fraudSignals',
  ]),
  format: z.enum(['csv', 'json']).default('csv'),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  projectId: z.string().uuid().optional(),
  supplierId: z.string().uuid().optional(),
  status: z.string().optional(),
  limit: z.coerce.number().min(1).max(10000).default(5000),
});

const escapeCsvValue = (val: unknown): string => {
  if (val === null || val === undefined) return '';

  let str = '';
  if (typeof val === 'object') {
    if (val instanceof Date) {
      str = val.toISOString();
    } else {
      str = JSON.stringify(val);
    }
  } else {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    str = String(val);
  }

  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

// Export Reports
reportRouter.get('/export', authMiddleware, (req: Request, res: Response) => {
  void (async () => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const paramsResult = organizationParamsSchema.safeParse(req.params);
      if (!paramsResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid path parameters',
          details: paramsResult.error.errors,
        });
      }

      const queryResult = reportExportQuerySchema.safeParse(req.query);
      if (!queryResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          details: queryResult.error.errors,
        });
      }

      const { organizationId } = paramsResult.data;
      const { reportType, format, from, to, projectId, supplierId, status, limit } =
        queryResult.data;
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
        return res.status(403).json({ success: false, error: 'Forbidden' });
      }

      // Validate projectId/supplierId belonging to org
      if (projectId) {
        const project = await prisma.project.findFirst({
          where: { id: projectId, organizationId },
        });
        if (!project)
          return res
            .status(400)
            .json({ success: false, error: 'Project not found in organization' });
      }
      if (supplierId) {
        const supplier = await prisma.supplier.findFirst({
          where: { id: supplierId, organizationId },
        });
        if (!supplier)
          return res
            .status(400)
            .json({ success: false, error: 'Supplier not found in organization' });
      }

      const dateFilter = {
        ...(from && { gte: new Date(from) }),
        ...(to && { lte: new Date(to) }),
      };
      const hasDateFilter = Object.keys(dateFilter).length > 0;

      let data: Record<string, unknown>[] = [];

      switch (reportType) {
        case 'projects': {
          const projects = await prisma.project.findMany({
            where: {
              organizationId,
              ...(status && { status: status as ProjectStatus }),
              ...(hasDateFilter && { createdAt: dateFilter }),
            },
            take: limit,
            orderBy: { createdAt: 'desc' },
          });
          data = projects.map((p) => ({
            id: p.id,
            name: p.name,
            status: p.status,
            clientName: p.clientName,
            startDate: p.startDate?.toISOString() || null,
            endDate: p.endDate?.toISOString() || null,
            createdAt: p.createdAt.toISOString(),
            updatedAt: p.updatedAt.toISOString(),
          }));
          break;
        }

        case 'suppliers': {
          const suppliers = await prisma.supplier.findMany({
            where: {
              organizationId,
              ...(status && { status: status as SupplierStatus }),
              ...(hasDateFilter && { createdAt: dateFilter }),
            },
            take: limit,
            orderBy: { createdAt: 'desc' },
          });
          data = suppliers.map((s) => ({
            id: s.id,
            name: s.name,
            contactName: s.contactName,
            email: s.email,
            phone: s.phone,
            website: s.website,
            status: s.status,
            createdAt: s.createdAt.toISOString(),
            updatedAt: s.updatedAt.toISOString(),
          }));
          break;
        }

        case 'respondentSessions': {
          const sessions = await prisma.respondentSession.findMany({
            where: {
              organizationId,
              ...(projectId && { projectId }),
              ...(supplierId && { supplierId }),
              ...(status && { status: status as RespondentSessionStatus }),
              ...(hasDateFilter && { startedAt: dateFilter }),
            },
            take: limit,
            orderBy: { startedAt: 'desc' },
            include: {
              project: { select: { name: true } },
              supplier: { select: { name: true } },
            },
          });
          data = sessions.map((s) => ({
            id: s.id,
            projectId: s.projectId,
            projectName: s.project?.name || '',
            supplierId: s.supplierId,
            supplierName: s.supplier?.name || '',
            projectSupplierId: s.projectSupplierId,
            supplierRespondentId: s.supplierRespondentId,
            status: s.status,
            ipAddress: s.ipAddress,
            userAgent: s.userAgent,
            startedAt: s.startedAt.toISOString(),
            redirectedAt: s.redirectedAt?.toISOString() || null,
            completedAt: s.completedAt?.toISOString() || null,
            createdAt: s.createdAt.toISOString(),
          }));
          break;
        }

        case 'callbacks': {
          const callbacks = await prisma.callbackEvent.findMany({
            where: {
              organizationId,
              ...(projectId && { projectId }),
              ...(status && { status: status as CallbackEventStatus }),
              ...(hasDateFilter && { receivedAt: dateFilter }),
            },
            take: limit,
            orderBy: { receivedAt: 'desc' },
            include: {
              project: { select: { name: true } },
            },
          });
          data = callbacks.map((c) => ({
            id: c.id,
            projectId: c.projectId,
            projectName: c.project?.name || '',
            outcome: c.outcome,
            status: c.status,
            respondentSessionId: c.respondentSessionId,
            supplierRespondentId: c.supplierRespondentId,
            ipAddress: c.ipAddress,
            userAgent: c.userAgent,
            errorMessage: c.errorMessage,
            receivedAt: c.receivedAt.toISOString(),
            processedAt: c.processedAt?.toISOString() || null,
            createdAt: c.createdAt.toISOString(),
          }));
          break;
        }

        case 'quotas': {
          const quotas = await prisma.projectQuota.findMany({
            where: {
              organizationId,
              ...(projectId && { projectId }),
              ...(status && { status: status as QuotaStatus }),
              ...(hasDateFilter && { createdAt: dateFilter }),
            },
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
              project: { select: { name: true } },
            },
          });
          data = quotas.map((q) => {
            const currentCompletes = q.currentCompletes || 0;
            const targetCompletes = q.targetCompletes;
            const remainingCompletes = Math.max(0, targetCompletes - currentCompletes);
            const completionRate =
              targetCompletes > 0 ? Number((currentCompletes / targetCompletes).toFixed(4)) : 0;

            return {
              id: q.id,
              projectId: q.projectId,
              projectName: q.project.name,
              name: q.name,
              status: q.status,
              targetCompletes,
              currentCompletes,
              remainingCompletes,
              completionRate,
              createdAt: q.createdAt.toISOString(),
              updatedAt: q.updatedAt.toISOString(),
            };
          });
          break;
        }

        case 'fraudSignals': {
          const frauds = await prisma.fraudSignal.findMany({
            where: {
              organizationId,
              ...(projectId && { projectId }),
              ...(supplierId && { supplierId }),
              ...(status && { status: status as FraudSignalStatus }),
              ...(hasDateFilter && { createdAt: dateFilter }),
            },
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
              project: { select: { name: true } },
              supplier: { select: { name: true } },
            },
          });
          data = frauds.map((f) => ({
            id: f.id,
            projectId: f.projectId,
            projectName: f.project?.name || '',
            supplierId: f.supplierId,
            supplierName: f.supplier?.name || '',
            respondentSessionId: f.respondentSessionId,
            type: f.type,
            severity: f.severity,
            status: f.status,
            reason: f.reason,
            createdAt: f.createdAt.toISOString(),
            updatedAt: f.updatedAt.toISOString(),
          }));
          break;
        }
      }

      if (format === 'json') {
        return res.status(200).json({
          reportType,
          generatedAt: new Date().toISOString(),
          filters: { from, to, projectId, supplierId, status, limit },
          count: data.length,
          data,
        });
      }

      // Generate CSV
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="surveyos-${reportType}-${Date.now()}.csv"`,
      );

      if (!data || data.length === 0) {
        return res.send('');
      }

      const headers = Object.keys(data[0] || {});
      if (headers.length === 0) {
        return res.send('');
      }

      const csvRows = [];

      // Add headers
      csvRows.push(headers.map(escapeCsvValue).join(','));

      // Add data rows
      for (const row of data) {
        const values = headers.map((h) => escapeCsvValue(row[h]));
        csvRows.push(values.join(','));
      }

      return res.send(csvRows.join('\n'));
    } catch (error) {
      console.error('Error exporting report:', error);
      return res.status(500).json({ success: false, error: 'An internal server error occurred' });
    }
  })();
});
