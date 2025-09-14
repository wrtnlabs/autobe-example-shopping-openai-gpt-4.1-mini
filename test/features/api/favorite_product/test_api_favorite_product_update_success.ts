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

/**
 * This test validates the complete workflow for updating a favorite product
 * entry in the shopping mall system.
 *
 * It involves multiple roles: memberUser, adminUser, and sellerUser. The test
 * covers user registrations, role-based authentication, product category and
 * channel creation by admin, product creation by seller, favorite product
 * creation by member, and update of favorite product.
 *
 * The test ensures correct handling of IDs, roles, authentication context
 * switches, and data consistency.
 */
export async function test_api_favorite_product_update_success(
  connection: api.IConnection,
) {
  // 1. Create a new member user and authenticate
  const memberUserCreateBody = {
    email: `${RandomGenerator.alphaNumeric(10)}@example.com`,
    password_hash: "initialPassword123!",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: RandomGenerator.mobile(),
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;
  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: memberUserCreateBody,
    });
  typia.assert(memberUser);

  // 2. Create a new admin user and authenticate
  const adminUserCreateBody = {
    email: `${RandomGenerator.alphaNumeric(10)}@admin.com`,
    password_hash: "AdminPass123!",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminUserCreateBody,
    });
  typia.assert(adminUser);

  // 3. Login as admin to set correct authentication context
  await api.functional.auth.adminUser.login(connection, {
    body: {
      email: adminUserCreateBody.email,
      password_hash: adminUserCreateBody.password_hash,
    } satisfies IShoppingMallAdminUser.ILogin,
  });

  // 4. Create a product category as admin
  const categoryCreateBody = {
    code: RandomGenerator.alphaNumeric(8),
    name: RandomGenerator.name(),
    status: "active",
    description: RandomGenerator.paragraph({ sentences: 3 }),
  } satisfies IShoppingMallCategory.ICreate;
  const category: IShoppingMallCategory =
    await api.functional.shoppingMall.adminUser.categories.create(connection, {
      body: categoryCreateBody,
    });
  typia.assert(category);

  // 5. Create a product channel as admin
  const channelCreateBody = {
    code: RandomGenerator.alphaNumeric(8),
    name: RandomGenerator.name(),
    status: "active",
    description: RandomGenerator.paragraph({ sentences: 2 }),
  } satisfies IShoppingMallChannel.ICreate;
  const channel: IShoppingMallChannel =
    await api.functional.shoppingMall.adminUser.channels.create(connection, {
      body: channelCreateBody,
    });
  typia.assert(channel);

  // 6. Create a seller user and authenticate
  const sellerUserCreateBody = {
    email: `${RandomGenerator.alphaNumeric(10)}@seller.com`,
    password: "SellerPass123!",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: RandomGenerator.mobile(),
    business_registration_number: `BRN${RandomGenerator.alphaNumeric(9)}`,
  } satisfies IShoppingMallSellerUser.ICreate;
  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: sellerUserCreateBody,
    });
  typia.assert(sellerUser);

  // 7. Login as seller to set authentication context
  await api.functional.auth.sellerUser.login(connection, {
    body: {
      email: sellerUserCreateBody.email,
      password: sellerUserCreateBody.password,
    } satisfies IShoppingMallSellerUser.ILogin,
  });

  // 8. Seller creates a product sale referencing the channel and category
  const saleCreateBody = {
    shopping_mall_channel_id: channel.id,
    shopping_mall_section_id: null,
    shopping_mall_seller_user_id: sellerUser.id,
    code: RandomGenerator.alphaNumeric(10),
    status: "active",
    name: RandomGenerator.name(3),
    description: RandomGenerator.paragraph({ sentences: 5 }),
    price: 10000,
  } satisfies IShoppingMallSale.ICreate;
  const sale: IShoppingMallSale =
    await api.functional.shoppingMall.sellerUser.sales.create(connection, {
      body: saleCreateBody,
    });
  typia.assert(sale);

  // 9. Switch back to member user context by login
  await api.functional.auth.memberUser.login(connection, {
    body: {
      email: memberUserCreateBody.email,
      password: "initialPassword123!",
    } satisfies IShoppingMallMemberUser.ILogin,
  });

  // 10. Member user creates a favorite product referencing sale snapshot id and member id
  // Note: Since sale snapshot id is required but sale snapshot is not given explicitly, we assume sale.id (as UUID) represents snapshot for test
  const favoriteProductCreateBody = {
    shopping_mall_memberuser_id: memberUser.id,
    shopping_mall_sale_snapshot_id: sale.id,
  } satisfies IShoppingMallFavoriteProduct.ICreate;
  const favoriteProduct: IShoppingMallFavoriteProduct =
    await api.functional.shoppingMall.memberUser.favoriteProducts.createFavoriteProduct(
      connection,
      { body: favoriteProductCreateBody },
    );
  typia.assert(favoriteProduct);

  // 11. Update the favorite product with new member user ID and new sale snapshot ID
  // Create another member user to switch to new member user ID
  const newMemberUserCreateBody = {
    email: `${RandomGenerator.alphaNumeric(10)}@example.com`,
    password_hash: "NewPass123!",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: RandomGenerator.mobile(),
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;
  const newMemberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: newMemberUserCreateBody,
    });
  typia.assert(newMemberUser);

  // New member user login to change authentication context
  await api.functional.auth.memberUser.login(connection, {
    body: {
      email: newMemberUserCreateBody.email,
      password: "NewPass123!",
    } satisfies IShoppingMallMemberUser.ILogin,
  });

  // Prepare update body: update to new member user id and new snapshot id (using the same sale id for snapshot)
  const favoriteUpdateBody = {
    shopping_mall_memberuser_id: newMemberUser.id,
    shopping_mall_sale_snapshot_id: sale.id,
    deleted_at: null,
  } satisfies IShoppingMallFavoriteProduct.IUpdate;

  // Perform update via PUT
  const updatedFavoriteProduct: IShoppingMallFavoriteProduct =
    await api.functional.shoppingMall.memberUser.favoriteProducts.updateFavoriteProduct(
      connection,
      {
        favoriteProductId: favoriteProduct.id,
        body: favoriteUpdateBody,
      },
    );
  typia.assert(updatedFavoriteProduct);

  // Validate that the updated favorite product has correct member user id and snapshot id
  TestValidator.equals(
    "favoriteProduct memberUserId updated",
    updatedFavoriteProduct.shopping_mall_memberuser_id,
    newMemberUser.id,
  );
  TestValidator.equals(
    "favoriteProduct saleSnapshotId updated",
    updatedFavoriteProduct.shopping_mall_sale_snapshot_id,
    sale.id,
  );
}
