import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallInquiry } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallInquiry";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

/**
 * Test detailed retrieval of a product inquiry by admin user including
 * success and error scenarios.
 *
 * This comprehensive E2E test covers multiple steps to ensure the inquiry
 * retrieval endpoint works as expected.
 *
 * 1. Admin user joins and authenticates.
 * 2. Admin user logs in to obtain valid auth token.
 * 3. Member user joins and authenticates.
 * 4. Member user logs in to obtain valid auth token.
 * 5. Member user creates a product inquiry with realistic data.
 * 6. Admin user retrieves inquiry details successfully by inquiry ID.
 * 7. Validates returned inquiry data for correctness including privacy flag
 *    and content.
 * 8. Attempts retrieval with invalid (non-existent) inquiry ID.
 * 9. Attempts unauthorized retrieval (without admin authentication).
 *
 * Each step validates API responses using typia.assert and TestValidator to
 * ensure strict type safety and business logic validation.
 */
export async function test_api_inquiries_retrieve_detail_admin_success_and_failure(
  connection: api.IConnection,
) {
  // 1. Admin user joins the system
  const adminJoinBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(16),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;

  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminJoinBody,
    });
  typia.assert(adminUser);

  // 2. Admin user logs in
  await api.functional.auth.adminUser.login(connection, {
    body: {
      email: adminJoinBody.email,
      password_hash: adminJoinBody.password_hash,
    } satisfies IShoppingMallAdminUser.ILogin,
  });

  // 3. Member user joins the system
  const memberJoinBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(16),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: RandomGenerator.mobile(),
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;

  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: memberJoinBody,
    });
  typia.assert(memberUser);

  // 4. Member user logs in
  await api.functional.auth.memberUser.login(connection, {
    body: {
      email: memberJoinBody.email,
      password: memberJoinBody.password_hash,
    } satisfies IShoppingMallMemberUser.ILogin,
  });

  // 5. Member user creates a product inquiry
  const inquiryCreateBody = {
    shopping_mall_channel_id: typia.random<string & tags.Format<"uuid">>(),
    shopping_mall_section_id: null,
    shopping_mall_category_id: null,
    shopping_mall_memberuserid: memberUser.id,
    inquiry_title: RandomGenerator.paragraph({
      sentences: 3,
      wordMin: 3,
      wordMax: 7,
    }),
    inquiry_body: RandomGenerator.content({
      paragraphs: 1,
      sentenceMin: 5,
      sentenceMax: 10,
    }),
    is_private: RandomGenerator.pick([true, false] as const),
    status: "open",
  } satisfies IShoppingMallInquiry.ICreate;

  const createdInquiry: IShoppingMallInquiry =
    await api.functional.shoppingMall.memberUser.inquiries.create(connection, {
      body: inquiryCreateBody,
    });
  typia.assert(createdInquiry);

  // 6. Admin user retrieves inquiry detail by ID successfully
  const retrievedInquiry: IShoppingMallInquiry =
    await api.functional.shoppingMall.adminUser.inquiries.at(connection, {
      id: createdInquiry.id,
    });
  typia.assert(retrievedInquiry);

  // Validation of retrieved inquiry matches created inquiry
  TestValidator.equals(
    "inquiry id matches",
    retrievedInquiry.id,
    createdInquiry.id,
  );
  TestValidator.equals(
    "inquiry title matches",
    retrievedInquiry.inquiry_title,
    inquiryCreateBody.inquiry_title,
  );
  TestValidator.equals(
    "inquiry body matches",
    retrievedInquiry.inquiry_body,
    inquiryCreateBody.inquiry_body,
  );
  TestValidator.equals(
    "inquiry privacy flag matches",
    retrievedInquiry.is_private,
    inquiryCreateBody.is_private,
  );
  TestValidator.equals(
    "inquiry status matches",
    retrievedInquiry.status,
    inquiryCreateBody.status,
  );
  TestValidator.equals(
    "inquiry member user ID matches",
    retrievedInquiry.shopping_mall_memberuserid,
    memberUser.id,
  );

  // 7. Attempt retrieval with non-existent inquiry ID
  await TestValidator.error(
    "retrieval with non-existent inquiry ID should fail",
    async () => {
      await api.functional.shoppingMall.adminUser.inquiries.at(connection, {
        id: typia.random<string & tags.Format<"uuid">>(),
      });
    },
  );

  // 8. Test unauthorized retrieval attempt
  // Create a new connection without auth headers
  const unauthenticatedConnection: api.IConnection = {
    ...connection,
    headers: {},
  };

  await TestValidator.error(
    "unauthorized retrieval attempt should fail",
    async () => {
      await api.functional.shoppingMall.adminUser.inquiries.at(
        unauthenticatedConnection,
        {
          id: createdInquiry.id,
        },
      );
    },
  );
}
