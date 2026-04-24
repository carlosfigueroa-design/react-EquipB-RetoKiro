import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Custom decorator that extracts the authenticated user from the request object.
 * The user is injected by JwtAuthGuard (task 2.4) into `request.user`.
 *
 * Usage: @CurrentUser() user: AuthenticatedUser
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser | undefined;

    if (!user) {
      return undefined;
    }

    return data ? user[data] : user;
  },
);
