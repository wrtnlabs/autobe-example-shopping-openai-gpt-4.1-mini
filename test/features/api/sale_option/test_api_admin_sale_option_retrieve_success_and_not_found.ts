import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallSaleOption } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleOption";

/**
 * Verify that an admin user can retrieve detailed information of a specific
 * sale option given its ID.
 *
 * This test covers:
 *
 * 1. Successful fetch of the sale option by a valid ID.
 * 2. Error case when the sale option does not exist, expecting failure
 *    validation.
 *
 * The test begins by creating and authenticating an admin user to establish
 * the admin role context required for access. Uses a simulated valid UUID
 * for the successful retrieval. Attempts retrieval with a different random
 * UUID for the not found case.
 *
 * Validates the response objects strictly with typia.assert and uses
 * TestValidator for assertion.
 */
export async function test_api_admin_sale_option_retrieve_success_and_not_found(
  connection: api.IConnection,
) {
  // 1. Admin user joins (signs up) and authentication is established
  const adminCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(32),
    nickname: RandomGenerator.name(2),
    full_name: RandomGenerator.name(3),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;

  const adminAuthorized: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminCreateBody,
    });
  typia.assert(adminAuthorized);

  // 2. Successful retrieval of a sale option by a valid ID (simulated)
  const validSaleOptionId: string & tags.Format<"uuid"> = typia.random<
    string & tags.Format<"uuid">
  >();

  const saleOption: IShoppingMallSaleOption =
    await api.functional.shoppingMall.adminUser.saleOptions.at(connection, {
      saleOptionId: validSaleOptionId,
    });
  typia.assert(saleOption);
  // Check that saleOption.id is a string UUID (not exact equality with generated validSaleOptionId)
  TestValidator.predicate(
    "sale option id is a valid UUID",
    typeof saleOption.id === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        saleOption.id,
      ),
  );
  TestValidator.predicate(
    "sale option group id is UUID",
    typeof saleOption.shopping_mall_sale_option_group_id === "string" &&
      saleOption.shopping_mall_sale_option_group_id.length > 0,
  );
  TestValidator.predicate(
    "sale option has code",
    typeof saleOption.code === "string" && saleOption.code.length > 0,
  );
  TestValidator.predicate(
    "sale option has name",
    typeof saleOption.name === "string" && saleOption.name.length > 0,
  );
  TestValidator.predicate(
    "sale option type is string",
    typeof saleOption.type === "string" && saleOption.type.length > 0,
  );

  // 3. Attempt retrieval with a non-existing saleOptionId, expect error
  const invalidSaleOptionId: string & tags.Format<"uuid"> = typia.random<
    string & tags.Format<"uuid">
  >();
  await TestValidator.error(
    "retrieving non-existent sale option fails",
    async () => {
      await api.functional.shoppingMall.adminUser.saleOptions.at(connection, {
        saleOptionId: invalidSaleOptionId,
      });
    },
  );
}
