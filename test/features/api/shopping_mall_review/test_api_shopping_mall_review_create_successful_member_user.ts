import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";
import type { IShoppingMallReview } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallReview";

/**
 * This E2E test function validates the successful creation of a new product
 * review by an authenticated member user.
 *
 * It covers the entire workflow:
 *
 * 1. Member user account creation with valid credentials.
 * 2. User login to establish authorization context.
 * 3. Creation of a product review with necessary properties.
 * 4. Comprehensive assertions to ensure created review matches inputs and contains
 *    all mandatory response properties.
 *
 * The test maintains strict TypeScript typing, uses typia assertions for
 * response validation, and TestValidator to check business logic and data
 * consistency.
 */
export async function test_api_shopping_mall_review_create_successful_member_user(
  connection: api.IConnection,
) {
  // 1. Member user account creation
  const memberUserCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(10),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: RandomGenerator.mobile(),
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;

  const createdMemberUser = await api.functional.auth.memberUser.join(
    connection,
    {
      body: memberUserCreateBody,
    },
  );
  typia.assert(createdMemberUser);

  // 2. Login with same credentials
  const loginBody = {
    email: memberUserCreateBody.email,
    password: memberUserCreateBody.password_hash,
  } satisfies IShoppingMallMemberUser.ILogin;

  const loggedInMemberUser = await api.functional.auth.memberUser.login(
    connection,
    {
      body: loginBody,
    },
  );
  typia.assert(loggedInMemberUser);
  TestValidator.equals(
    "Logged in user id equals created member user id",
    loggedInMemberUser.id,
    createdMemberUser.id,
  );

  // 3. Create product review
  const reviewCreateBody = {
    rating: typia.random<
      number & tags.Type<"int32"> & tags.Minimum<1> & tags.Maximum<5>
    >(),
    review_title: RandomGenerator.paragraph({
      sentences: 3,
      wordMin: 5,
      wordMax: 10,
    }),
    review_body: RandomGenerator.content({
      paragraphs: 2,
      sentenceMin: 5,
      sentenceMax: 10,
      wordMin: 5,
      wordMax: 12,
    }),
    is_private: false,
  } satisfies IShoppingMallReview.ICreate;

  const createdReview =
    await api.functional.shoppingMall.memberUser.reviews.createReview(
      connection,
      { body: reviewCreateBody },
    );
  typia.assert(createdReview);

  // 4. Validate returned values
  TestValidator.predicate(
    "Created review id is UUID",
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      createdReview.id,
    ),
  );
  TestValidator.equals(
    "Review is linked to logged in member user",
    createdReview.shopping_mall_memberuserid,
    loggedInMemberUser.id,
  );
  TestValidator.equals(
    "Review title matches input",
    createdReview.review_title,
    reviewCreateBody.review_title,
  );
  TestValidator.equals(
    "Review body matches input",
    createdReview.review_body,
    reviewCreateBody.review_body,
  );
  TestValidator.equals(
    "Review rating matches input",
    createdReview.rating,
    reviewCreateBody.rating,
  );
  TestValidator.equals(
    "Review privacy flag matches input",
    createdReview.is_private,
    reviewCreateBody.is_private,
  );
  TestValidator.equals(
    "Review status defaults to 'pending'",
    createdReview.status,
    "pending",
  );
  TestValidator.predicate(
    "Review created_at is ISO 8601 date-time",
    !!createdReview.created_at.match(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/,
    ),
  );
  TestValidator.predicate(
    "Review updated_at is ISO 8601 date-time",
    !!createdReview.updated_at.match(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/,
    ),
  );
}
