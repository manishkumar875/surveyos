import { Router } from 'express';
import { z } from 'zod';
import { prisma, Prisma, type ProjectIntegration, IntegrationStatus } from '@surveyos/db';
import { Role } from '@surveyos/db';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { env } from '../config/env.js';

export const projectIntegrationRouter: Router = Router({ mergeParams: true });

const integrationParamsSchema = z.object({
  organizationId: z.string().uuid('Invalid organization ID'),
  projectId: z.string().uuid('Invalid project ID'),
});

const updateIntegrationSchema = z.object({
  clientSurveyUrl: z.string().url('Invalid URL format').optional().nullable(),
  parameterMapping: z.record(z.any()).optional().nullable(),
});

const updateStatusSchema = z.object({
  status: z.enum([
    IntegrationStatus.WAITING,
    IntegrationStatus.TESTING,
    IntegrationStatus.LIVE,
    IntegrationStatus.FAILED,
  ]),
});

function generateCallbackUrls(integration: {
  completeCallbackToken: string;
  terminateCallbackToken: string;
  quotaFullCallbackToken: string;
  securityCallbackToken: string;
  testCallbackToken: string;
}) {
  const baseUrl = env.API_PUBLIC_URL;
  return {
    completeCallbackUrl: `${baseUrl}/callbacks/complete/${integration.completeCallbackToken}`,
    terminateCallbackUrl: `${baseUrl}/callbacks/terminate/${integration.terminateCallbackToken}`,
    quotaFullCallbackUrl: `${baseUrl}/callbacks/quota-full/${integration.quotaFullCallbackToken}`,
    securityCallbackUrl: `${baseUrl}/callbacks/security/${integration.securityCallbackToken}`,
    testCallbackUrl: `${baseUrl}/callbacks/test/${integration.testCallbackToken}`,
  };
}

function formatIntegrationResponse(integration: ProjectIntegration) {
  const {
    completeCallbackToken: _completeCallbackToken,
    terminateCallbackToken: _terminateCallbackToken,
    quotaFullCallbackToken: _quotaFullCallbackToken,
    securityCallbackToken: _securityCallbackToken,
    testCallbackToken: _testCallbackToken,
    ...rest
  } = integration;

  return {
    ...rest,
    callbackUrls: generateCallbackUrls(integration),
  };
}

// Initialize Integration
// eslint-disable-next-line @typescript-eslint/no-misused-promises
projectIntegrationRouter.post('/', authMiddleware, (req, res) => {
  void (async () => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const paramsResult = integrationParamsSchema.safeParse(req.params);
      if (!paramsResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid path parameters',
          details: paramsResult.error.errors,
        });
      }

      const { organizationId, projectId } = paramsResult.data;
      const requestingUserId = req.user.id;

      const requestingUserMembership = await prisma.membership.findFirst({
        where: {
          organizationId,
          userId: requestingUserId,
        },
      });

      if (!requestingUserMembership) {
        return res.status(404).json({ success: false, error: 'Organization not found' });
      }

      if (requestingUserMembership.role === Role.MEMBER) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Insufficient permissions to initialize integration',
        });
      }

      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          organizationId,
        },
      });

      if (!project) {
        return res.status(404).json({ success: false, error: 'Project not found' });
      }

      let integration = await prisma.projectIntegration.findFirst({
        where: {
          projectId,
        },
      });

      if (!integration) {
        integration = await prisma.projectIntegration.create({
          data: {
            projectId,
          },
        });
      }

      return res.status(200).json({
        success: true,
        data: formatIntegrationResponse(integration),
      });
    } catch (error) {
      console.error('Error initializing project integration:', error);
      return res.status(500).json({ success: false, error: 'An internal server error occurred' });
    }
  })();
});

