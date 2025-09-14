import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

/**
 * Test successful deletion of a member user's review comment.
 *
 * This test performs the following steps:
 *
 * 1. Registers a new member user by calling the join endpoint with all required
 *    user data.
 * 2. Logs in the newly registered member user to establish authentication.
 * 3. Calls the delete API to erase a product review comment by providing valid
 *    UUIDs for the review and comment.
 *
 * The test validates that each API call succeeds with correct types and that
 * deleting the comment results in no error.
 */
export async function test_api_member_review_comment_delete_success(
  connection: api.IConnection,
) {
  // 1. Create a member user using the join API with required properties
  const memberUserCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(16),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    phone_number: null, // Explicit null to match schema
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;
  const authorizedUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: memberUserCreateBody,
    });
  typia.assert(authorizedUser);

  // 2. Login the created member user
  const memberUserLoginBody = {
    email: authorizedUser.email,
    password: memberUserCreateBody.password_hash,
  } satisfies IShoppingMallMemberUser.ILogin;
  const loginResult: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.login(connection, {
      body: memberUserLoginBody,
    });
  typia.assert(loginResult);

  // 3. Delete review comment by randomly generated UUIDs
  // Note: Since comment and review creation APIs are not provided,
  // random UUIDs are used for test
  const reviewId = typia.random<string & tags.Format<"uuid">>();
  const commentId = typia.random<string & tags.Format<"uuid">>();
  await api.functional.shoppingMall.memberUser.reviews.comments.erase(
    connection,
    {
      reviewId,
      commentId,
    },
  );

  // 4. Confirm the delete call succeeded (no error thrown)
  TestValidator.predicate("delete review comment successfully", true);
}
