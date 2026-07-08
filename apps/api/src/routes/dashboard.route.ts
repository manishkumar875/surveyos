/* eslint-disable */
import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import {
  prisma,
  ProjectStatus,
  SupplierStatus,
  RespondentSessionStatus,
  CallbackEventStatus,
  CallbackOutcomeType,
  QuotaStatus,
  FraudSignalStatus,
  FraudSignalSeverity,
} from '@surveyos/db';
import { authMiddleware } from '../middleware/auth.middleware.js';

export const dashboardRouter: Router = Router({ mergeParams: true });

const orgDashboardParamsSchema = z.object({
  organizationId: z.string().uuid('Invalid organization ID'),
});

const projectDashboardParamsSchema = z.object({
  organizationId: z.string().uuid('Invalid organization ID'),
  projectId: z.string().uuid('Invalid project ID'),
});

const dateFilterQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

function calculateRates(metrics: {
  redirected: number;
  completed: number;
  terminated: number;
  quotaFull: number;
  security: number;
}) {
  const denominator = metrics.redirected;
  if (denominator === 0) {
    return {
      completionRate: 0,
      terminationRate: 0,
      quotaFullRate: 0,
      securityRate: 0,
    };
  }

  return {
    completionRate: Number((metrics.completed / denominator).toFixed(4)),
    terminationRate: Number((metrics.terminated / denominator).toFixed(4)),
    quotaFullRate: Number((metrics.quotaFull / denominator).toFixed(4)),
    securityRate: Number((metrics.security / denominator).toFixed(4)),
  };
}

