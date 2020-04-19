import BsGrid from "./BsGrid";
import BsGridCell from "./BsGridCell";
import BsGridColumn from "./BsGridColumn";
import BsGridColumnSelection from "./BsGridColumnSelection";
import BsGridCellNumbering from "./BsGridCellNumbering";
import BsGridFooter from "./BsGridFooter";
import BsGridFooterCell from "./BsGridFooterCell";
import BsGridRowhead from "./BsGridRowhead";
import BsGridToolbar from "./BsGridToolbar";
import BsGridToolSearch from "./BsGridToolSearch";
import BsTreegrid from "./BsTreegrid";
import BsTreegridCell from "./BsTreegridCell";
import BsTreegridColumn from "./BsTreegridColumn";

export default Vue => {
    Vue.component(BsGrid.name, BsGrid);
    Vue.component(BsGridColumn.name, BsGridColumn);
    Vue.component(BsGridColumnSelection.name, BsGridColumnSelection);
    Vue.component(BsGridCell.name, BsGridCell);
    Vue.component(BsGridCellNumbering.name, BsGridCellNumbering);
    Vue.component(BsGridFooter.name, BsGridFooter);
    Vue.component(BsGridFooterCell.name, BsGridFooterCell);
    Vue.component(BsGridRowhead.name, BsGridRowhead);
    Vue.component(BsGridToolbar.name, BsGridToolbar);
    Vue.component(BsGridToolSearch.name, BsGridToolSearch);
    Vue.component(BsTreegrid.name, BsTreegrid);
    Vue.component(BsTreegridCell.name, BsTreegridCell);
    Vue.component(BsTreegridColumn.name, BsTreegridColumn);
};