// Get Integration
// eslint-disable-next-line @typescript-eslint/no-misused-promises
projectIntegrationRouter.get('/', authMiddleware, (req, res) => {
  void (async () => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const paramsResult = integrationParamsSchema.safeParse(req.params);
      if (!paramsResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid path parameters',
          details: paramsResult.error.errors,
        });
      }

      const { organizationId, projectId } = paramsResult.data;
      const requestingUserId = req.user.id;

      const requestingUserMembership = await prisma.membership.findFirst({
        where: {
          organizationId,
          userId: requestingUserId,
        },
      });

      if (!requestingUserMembership) {
        return res.status(404).json({ success: false, error: 'Organization not found' });
      }

      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          organizationId,
        },
      });

      if (!project) {
        return res.status(404).json({ success: false, error: 'Project not found' });
      }

      const integration = await prisma.projectIntegration.findFirst({
        where: {
          projectId,
        },
      });

      if (!integration) {
        return res
          .status(404)
          .json({ success: false, error: 'Integration has not been initialized for this project' });
      }

      return res.status(200).json({
        success: true,
        data: formatIntegrationResponse(integration),
      });
    } catch (error) {
      console.error('Error fetching project integration:', error);
      return res.status(500).json({ success: false, error: 'An internal server error occurred' });
    }
  })();
});

// Update Integration
// eslint-disable-next-line @typescript-eslint/no-misused-promises
projectIntegrationRouter.patch('/', authMiddleware, (req, res) => {
  void (async () => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const paramsResult = integrationParamsSchema.safeParse(req.params);
      if (!paramsResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid path parameters',
          details: paramsResult.error.errors,
        });
      }

      const bodyResult = updateIntegrationSchema.safeParse(req.body);
      if (!bodyResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: bodyResult.error.errors,
        });
      }

      const { organizationId, projectId } = paramsResult.data;
      const updates = bodyResult.data;
      const requestingUserId = req.user.id;

      const requestingUserMembership = await prisma.membership.findFirst({
        where: {
          organizationId,
          userId: requestingUserId,
        },
      });

      if (!requestingUserMembership) {
        return res.status(404).json({ success: false, error: 'Organization not found' });
      }

      if (requestingUserMembership.role === Role.MEMBER) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Insufficient permissions to update integration',
        });
      }

      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          organizationId,
        },
      });

      if (!project) {
        return res.status(404).json({ success: false, error: 'Project not found' });
      }

      const existingIntegration = await prisma.projectIntegration.findFirst({
        where: {
          projectId,
        },
      });

      if (!existingIntegration) {
        return res.status(404).json({ success: false, error: 'Integration not found' });
      }

      const dataToUpdate: Prisma.ProjectIntegrationUpdateInput = {};
      if (updates.clientSurveyUrl !== undefined) {
        dataToUpdate.clientSurveyUrl = updates.clientSurveyUrl;
      }
      if (updates.parameterMapping !== undefined) {
        // null or JSON object natively accepted by Prisma Json field
        dataToUpdate.parameterMapping = updates.parameterMapping ?? Prisma.JsonNull;
      }

      const updatedIntegration = await prisma.projectIntegration.update({
        where: { id: existingIntegration.id },
        data: dataToUpdate,
      });

      return res.status(200).json({
        success: true,
        data: formatIntegrationResponse(updatedIntegration),
      });
    } catch (error) {
      console.error('Error updating project integration:', error);
      return res.status(500).json({ success: false, error: 'An internal server error occurred' });
    }
  })();
});

