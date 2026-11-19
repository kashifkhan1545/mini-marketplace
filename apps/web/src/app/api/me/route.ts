import { route, requireUser } from '@/lib/server/db';

export const GET = route(async (req) => requireUser(req));
