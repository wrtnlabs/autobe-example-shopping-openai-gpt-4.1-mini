import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallChannel } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallChannel";
import type { IShoppingMallSale } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSale";
import type { IShoppingMallSection } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSection";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * This test validates the successful update flow of a sales product by a seller
 * user in the shopping mall system. The test involves:
 *
 * 1. Creating and authenticating an admin user.
 * 2. Using the admin user's authenticated context to create a sales channel and a
 *    section.
 * 3. Creating and authenticating a seller user.
 * 4. Using the seller user's authenticated context to create a sales product
 *    associated with the channel and section.
 * 5. Updating the sales product's status, name, price, and description
 *    successfully.
 * 6. Validating that the updated sales product data matches the update payload.
 *    All API calls respect required properties, formats, and constraints to
 *    ensure business logic correctness.
 */
export async function test_api_sales_product_update_successful_flow(
  connection: api.IConnection,
) {
  // 1. Create and authenticate admin user
  const adminEmail: string = typia.random<string & tags.Format<"email">>();
  const adminPassword = "Password123!";
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: adminEmail,
        password_hash: adminPassword,
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        status: "active",
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser);

  // 2. Admin user login to set authentication context
  await api.functional.auth.adminUser.login(connection, {
    body: {
      email: adminEmail,
      password_hash: adminPassword,
    } satisfies IShoppingMallAdminUser.ILogin,
  });

  // 3. Admin creates sales channel
  const channelCode = RandomGenerator.alphaNumeric(8);
  const createdChannel: IShoppingMallChannel =
    await api.functional.shoppingMall.adminUser.channels.create(connection, {
      body: {
        code: channelCode,
        name: `Channel_${channelCode}`,
        description: RandomGenerator.paragraph({ sentences: 5 }),
        status: "active",
      } satisfies IShoppingMallChannel.ICreate,
    });
  typia.assert(createdChannel);

  // 4. Admin creates section
  const sectionCode = RandomGenerator.alphaNumeric(8);
  const createdSection: IShoppingMallSection =
    await api.functional.shoppingMall.adminUser.sections.create(connection, {
      body: {
        code: sectionCode,
        name: `Section_${sectionCode}`,
        description: RandomGenerator.paragraph({ sentences: 5 }),
        status: "active",
      } satisfies IShoppingMallSection.ICreate,
    });
  typia.assert(createdSection);

  // 5. Create and authenticate seller user
  const sellerEmail: string = typia.random<string & tags.Format<"email">>();
  const sellerPassword = "SellerPass123!";
  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: {
        email: sellerEmail,
        password: sellerPassword,
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        phone_number: null,
        business_registration_number: `BRN${RandomGenerator.alphaNumeric(9)}`,
      } satisfies IShoppingMallSellerUser.ICreate,
    });
  typia.assert(sellerUser);

  // 6. Seller user login to set authentication context
  await api.functional.auth.sellerUser.login(connection, {
    body: {
      email: sellerEmail,
      password: sellerPassword,
    } satisfies IShoppingMallSellerUser.ILogin,
  });

  // 7. Seller creates a sales product
  const saleCode = RandomGenerator.alphaNumeric(10);
  const createdSale: IShoppingMallSale =
    await api.functional.shoppingMall.sellerUser.sales.create(connection, {
      body: {
        shopping_mall_channel_id: createdChannel.id,
        shopping_mall_section_id: createdSection.id,
        shopping_mall_seller_user_id: sellerUser.id,
        code: saleCode,
        status: "active",
        name: `Product_${saleCode}`,
        description: RandomGenerator.content({ paragraphs: 2 }),
        price: Math.floor(10000 + Math.random() * 90000),
      } satisfies IShoppingMallSale.ICreate,
    });
  typia.assert(createdSale);

  // 8. Seller updates the sales product
  const updatedStatus = "paused";
  const updatedName = `${createdSale.name}_Updated`;
  const updatedPrice = createdSale.price + 5000;
  const updatedDescription = `Updated: ${RandomGenerator.paragraph({ sentences: 3 })}`;
  const updatedSale: IShoppingMallSale =
    await api.functional.shoppingMall.sellerUser.sales.update(connection, {
      saleId: createdSale.id,
      body: {
        status: updatedStatus,
        name: updatedName,
        price: updatedPrice,
        description: updatedDescription,
        shopping_mall_channel_id: createdSale.shopping_mall_channel_id,
        shopping_mall_section_id: createdSale.shopping_mall_section_id,
        shopping_mall_seller_user_id: createdSale.shopping_mall_seller_user_id,
        code: createdSale.code,
      } satisfies IShoppingMallSale.IUpdate,
    });
  typia.assert(updatedSale);

  // 9. Validate the updated sale product response matches the update payload
  TestValidator.equals(
    "Updated sale product id should match",
    updatedSale.id,
    createdSale.id,
  );
  TestValidator.equals(
    "Updated sale product status",
    updatedSale.status,
    updatedStatus,
  );
  TestValidator.equals(
    "Updated sale product name",
    updatedSale.name,
    updatedName,
  );
  TestValidator.equals(
    "Updated sale product price",
    updatedSale.price,
    updatedPrice,
  );
  TestValidator.equals(
    "Updated sale product description",
    updatedSale.description,
    updatedDescription,
  );
}
