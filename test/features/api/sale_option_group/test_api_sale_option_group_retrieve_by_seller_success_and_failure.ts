import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallSaleOptionGroup } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleOptionGroup";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * Test successful retrieval and failure scenarios for sale option group
 * retrieval by an authenticated seller user.
 *
 * This test validates:
 *
 * 1. Seller user registration and authentication
 * 2. Successful retrieval of a sale option group by a valid UUID
 * 3. Correctness of retrieved sale option group properties
 * 4. Error handling for invalid UUID format
 * 5. Permission enforcement by testing unauthenticated access
 */
export async function test_api_sale_option_group_retrieve_by_seller_success_and_failure(
  connection: api.IConnection,
) {
  // 1. Seller user joins and authenticates
  const sellerUserBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password: RandomGenerator.alphaNumeric(12),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: null,
    business_registration_number:
      RandomGenerator.alphaNumeric(10).toUpperCase(),
  } satisfies IShoppingMallSellerUser.ICreate;

  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: sellerUserBody,
    });
  typia.assert(sellerUser);

  // 2. Retrieve a saleOptionGroup with a valid UUID
  const validSaleOptionGroupId: string & tags.Format<"uuid"> = typia.random<
    string & tags.Format<"uuid">
  >();
  const saleOptionGroup: IShoppingMallSaleOptionGroup =
    await api.functional.shoppingMall.sellerUser.saleOptionGroups.at(
      connection,
      { saleOptionGroupId: validSaleOptionGroupId },
    );
  typia.assert(saleOptionGroup);

  TestValidator.predicate(
    "saleOptionGroup ID format should be uuid",
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      saleOptionGroup.id,
    ),
  );

  TestValidator.predicate(
    "saleOptionGroup code is non-empty",
    typeof saleOptionGroup.code === "string" && saleOptionGroup.code.length > 0,
  );

  TestValidator.predicate(
    "saleOptionGroup name is non-empty",
    typeof saleOptionGroup.name === "string" && saleOptionGroup.name.length > 0,
  );

  TestValidator.predicate(
    "saleOptionGroup created_at format",
    typeof saleOptionGroup.created_at === "string" &&
      saleOptionGroup.created_at.length > 0,
  );

  TestValidator.predicate(
    "saleOptionGroup updated_at format",
    typeof saleOptionGroup.updated_at === "string" &&
      saleOptionGroup.updated_at.length > 0,
  );

  // 3. Test failure: invalid UUID should throw error
  await TestValidator.error(
    "invalid UUID format should cause error",
    async () => {
      const invalidId = "INVALID-UUID";
      await api.functional.shoppingMall.sellerUser.saleOptionGroups.at(
        connection,
        {
          saleOptionGroupId: invalidId as string & tags.Format<"uuid">,
        },
      );
    },
  );

  // 4. Test failure: unauthorized access (simulate by clearing headers / unauth connection)
  const unauthenticatedConnection: api.IConnection = {
    ...connection,
    headers: {},
  };
  await TestValidator.error(
    "unauthorized access should cause permission denied error",
    async () => {
      await api.functional.shoppingMall.sellerUser.saleOptionGroups.at(
        unauthenticatedConnection,
        { saleOptionGroupId: validSaleOptionGroupId },
      );
    },
  );
}
