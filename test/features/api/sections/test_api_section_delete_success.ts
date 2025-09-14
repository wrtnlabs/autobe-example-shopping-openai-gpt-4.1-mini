import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallSection } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSection";

/**
 * Test for deleting a shopping mall spatial section permanently.
 *
 * Steps:
 *
 * 1. Create an admin user and authenticate.
 * 2. Create a new spatial section to have an ID for deletion.
 * 3. Perform the delete operation on the created section ID.
 * 4. Validate that the delete call completes successfully (void return).
 *
 * This confirms that the deletion is a hard delete and requires admin
 * authorization.
 */
export async function test_api_section_delete_success(
  connection: api.IConnection,
) {
  // 1. Create admin user and authenticate
  const adminUserEmail = typia.random<string & tags.Format<"email">>();
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: adminUserEmail,
        password_hash: "hashedPassword",
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        status: "active",
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser);

  // 2. Create a new shopping mall spatial section
  const section: IShoppingMallSection =
    await api.functional.shoppingMall.adminUser.sections.create(connection, {
      body: {
        code: RandomGenerator.alphaNumeric(8),
        name: RandomGenerator.name(),
        description: null,
        status: "active",
      } satisfies IShoppingMallSection.ICreate,
    });
  typia.assert(section);

  // 3. Delete the created shopping mall section by ID
  await api.functional.shoppingMall.adminUser.sections.eraseSection(
    connection,
    {
      id: section.id,
    },
  );
}
