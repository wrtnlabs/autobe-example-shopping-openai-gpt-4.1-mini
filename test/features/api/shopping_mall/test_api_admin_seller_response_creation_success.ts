import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallSellerResponse } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerResponse";

export async function test_api_admin_seller_response_creation_success(
  connection: api.IConnection,
) {
  // 1. Create an admin user
  const adminUserCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(64),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;

  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminUserCreateBody,
    });
  typia.assert(adminUser);

  // 2. Login as the created admin user
  const adminUserLoginBody = {
    email: adminUser.email,
    password_hash: adminUserCreateBody.password_hash,
  } satisfies IShoppingMallAdminUser.ILogin;

  const loggedInAdmin: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.login(connection, {
      body: adminUserLoginBody,
    });
  typia.assert(loggedInAdmin);

  // 3. Create seller response
  const sellerResponseCreateBody = {
    shopping_mall_selleruserid: typia.random<string & tags.Format<"uuid">>(),
    response_body: RandomGenerator.paragraph({
      sentences: 5,
      wordMin: 4,
      wordMax: 8,
    }),
    is_private: RandomGenerator.pick([true, false] as const),
    status: "published",
    shopping_mall_inquiry_id: null,
    shopping_mall_review_id: null,
  } satisfies IShoppingMallSellerResponse.ICreate;

  const sellerResponse: IShoppingMallSellerResponse =
    await api.functional.shoppingMall.adminUser.sellerResponses.create(
      connection,
      { body: sellerResponseCreateBody },
    );
  typia.assert(sellerResponse);

  // 4. Validation
  TestValidator.equals(
    "selleruserid matches",
    sellerResponse.shopping_mall_selleruserid,
    sellerResponseCreateBody.shopping_mall_selleruserid,
  );
  TestValidator.equals(
    "response_body matches",
    sellerResponse.response_body,
    sellerResponseCreateBody.response_body,
  );
  TestValidator.equals(
    "is_private matches",
    sellerResponse.is_private,
    sellerResponseCreateBody.is_private,
  );
  TestValidator.equals(
    "status matches",
    sellerResponse.status,
    sellerResponseCreateBody.status,
  );
  TestValidator.equals(
    "shopping_mall_inquiry_id is null",
    sellerResponse.shopping_mall_inquiry_id,
    null,
  );
  TestValidator.equals(
    "shopping_mall_review_id is null",
    sellerResponse.shopping_mall_review_id,
    null,
  );
}
