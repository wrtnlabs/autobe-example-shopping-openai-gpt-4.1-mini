import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallSellerResponse } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerResponse";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

export async function test_api_seller_response_retrieval_success(
  connection: api.IConnection,
) {
  // 1. Create seller user
  const sellerCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password: "P@ssword123!",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    phone_number: null,
    business_registration_number: `BRN${RandomGenerator.alphaNumeric(9).toUpperCase()}`,
  } satisfies IShoppingMallSellerUser.ICreate;
  const seller: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: sellerCreateBody,
    });
  typia.assert(seller);

  // 2. Login with seller user
  const loginBody = {
    email: sellerCreateBody.email,
    password: sellerCreateBody.password,
  } satisfies IShoppingMallSellerUser.ILogin;
  const loginResult: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.login(connection, {
      body: loginBody,
    });
  typia.assert(loginResult);

  // 3. Create seller response record
  // For linked inquiry and review, assign one as UUID and the other null explicitly
  const linkedInquiryId = typia.random<string & tags.Format<"uuid">>();
  const linkedReviewId = null;

  const responseCreateBody = {
    shopping_mall_inquiry_id: linkedInquiryId,
    shopping_mall_review_id: linkedReviewId,
    shopping_mall_selleruserid: seller.id,
    response_body: RandomGenerator.content({
      paragraphs: 1,
      sentenceMin: 5,
      sentenceMax: 7,
      wordMin: 3,
      wordMax: 7,
    }),
    is_private: false,
    status: "published",
  } satisfies IShoppingMallSellerResponse.ICreate;

  const createdResponse: IShoppingMallSellerResponse =
    await api.functional.shoppingMall.sellerUser.sellerResponses.create(
      connection,
      {
        body: responseCreateBody,
      },
    );
  typia.assert(createdResponse);

  // 4. Retrieve created seller response by ID
  const retrievedResponse: IShoppingMallSellerResponse =
    await api.functional.shoppingMall.sellerUser.sellerResponses.at(
      connection,
      {
        id: createdResponse.id,
      },
    );
  typia.assert(retrievedResponse);

  // 5. Validate retrieved data
  TestValidator.equals(
    "seller response ID matches",
    retrievedResponse.id,
    createdResponse.id,
  );
  TestValidator.equals(
    "seller user ID matches",
    retrievedResponse.shopping_mall_selleruserid,
    seller.id,
  );
  TestValidator.equals(
    "linked inquiry ID matches",
    retrievedResponse.shopping_mall_inquiry_id,
    linkedInquiryId,
  );
  TestValidator.equals(
    "linked review ID is null",
    retrievedResponse.shopping_mall_review_id,
    linkedReviewId,
  );
  TestValidator.equals(
    "response body matches",
    retrievedResponse.response_body,
    responseCreateBody.response_body,
  );
  TestValidator.equals(
    "is_private flag matches",
    retrievedResponse.is_private,
    responseCreateBody.is_private,
  );
  TestValidator.equals(
    "status matches",
    retrievedResponse.status,
    responseCreateBody.status,
  );
  TestValidator.predicate(
    "created_at is present and matches",
    typeof retrievedResponse.created_at === "string" &&
      retrievedResponse.created_at.length > 0,
  );
  TestValidator.predicate(
    "updated_at is present and matches",
    typeof retrievedResponse.updated_at === "string" &&
      retrievedResponse.updated_at.length > 0,
  );
}
