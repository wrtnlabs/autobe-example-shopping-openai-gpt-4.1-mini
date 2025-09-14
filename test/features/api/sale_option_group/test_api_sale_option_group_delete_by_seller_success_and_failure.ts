import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * This test case verifies the sale option group deletion by seller user. It
 * covers successful deletion, failure with invalid UUID, non-existing UUID,
 * and unauthorized attempts.
 *
 * The flow includes:
 *
 * 1. Creating and authenticating a seller user properly.
 * 2. Deleting a sale option group with a valid UUID.
 * 3. Attempting deletions with invalid and non-existent UUIDs to verify error
 *    cases.
 * 4. Trying to delete without authentication to ensure access control.
 */
export async function test_api_sale_option_group_delete_by_seller_success_and_failure(
  connection: api.IConnection,
) {
  // 1. Seller user creation and authentication
  const sellerUserBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password: "StrongPassword123!",
    nickname: "SellerNick",
    full_name: "Seller Full Name",
    phone_number: null,
    business_registration_number: `BRN${RandomGenerator.alphaNumeric(9)}`,
  } satisfies IShoppingMallSellerUser.ICreate;

  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: sellerUserBody,
    });
  typia.assert(sellerUser);

  // 2. Successful deletion of sale option group with valid id
  const validSaleOptionGroupId = typia.random<string & tags.Format<"uuid">>();

  await api.functional.shoppingMall.sellerUser.saleOptionGroups.erase(
    connection,
    { saleOptionGroupId: validSaleOptionGroupId },
  );

  // 3. Failure tests
  // 3.1 Deletion with malformed UUID
  await TestValidator.error(
    "deleting with invalid UUID should fail",
    async () => {
      await api.functional.shoppingMall.sellerUser.saleOptionGroups.erase(
        connection,
        {
          saleOptionGroupId: "invalid-uuid-string",
        },
      );
    },
  );

  // 3.2 Deletion with non-existent but valid UUID
  const nonExistentId = typia.random<string & tags.Format<"uuid">>();
  await TestValidator.error(
    "deleting non-existent saleOptionGroupId should fail",
    async () => {
      await api.functional.shoppingMall.sellerUser.saleOptionGroups.erase(
        connection,
        {
          saleOptionGroupId: nonExistentId,
        },
      );
    },
  );

  // 4. Unauthorized access: attempt delete without authentication
  const unauthenticatedConnection: api.IConnection = {
    ...connection,
    headers: {},
  };

  await TestValidator.error("unauthorized deletion should fail", async () => {
    await api.functional.shoppingMall.sellerUser.saleOptionGroups.erase(
      unauthenticatedConnection,
      { saleOptionGroupId: validSaleOptionGroupId },
    );
  });
}
