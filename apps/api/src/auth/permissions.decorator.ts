import { SetMetadata } from "@nestjs/common";
import type { AdminTabId } from "@tresamigos/types";

export const PERMISSIONS_KEY = "admin_permissions";
export const RequirePermissions = (...permissions: AdminTabId[]) => SetMetadata(PERMISSIONS_KEY, permissions);
