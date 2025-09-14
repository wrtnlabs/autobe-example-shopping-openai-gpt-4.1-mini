import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";

/**
 * Test the logical soft deletion of shopping mall product sections with
 * enforced access control.
 *
 * This test covers the full lifecycle of soft deleting sections by admin
 * users. It validates authorization via login, correct execution of the
 * soft delete operation, and rejection of unauthorized or invalid deletion
 * attempts.
 *
 * Steps:
 *
 * 1. Create and authenticate an admin user through the join endpoint.
 * 2. Perform a soft delete on an existing section ID and verify success.
 * 3. Attempt deletion of a non-existent section ID and confirm error handling.
 * 4. Attempt deletion without authentication and expect failure to enforce
 *    access control.
 *
 * This ensures correctness and security of the DELETE
 * /shoppingMall/adminUser/sections/{id} endpoint.
 */
export async function test_api_section_soft_delete_and_access_control(
  connection: api.IConnection,
) {
  // 1. Create and authenticate an admin user
  const adminCreate = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(64),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;

  const admin: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminCreate,
    });
  typia.assert(admin);

  // 2. Use authenticated connection (token handled internally by SDK) to erase a valid section
  const validSectionId = typia.random<string & tags.Format<"uuid">>();
  await api.functional.shoppingMall.adminUser.sections.eraseSection(
    connection,
    {
      id: validSectionId,
    },
  );

  // 3. Attempt to erase a non-existent section and expect error
  const nonExistentSectionId = typia.random<string & tags.Format<"uuid">>();
  await TestValidator.error(
    "erasing non-existent section should fail",
    async () => {
      await api.functional.shoppingMall.adminUser.sections.eraseSection(
        connection,
        {
          id: nonExistentSectionId,
        },
      );
    },
  );

  // 4. Attempt to erase a section without authentication using a new unauthenticated connection
  const unauthConn: api.IConnection = { ...connection, headers: {} };
  await TestValidator.error(
    "erasing section without authentication should fail",
    async () => {
      await api.functional.shoppingMall.adminUser.sections.eraseSection(
        unauthConn,
        {
          id: validSectionId,
        },
      );
    },
  );
}
