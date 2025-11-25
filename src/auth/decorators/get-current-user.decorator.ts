import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetCurrentUser = createParamDecorator(
  (data: string | undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    
    if (!request.user) {
      return null;
    }
    
    if (!data) {
      return request.user;
    }
    
    return request.user[data];
  },
);

export const GetCurrentUserId = createParamDecorator(
  (data: undefined, context: ExecutionContext): number => {
    const request = context.switchToHttp().getRequest();
    return request.user?.user_id;
  },
);