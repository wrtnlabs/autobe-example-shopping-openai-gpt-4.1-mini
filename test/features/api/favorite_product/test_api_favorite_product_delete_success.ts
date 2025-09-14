import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallCategory } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCategory";
import type { IShoppingMallChannel } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallChannel";
import type { IShoppingMallFavoriteProduct } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallFavoriteProduct";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";
import type { IShoppingMallSale } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSale";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

export async function test_api_favorite_product_delete_success(
  connection: api.IConnection,
) {
  // 1. Admin User creation and authentication
  const adminUserEmail = typia.random<string & tags.Format<"email">>();
  const adminUserPassword = "StrongPass123@";
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: adminUserEmail,
        password_hash: adminUserPassword,
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        status: "active",
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser);

  // 2. Create product category by Admin user
  const category: IShoppingMallCategory =
    await api.functional.shoppingMall.adminUser.categories.create(connection, {
      body: {
        code: RandomGenerator.alphaNumeric(6),
        name: RandomGenerator.name(),
        status: "active",
        description: RandomGenerator.paragraph({ sentences: 2 }),
      } satisfies IShoppingMallCategory.ICreate,
    });
  typia.assert(category);

  // 3. Create product channel by Admin user
  const channel: IShoppingMallChannel =
    await api.functional.shoppingMall.adminUser.channels.create(connection, {
      body: {
        code: RandomGenerator.alphaNumeric(6),
        name: RandomGenerator.name(),
        status: "active",
        description: RandomGenerator.paragraph({ sentences: 2 }),
      } satisfies IShoppingMallChannel.ICreate,
    });
  typia.assert(channel);

  // 4. Seller user creation and authentication
  const sellerUserEmail = typia.random<string & tags.Format<"email">>();
  const sellerUserPassword = "SecurePass456@";
  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: {
        email: sellerUserEmail,
        password: sellerUserPassword,
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        phone_number: RandomGenerator.mobile(),
        business_registration_number: RandomGenerator.alphaNumeric(10),
      } satisfies IShoppingMallSellerUser.ICreate,
    });
  typia.assert(sellerUser);

  // 5. Create product sale by seller user
  const sale: IShoppingMallSale =
    await api.functional.shoppingMall.sellerUser.sales.create(connection, {
      body: {
        shopping_mall_channel_id: channel.id,
        shopping_mall_section_id: null,
        shopping_mall_seller_user_id: sellerUser.id,
        code: RandomGenerator.alphaNumeric(10),
        status: "active",
        name: RandomGenerator.name(),
        description: RandomGenerator.paragraph({ sentences: 3 }),
        price: 10000,
      } satisfies IShoppingMallSale.ICreate,
    });
  typia.assert(sale);

  // 6. Create member user and authenticate
  const memberUserEmail = typia.random<string & tags.Format<"email">>();
  const memberUserPassword = "MemberPass789@";
  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: {
        email: memberUserEmail,
        password_hash: memberUserPassword,
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        phone_number: RandomGenerator.mobile(),
        status: "active",
      } satisfies IShoppingMallMemberUser.ICreate,
    });
  typia.assert(memberUser);

  // 7. Member user creates a favorite product
  const favoriteProduct: IShoppingMallFavoriteProduct =
    await api.functional.shoppingMall.memberUser.favoriteProducts.createFavoriteProduct(
      connection,
      {
        body: {
          shopping_mall_memberuser_id: memberUser.id,
          shopping_mall_sale_snapshot_id: sale.id,
        } satisfies IShoppingMallFavoriteProduct.ICreate,
      },
    );
  typia.assert(favoriteProduct);

  // 8. Member user deletes the favorite product
  await api.functional.shoppingMall.memberUser.favoriteProducts.eraseFavoriteProduct(
    connection,
    {
      favoriteProductId: favoriteProduct.id,
    },
  );

  // 9. Attempt to retrieve the deleted favorite product to confirm removal
  // Since no explicit retrieval API is described, we confirm by expecting an error when deleting again
  await TestValidator.error(
    "deleting already deleted favorite product should fail",
    async () => {
      await api.functional.shoppingMall.memberUser.favoriteProducts.eraseFavoriteProduct(
        connection,
        {
          favoriteProductId: favoriteProduct.id,
        },
      );
    },
  );
}
