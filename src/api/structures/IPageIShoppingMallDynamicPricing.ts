import { IPage } from "./IPage";
import { IShoppingMallDynamicPricing } from "./IShoppingMallDynamicPricing";

export namespace IPageIShoppingMallDynamicPricing {
  /**
   * A page.
   *
   * Collection of records with pagination information.
   */
  export type ISummary = {
    /** Page information. */
    pagination: IPage.IPagination;

    /** List of records. */
    data: IShoppingMallDynamicPricing.ISummary[];
  };
}