// Organization Dashboard Summary
dashboardRouter.get('/summary', authMiddleware, (req: Request, res: Response) => {
  void (async () => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const paramsResult = orgDashboardParamsSchema.safeParse(req.params);
      if (!paramsResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid path parameters',
          details: paramsResult.error.errors,
        });
      }

      const queryResult = dateFilterQuerySchema.safeParse(req.query);
      if (!queryResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          details: queryResult.error.errors,
        });
      }

      const { organizationId } = paramsResult.data;
      const { from, to } = queryResult.data;
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

      const dateFilter = {
        ...(from && { gte: new Date(from) }),
        ...(to && { lte: new Date(to) }),
      };

      const hasDateFilter = Object.keys(dateFilter).length > 0;

      // Projects
      const projectCounts = await prisma.project.groupBy({
        by: ['status'],
        where: {
          organizationId,
          ...(hasDateFilter && { createdAt: dateFilter }),
        },
        _count: true,
      });

      const projects = {
        total: projectCounts.reduce((acc, curr) => acc + curr._count, 0),
        draft: projectCounts.find((c) => c.status === ProjectStatus.DRAFT)?._count || 0,
        active: projectCounts.find((c) => c.status === ProjectStatus.ACTIVE)?._count || 0,
        paused: projectCounts.find((c) => c.status === ProjectStatus.PAUSED)?._count || 0,
        completed: projectCounts.find((c) => c.status === ProjectStatus.COMPLETED)?._count || 0,
        archived: projectCounts.find((c) => c.status === ProjectStatus.ARCHIVED)?._count || 0,
      };

      // Suppliers
      const supplierCounts = await prisma.supplier.groupBy({
        by: ['status'],
        where: {
          organizationId,
          ...(hasDateFilter && { createdAt: dateFilter }),
        },
        _count: true,
      });

      const suppliers = {
        total: supplierCounts.reduce((acc, curr) => acc + curr._count, 0),
        active: supplierCounts.find((c) => c.status === SupplierStatus.ACTIVE)?._count || 0,
        paused: supplierCounts.find((c) => c.status === SupplierStatus.PAUSED)?._count || 0,
        archived: supplierCounts.find((c) => c.status === SupplierStatus.ARCHIVED)?._count || 0,
      };

      // Respondent Sessions
      const sessionCounts = await prisma.respondentSession.groupBy({
        by: ['status'],
        where: {
          organizationId,
          ...(hasDateFilter && { startedAt: dateFilter }),
        },
        _count: true,
      });

      const respondentSessions = {
        total: sessionCounts.reduce((acc, curr) => acc + curr._count, 0),
        started:
          sessionCounts.find((c) => c.status === RespondentSessionStatus.STARTED)?._count || 0,
        redirected:
          sessionCounts.find((c) => c.status === RespondentSessionStatus.REDIRECTED)?._count || 0,
        completed:
          sessionCounts.find((c) => c.status === RespondentSessionStatus.COMPLETED)?._count || 0,
        terminated:
          sessionCounts.find((c) => c.status === RespondentSessionStatus.TERMINATED)?._count || 0,
        quotaFull:
          sessionCounts.find((c) => c.status === RespondentSessionStatus.QUOTA_FULL)?._count || 0,
        security:
          sessionCounts.find((c) => c.status === RespondentSessionStatus.SECURITY)?._count || 0,
        abandoned:
          sessionCounts.find((c) => c.status === RespondentSessionStatus.ABANDONED)?._count || 0,
      };

      // Callbacks
      const callbackStatusCounts = await prisma.callbackEvent.groupBy({
        by: ['status'],
        where: {
          organizationId,
          ...(hasDateFilter && { receivedAt: dateFilter }),
        },
        _count: true,
      });

      const callbackOutcomeCounts = await prisma.callbackEvent.groupBy({
        by: ['outcome'],
        where: {
          organizationId,
          ...(hasDateFilter && { receivedAt: dateFilter }),
        },
        _count: true,
      });

      const callbacks = {
        total: callbackStatusCounts.reduce((acc, curr) => acc + curr._count, 0),
        received:
          callbackStatusCounts.find((c) => c.status === CallbackEventStatus.RECEIVED)?._count || 0,
        processed:
          callbackStatusCounts.find((c) => c.status === CallbackEventStatus.PROCESSED)?._count || 0,
        failed:
          callbackStatusCounts.find((c) => c.status === CallbackEventStatus.FAILED)?._count || 0,
        ignored:
          callbackStatusCounts.find((c) => c.status === CallbackEventStatus.IGNORED)?._count || 0,
        complete:
          callbackOutcomeCounts.find((c) => c.outcome === CallbackOutcomeType.COMPLETE)?._count ||
          0,
        terminate:
          callbackOutcomeCounts.find((c) => c.outcome === CallbackOutcomeType.TERMINATE)?._count ||
          0,
        quotaFull:
          callbackOutcomeCounts.find((c) => c.outcome === CallbackOutcomeType.QUOTA_FULL)?._count ||
          0,
        security:
          callbackOutcomeCounts.find((c) => c.outcome === CallbackOutcomeType.SECURITY)?._count ||
          0,
        test:
          callbackOutcomeCounts.find((c) => c.outcome === CallbackOutcomeType.TEST)?._count || 0,
      };

      // Quotas
      const quotaCounts = await prisma.projectQuota.groupBy({
        by: ['status'],
        where: {
          organizationId,
          ...(hasDateFilter && { createdAt: dateFilter }),
        },
        _count: true,
        _sum: {
          targetCompletes: true,
          currentCompletes: true,
        },
      });

      const targetCompletesSum = quotaCounts.reduce(
        (acc, curr) => acc + (curr._sum.targetCompletes || 0),
        0,
      );
      const currentCompletesSum = quotaCounts.reduce(
        (acc, curr) => acc + (curr._sum.currentCompletes || 0),
        0,
      );

      const quotas = {
        total: quotaCounts.reduce((acc, curr) => acc + curr._count, 0),
        active: quotaCounts.find((c) => c.status === QuotaStatus.ACTIVE)?._count || 0,
        paused: quotaCounts.find((c) => c.status === QuotaStatus.PAUSED)?._count || 0,
        full: quotaCounts.find((c) => c.status === QuotaStatus.FULL)?._count || 0,
        archived: quotaCounts.find((c) => c.status === QuotaStatus.ARCHIVED)?._count || 0,
        targetCompletes: targetCompletesSum,
        currentCompletes: currentCompletesSum,
        remainingCompletes: Math.max(0, targetCompletesSum - currentCompletesSum),
      };

      // Fraud Signals
      const fraudStatusCounts = await prisma.fraudSignal.groupBy({
        by: ['status'],
        where: {
          organizationId,
          ...(hasDateFilter && { createdAt: dateFilter }),
        },
        _count: true,
      });

      const fraudSeverityCounts = await prisma.fraudSignal.groupBy({
        by: ['severity'],
        where: {
          organizationId,
          ...(hasDateFilter && { createdAt: dateFilter }),
        },
        _count: true,
      });

      const fraudSignals = {
        total: fraudStatusCounts.reduce((acc, curr) => acc + curr._count, 0),
        open: fraudStatusCounts.find((c) => c.status === FraudSignalStatus.OPEN)?._count || 0,
        reviewed:
          fraudStatusCounts.find((c) => c.status === FraudSignalStatus.REVIEWED)?._count || 0,
        dismissed:
          fraudStatusCounts.find((c) => c.status === FraudSignalStatus.DISMISSED)?._count || 0,
        low: fraudSeverityCounts.find((c) => c.severity === FraudSignalSeverity.LOW)?._count || 0,
        medium:
          fraudSeverityCounts.find((c) => c.severity === FraudSignalSeverity.MEDIUM)?._count || 0,
        high: fraudSeverityCounts.find((c) => c.severity === FraudSignalSeverity.HIGH)?._count || 0,
      };

      // Rates
      const rates = calculateRates({
        redirected: respondentSessions.redirected,
        completed: respondentSessions.completed,
        terminated: respondentSessions.terminated,
        quotaFull: respondentSessions.quotaFull,
        security: respondentSessions.security,
      });

      return res.status(200).json({
        success: true,
        data: {
          projects,
          suppliers,
          respondentSessions,
          callbacks,
          quotas,
          fraudSignals,
          rates,
        },
      });
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
      return res.status(500).json({ success: false, error: 'An internal server error occurred' });
    }
  })();
});

