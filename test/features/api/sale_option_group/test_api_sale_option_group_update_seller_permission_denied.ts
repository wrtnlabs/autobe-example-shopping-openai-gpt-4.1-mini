import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallSaleOptionGroup } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleOptionGroup";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

export async function test_api_sale_option_group_update_seller_permission_denied(
  connection: api.IConnection,
) {
  // 1. Essential seller user registration.
  const sellerUserCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password: "strongpassword123!",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: RandomGenerator.mobile("010"),
    business_registration_number: `BRN${RandomGenerator.alphaNumeric(9).toUpperCase()}`,
  } satisfies IShoppingMallSellerUser.ICreate;

  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: sellerUserCreateBody,
    });
  typia.assert(sellerUser);

  // 2. Authenticate the seller user (login).
  const sellerUserLoginBody = {
    email: sellerUserCreateBody.email,
    password: sellerUserCreateBody.password,
  } satisfies IShoppingMallSellerUser.ILogin;

  const sellerUserLoggedIn: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.login(connection, {
      body: sellerUserLoginBody,
    });
  typia.assert(sellerUserLoggedIn);

  // 3. Attempt to update a sale option group without proper authorization
  // Generate a random UUID for saleOptionGroupId
  const saleOptionGroupId = typia.random<string & tags.Format<"uuid">>();

  // Construct valid update payload with optional properties
  const updateBody = {
    code: RandomGenerator.alphaNumeric(10).toUpperCase(),
    name: RandomGenerator.name(2),
    deleted_at: null,
  } satisfies IShoppingMallSaleOptionGroup.IUpdate;

  // Expect this update to fail with a permission denied error
  await TestValidator.error(
    "Updating sale option group without seller permission should fail",
    async () => {
      await api.functional.shoppingMall.sellerUser.saleOptionGroups.update(
        connection,
        {
          saleOptionGroupId,
          body: updateBody,
        },
      );
    },
  );
}
