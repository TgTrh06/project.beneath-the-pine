import { SetMetadata } from '@nestjs/common';

export const PUBLIC_ROUTE = Symbol('PUBLIC_ROUTE');
/** Explicit opt-in; only health endpoints are public in this scaffold. */
export const Public = () => SetMetadata(PUBLIC_ROUTE, true);
