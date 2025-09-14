import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallInquiry } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallInquiry";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

/**
 * This test validates the deletion of a product inquiry by a member user who
 * owns it. It tests successful deletion and authorization errors when other
 * users attempt deletion.
 *
 * Steps:
 *
 * 1. Create member user A (inquiry owner).
 * 2. User A creates a product inquiry.
 * 3. User A deletes the inquiry successfully.
 * 4. Attempt to delete again (should fail).
 * 5. Create member user B.
 * 6. User B attempts deletion of user A's inquiry (should fail authorization).
 */
export async function test_api_inquiries_delete_member_success_and_authorization_errors(
  connection: api.IConnection,
) {
  // Step 1: Member user A joins
  const memberUserAEmail = typia.random<string & tags.Format<"email">>();
  const memberUserAJoinBody = {
    email: memberUserAEmail,
    password_hash: "validpassword123",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    phone_number: null,
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;
  const memberUserA = await api.functional.auth.memberUser.join(connection, {
    body: memberUserAJoinBody,
  });
  typia.assert(memberUserA);

  // Step 2: Member user A creates a product inquiry
  const inquiryCreateBody = {
    shopping_mall_channel_id: typia.random<string & tags.Format<"uuid">>(),
    shopping_mall_section_id: null,
    shopping_mall_category_id: null,
    shopping_mall_memberuserid: memberUserA.id,
    shopping_mall_guestuserid: null,
    parent_inquiry_id: null,
    inquiry_title: RandomGenerator.paragraph({
      sentences: 3,
      wordMin: 5,
      wordMax: 10,
    }),
    inquiry_body: RandomGenerator.content({ paragraphs: 2 }),
    is_private: false,
    is_answered: false,
    status: "open",
  } satisfies IShoppingMallInquiry.ICreate;
  const inquiry = await api.functional.shoppingMall.memberUser.inquiries.create(
    connection,
    {
      body: inquiryCreateBody,
    },
  );
  typia.assert(inquiry);

  TestValidator.equals(
    "inquiry member user id matches creator",
    inquiry.shopping_mall_memberuserid,
    memberUserA.id,
  );
  TestValidator.equals("inquiry status open", inquiry.status, "open");
  TestValidator.predicate(
    "inquiry deleted_at is null initially",
    inquiry.deleted_at === null || inquiry.deleted_at === undefined,
  );

  // Step 3: Member user A deletes the inquiry successfully
  await api.functional.shoppingMall.memberUser.inquiries.erase(connection, {
    id: inquiry.id,
  });

  // After deletion, attempt to delete again should fail
  await TestValidator.error(
    "deleting already deleted inquiry fails",
    async () => {
      await api.functional.shoppingMall.memberUser.inquiries.erase(connection, {
        id: inquiry.id,
      });
    },
  );

  // Step 5: Create Member user B (different user)
  const memberUserBEmail = typia.random<string & tags.Format<"email">>();
  const memberUserBJoinBody = {
    email: memberUserBEmail,
    password_hash: "validpassword123",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    phone_number: null,
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;
  const memberUserB = await api.functional.auth.memberUser.join(connection, {
    body: memberUserBJoinBody,
  });
  typia.assert(memberUserB);

  // Step 6: Member user B tries to delete the inquiry created by A - should fail authorization
  await TestValidator.error(
    "member user B should not delete member user A's inquiry",
    async () => {
      await api.functional.shoppingMall.memberUser.inquiries.erase(connection, {
        id: inquiry.id,
      });
    },
  );
}
