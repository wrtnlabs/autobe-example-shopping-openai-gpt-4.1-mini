import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallSale } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSale";
import type { IShoppingMallSaleUnit } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleUnit";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * This test covers the successful deletion of a sale unit under a sale
 * product by a seller user.
 *
 * The test flow is:
 *
 * 1. Register a seller user with complete profile data and authenticate.
 * 2. Register a sale product under the authenticated seller user.
 * 3. Register an admin user and authenticate to create a sale unit under the
 *    sale product.
 * 4. Re-authenticate the seller user to establish seller context.
 * 5. Use the seller user to delete the sale unit from the sale product.
 * 6. Confirm deletion by attempting to delete again and expect an error.
 *
 * The test ensures all steps comply with DTO schemas, use correct formats,
 * and perform typia.assert and TestValidator validations.
 */
export async function test_api_sales_sale_unit_delete_seller_success(
  connection: api.IConnection,
) {
  // 1. Register a seller user
  const sellerCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password: "SellerPass123!",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: RandomGenerator.mobile(),
    business_registration_number: `BRN${RandomGenerator.alphaNumeric(9).toUpperCase()}`,
  } satisfies IShoppingMallSellerUser.ICreate;
  const seller: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: sellerCreateBody,
    });
  typia.assert(seller);

  // 2. Create a sale product under seller
  const saleCreateBody = {
    shopping_mall_channel_id: typia.random<string & tags.Format<"uuid">>(),
    shopping_mall_section_id: null,
    shopping_mall_seller_user_id: seller.id,
    code: `SALE${RandomGenerator.alphaNumeric(6).toUpperCase()}`,
    status: "active",
    name: RandomGenerator.name(3),
    description: RandomGenerator.content({ paragraphs: 1 }),
    price: Math.floor(Math.random() * 10000) + 1000,
  } satisfies IShoppingMallSale.ICreate;
  const sale: IShoppingMallSale =
    await api.functional.shoppingMall.sellerUser.sales.create(connection, {
      body: saleCreateBody,
    });
  typia.assert(sale);

  // 3. Register an admin user
  const adminCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: "AdminPassHash123456789",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;
  const admin: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminCreateBody,
    });
  typia.assert(admin);

  // 4. Admin creates a sale unit under the sale
  const saleUnitCreateBody = {
    shopping_mall_sale_id: sale.id,
    code: `SU${RandomGenerator.alphaNumeric(6).toUpperCase()}`,
    name: RandomGenerator.name(2),
    description: RandomGenerator.paragraph({ sentences: 5 }),
  } satisfies IShoppingMallSaleUnit.ICreate;
  const saleUnit: IShoppingMallSaleUnit =
    await api.functional.shoppingMall.adminUser.sales.saleUnits.create(
      connection,
      {
        saleId: sale.id,
        body: saleUnitCreateBody,
      },
    );
  typia.assert(saleUnit);

  // 5. Seller user logs in again to establish seller context
  const sellerLoginBody = {
    email: seller.email,
    password: "SellerPass123!",
  } satisfies IShoppingMallSellerUser.ILogin;
  const sellerLogin: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.login(connection, {
      body: sellerLoginBody,
    });
  typia.assert(sellerLogin);

  // 6. Seller deletes the sale unit
  await api.functional.shoppingMall.sellerUser.sales.saleUnits.erase(
    connection,
    {
      saleId: sale.id,
      saleUnitId: saleUnit.id,
    },
  );

  // 7. Confirm by attempting to delete again, expecting error
  await TestValidator.error(
    "deleting the same sale unit again should fail",
    async () => {
      await api.functional.shoppingMall.sellerUser.sales.saleUnits.erase(
        connection,
        {
          saleId: sale.id,
          saleUnitId: saleUnit.id,
        },
      );
    },
  );
}
