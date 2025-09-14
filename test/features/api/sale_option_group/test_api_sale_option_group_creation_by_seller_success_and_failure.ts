import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallSaleOptionGroup } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleOptionGroup";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

export async function test_api_sale_option_group_creation_by_seller_success_and_failure(
  connection: api.IConnection,
) {
  // 1. Perform seller user join and acquire authorization
  const sellerCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password: "P@ssword123!",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: null,
    business_registration_number: RandomGenerator.alphaNumeric(10),
  } satisfies IShoppingMallSellerUser.ICreate;

  const authorizedSeller: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: sellerCreateBody,
    });
  typia.assert(authorizedSeller);

  // 2. Create a sale option group successfully
  const uniqueCode = RandomGenerator.alphaNumeric(8);
  const createRequest1 = {
    code: uniqueCode,
    name: RandomGenerator.name(),
  } satisfies IShoppingMallSaleOptionGroup.ICreate;

  const optionGroup1: IShoppingMallSaleOptionGroup =
    await api.functional.shoppingMall.sellerUser.saleOptionGroups.create(
      connection,
      {
        body: createRequest1,
      },
    );
  typia.assert(optionGroup1);
  TestValidator.equals(
    "sale option group code equality",
    optionGroup1.code,
    createRequest1.code,
  );
  TestValidator.equals(
    "sale option group name equality",
    optionGroup1.name,
    createRequest1.name,
  );

  // 3. Try to create another group with duplicate code, expect failure
  await TestValidator.error("duplicate code creation should fail", async () => {
    await api.functional.shoppingMall.sellerUser.saleOptionGroups.create(
      connection,
      {
        body: {
          code: optionGroup1.code,
          name: RandomGenerator.name(),
        } satisfies IShoppingMallSaleOptionGroup.ICreate,
      },
    );
  });

  // 4. Test unauthorized access denial
  const unauthConn: api.IConnection = { ...connection, headers: {} };
  await TestValidator.error("unauthorized creation should fail", async () => {
    await api.functional.shoppingMall.sellerUser.saleOptionGroups.create(
      unauthConn,
      {
        body: {
          code: RandomGenerator.alphaNumeric(8),
          name: RandomGenerator.name(),
        } satisfies IShoppingMallSaleOptionGroup.ICreate,
      },
    );
  });
}
