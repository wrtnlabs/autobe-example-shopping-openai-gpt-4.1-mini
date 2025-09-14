import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";
import type { IShoppingMallOrder } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrder";
import type { IShoppingMallPayment } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallPayment";
import type { IShoppingMallSale } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSale";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * Successful retrieval test of a member user's payment application by valid
 * order and payment IDs.
 *
 * This test covers a complete end-to-end process:
 *
 * 1. Creation and authentication of a member user.
 * 2. Creation and authentication of a seller user.
 * 3. Seller registers a sales product.
 * 4. Member places an order for the product.
 * 5. Member creates a payment for the order.
 * 6. Retrieval of the payment details by payment ID.
 *
 * Validates that the payment details retrieved match the created payment,
 * ensuring proper data consistency and API correctness across roles and
 * resources.
 */
export async function test_api_member_order_payment_retrieval_success(
  connection: api.IConnection,
) {
  // 1. Create and authenticate member user
  const memberEmail: string = typia.random<string & tags.Format<"email">>();
  const memberPassword: string = RandomGenerator.alphaNumeric(12);
  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: {
        email: memberEmail,
        password_hash: memberPassword,
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        phone_number: null,
        status: "active",
      } satisfies IShoppingMallMemberUser.ICreate,
    });
  typia.assert(memberUser);

  // 2. Create and authenticate seller user
  const sellerEmail: string = typia.random<string & tags.Format<"email">>();
  const sellerPassword: string = RandomGenerator.alphaNumeric(12);
  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: {
        email: sellerEmail,
        password: sellerPassword,
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        phone_number: null,
        business_registration_number: RandomGenerator.alphaNumeric(10),
      } satisfies IShoppingMallSellerUser.ICreate,
    });
  typia.assert(sellerUser);

  // 3. Seller logs in to switch authentication context
  await api.functional.auth.sellerUser.login(connection, {
    body: {
      email: sellerEmail,
      password: sellerPassword,
    } satisfies IShoppingMallSellerUser.ILogin,
  });

  // 4. Seller registers a sales product
  const saleProduct: IShoppingMallSale =
    await api.functional.shoppingMall.sellerUser.sales.create(connection, {
      body: {
        shopping_mall_channel_id: typia.random<string & tags.Format<"uuid">>(),
        shopping_mall_section_id: null,
        shopping_mall_seller_user_id: sellerUser.id,
        code: RandomGenerator.alphaNumeric(8),
        status: "active",
        name: RandomGenerator.name(),
        description: null,
        price: 9999,
      } satisfies IShoppingMallSale.ICreate,
    });
  typia.assert(saleProduct);

  // 5. Member logs in
  await api.functional.auth.memberUser.login(connection, {
    body: {
      email: memberEmail,
      password: memberPassword,
    } satisfies IShoppingMallMemberUser.ILogin,
  });

  // 6. Member places an order
  const order: IShoppingMallOrder =
    await api.functional.shoppingMall.memberUser.orders.createOrder(
      connection,
      {
        body: {
          shopping_mall_memberuser_id: memberUser.id,
          shopping_mall_channel_id: saleProduct.shopping_mall_channel_id,
          shopping_mall_section_id: null,
          order_code: RandomGenerator.alphaNumeric(8),
          order_status: "pending",
          payment_status: "pending",
          total_price: saleProduct.price,
        } satisfies IShoppingMallOrder.ICreate,
      },
    );
  typia.assert(order);

  // 7. Member creates a payment linked to the order
  const paymentCreatePayload: IShoppingMallPayment.ICreate = {
    shopping_mall_order_id: order.id,
    payment_method: "credit_card",
    payment_status: "pending",
    payment_amount: order.total_price,
    transaction_id: null,
  };
  const payment: IShoppingMallPayment =
    await api.functional.shoppingMall.memberUser.orders.payments.create(
      connection,
      {
        orderId: order.id,
        body: paymentCreatePayload,
      },
    );
  typia.assert(payment);

  // 8. Retrieve payment details by orderId and paymentId
  const retrievedPayment: IShoppingMallPayment =
    await api.functional.shoppingMall.memberUser.orders.payments.at(
      connection,
      {
        orderId: order.id,
        paymentId: payment.id,
      },
    );
  typia.assert(retrievedPayment);

  // 9. Validate retrieved payment data matches created payment
  TestValidator.equals("payment ID matches", retrievedPayment.id, payment.id);
  TestValidator.equals(
    "payment order ID matches",
    retrievedPayment.shopping_mall_order_id,
    payment.shopping_mall_order_id,
  );
  TestValidator.equals(
    "payment method matches",
    retrievedPayment.payment_method,
    payment.payment_method,
  );
  TestValidator.equals(
    "payment status matches",
    retrievedPayment.payment_status,
    payment.payment_status,
  );
  TestValidator.equals(
    "payment amount matches",
    retrievedPayment.payment_amount,
    payment.payment_amount,
  );
  TestValidator.equals(
    "payment transaction ID matches",
    retrievedPayment.transaction_id,
    payment.transaction_id,
  );
}
