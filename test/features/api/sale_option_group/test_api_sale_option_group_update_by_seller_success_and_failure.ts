import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallSaleOptionGroup } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleOptionGroup";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * This test validates the update operation of a sale option group by an
 * authenticated seller user.
 *
 * It covers the full flow including:
 *
 * 1. Seller user creation and authentication.
 * 2. Updating a sale option group with valid parameters and asserting the
 *    response correctness.
 * 3. Attempting to update with an invalid sale option group ID to confirm
 *    error handling.
 * 4. Attempting to update without proper authorization to confirm permission
 *    enforcement.
 */
export async function test_api_sale_option_group_update_by_seller_success_and_failure(
  connection: api.IConnection,
) {
  // 1. Seller user creation and authentication
  const sellerCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password: "P@ssword123!",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: RandomGenerator.mobile(),
    business_registration_number: `${RandomGenerator.alphaNumeric(10)}`,
  } satisfies IShoppingMallSellerUser.ICreate;
  const seller: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: sellerCreateBody,
    });
  typia.assert(seller);

  // 2. Simulate existing sale option group
  const originalSaleOptionGroup = typia.random<IShoppingMallSaleOptionGroup>();
  typia.assert(originalSaleOptionGroup);

  // 3. Perform valid update on sale option group
  const updateBody: IShoppingMallSaleOptionGroup.IUpdate = {
    code: RandomGenerator.alphaNumeric(8),
    name: RandomGenerator.name(),
    deleted_at: null, // Explicitly unsetting deletion status
  };

  const updatedOptionGroup =
    await api.functional.shoppingMall.sellerUser.saleOptionGroups.update(
      connection,
      {
        saleOptionGroupId: originalSaleOptionGroup.id,
        body: updateBody,
      },
    );
  typia.assert(updatedOptionGroup);

  TestValidator.equals(
    "updated option group id matches",
    updatedOptionGroup.id,
    originalSaleOptionGroup.id,
  );
  TestValidator.equals(
    "updated option group code",
    updatedOptionGroup.code,
    updateBody.code,
  );
  TestValidator.equals(
    "updated option group name",
    updatedOptionGroup.name,
    updateBody.name,
  );
  TestValidator.equals(
    "updated option group deleted_at",
    updatedOptionGroup.deleted_at,
    updateBody.deleted_at,
  );

  // 4. Test update with invalid saleOptionGroupId (non-existent ID)
  await TestValidator.error(
    "update fails with invalid saleOptionGroupId",
    async () => {
      await api.functional.shoppingMall.sellerUser.saleOptionGroups.update(
        connection,
        {
          saleOptionGroupId: typia.random<string & tags.Format<"uuid">>(),
          body: updateBody,
        },
      );
    },
  );

  // 5. Test unauthorized access by using connection without authentication
  const unauthenticatedConnection: api.IConnection = {
    ...connection,
    headers: {},
  };
  await TestValidator.error("update fails when unauthorized", async () => {
    await api.functional.shoppingMall.sellerUser.saleOptionGroups.update(
      unauthenticatedConnection,
      {
        saleOptionGroupId: originalSaleOptionGroup.id,
        body: updateBody,
      },
    );
  });
}
