import type { RequestHandler } from 'express';

import { setAuthCookies } from '../../config/cookies.js';
import { login, type LoginService } from './auth.service.js';
import type { LoginInput } from './auth.validation.js';

export const createLoginController = (
  loginService: LoginService = login,
): RequestHandler => {
  return async (request, response) => {
    const input = request.validated.body as LoginInput;
    const userAgent = request.get('User-Agent');
    const result = await loginService(input, {
      ...(userAgent ? { userAgent } : {}),
      ...(request.ip ? { ipAddress: request.ip } : {}),
    });

    setAuthCookies(response, result);
    response.status(200).json({
      success: true,
      message: 'Login successful',
      data: { user: result.user },
    });
  };
};
