import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";
import type { IShoppingMallReview } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallReview";

/**
 * This E2E test verifies that creating a product review without proper
 * authentication fails as expected, validating authorization enforcement.
 *
 * The test first performs the required member user account registration (join)
 * to establish the user account context, but does not authenticate or provide a
 * valid token for the review creation request.
 *
 * It then attempts to create a product review via POST
 * /shoppingMall/memberUser/reviews using valid review data while intentionally
 * using an unauthenticated connection. It expects the operation to throw an
 * authorization error.
 *
 * This ensures that only authenticated member users can create product reviews,
 * safeguarding system integrity.
 */
export async function test_api_shopping_mall_review_create_unauthorized_error(
  connection: api.IConnection,
) {
  // 0. Create a member user account to satisfy dependency
  const memberUserEmail = typia.random<string & tags.Format<"email">>();
  const memberUserPassword = RandomGenerator.alphaNumeric(10);
  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: {
        email: memberUserEmail,
        password_hash: memberUserPassword,
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        phone_number: null,
        status: "active",
      } satisfies IShoppingMallMemberUser.ICreate,
    });
  typia.assert(memberUser);

  // 1. Prepare a valid product review creation payload
  const reviewToCreate = {
    review_title: RandomGenerator.paragraph({
      sentences: 3,
      wordMin: 5,
      wordMax: 10,
    }),
    review_body: RandomGenerator.content({
      paragraphs: 1,
      sentenceMin: 5,
      sentenceMax: 10,
      wordMin: 5,
      wordMax: 10,
    }),
    rating: 5,
    is_private: false,
  } satisfies IShoppingMallReview.ICreate;

  // 2. Use a clone of connection without authentication headers to simulate unauthorized
  const unauthenticatedConnection: api.IConnection = {
    ...connection,
    headers: {},
  };

  // 3. Attempt to createReview with unauthorized connection and expect error
  await TestValidator.error(
    "Creating review without authentication should fail",
    async () => {
      await api.functional.shoppingMall.memberUser.reviews.createReview(
        unauthenticatedConnection,
        {
          body: reviewToCreate,
        },
      );
    },
  );
}
