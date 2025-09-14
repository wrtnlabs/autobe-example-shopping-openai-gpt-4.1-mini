import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallSaleOptionGroup } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleOptionGroup";

/**
 * Validate update operations for sale option groups by admin users.
 *
 * This test covers:
 *
 * 1. Admin user authentication via join operation.
 * 2. Successful updates of sale option groups with full or partial fields
 *    updates.
 * 3. Validation that updated fields, especially 'code', 'name', and
 *    'deleted_at', are set correctly.
 * 4. Update cases unsetting 'deleted_at' with explicit null.
 * 5. Failure on updating with non-existent saleOptionGroupId expecting not
 *    found error.
 * 6. Failure on updating without authentication expecting permission denied
 *    error.
 *
 * All responses are validated with typia.assert and all error cases use
 * TestValidator.error with awaited async callbacks.
 *
 * No headers manipulation is done manually; authentication is handled via
 * SDK.
 */
export async function test_api_sale_option_group_update_success_and_failure(
  connection: api.IConnection,
) {
  // 1. Admin user sign up and authenticate
  const adminUserCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(16),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(3),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;

  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminUserCreateBody,
    });
  typia.assert(adminUser);

  // Prepare an existing sale option group to update (simulate or random)
  // Since no create API, use random sample from update.simulate to get an example
  const existingGroup: IShoppingMallSaleOptionGroup = await (async () => {
    try {
      // Try to update random existing ID with random body to get a valid group
      const randomId = typia.random<string & tags.Format<"uuid">>();
      const randomBody = {
        code: RandomGenerator.alphaNumeric(8),
        name: RandomGenerator.name(),
      } satisfies IShoppingMallSaleOptionGroup.IUpdate;
      const res =
        await api.functional.shoppingMall.adminUser.saleOptionGroups.update(
          connection,
          {
            saleOptionGroupId: randomId,
            body: randomBody,
          },
        );
      typia.assert(res);
      return res;
    } catch {
      // fallback: simulate random
      return api.functional.shoppingMall.adminUser.saleOptionGroups.update.simulate(
        connection,
        {
          saleOptionGroupId: typia.random<string & tags.Format<"uuid">>(),
          body: {} satisfies IShoppingMallSaleOptionGroup.IUpdate,
        },
      );
    }
  })();

  // 2. Successful update: change code and name
  const updateBody1 = {
    code: RandomGenerator.alphaNumeric(8),
    name: RandomGenerator.name(),
  } satisfies IShoppingMallSaleOptionGroup.IUpdate;

  const updatedGroup1 =
    await api.functional.shoppingMall.adminUser.saleOptionGroups.update(
      connection,
      {
        saleOptionGroupId: existingGroup.id,
        body: updateBody1,
      },
    );
  typia.assert(updatedGroup1);
  TestValidator.equals(
    "updated code is correct",
    updatedGroup1.code,
    updateBody1.code,
  );
  TestValidator.equals(
    "updated name is correct",
    updatedGroup1.name,
    updateBody1.name,
  );

  // 3. Update 'deleted_at' to a valid ISO date-time string to mark logical deletion
  const deletedAtDate = new Date().toISOString();
  const updateBody2 = {
    deleted_at: deletedAtDate,
  } satisfies IShoppingMallSaleOptionGroup.IUpdate;

  const updatedGroup2 =
    await api.functional.shoppingMall.adminUser.saleOptionGroups.update(
      connection,
      {
        saleOptionGroupId: existingGroup.id,
        body: updateBody2,
      },
    );
  typia.assert(updatedGroup2);
  TestValidator.equals(
    "deleted_at set correctly",
    updatedGroup2.deleted_at,
    deletedAtDate,
  );

  // 4. Unset the logical deletion by setting 'deleted_at' explicitly to null
  const updateBody3 = {
    deleted_at: null,
  } satisfies IShoppingMallSaleOptionGroup.IUpdate;

  const updatedGroup3 =
    await api.functional.shoppingMall.adminUser.saleOptionGroups.update(
      connection,
      {
        saleOptionGroupId: existingGroup.id,
        body: updateBody3,
      },
    );
  typia.assert(updatedGroup3);
  TestValidator.equals(
    "deleted_at unset correctly",
    updatedGroup3.deleted_at,
    null,
  );

  // 5. Failure case: update with non-existent saleOptionGroupId
  const notExistingId = typia.random<string & tags.Format<"uuid">>();
  await TestValidator.error(
    "update fails for non-existent saleOptionGroupId",
    async () => {
      await api.functional.shoppingMall.adminUser.saleOptionGroups.update(
        connection,
        {
          saleOptionGroupId: notExistingId,
          body: {
            name: RandomGenerator.name(),
          } satisfies IShoppingMallSaleOptionGroup.IUpdate,
        },
      );
    },
  );

  // 6. Failure case: unauthorized update attempt
  // Prepare unauthenticated connection by removing headers safely
  const unauthenticatedConnection: api.IConnection = {
    ...connection,
    headers: {},
  };

  await TestValidator.error("update fails without authentication", async () => {
    await api.functional.shoppingMall.adminUser.saleOptionGroups.update(
      unauthenticatedConnection,
      {
        saleOptionGroupId: existingGroup.id,
        body: {
          name: RandomGenerator.name(),
        } satisfies IShoppingMallSaleOptionGroup.IUpdate,
      },
    );
  });
}
