import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallSellerResponse } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerResponse";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * This test validates the successful update flow of a seller response by a
 * seller user.
 *
 * First, a seller user account is created with valid data using the join
 * API. The user then logs in to establish an authenticated session. A
 * seller response is created with references explicitly set to null for
 * inquiry and review links. The created response's details are asserted.
 * Then the seller response is updated with new body content, toggled
 * privacy setting, and status changed. Assertions confirm that updates are
 * persisted and all fields comply with the schema.
 *
 * All API calls are awaited and response data validated with typia.assert.
 * TestValidator assertions ensure correct workflow and data consistency.
 */
export async function test_api_seller_response_update_success(
  connection: api.IConnection,
) {
  // 1. Create a new seller user
  const sellerCreateBody = {
    email: `seller_${RandomGenerator.alphaNumeric(8)}@example.com`,
    password: "StrongPassw0rd!",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: RandomGenerator.mobile(),
    business_registration_number: `BRN${RandomGenerator.alphaNumeric(9)}`,
  } satisfies IShoppingMallSellerUser.ICreate;
  const seller: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: sellerCreateBody,
    });
  typia.assert(seller);

  // 2. Login with the same seller credentials
  const sellerLoginBody = {
    email: sellerCreateBody.email,
    password: sellerCreateBody.password,
  } satisfies IShoppingMallSellerUser.ILogin;
  const login: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.login(connection, {
      body: sellerLoginBody,
    });
  typia.assert(login);

  // 3. Create a seller response with null inquiry and review references
  const sellerResponseCreateBody = {
    shopping_mall_inquiry_id: null,
    shopping_mall_review_id: null,
    shopping_mall_selleruserid: seller.id,
    response_body: "Initial response content.",
    is_private: RandomGenerator.pick([true, false] as const),
    status: "published",
  } satisfies IShoppingMallSellerResponse.ICreate;
  const sellerResponse: IShoppingMallSellerResponse =
    await api.functional.shoppingMall.sellerUser.sellerResponses.create(
      connection,
      {
        body: sellerResponseCreateBody,
      },
    );
  typia.assert(sellerResponse);
  TestValidator.equals(
    "created response body matches input",
    sellerResponse.response_body,
    sellerResponseCreateBody.response_body,
  );
  TestValidator.equals(
    "created response seller user ID matches input",
    sellerResponse.shopping_mall_selleruserid,
    sellerResponseCreateBody.shopping_mall_selleruserid,
  );

  // 4. Update the seller response with new content
  const sellerResponseUpdateBody = {
    response_body: "Updated response content.",
    is_private: !sellerResponse.is_private,
    status: "archived",
  } satisfies IShoppingMallSellerResponse.IUpdate;
  const updatedSellerResponse: IShoppingMallSellerResponse =
    await api.functional.shoppingMall.sellerUser.sellerResponses.updateSellerResponse(
      connection,
      {
        id: sellerResponse.id,
        body: sellerResponseUpdateBody,
      },
    );
  typia.assert(updatedSellerResponse);

  TestValidator.equals(
    "updated response body matches update",
    updatedSellerResponse.response_body,
    sellerResponseUpdateBody.response_body,
  );
  TestValidator.equals(
    "updated is_private toggled",
    updatedSellerResponse.is_private,
    sellerResponseUpdateBody.is_private,
  );
  TestValidator.equals(
    "updated status matches",
    updatedSellerResponse.status,
    sellerResponseUpdateBody.status,
  );

  TestValidator.equals(
    "unchanged inquiry ID remains",
    updatedSellerResponse.shopping_mall_inquiry_id,
    sellerResponse.shopping_mall_inquiry_id,
  );
  TestValidator.equals(
    "unchanged review ID remains",
    updatedSellerResponse.shopping_mall_review_id,
    sellerResponse.shopping_mall_review_id,
  );
  TestValidator.equals(
    "seller user ID remains same",
    updatedSellerResponse.shopping_mall_selleruserid,
    sellerResponse.shopping_mall_selleruserid,
  );
}
