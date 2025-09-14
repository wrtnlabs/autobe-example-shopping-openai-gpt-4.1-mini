import { IPage } from "./IPage";
import { IShoppingMallSaleUnitOption } from "./IShoppingMallSaleUnitOption";

export namespace IPageIShoppingMallSaleUnitOption {
  /**
   * A page.
   *
   * Collection of records with pagination information.
   */
  export type ISummary = {
    /** Page information. */
    pagination: IPage.IPagination;

    /** List of records. */
    data: IShoppingMallSaleUnitOption.ISummary[];
  };
}
