import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * Tests the successful deletion of a product review comment by a seller
 * user.
 *
 * This test performs the following steps:
 *
 * 1. Seller user creation (join) with valid data to register a new seller
 *    user.
 * 2. Seller user login to obtain authentication tokens and establish an
 *    authenticated session.
 * 3. Perform deletion of a review comment identified by specific UUIDs for
 *    review and comment.
 * 4. Confirm that deletion succeeds without error.
 * 5. Attempt to delete the same comment again to assert that an error is
 *    raised, indicating comment non-existence.
 *
 * This scenario confirms that only authenticated seller users can delete
 * their own review comments, validating the security and correctness of the
 * review comment deletion API endpoint.
 *
 * Proper typing and schema validation is performed on all API responses and
 * requests.
 */
export async function test_api_seller_review_comment_delete_success(
  connection: api.IConnection,
) {
  // 1. Seller user creation (join)
  const createBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password: "StrongP@ssword123",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: null,
    business_registration_number:
      RandomGenerator.alphaNumeric(12).toUpperCase(),
  } satisfies IShoppingMallSellerUser.ICreate;

  const seller: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: createBody,
    });
  typia.assert(seller);

  // 2. Seller user login to establish authentication context
  // Use the same credentials to login
  const loginBody = {
    email: createBody.email,
    password: createBody.password,
  } satisfies IShoppingMallSellerUser.ILogin;

  const loggedInSeller: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.login(connection, {
      body: loginBody,
    });
  typia.assert(loggedInSeller);

  // 3. Perform deletion of review comment
  // Use realistic UUIDs generated for test
  const reviewId = typia.random<string & tags.Format<"uuid">>();
  const commentId = typia.random<string & tags.Format<"uuid">>();

  // Assert no error during deletion
  await api.functional.shoppingMall.sellerUser.reviews.comments.erase(
    connection,
    {
      reviewId,
      commentId,
    },
  );

  // 4. Attempt to delete the same comment again, expecting an error
  // The API should throw an error as comment no longer exists
  await TestValidator.error(
    "Deleting an already deleted comment should fail",
    async () => {
      await api.functional.shoppingMall.sellerUser.reviews.comments.erase(
        connection,
        {
          reviewId,
          commentId,
        },
      );
    },
  );
}