// Test Integration
// eslint-disable-next-line @typescript-eslint/no-misused-promises
projectIntegrationRouter.post('/test', authMiddleware, (req, res) => {
  void (async () => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const paramsResult = integrationParamsSchema.safeParse(req.params);
      if (!paramsResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid path parameters',
          details: paramsResult.error.errors,
        });
      }

      const { organizationId, projectId } = paramsResult.data;
      const requestingUserId = req.user.id;

      const requestingUserMembership = await prisma.membership.findFirst({
        where: {
          organizationId,
          userId: requestingUserId,
        },
      });

      if (!requestingUserMembership) {
        return res.status(404).json({ success: false, error: 'Organization not found' });
      }

      if (requestingUserMembership.role === Role.MEMBER) {
        return res
          .status(403)
          .json({
            success: false,
            error: 'Forbidden: Insufficient permissions to test integration',
          });
      }

      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          organizationId,
        },
      });

      if (!project) {
        return res.status(404).json({ success: false, error: 'Project not found' });
      }

      const existingIntegration = await prisma.projectIntegration.findFirst({
        where: {
          projectId,
        },
      });

      if (!existingIntegration) {
        return res.status(404).json({ success: false, error: 'Integration not found' });
      }

      const checks = {
        integrationExists: true,
        clientSurveyUrlExists: !!existingIntegration.clientSurveyUrl,
        completeCallbackUrlExists: !!existingIntegration.completeCallbackToken,
        terminateCallbackUrlExists: !!existingIntegration.terminateCallbackToken,
        quotaFullCallbackUrlExists: !!existingIntegration.quotaFullCallbackToken,
        securityCallbackUrlExists: !!existingIntegration.securityCallbackToken,
        testCallbackUrlExists: !!existingIntegration.testCallbackToken,
      };

      const passed = Object.values(checks).every((check) => check === true);
      const newStatus = passed ? IntegrationStatus.TESTING : IntegrationStatus.FAILED;

      const updatedIntegration = await prisma.projectIntegration.update({
        where: { id: existingIntegration.id },
        data: { status: newStatus },
      });

      return res.status(200).json({
        success: true,
        message: passed ? 'Integration test passed' : 'Integration test failed',
        passed,
        checks,
        integration: formatIntegrationResponse(updatedIntegration),
      });
    } catch (error) {
      console.error('Error testing project integration:', error);
      return res.status(500).json({ success: false, error: 'An internal server error occurred' });
    }
  })();
});

// Update Integration Status
// eslint-disable-next-line @typescript-eslint/no-misused-promises
projectIntegrationRouter.patch('/status', authMiddleware, (req, res) => {
  void (async () => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const paramsResult = integrationParamsSchema.safeParse(req.params);
      if (!paramsResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid path parameters',
          details: paramsResult.error.errors,
        });
      }

      const bodyResult = updateStatusSchema.safeParse(req.body);
      if (!bodyResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: bodyResult.error.errors,
        });
      }

      const { organizationId, projectId } = paramsResult.data;
      const { status } = bodyResult.data;
      const requestingUserId = req.user.id;

      const requestingUserMembership = await prisma.membership.findFirst({
        where: {
          organizationId,
          userId: requestingUserId,
        },
      });

      if (!requestingUserMembership) {
        return res.status(404).json({ success: false, error: 'Organization not found' });
      }

      if (requestingUserMembership.role === Role.MEMBER) {
        return res
          .status(403)
          .json({
            success: false,
            error: 'Forbidden: Insufficient permissions to update integration status',
          });
      }

      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          organizationId,
        },
      });

      if (!project) {
        return res.status(404).json({ success: false, error: 'Project not found' });
      }

      const existingIntegration = await prisma.projectIntegration.findFirst({
        where: {
          projectId,
        },
      });

      if (!existingIntegration) {
        return res.status(404).json({ success: false, error: 'Integration not found' });
      }

      if (status === IntegrationStatus.LIVE && !existingIntegration.clientSurveyUrl) {
        return res.status(400).json({
          success: false,
          error: 'Cannot set status to LIVE because clientSurveyUrl is missing',
        });
      }

      const updatedIntegration = await prisma.projectIntegration.update({
        where: { id: existingIntegration.id },
        data: { status },
      });

      return res.status(200).json({
        success: true,
        data: formatIntegrationResponse(updatedIntegration),
      });
    } catch (error) {
      console.error('Error updating project integration status:', error);
      return res.status(500).json({ success: false, error: 'An internal server error occurred' });
    }
  })();
});
