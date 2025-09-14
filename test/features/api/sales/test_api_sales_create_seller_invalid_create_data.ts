import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallSale } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSale";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

export async function test_api_sales_create_seller_invalid_create_data(
  connection: api.IConnection,
) {
  // 1. Admin user join and login
  const adminUserEmail = typia.random<string & tags.Format<"email">>();
  const adminUserPassword = "1234";
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: adminUserEmail,
        password_hash: adminUserPassword,
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        status: "active",
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser);

  await api.functional.auth.adminUser.login(connection, {
    body: {
      email: adminUserEmail,
      password_hash: adminUserPassword,
    } satisfies IShoppingMallAdminUser.ILogin,
  });

  // 2. Seller user join and login
  const sellerUserEmail = typia.random<string & tags.Format<"email">>();
  const sellerUserPassword = "1234";
  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: {
        email: sellerUserEmail,
        password: sellerUserPassword,
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        phone_number: null,
        business_registration_number: RandomGenerator.alphaNumeric(12),
      } satisfies IShoppingMallSellerUser.ICreate,
    });
  typia.assert(sellerUser);

  await api.functional.auth.sellerUser.login(connection, {
    body: {
      email: sellerUserEmail,
      password: sellerUserPassword,
    } satisfies IShoppingMallSellerUser.ILogin,
  });

  // 3. Try to create a sales product with invalid shopping_mall_channel_id (empty string)
  const invalidCreateBody1 = {
    shopping_mall_channel_id: "",
    shopping_mall_seller_user_id: sellerUser.id,
    code: RandomGenerator.alphaNumeric(8),
    status: "active",
    name: RandomGenerator.paragraph({ sentences: 3, wordMin: 5, wordMax: 10 }),
    price: 10000,
  } satisfies IShoppingMallSale.ICreate;

  await TestValidator.error(
    "empty shopping_mall_channel_id should fail",
    async () => {
      await api.functional.shoppingMall.sellerUser.sales.create(connection, {
        body: invalidCreateBody1,
      });
    },
  );

  // 4. Try to create a sales product with invalid shopping_mall_seller_user_id (empty string)
  const invalidCreateBody2 = {
    shopping_mall_channel_id: typia.random<string & tags.Format<"uuid">>(),
    shopping_mall_seller_user_id: "",
    code: RandomGenerator.alphaNumeric(8),
    status: "active",
    name: RandomGenerator.paragraph({ sentences: 3, wordMin: 5, wordMax: 10 }),
    price: 10000,
  } satisfies IShoppingMallSale.ICreate;

  await TestValidator.error(
    "empty shopping_mall_seller_user_id should fail",
    async () => {
      await api.functional.shoppingMall.sellerUser.sales.create(connection, {
        body: invalidCreateBody2,
      });
    },
  );
}
