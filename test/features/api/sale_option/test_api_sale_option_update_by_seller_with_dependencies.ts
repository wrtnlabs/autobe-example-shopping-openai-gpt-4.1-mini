import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallSaleOption } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleOption";
import type { IShoppingMallSaleOptionGroup } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleOptionGroup";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

export async function test_api_sale_option_update_by_seller_with_dependencies(
  connection: api.IConnection,
) {
  // 1. Create seller user and authenticate
  const sellerUserCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password: "P@ssword123!",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: RandomGenerator.mobile(),
    business_registration_number:
      RandomGenerator.alphaNumeric(10).toUpperCase(),
  } satisfies IShoppingMallSellerUser.ICreate;

  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: sellerUserCreateBody,
    });
  typia.assert(sellerUser);

  // 2. Create admin user and authenticate
  const adminUserCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: "HashedAdminPass123!",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;

  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminUserCreateBody,
    });
  typia.assert(adminUser);

  // 3. Admin creates sale option group
  const saleOptionGroupCreateBody = {
    code: RandomGenerator.alphaNumeric(6).toUpperCase(),
    name: RandomGenerator.name(2),
  } satisfies IShoppingMallSaleOptionGroup.ICreate;

  const saleOptionGroup: IShoppingMallSaleOptionGroup =
    await api.functional.shoppingMall.adminUser.saleOptionGroups.create(
      connection,
      {
        body: saleOptionGroupCreateBody,
      },
    );
  typia.assert(saleOptionGroup);

  // 4. Admin creates sale option
  const saleOptionCreateBody = {
    shopping_mall_sale_option_group_id: saleOptionGroup.id,
    code: RandomGenerator.alphaNumeric(5).toUpperCase(),
    name: RandomGenerator.name(1),
    type: RandomGenerator.pick(["selection", "boolean", "text"] as const),
  } satisfies IShoppingMallSaleOption.ICreate;

  const saleOption: IShoppingMallSaleOption =
    await api.functional.shoppingMall.adminUser.saleOptions.create(connection, {
      body: saleOptionCreateBody,
    });
  typia.assert(saleOption);

  // 5. Seller user login
  const sellerUserLoginBody = {
    email: sellerUser.email,
    password: sellerUserCreateBody.password,
  } satisfies IShoppingMallSellerUser.ILogin;

  const sellerUserAfterLogin: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.login(connection, {
      body: sellerUserLoginBody,
    });
  typia.assert(sellerUserAfterLogin);

  // 6. Update sale option by seller
  const updatedSaleOptionBody = {
    shopping_mall_sale_option_group_id: saleOptionGroup.id,
    code: RandomGenerator.alphaNumeric(6).toUpperCase(),
    name: RandomGenerator.name(2),
    type: RandomGenerator.pick(["selection", "boolean", "text"] as const),
  } satisfies IShoppingMallSaleOption.IUpdate;

  const updatedSaleOption: IShoppingMallSaleOption =
    await api.functional.shoppingMall.sellerUser.saleOptions.update(
      connection,
      {
        saleOptionId: saleOption.id,
        body: updatedSaleOptionBody,
      },
    );
  typia.assert(updatedSaleOption);

  // Validate that the sale option ID stays the same
  TestValidator.equals(
    "sale option id remains unchanged",
    updatedSaleOption.id,
    saleOption.id,
  );

  // Validate updated group ID
  TestValidator.equals(
    "sale option group id updated",
    updatedSaleOption.shopping_mall_sale_option_group_id,
    updatedSaleOptionBody.shopping_mall_sale_option_group_id,
  );

  // Validate updated code
  TestValidator.equals(
    "sale option code updated",
    updatedSaleOption.code,
    updatedSaleOptionBody.code,
  );

  // Validate updated name
  TestValidator.equals(
    "sale option name updated",
    updatedSaleOption.name,
    updatedSaleOptionBody.name,
  );

  // Validate updated type
  TestValidator.equals(
    "sale option type updated",
    updatedSaleOption.type,
    updatedSaleOptionBody.type,
  );

  // Validate timestamps are proper ISO8601 date-times
  TestValidator.predicate(
    "created_at is ISO date-time",
    /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9:.]+Z$/.test(updatedSaleOption.created_at),
  );

  TestValidator.predicate(
    "updated_at is ISO date-time",
    /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9:.]+Z$/.test(updatedSaleOption.updated_at),
  );
}
