import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallChannel } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallChannel";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";
import type { IShoppingMallOrder } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrder";
import type { IShoppingMallOrderItem } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrderItem";
import type { IShoppingMallSale } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSale";
import type { IShoppingMallSection } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSection";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

export async function test_api_order_item_update_success_admin_full_flow(
  connection: api.IConnection,
) {
  // 1. Admin user sign up and authentication
  const adminEmail: string = typia.random<string & tags.Format<"email">>();
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: adminEmail,
        password_hash: "StrongP@ssw0rd",
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        status: "active",
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser);

  // 2. Member user sign up and authentication
  const memberEmail: string = typia.random<string & tags.Format<"email">>();
  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: {
        email: memberEmail,
        password_hash: "MemberP@ssw0rd",
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        status: "active",
      } satisfies IShoppingMallMemberUser.ICreate,
    });
  typia.assert(memberUser);

  // 3. Create channel (admin context)
  const createdChannel: IShoppingMallChannel =
    await api.functional.shoppingMall.adminUser.channels.create(connection, {
      body: {
        code: RandomGenerator.alphaNumeric(6).toLowerCase(),
        name: `Channel - ${RandomGenerator.name(2)}`,
        description: RandomGenerator.paragraph({ sentences: 3 }),
        status: "active",
      } satisfies IShoppingMallChannel.ICreate,
    });
  typia.assert(createdChannel);

  // 4. Create section (admin context)
  const createdSection: IShoppingMallSection =
    await api.functional.shoppingMall.adminUser.sections.create(connection, {
      body: {
        code: RandomGenerator.alphaNumeric(5).toLowerCase(),
        name: `Section - ${RandomGenerator.name(2)}`,
        description: RandomGenerator.paragraph({ sentences: 2 }),
        status: "active",
      } satisfies IShoppingMallSection.ICreate,
    });
  typia.assert(createdSection);

  // 5. Seller user sign up and authentication
  const sellerEmail: string = typia.random<string & tags.Format<"email">>();
  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: {
        email: sellerEmail,
        password: "SellerP@ssw0rd",
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        phone_number: RandomGenerator.mobile(),
        business_registration_number:
          RandomGenerator.alphaNumeric(10).toUpperCase(),
      } satisfies IShoppingMallSellerUser.ICreate,
    });
  typia.assert(sellerUser);

  // 6. Create sale product (seller context) referencing created channel and section
  await api.functional.auth.sellerUser.login(connection, {
    body: {
      email: sellerEmail,
      password: "SellerP@ssw0rd",
    } satisfies IShoppingMallSellerUser.ILogin,
  });
  const saleProduct: IShoppingMallSale =
    await api.functional.shoppingMall.sellerUser.sales.create(connection, {
      body: {
        shopping_mall_channel_id: createdChannel.id,
        shopping_mall_section_id: createdSection.id,
        shopping_mall_seller_user_id: sellerUser.id,
        code: RandomGenerator.alphaNumeric(8).toUpperCase(),
        status: "active",
        name: `Product - ${RandomGenerator.name(2)}`,
        description: RandomGenerator.content({ paragraphs: 2 }),
        price: Math.floor(Math.random() * 10000) + 1000,
      } satisfies IShoppingMallSale.ICreate,
    });
  typia.assert(saleProduct);

  // 7. Create order (admin context) for member user
  await api.functional.auth.adminUser.login(connection, {
    body: {
      email: adminEmail,
      password_hash: "StrongP@ssw0rd",
    } satisfies IShoppingMallAdminUser.ILogin,
  });

  const order: IShoppingMallOrder =
    await api.functional.shoppingMall.adminUser.orders.createOrder(connection, {
      body: {
        shopping_mall_memberuser_id: memberUser.id,
        shopping_mall_channel_id: createdChannel.id,
        shopping_mall_section_id: createdSection.id,
        order_code: `ORD-${RandomGenerator.alphaNumeric(10).toUpperCase()}`,
        order_status: "pending",
        payment_status: "pending",
        total_price: 0,
      } satisfies IShoppingMallOrder.ICreate,
    });
  typia.assert(order);

  // 8. Add order item referring to sale product snapshot
  const orderItem: IShoppingMallOrderItem =
    await api.functional.shoppingMall.adminUser.orders.items.create(
      connection,
      {
        orderId: order.id,
        body: {
          shopping_mall_order_id: order.id,
          shopping_mall_sale_snapshot_id: saleProduct.id,
          quantity: 1,
          price: saleProduct.price,
          order_item_status: "pending",
        } satisfies IShoppingMallOrderItem.ICreate,
      },
    );
  typia.assert(orderItem);

  // 9. Update order item (admin context)
  const newQuantity: number & tags.Type<"int32"> = (Math.floor(
    Math.random() * 5,
  ) + 1) satisfies number as number;
  const newPrice: number = orderItem.price + 500;
  const updatedOrderItem: IShoppingMallOrderItem =
    await api.functional.shoppingMall.adminUser.orders.items.update(
      connection,
      {
        orderId: order.id,
        orderItemId: orderItem.id,
        body: {
          quantity: newQuantity,
          price: newPrice,
        } satisfies IShoppingMallOrderItem.IUpdate,
      },
    );
  typia.assert(updatedOrderItem);

  // 10. Validate updated order item
  TestValidator.equals(
    "Order item ID remains the same after update",
    updatedOrderItem.id,
    orderItem.id,
  );
  TestValidator.equals(
    "Order item quantity is updated",
    updatedOrderItem.quantity,
    newQuantity,
  );
  TestValidator.equals(
    "Order item price is updated",
    updatedOrderItem.price,
    newPrice,
  );
  TestValidator.equals(
    "Order item order ID remains unchanged",
    updatedOrderItem.shopping_mall_order_id,
    order.id,
  );
}