// Project Performance Metrics

dashboardRouter.get(
  '/projects/:projectId/performance',
  authMiddleware,
  (req: Request, res: Response) => {
    void (async () => {
      try {
        if (!req.user) {
          return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        const paramsResult = projectDashboardParamsSchema.safeParse(req.params);
        if (!paramsResult.success) {
          return res.status(400).json({
            success: false,
            error: 'Invalid path parameters',
            details: paramsResult.error.errors,
          });
        }

        const queryResult = dateFilterQuerySchema.safeParse(req.query);
        if (!queryResult.success) {
          return res.status(400).json({
            success: false,
            error: 'Invalid query parameters',
            details: queryResult.error.errors,
          });
        }

        const { organizationId, projectId } = paramsResult.data;
        const { from, to } = queryResult.data;
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

        const projectData = await prisma.project.findFirst({
          where: {
            id: projectId,
            organizationId,
          },
        });

        if (!projectData) {
          return res.status(404).json({ success: false, error: 'Project not found' });
        }

        const dateFilter = {
          ...(from && { gte: new Date(from) }),
          ...(to && { lte: new Date(to) }),
        };

        const hasDateFilter = Object.keys(dateFilter).length > 0;

        // Respondent Sessions
        const sessionCounts = await prisma.respondentSession.groupBy({
          by: ['status'],
          where: {
            projectId,
            ...(hasDateFilter && { startedAt: dateFilter }),
          },
          _count: true,
        });

        const respondentSessions = {
          total: sessionCounts.reduce((acc, curr) => acc + curr._count, 0),
          started:
            sessionCounts.find((c) => c.status === RespondentSessionStatus.STARTED)?._count || 0,
          redirected:
            sessionCounts.find((c) => c.status === RespondentSessionStatus.REDIRECTED)?._count || 0,
          completed:
            sessionCounts.find((c) => c.status === RespondentSessionStatus.COMPLETED)?._count || 0,
          terminated:
            sessionCounts.find((c) => c.status === RespondentSessionStatus.TERMINATED)?._count || 0,
          quotaFull:
            sessionCounts.find((c) => c.status === RespondentSessionStatus.QUOTA_FULL)?._count || 0,
          security:
            sessionCounts.find((c) => c.status === RespondentSessionStatus.SECURITY)?._count || 0,
          abandoned:
            sessionCounts.find((c) => c.status === RespondentSessionStatus.ABANDONED)?._count || 0,
        };

        // Callbacks
        const callbackStatusCounts = await prisma.callbackEvent.groupBy({
          by: ['status'],
          where: {
            projectId,
            ...(hasDateFilter && { receivedAt: dateFilter }),
          },
          _count: true,
        });

        const callbackOutcomeCounts = await prisma.callbackEvent.groupBy({
          by: ['outcome'],
          where: {
            projectId,
            ...(hasDateFilter && { receivedAt: dateFilter }),
          },
          _count: true,
        });

        const callbacks = {
          total: callbackStatusCounts.reduce((acc, curr) => acc + curr._count, 0),
          received:
            callbackStatusCounts.find((c) => c.status === CallbackEventStatus.RECEIVED)?._count ||
            0,
          processed:
            callbackStatusCounts.find((c) => c.status === CallbackEventStatus.PROCESSED)?._count ||
            0,
          failed:
            callbackStatusCounts.find((c) => c.status === CallbackEventStatus.FAILED)?._count || 0,
          ignored:
            callbackStatusCounts.find((c) => c.status === CallbackEventStatus.IGNORED)?._count || 0,
          complete:
            callbackOutcomeCounts.find((c) => c.outcome === CallbackOutcomeType.COMPLETE)?._count ||
            0,
          terminate:
            callbackOutcomeCounts.find((c) => c.outcome === CallbackOutcomeType.TERMINATE)
              ?._count || 0,
          quotaFull:
            callbackOutcomeCounts.find((c) => c.outcome === CallbackOutcomeType.QUOTA_FULL)
              ?._count || 0,
          security:
            callbackOutcomeCounts.find((c) => c.outcome === CallbackOutcomeType.SECURITY)?._count ||
            0,
          test:
            callbackOutcomeCounts.find((c) => c.outcome === CallbackOutcomeType.TEST)?._count || 0,
        };

        // Quotas
        const projectQuotas = await prisma.projectQuota.findMany({
          where: {
            projectId,
            ...(hasDateFilter && { createdAt: dateFilter }),
          },
        });

        let targetCompletesSum = 0;
        let currentCompletesSum = 0;
        let activeQ = 0;
        let pausedQ = 0;
        let fullQ = 0;
        let archivedQ = 0;

        const quotaItems = projectQuotas.map((q) => {
          targetCompletesSum += q.targetCompletes;
          currentCompletesSum += q.currentCompletes;

          if (q.status === QuotaStatus.ACTIVE) activeQ++;
          else if (q.status === QuotaStatus.PAUSED) pausedQ++;
          else if (q.status === QuotaStatus.FULL) fullQ++;
          else if (q.status === QuotaStatus.ARCHIVED) archivedQ++;

          return {
            id: q.id,
            name: q.name,
            status: q.status,
            targetCompletes: q.targetCompletes,
            currentCompletes: q.currentCompletes,
            remainingCompletes: Math.max(0, q.targetCompletes - q.currentCompletes),
            completionRate:
              q.targetCompletes > 0
                ? Number((q.currentCompletes / q.targetCompletes).toFixed(4))
                : 0,
          };
        });

        const quotas = {
          total: projectQuotas.length,
          active: activeQ,
          paused: pausedQ,
          full: fullQ,
          archived: archivedQ,
          targetCompletes: targetCompletesSum,
          currentCompletes: currentCompletesSum,
          remainingCompletes: Math.max(0, targetCompletesSum - currentCompletesSum),
          items: quotaItems,
        };

        // Fraud Signals
        const fraudStatusCounts = await prisma.fraudSignal.groupBy({
          by: ['status'],
          where: {
            projectId,
            ...(hasDateFilter && { createdAt: dateFilter }),
          },
          _count: true,
        });

        const fraudSeverityCounts = await prisma.fraudSignal.groupBy({
          by: ['severity'],
          where: {
            projectId,
            ...(hasDateFilter && { createdAt: dateFilter }),
          },
          _count: true,
        });

        const fraudSignals = {
          total: fraudStatusCounts.reduce((acc, curr) => acc + curr._count, 0),
          open: fraudStatusCounts.find((c) => c.status === FraudSignalStatus.OPEN)?._count || 0,
          reviewed:
            fraudStatusCounts.find((c) => c.status === FraudSignalStatus.REVIEWED)?._count || 0,
          dismissed:
            fraudStatusCounts.find((c) => c.status === FraudSignalStatus.DISMISSED)?._count || 0,
          low: fraudSeverityCounts.find((c) => c.severity === FraudSignalSeverity.LOW)?._count || 0,
          medium:
            fraudSeverityCounts.find((c) => c.severity === FraudSignalSeverity.MEDIUM)?._count || 0,
          high:
            fraudSeverityCounts.find((c) => c.severity === FraudSignalSeverity.HIGH)?._count || 0,
        };

        // Rates
        const rates = calculateRates({
          redirected: respondentSessions.redirected,
          completed: respondentSessions.completed,
          terminated: respondentSessions.terminated,
          quotaFull: respondentSessions.quotaFull,
          security: respondentSessions.security,
        });

        // Supplier Performance
        const projectSuppliers = await prisma.projectSupplier.findMany({
          where: { projectId },
          include: { supplier: true },
        });

        const sessionStatsBySupplier = await prisma.respondentSession.groupBy({
          by: ['projectSupplierId', 'status'],
          where: {
            projectId,
            ...(hasDateFilter && { startedAt: dateFilter }),
          },
          _count: true,
        });

        const supplierPerformance = projectSuppliers.map((ps) => {
          const stats = sessionStatsBySupplier.filter((s) => s.projectSupplierId === ps.id);
          const total = stats.reduce((acc, curr) => acc + curr._count, 0);
          const redirected =
            stats.find((s) => s.status === RespondentSessionStatus.REDIRECTED)?._count || 0;
          const completed =
            stats.find((s) => s.status === RespondentSessionStatus.COMPLETED)?._count || 0;
          const terminated =
            stats.find((s) => s.status === RespondentSessionStatus.TERMINATED)?._count || 0;
          const quotaFull =
            stats.find((s) => s.status === RespondentSessionStatus.QUOTA_FULL)?._count || 0;
          const security =
            stats.find((s) => s.status === RespondentSessionStatus.SECURITY)?._count || 0;

          const conversionRate = redirected > 0 ? Number((completed / redirected).toFixed(4)) : 0;

          return {
            projectSupplierId: ps.id,
            supplierId: ps.supplierId,
            supplierName: ps.supplier.name,
            supplierStatus: ps.supplier.status,
            assignmentStatus: ps.status,
            sessions: total,
            redirected,
            completed,
            terminated,
            quotaFull,
            security,
            conversionRate,
          };
        });

        const project = {
          id: projectData.id,
          name: projectData.name,
          status: projectData.status,
          clientName: projectData.clientName,
          startDate: projectData.startDate,
          endDate: projectData.endDate,
          createdAt: projectData.createdAt,
          updatedAt: projectData.updatedAt,
        };

        return res.status(200).json({
          success: true,
          data: {
            project,
            respondentSessions,
            callbacks,
            quotas,
            supplierPerformance,
            fraudSignals,
            rates,
          },
        });
      } catch (error) {
        console.error('Error fetching project dashboard performance:', error);
        return res.status(500).json({ success: false, error: 'An internal server error occurred' });
      }
    })();
  },
);
