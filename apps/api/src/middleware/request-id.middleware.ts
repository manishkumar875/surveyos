import { randomUUID } from 'node:crypto';

import type { RequestHandler } from 'express';

import { REQUEST_ID_HEADER } from '../constants/app.constants.js';

export const requestIdMiddleware: RequestHandler = (req, res, next) => {
  const incomingRequestId = req.header(REQUEST_ID_HEADER);
  const requestId = incomingRequestId && incomingRequestId.length > 0 ? incomingRequestId : randomUUID();

  req.id = requestId;
  res.setHeader(REQUEST_ID_HEADER, requestId);

  next();
};
