import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallInquiry } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallInquiry";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

/**
 * Validate the update functionality of a product inquiry by a member user.
 *
 * This comprehensive test covers:
 *
 * 1. Member user account registration and authentication.
 * 2. Creation of a product inquiry by the member user.
 * 3. Successful update of the inquiry fields (title, body, privacy, status) by
 *    that user.
 * 4. Authorization check: ensure another member user cannot update the
 *    inquiry.
 * 5. Failure test: updating with a non-existent inquiry id should result in an
 *    error.
 *
 * Each step uses realistic and valid data matching the DTOs and API specs.
 * Responses from API are validated using typia.assert to ensure type
 * correctness. All required fields and proper value formats are ensured.
 * Authorization flows are tested by switching authenticated users via login
 * calls.
 */
export async function test_api_inquiries_update_member_success_and_authorization_errors(
  connection: api.IConnection,
) {
  // 1. Member user signs up and obtains authentication
  const memberUserOneEmail = typia.random<string & tags.Format<"email">>();
  const memberUserOnePassword = "P@ssw0rd123";
  const memberUserOne = await api.functional.auth.memberUser.join(connection, {
    body: {
      email: memberUserOneEmail,
      password_hash: memberUserOnePassword,
      nickname: RandomGenerator.name(),
      full_name: RandomGenerator.name(),
      phone_number: undefined,
      status: "active",
    } satisfies IShoppingMallMemberUser.ICreate,
  });
  typia.assert(memberUserOne);

  // 2. The member user creates a product inquiry
  const inquiryTitle = RandomGenerator.paragraph({
    sentences: 5,
    wordMin: 3,
    wordMax: 7,
  });
  const inquiryBody = RandomGenerator.content({
    paragraphs: 2,
    sentenceMin: 10,
    sentenceMax: 15,
    wordMin: 3,
    wordMax: 8,
  });
  const inquiryCreateRequest = {
    shopping_mall_channel_id: typia.random<string & tags.Format<"uuid">>(),
    shopping_mall_section_id: null,
    shopping_mall_category_id: null,
    shopping_mall_memberuserid: memberUserOne.id,
    shopping_mall_guestuserid: null,
    parent_inquiry_id: null,
    inquiry_title: inquiryTitle,
    inquiry_body: inquiryBody,
    is_private: false,
    is_answered: false,
    status: "open",
  } satisfies IShoppingMallInquiry.ICreate;
  const inquiry: IShoppingMallInquiry =
    await api.functional.shoppingMall.memberUser.inquiries.create(connection, {
      body: inquiryCreateRequest,
    });
  typia.assert(inquiry);
  TestValidator.equals(
    "created inquiry member ID matches",
    inquiry.shopping_mall_memberuserid,
    memberUserOne.id,
  );
  TestValidator.equals(
    "created inquiry title matches",
    inquiry.inquiry_title,
    inquiryTitle,
  );

  // 3. Update the inquiry by the owning member user - change title, body, is_private, and status
  const updatedTitle = RandomGenerator.paragraph({
    sentences: 6,
    wordMin: 4,
    wordMax: 8,
  });
  const updatedBody = RandomGenerator.content({
    paragraphs: 3,
    sentenceMin: 12,
    sentenceMax: 18,
    wordMin: 3,
    wordMax: 9,
  });
  const inquiryUpdateRequest: IShoppingMallInquiry.IUpdate = {
    inquiry_title: updatedTitle,
    inquiry_body: updatedBody,
    is_private: true,
    status: "closed",
    shopping_mall_channel_id: inquiry.shopping_mall_channel_id,
    shopping_mall_section_id: null,
    shopping_mall_category_id: null,
    shopping_mall_memberuserid: memberUserOne.id,
    shopping_mall_guestuserid: null,
    parent_inquiry_id: null,
    is_answered: true,
  };
  const updatedInquiry: IShoppingMallInquiry =
    await api.functional.shoppingMall.memberUser.inquiries.update(connection, {
      id: inquiry.id,
      body: inquiryUpdateRequest,
    });
  typia.assert(updatedInquiry);
  TestValidator.equals(
    "updated inquiry title matches",
    updatedInquiry.inquiry_title,
    updatedTitle,
  );
  TestValidator.equals(
    "updated inquiry body matches",
    updatedInquiry.inquiry_body,
    updatedBody,
  );
  TestValidator.equals(
    "updated inquiry is_private matches",
    updatedInquiry.is_private,
    true,
  );
  TestValidator.equals(
    "updated inquiry status matches",
    updatedInquiry.status,
    "closed",
  );

  // 4. Create another member user and attempt update on the first user inquiry - expect error (unauthorized)
  const memberUserTwoEmail = typia.random<string & tags.Format<"email">>();
  const memberUserTwoPassword = "P@ssw0rd123";
  const memberUserTwo = await api.functional.auth.memberUser.join(connection, {
    body: {
      email: memberUserTwoEmail,
      password_hash: memberUserTwoPassword,
      nickname: RandomGenerator.name(),
      full_name: RandomGenerator.name(),
      phone_number: undefined,
      status: "active",
    } satisfies IShoppingMallMemberUser.ICreate,
  });
  typia.assert(memberUserTwo);

  await TestValidator.error(
    "unauthorized update attempt by different member user",
    async () => {
      await api.functional.shoppingMall.memberUser.inquiries.update(
        connection,
        {
          id: inquiry.id,
          body: {
            inquiry_title: "Unauthorized update",
            inquiry_body: "This update should fail due to authorization",
            is_private: false,
            status: "open",
          } satisfies IShoppingMallInquiry.IUpdate,
        },
      );
    },
  );

  // 5. Attempt update on a non-existent inquiry ID - expect error
  await TestValidator.error(
    "update attempt on non-existent inquiry id throws error",
    async () => {
      await api.functional.shoppingMall.memberUser.inquiries.update(
        connection,
        {
          id: typia.random<string & tags.Format<"uuid">>(),
          body: {
            inquiry_title: "Invalid inquiry",
            inquiry_body: "Invalid inquiry id update",
            is_private: false,
            status: "open",
          } satisfies IShoppingMallInquiry.IUpdate,
        },
      );
    },
  );
}
