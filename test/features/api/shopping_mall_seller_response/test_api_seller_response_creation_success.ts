import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallSellerResponse } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerResponse";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * This E2E test validates the successful creation of a seller response linked
 * to either an inquiry or a review within a shopping mall backend system.
 *
 * The test flow covers:
 *
 * 1. Seller user account creation
 * 2. Seller user login
 * 3. Seller response creation linked to inquiry (with review ID null)
 * 4. Seller response creation linked to review (with inquiry ID null)
 * 5. Validation of response integrity and type correctness
 */
export async function test_api_seller_response_creation_success(
  connection: api.IConnection,
) {
  // 1. Seller user account creation with valid random data
  const sellerUserCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password: "P@ssw0rd123", // Fixed password for test
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: RandomGenerator.mobile(),
    business_registration_number: RandomGenerator.alphaNumeric(12),
  } satisfies IShoppingMallSellerUser.ICreate;

  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: sellerUserCreateBody,
    });
  typia.assert(sellerUser);

  // 2. Seller user login using the created email and password
  const sellerUserLoginBody = {
    email: sellerUserCreateBody.email,
    password: sellerUserCreateBody.password,
  } satisfies IShoppingMallSellerUser.ILogin;

  const loggedInSellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.login(connection, {
      body: sellerUserLoginBody,
    });
  typia.assert(loggedInSellerUser);

  // 3a. Create seller response linked to inquiry, review ID null
  const inquiryLinkedResponseBody = {
    shopping_mall_selleruserid: loggedInSellerUser.id,
    response_body: RandomGenerator.paragraph({ sentences: 5 }),
    is_private: false,
    status: "published",
    shopping_mall_inquiry_id: typia.random<string & tags.Format<"uuid">>(),
    shopping_mall_review_id: null,
  } satisfies IShoppingMallSellerResponse.ICreate;

  const inquiryLinkedResponse: IShoppingMallSellerResponse =
    await api.functional.shoppingMall.sellerUser.sellerResponses.create(
      connection,
      {
        body: inquiryLinkedResponseBody,
      },
    );
  typia.assert(inquiryLinkedResponse);

  TestValidator.equals(
    "seller ID matches in inquiry linked response",
    inquiryLinkedResponse.shopping_mall_selleruserid,
    inquiryLinkedResponseBody.shopping_mall_selleruserid,
  );
  TestValidator.equals(
    "response body matches inquiry linked response",
    inquiryLinkedResponse.response_body,
    inquiryLinkedResponseBody.response_body,
  );
  TestValidator.equals(
    "is_private flag matches inquiry linked response",
    inquiryLinkedResponse.is_private,
    inquiryLinkedResponseBody.is_private,
  );
  TestValidator.equals(
    "status matches inquiry linked response",
    inquiryLinkedResponse.status,
    inquiryLinkedResponseBody.status,
  );
  TestValidator.equals(
    "shopping_mall_inquiry_id matches",
    inquiryLinkedResponse.shopping_mall_inquiry_id,
    inquiryLinkedResponseBody.shopping_mall_inquiry_id,
  );
  TestValidator.equals(
    "shopping_mall_review_id is null",
    inquiryLinkedResponse.shopping_mall_review_id,
    null,
  );

  // 3b. Create seller response linked to review, inquiry ID null
  const reviewLinkedResponseBody = {
    shopping_mall_selleruserid: loggedInSellerUser.id,
    response_body: RandomGenerator.paragraph({ sentences: 3 }),
    is_private: true,
    status: "published",
    shopping_mall_inquiry_id: null,
    shopping_mall_review_id: typia.random<string & tags.Format<"uuid">>(),
  } satisfies IShoppingMallSellerResponse.ICreate;

  const reviewLinkedResponse: IShoppingMallSellerResponse =
    await api.functional.shoppingMall.sellerUser.sellerResponses.create(
      connection,
      {
        body: reviewLinkedResponseBody,
      },
    );
  typia.assert(reviewLinkedResponse);

  TestValidator.equals(
    "seller ID matches in review linked response",
    reviewLinkedResponse.shopping_mall_selleruserid,
    reviewLinkedResponseBody.shopping_mall_selleruserid,
  );
  TestValidator.equals(
    "response body matches review linked response",
    reviewLinkedResponse.response_body,
    reviewLinkedResponseBody.response_body,
  );
  TestValidator.equals(
    "is_private flag matches review linked response",
    reviewLinkedResponse.is_private,
    reviewLinkedResponseBody.is_private,
  );
  TestValidator.equals(
    "status matches review linked response",
    reviewLinkedResponse.status,
    reviewLinkedResponseBody.status,
  );
  TestValidator.equals(
    "shopping_mall_inquiry_id is null",
    reviewLinkedResponse.shopping_mall_inquiry_id,
    null,
  );
  TestValidator.equals(
    "shopping_mall_review_id matches",
    reviewLinkedResponse.shopping_mall_review_id,
    reviewLinkedResponseBody.shopping_mall_review_id,
  );
}
