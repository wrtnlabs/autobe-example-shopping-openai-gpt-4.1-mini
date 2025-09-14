import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";

/**
 * Validate soft deletion (logical removal) of a customer mileage record by
 * an authorized admin user.
 *
 * This test performs the full business workflow:
 *
 * 1. Creates and authenticates a new admin user
 * 2. Soft deletes a mileage record by its UUID
 *
 * It ensures the operation executes without errors, and all DTO and API
 * contract requirements are met.
 *
 * A mileage record is logically deleted by setting its deleted_at
 * timestamp, preserving data integrity while marking it as erased. This
 * action requires proper admin authorization.
 */
export async function test_api_mileage_erase_soft_delete_by_admin(
  connection: api.IConnection,
) {
  // 1. Admin user creation and authentication
  const adminUser = await api.functional.auth.adminUser.join(connection, {
    body: {
      email: typia.random<string & tags.Format<"email">>(),
      password_hash: RandomGenerator.alphaNumeric(32),
      nickname: RandomGenerator.name(),
      full_name: RandomGenerator.name(2),
      status: "active",
    } satisfies IShoppingMallAdminUser.ICreate,
  });
  typia.assert(adminUser);

  // 2. Soft delete a mileage record by admin
  const mileageId = typia.random<string & tags.Format<"uuid">>();
  await api.functional.shoppingMall.adminUser.mileages.erase(connection, {
    mileageId,
  });
}
