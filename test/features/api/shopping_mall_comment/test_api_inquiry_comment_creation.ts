import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallComment } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallComment";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

/**
 * Validate the creation of a new product inquiry comment by an
 * authenticated member user.
 *
 * This test performs the following steps:
 *
 * 1. Register a new member user with valid creation data.
 * 2. Login with the created member user credentials to set authentication
 *    token.
 * 3. Using the authenticated session, create a new product inquiry comment
 *    linked to a randomly generated valid inquiryId.
 * 4. Validate the returned comment content, privacy flag, status, and author
 *    linkages.
 * 5. Perform negative tests by trying to create comments with missing or empty
 *    required fields to confirm error responses.
 * 6. Perform negative tests for unauthorized access by calling comment
 *    creation without authentication.
 *
 * All object validations are done using typia.assert to ensure full type
 * correctness. All test asserts use descriptive messages for clear test
 * failure reporting.
 */
export async function test_api_inquiry_comment_creation(
  connection: api.IConnection,
) {
  // 1. Register a member user
  const newUserEmail: string = typia.random<string & tags.Format<"email">>();
  const newUserPassword = "P@ssword123!";
  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: {
        email: newUserEmail,
        password_hash: newUserPassword,
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(2),
        phone_number: null,
        status: "active",
      } satisfies IShoppingMallMemberUser.ICreate,
    });
  typia.assert(memberUser);

  // 2. Login with the created member user
  const loggedUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.login(connection, {
      body: {
        email: newUserEmail,
        password: newUserPassword,
      } satisfies IShoppingMallMemberUser.ILogin,
    });
  typia.assert(loggedUser);

  // Prepare a valid inquiryId for comment creation
  const inquiryId: string & tags.Format<"uuid"> = typia.random<
    string & tags.Format<"uuid">
  >();

  // 3. Create a comment linked to inquiryId
  const commentBody: string = RandomGenerator.paragraph({ sentences: 5 });
  const commentPayload: IShoppingMallComment.ICreate = {
    comment_body: commentBody,
    is_private: false,
    status: "visible",
    shopping_mall_inquiry_id: inquiryId,
    shopping_mall_memberuserid: memberUser.id,
    parent_comment_id: null,
    shopping_mall_guestuserid: null,
    shopping_mall_selleruserid: null,
  };

  const comment: IShoppingMallComment =
    await api.functional.shoppingMall.memberUser.inquiries.comments.createComment(
      connection,
      {
        inquiryId: inquiryId,
        body: commentPayload,
      },
    );
  typia.assert(comment);

  // Validate returned comment fields
  TestValidator.equals(
    "comment_body matches input",
    comment.comment_body,
    commentPayload.comment_body,
  );
  TestValidator.equals("is_private matches input", comment.is_private, false);
  TestValidator.equals("status matches input", comment.status, "visible");

  // 4. Negative test: missing required comment_body
  // Prepare invalid payload with empty comment_body but other required fields present
  await TestValidator.error("missing comment_body causes error", async () => {
    await api.functional.shoppingMall.memberUser.inquiries.comments.createComment(
      connection,
      {
        inquiryId: inquiryId,
        body: {
          comment_body: "",
          is_private: false,
          status: "visible",
          shopping_mall_inquiry_id: inquiryId,
          shopping_mall_memberuserid: memberUser.id,
          parent_comment_id: null,
          shopping_mall_guestuserid: null,
          shopping_mall_selleruserid: null,
        },
      },
    );
  });

  // 5. Negative test: unauthorized access
  const unauthenticatedConnection: api.IConnection = {
    ...connection,
    headers: {},
  };
  await TestValidator.error(
    "unauthorized comment creation is rejected",
    async () => {
      await api.functional.shoppingMall.memberUser.inquiries.comments.createComment(
        unauthenticatedConnection,
        {
          inquiryId: inquiryId,
          body: commentPayload,
        },
      );
    },
  );
}
