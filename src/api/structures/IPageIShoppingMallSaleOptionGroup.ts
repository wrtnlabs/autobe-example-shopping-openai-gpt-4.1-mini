import { IPage } from "./IPage";
import { IShoppingMallSaleOptionGroup } from "./IShoppingMallSaleOptionGroup";

export namespace IPageIShoppingMallSaleOptionGroup {
  /**
   * A page.
   *
   * Collection of records with pagination information.
   */
  export type ISummary = {
    /** Page information. */
    pagination: IPage.IPagination;

    /** List of records. */
    data: IShoppingMallSaleOptionGroup.ISummary[];
  };
}
