import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallInquiry } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallInquiry";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";
import type { IShoppingMallSale } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSale";
import type { IShoppingMallSellerResponse } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerResponse";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * Test successful deletion of a seller response by an authorized seller
 * user.
 *
 * This test implements the entire business workflow:
 *
 * 1. Register a seller user.
 * 2. Create a product for the seller user.
 * 3. Register a member user who will create inquiries.
 * 4. Create a product inquiry linked to the product by the member user.
 * 5. Create a seller response linked to the inquiry by the seller user.
 * 6. Delete the created seller response.
 *
 * It validates proper API functionality and type safety with real business
 * data, ensuring all required properties are present and formats are
 * correct.
 *
 * Authentication tokens are managed automatically by the SDK.
 */
export async function test_api_seller_response_deletion_success(
  connection: api.IConnection,
) {
  // 1. Seller user registration
  const sellerUserEmail: string = typia.random<string & tags.Format<"email">>();
  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: {
        email: sellerUserEmail,
        password: "P@ssword1234",
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        phone_number: RandomGenerator.mobile(),
        business_registration_number: RandomGenerator.alphaNumeric(10),
      } satisfies IShoppingMallSellerUser.ICreate,
    });
  typia.assert(sellerUser);

  // 2. Create product under seller user context
  const sale: IShoppingMallSale =
    await api.functional.shoppingMall.sellerUser.sales.create(connection, {
      body: {
        shopping_mall_channel_id: typia.random<string & tags.Format<"uuid">>(),
        shopping_mall_section_id: null,
        shopping_mall_seller_user_id: sellerUser.id,
        code: RandomGenerator.alphaNumeric(8),
        status: "active",
        name: RandomGenerator.name(),
        description: RandomGenerator.paragraph({ sentences: 5 }),
        price: 10000,
      } satisfies IShoppingMallSale.ICreate,
    });
  typia.assert(sale);

  // 3. Member user registration
  const memberUserEmail: string = typia.random<string & tags.Format<"email">>();
  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: {
        email: memberUserEmail,
        password_hash: "P@ssword1234",
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        phone_number: RandomGenerator.mobile(),
        status: "active",
      } satisfies IShoppingMallMemberUser.ICreate,
    });
  typia.assert(memberUser);

  // 4. Create product inquiry linked to the created product
  const inquiry: IShoppingMallInquiry =
    await api.functional.shoppingMall.memberUser.inquiries.create(connection, {
      body: {
        shopping_mall_channel_id: typia.random<string & tags.Format<"uuid">>(),
        shopping_mall_section_id: null,
        shopping_mall_category_id: null,
        shopping_mall_memberuserid: memberUser.id,
        shopping_mall_guestuserid: null,
        parent_inquiry_id: null,
        inquiry_title: RandomGenerator.paragraph({ sentences: 3 }),
        inquiry_body: RandomGenerator.content({ paragraphs: 1 }),
        is_private: false,
        is_answered: false,
        status: "open",
      } satisfies IShoppingMallInquiry.ICreate,
    });
  typia.assert(inquiry);

  // 5. Create seller response linked to the inquiry
  const sellerResponse: IShoppingMallSellerResponse =
    await api.functional.shoppingMall.sellerUser.sellerResponses.create(
      connection,
      {
        body: {
          shopping_mall_inquiry_id: inquiry.id,
          shopping_mall_review_id: null,
          shopping_mall_selleruserid: sellerUser.id,
          response_body: RandomGenerator.paragraph({ sentences: 4 }),
          is_private: false,
          status: "published",
        } satisfies IShoppingMallSellerResponse.ICreate,
      },
    );
  typia.assert(sellerResponse);

  // 6. Delete the created seller response
  await api.functional.shoppingMall.sellerUser.sellerResponses.eraseSellerResponse(
    connection,
    {
      id: sellerResponse.id,
    },
  );
}
