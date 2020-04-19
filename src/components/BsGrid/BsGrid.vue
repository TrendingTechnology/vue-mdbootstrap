<template>
  <div :class="_classNames" :style="_gridStyles" class="md-grid">
    <slot name="toolbar"></slot>
    <div :class="{'d-flex': isSmallScreen && flipOnSmallScreen}">
      <div class="md-grid-header">
        <div class="md-grid-header-wrap" ref="theader">
          <table role="grid" :style="_tableStyles">
            <colgroup v-if="!isSmallScreen || !flipOnSmallScreen">
              <col v-if="isSelectable" :style="{width: checkboxWidth + 'px'}" />
              <col v-for="(column, idx) in columnIterator"
                   :key="'col-' + _uuid() + idx"
                   :style="_colHeaderStyles(column)" />
            </colgroup>
            <thead role="rowgroup">
              <slot name="columnheader" v-bind="{ items: dataItems, selectionMode: selectionMode }"></slot>
              <tr v-if="!$scopedSlots['columnheader']" role="row">
                <bs-grid-column-selection v-if="isSelectable"
                                          :data-items="dataItems"
                                          :color="selectionMode.checkboxColor" />
                <slot></slot>
              </tr>
              <bs-grid-column-filters v-if="filterable && !(flipOnSmallScreen && isSmallScreen)"
                                      :columns="columnIterator" />
            </thead>
          </table>
        </div>
      </div>
      <bs-progress v-if="isLoading && loading.type === 'bar'" v-bind="_progressLoadingAttrs" />
      <div class="md-grid-content" ref="tcontent" @scroll="_handleScroll">
        <table role="grid" :style="_tableStyles">
          <colgroup v-if="!isSmallScreen || !flipOnSmallScreen">
            <col v-if="isSelectable" :style="{width: checkboxWidth + 'px'}" />
            <col v-for="(column, idx) in columnIterator"
                 :key="'col-' + _uuid() + idx"
                 :style="_colDataStyles(column)" />
          </colgroup>
          <tbody role="rowgroup">
            <bs-grid-row v-for="(item, index) in dataItems"
                         :key="'row-' + index"
                         :item="item"
                         :index="index"
                         :selection-mode="selectionMode">
              <bs-grid-cell-selection v-if="isSelectable"
                                      :item="item"
                                      :value="isRowSelected(item)"
                                      :selection-mode="selectionMode"
                                      @input="selected => selected ? selectRow(item) : deselectRow(item)" />
              <slot name="datarow" v-bind="{ columns: columnIterator, item: item, index: index }">
                <template v-for="column in columnIterator">
                  <component :is="column.rowNumbering ? 'bs-grid-cell-numbering' : 'bs-grid-cell'"
                             :key="column.field + '-' + _uuid()"
                             :column="column"
                             :item="item"
                             :index="index" />
                </template>
              </slot>
            </bs-grid-row>
          </tbody>
        </table>
        <transition v-if="_showEmptyMessage" name="fade">
          <div class="md-grid-alert my-3 mx-3 mx-md-4 mx-xl-auto">
            <bs-alert color="danger" icon="exclamation-triangle">
              <slot name="emptyMessage">
                Sorry! No data to display here.
              </slot>
            </bs-alert>
          </div>
        </transition>
      </div>
      <div class="md-grid-footer" v-if="showFooter">
        <div class="md-grid-footer-wrap" ref="tfooter">
          <slot name="gridfooter" v-bind="{ columns: columnIterator }">
            <bs-grid-footer :columns="columnIterator" />
          </slot>
        </div>
      </div>
    </div>
    <div v-if="isLoading && loading.type === 'spinner'" class="md-grid-progress-spinner">
      <bs-progress class="align-self-center" v-bind="_progressLoadingAttrs" />
    </div>
    <div class="md-pagination" v-if="pageable" ref="footer">
      <bs-pagination v-bind="_paginationAttrs"
                     @pagesize="setPageSize"
                     @reload="reload"
                     @gotopage="gotoPage"
                     @prevpage="previousPage"
                     @nextpage="nextPage" />
    </div>
  </div>
</template>

<script>
import BsGridRow from './BsGridRow';
import BsGridCell from './BsGridCell';
import BsGridCellNumbering from "./BsGridCellNumbering";
import BsGridCellSelection from './BsGridCellSelection';
import BsGridColumnFilters from "./BsGridColumnFilters";
import BsGridColumnSelection from './BsGridColumnSelection';
import BsPagination from '../BsPagination/BsPagination';
import BsProgress from '../BsAnimation/BsProgress';
import BsAlert from '../BsBasic/BsAlert';
import BsStore from '../../model/BsStore';
import BsArrayStore from "../../model/BsArrayStore";
import Common from "../../mixins/Common";
import ScreenSize from '../../mixins/ScreenSize';
import Grid from "./mixins/Grid";
import Helper from '../../utils/Helper';
import sum from 'lodash/sum';
// import { sum } from 'lodash';
import { addResizeListener, removeResizeListener } from '../../utils/ResizeListener';
import '../../../scss/_others.scss';

export default {
    name: "BsGrid",
    components: {
        BsGridCell, BsGridCellSelection, BsGridCellNumbering, BsGridColumnFilters,
        BsGridColumnSelection, BsGridRow, BsPagination, BsProgress, BsAlert
    },
    mixins: [Common, Grid, ScreenSize],
    props: {
        /**
         * @type {BsStore|BsArrayStore|*}
         */
        dataSource: {
            type: [BsStore, BsArrayStore],
            default: undefined
        },
        flipOnSmallScreen: {
            type: Boolean,
            default: true
        },
        pageable: {
            type: [Boolean, Object],
            default: false
        },
        /**
         * Jika berupa <b>Object</b> maka strukturnya adalah:
         * <pre>
         * {
         *    logic: 'and|or',      // Logic yang dipakai jika filters lebih dari 1
         *    operator: 'eq|neq|gt|gte|lt|lte|in|notin|startwith|endwith|contains|fts',  // default 'eq'
         *    placeholder: boolean, // Show/hide placeholder pada textfield, default TRUE
         *    immediate: boolean,   // Jika TRUE maka filtering akan segera dilakukan setelah event 'onChange' terjadi
         *                          // jika FALSE maka filtering baru dilakukan setelah keyboard 'ENTER' ditekan
         *                          // ataupun melalui action button
         *    minlength: int,       // Minimum jumlah karakter, default 1
         * }
         * </pre>
         */
        filterable: {
            type: [Boolean, Object],
            default: false
        },
        rowSelection: {
            type: [Boolean, Object],
            default: false
        },
        sortable: {
            type: [Boolean, Object],
            default: undefined
        }
    },
    data: (vm) => ({
        checkboxWidth: 48,
        columnsWidth: [],
        dataFetched: false,
        isFetching: false,
        isSmallScreen: false,
        selectionMode: {
            checkboxColor: 'pink',
            rowSelect: false
        },
        table: {
            columns: [],
            selectedItems: [],
            page: 0,
            pageSize: 10,
            totalCount: 0,
            enableSort: vm.sortable,
            dataSource: vm.dataSource,
            filterable: vm.filterable,
            checkboxWidth: vm.checkboxWidth,
            flipOnSmallScreen: vm.flipOnSmallScreen,
            sort: {property: '', direction: 'asc'},
            tableWidth: undefined,
            // methods
            /**
             * Sort the data based on the given fieldname.
             *
             * @param {string} field     - The field for sorting
             * @param {string} direction - The sort direction.
             */
            doSort: vm.sort,
            /**
             * Check if feature CheckBox Row selection is enabled or not.
             *
             * @return {boolean}
             */
            enableRowSelect: vm._enableRowSelect,
            /**
             * Filter the data based on the given filters and fire event <tt>'filter'</tt> after data has been filtered.
             *
             * @param {IFilter[]} filters - Collection of filters to be used
             * @param {string} logic      - The filter logic to be used (optional)
             */
            filter: vm.filter,
            fireEvent: vm.fireEvent,
            /**
             * Generate simple/random UUID or standard UUID v4.
             *
             * @param {boolean} standard
             * @return {string}
             */
            uuid: vm._uuid
        }
    }),
    provide() {
        const _grid = this.table;

        return {
            BsGrid: _grid
        }
    },
    computed: {
        /**
         * Get pagination binding attributes.
         *
         * @return {Object} Pagination attributes
         * @private
         */
        _paginationAttrs() {
            return {
                page: this.currentPage,
                pageable: this.pageable,
                pageSize: this.pageSize,
                dataItems: this.dataItems,
                totalItems: this.totalItems
            }
        },
        /**
         * Gets current page number.
         *
         * @return {number} Page number
         */
        currentPage() {
            return this.table.page;
        },
        /**
         * Check if feature Row selection is enabled or not.
         *
         * @return {boolean} TRUE if row selection is enabled otherwise FALSE
         */
        isSelectable() {
            return this.selectionMode.rowSelect;
        },
        /**
         * Gets the number of items that can be display in the Grid.
         *
         * @return {int} Default number of items within a page
         */
        pageSize() {
            return this.table.pageSize;
        },
        /**
         * Gets the selected items.
         *
         * @return {Array} Current selected items
         */
        selectedItems() {
            return this.table.selectedItems;
        },
        /**
         * Gets total number of items.
         *
         * @return {int} Total items
         */
        totalItems() {
            return this.table.totalCount;
        },
        /**
         * Gets the total number of pages.
         *
         * @return {int} Total pages
         */
        totalPages() {
            return Math.ceil(this.table.totalCount / this.table.pageSize);
        }
    },
    created() {
        if (typeof this.rowSelection === 'boolean') {
            this.selectionMode.rowSelect = this.rowSelection;
        } else if (typeof this.rowSelection === 'object') {
            this.selectionMode.checkboxColor = this.rowSelection.checkboxColor || 'pink';
            this.selectionMode.rowSelect     = this.rowSelection.rowSelect || true;
        }
        if (Helper.isObject(this.pageable) && this.pageable.pageSize && this.pageable.pageSize > 0) {
            this.table.pageSize = this.pageable.pageSize;
        }

        this.gotoPage(1);
    },
    mounted() {
        addResizeListener(this.$el, this._updateTableWidth);
        this._updateBodyHeight();
    },
    beforeDestroy() {
        removeResizeListener(this.$el, this._updateTableWidth);
        this.columnsWidth  = null;
        this.selectionMode = null;

        this.table.columns       = [];
        this.table.selectedItems = [];
        this.table               = null;
    },
    methods: {
        /**
         * Check if feature CheckBox Row selection is enabled or not.
         *
         * @return {boolean} TRUE if feature CheckBox Row selection is enabled otherwise FALSE
         * @private
         */
        _enableRowSelect() {
            return this.selectionMode.rowSelect;
        },
        /**
         * Fetch data from array data source or remote server.
         *
         * @return {void}
         * @private
         */
        _fetchData() {
            this.isFetching = true;

            if (!Helper.isEmpty(this.dataSource)) {
                if (this.dataSource.pageSize < 1 || Helper.isEmpty(this.dataSource.pageSize)) {
                    this.dataSource.pageSize = this.table.pageSize;
                } else {
                    this.table.pageSize = this.dataSource.pageSize;
                }

                this.dataSource
                    .page(this.table.page)
                    .load()
                    .then(() => {
                        this.dataFetched      = true;
                        this.isFetching       = false;
                        this.table.totalCount = this.dataSource.totalCount;
                        this.fireEvent('data-bind', this.dataSource.dataItems);
                    })
                    .catch((error) => {
                        this.dataFetched = true;
                        this.isFetching  = false;
                        this.fireEvent('error', error);
                    });
            } else {
                this.dataFetched = false;
                this.isFetching  = false;
            }
        },
        /**
         * Event handler when table body is scrolling.
         *
         * @param {Event} e The received event
         * @return {void}
         * @private
         */
        _handleScroll(e) {
            const scrollLeft = e.target.scrollLeft;
            const theader    = this.$refs.theader;
            const tfooter    = this.$refs.tfooter;

            if (theader) {
                theader.scrollLeft = scrollLeft;
            }
            if (tfooter) {
                tfooter.scrollLeft = scrollLeft;
            }
        },
        /**
         * Update grid body height.
         *
         * @return {void}
         * @private
         */
        _updateBodyHeight() {
            if (this.isFixedHeight && (!this.isSmallScreen || !this.flipOnSmallScreen)) {
                const gridHeight    = this.$el.offsetHeight;
                const theaderHeight = this.$refs.theader ? this.$refs.theader.offsetHeight : 0;
                const tfooterHeight = this.$refs.tfooter ? this.$refs.tfooter.offsetHeight : 0;
                const footerHeight  = this.$refs.footer ? this.$refs.footer.offsetHeight : 0;

                this.$refs.tcontent.style.height = (gridHeight - (theaderHeight + tfooterHeight + footerHeight)) + 'px';
            }
        },
        /**
         * Detect screen size and recalculate grid width.
         *
         * @return {void}
         * @private
         */
        _updateTableWidth() {
            this.isSmallScreen = this.screenMaxSm.matches;

            if (this.$el && this.columnIterator.length > 0 && (!this.isSmallScreen || !this.flipOnSmallScreen)) {
                if (this.columnsWidth.length === 0) {
                    this.columnsWidth = this.columnIterator.map(col => col.width ? Number(col.width) : 0);
                }
                const elWidth     = this.isFixedHeight
                    ? (this.$el.getBoundingClientRect().width - 18)
                    : this.$el.getBoundingClientRect().width;
                let avgColWidth   = 0;
                let tmpCols       = this.columnsWidth.map(col => col);
                let decreaseWidth = true;
                const colsNoWidth = tmpCols.filter(c => c === 0);

                if (this.rowSelection) {
                    tmpCols.push(this.checkboxWidth);
                }

                let totWidth = sum(tmpCols);
                if (elWidth > totWidth && colsNoWidth.length > 0) {
                    avgColWidth = Math.floor((elWidth - totWidth) / colsNoWidth.length);
                }

                this.table.columns = this.columnIterator.map((col, idx) => {
                    if (tmpCols[idx] === 0) {
                        const minWidth = parseInt(col.minWidth, 10);

                        if (avgColWidth < minWidth) {
                            col.width = decreaseWidth ? (minWidth - 1) : minWidth;
                        } else {
                            col.width = decreaseWidth ? (avgColWidth - 1) : avgColWidth;
                        }
                        totWidth += col.width;
                        decreaseWidth = false;
                    }

                    return col;
                });

                this.table.tableWidth = totWidth <= elWidth ? elWidth : totWidth;
            } else {
                this.table.tableWidth = null;
            }
        },
        /**
         * Deselect a row.
         *
         * @param {Record} item The item to deselect
         * @return {void}
         */
        deselectRow(item) {
            if (this.isRowSelected(item)) {
                this.table.selectedItems = this.table.selectedItems.filter(target => target !== item);
                this.fireEvent('deselect', item);
            }
        },
        /**
         * Filter the data based on the given filters and fire event <tt>'filter'</tt> after data has been filtered.
         *
         * @param {IFilter[]} filters Collection of filters to be used
         * @param {string} [logic]   The filter logic to be used
         * @return {void}
         */
        filter(filters, logic = 'AND') {
            if (!Helper.isEmpty(this.dataSource)) {
                this.dataSource
                    .setFilterLogic((this.filterable && this.filterable.logic ? this.filterable.logic : logic))
                    .setFilters(filters, true);
            }

            this.table.page = 1;
            this._fetchData();
            this.fireEvent('filter', filters);
        },
        /**
         * Go to another page and load its data.
         *
         * @param {int} page Page number
         * @return {void}
         */
        gotoPage(page) {
            if (page > 0 && page <= this.totalPages) {
                this.table.page = page;
            } else {
                this.table.page = 1;
            }

            this._fetchData();
        },
        /**
         * Check if a row is selected or not.
         *
         * @param {Record} item The item to be checked
         * @return {boolean} TRUE if the given item is selected otherwise FALSE
         */
        isRowSelected(item) {
            return this.table.selectedItems.includes(item);
        },
        /**
         * Go to next page and load its data.
         *
         * @return {void}
         */
        nextPage() {
            if (this.table.page < this.totalPages) {
                ++this.table.page;
                this._fetchData();
            }
        },
        /**
         * Go to previous page and load its data.
         *
         * @return {void}
         */
        previousPage() {
            if (this.table.page > 1) {
                --this.table.page;
                this._fetchData();
            }
        },
        /**
         * Reload data from the remote server.
         *
         * @return {void}
         */
        reload() {
            this._fetchData();
        },
        /**
         * Select a row.
         *
         * @param {Record} item The selected item
         * @return {void}
         */
        selectRow(item) {
            if (!this.isRowSelected(item)) {
                this.table.selectedItems = this.table.selectedItems.concat([item]);
                this.fireEvent('select', item);
            }
        },
        /**
         * Set default number of items to display within a page.
         *
         * @param {int} value Number of items to display
         * @return {void}
         */
        setPageSize(value) {
            if (Helper.isEmpty(value)) {
                this.table.page     = 1;
                this.table.pageSize = -1;
            } else {
                this.table.pageSize = value;
            }
            if (!Helper.isEmpty(this.dataSource)) {
                this.dataSource.pageSize = this.table.pageSize;
            }

            this._fetchData();
        },
        /**
         * Sort the data based on the given fieldname.
         *
         * @param {string} field     The field for sorting
         * @param {string} direction The sort direction.
         * @return {void}
         */
        sort(field, direction) {
            if (!Helper.isEmpty(this.dataSource)) {
                this.isFetching = true;
                this.dataSource.sort(field, direction)
                    .then(() => {
                        this.dataFetched      = true;
                        this.isFetching       = false;
                        this.table.totalCount = this.dataSource.totalCount;
                        this.fireEvent('data-bind', this.dataSource.dataItems);
                    })
                    .catch((error) => {
                        this.dataFetched = true;
                        this.isFetching  = false;
                        this.fireEvent('error', error);
                    });
            }
        }
    }
}
</script>

<style lang="scss">
  @import "~bootstrap/scss/functions";
  @import "~bootstrap/scss/variables";
  @import "~bootstrap/scss/mixins/breakpoints";
  @import "~compass-sass-mixins/lib/compass/css3";
  @import "../../../scss/colors";
  @import "../../../scss/variables";

  .#{$prefix}-grid,
  .#{$prefix}-treegrid {
    position: relative;
    width: 100%;

    table {
      border-collapse: separate;
      border-spacing: 0;
      height: auto;
      width: 100%;
      margin: 0;

      .#{$prefix}-grid-cell {
        &.row-numbering {
          border-right: 1px solid lighten($gray-300, 4%);
        }
      }

      th, td {
        border-top: $table-border-width solid $table-border-color;
        color: $table-text-color;
        font-size: $table-font-size;
        font-weight: $font-weight-light;
        padding: $table-cell-padding;
        vertical-align: middle;
      }

      thead, tfoot {
        th {
          @include user-select(none);
          font-weight: $font-weight-normal;
          color: $table-header-color;

          &.row-numbering {
            border-right: 1px solid lighten($table-border-color, 20%);
          }
        }

        > tr {
          &:first-child {
            th {
              border-top: 0 none;
            }
          }
        }
      }

      tbody {
        > tr {
          &:first-child {
            td {
              border-top: 0 none;
            }
          }
        }
      }

      thead th, tbody td {
        &:first-child {
          padding-left: 1rem;
        }
      }
    }

    .#{$prefix}-pagination {
      border-top: 1px solid darken($table-border-color, 10%);
      position: relative;
    }

    .#{$prefix}-grid-header,
    .#{$prefix}-grid-footer,
    .#{$prefix}-grid-content {
      position: relative;

      table {
        table-layout: fixed;
      }
    }

    .#{$prefix}-grid-header {
      background-color: $table-header-bgcolor;
      border-bottom: 1px solid darken($table-border-color, 10%);

      > .#{$prefix}-grid-header-wrap {
        position: relative;
        overflow: hidden;
        width: 100%;

        .#{$prefix}-grid-th-inner {
          overflow: hidden;
          position: relative;
          text-overflow: ellipsis;
          vertical-align: top;
          white-space: nowrap;

          &.enable-sort {
            cursor: pointer;
          }

          .sort-asc, .sort-desc {
            @include transition($transition-basic);
            color: darken($table-header-color, 10%);
            display: inline-block;
            font-size: 12px;
          }

          .sort-asc {
            @include transform(rotateZ(0deg));
          }

          .sort-desc {
            @include transform(rotateZ(180deg));
          }
        }
      }
    }

    .#{$prefix}-grid-footer {
      background-color: lighten($table-header-bgcolor, 2%);
      border-top: 1px solid $table-border-color;

      > .#{$prefix}-grid-footer-wrap {
        position: relative;
        overflow: hidden;
        width: 100%;

        .#{$prefix}-grid-th-inner {
          overflow: hidden;
          position: relative;
          text-overflow: ellipsis;
          vertical-align: top;
          white-space: nowrap;
          font-weight: $font-weight-bold;
        }
      }
    }

    .#{$prefix}-grid-content {
      background-color: $body-bg;
      min-height: 100px;
      width: 100%;
      overflow-y: hidden;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      -ms-overflow-style: -ms-autohiding-scrollbar;

      table {
        > thead {
          background-color: $table-header-bgcolor;
          border-bottom: 1px solid darken($table-border-color, 10%);

          .#{$prefix}-grid-th-inner {
            overflow: hidden;
            position: relative;
            text-overflow: ellipsis;
            vertical-align: top;
            white-space: nowrap;

            &.enable-sort {
              cursor: pointer;
            }

            .sort-asc, .sort-desc {
              @include transition($transition-basic);
              color: darken($table-header-color, 10%);
              display: inline-block;
              font-size: 12px;
            }

            .sort-asc {
              @include transform(rotateZ(0deg));
            }

            .sort-desc {
              @include transform(rotateZ(180deg));
            }
          }
        }
      }

      > .#{$prefix}-grid-alert {
        > .alert {
          margin-bottom: 0;
        }
      }

      .#{$prefix}-grid-cell-inner {
        overflow: hidden;
        position: relative;
        text-overflow: ellipsis;
        white-space: nowrap;

        > .svg-inline--fa {
          font-size: 20px;
        }
      }

      @include media-breakpoint-up(xl) {
        > .#{$prefix}-grid-alert {
          width: 75%;
        }
      }
    }

    .#{$prefix}-progress-bar {
      position: absolute;
      width: 100%;
      z-index: 100;
    }

    .#{$prefix}-grid-progress-spinner {
      position: absolute;
      left: 0;
      top: 0;
      right: 0;
      z-index: 100;
      min-height: 100px;
      max-height: 100%;
      width: 100%;
      height: 100%;
      display: flex;
      display: -ms-flexbox;
      justify-content: center;
      -ms-flex-pack: center;
    }

    &.#{$prefix}-grid-bordered {
      .#{$prefix}-grid-header,
      .#{$prefix}-grid-content {
        th, td {
          border-right: $table-border-width solid $table-border-color;

          &:last-child {
            border-right: none;
          }
        }
      }
    }

    &.#{$prefix}-grid-hoverable {
      .#{$prefix}-grid-content {
        .#{$prefix}-grid-row,
        .#{$prefix}-grid-row-alt {
          @include transition($transition-hoverable);

          &:hover {
            background-color: $table-hover-bgcolor;
          }
        }
      }
    }

    &.#{$prefix}-grid-fixed {
      .#{$prefix}-grid-header {
        padding-right: 18px;

        > .#{$prefix}-grid-header-wrap {
          border-right: 1px solid darken($table-border-color, 10%);
        }
      }

      .#{$prefix}-grid-content {
        overflow-y: scroll;
      }
    }
  }

  .card {
    > .#{$prefix}-grid,
    > .#{$prefix}-treegrid {
      &:first-child {
        > div:first-child {
          > div[class^="#{$prefix}-grid"] {
            &:first-child:not(.#{$prefix}-grid-cell-inner) {
              @include border-top-radius($border-radius-base * 2);
            }

            &:last-child:not(.#{$prefix}-grid-cell-inner) {
              @include border-bottom-radius($border-radius-base * 2);
            }
          }
        }
      }

      > div:last-child > div[class^="#{$prefix}-grid"],
      > div[class^="#{$prefix}-grid"] {
        &:last-child:not(.#{$prefix}-grid-cell-inner) {
          @include border-bottom-radius($border-radius-base * 2);
        }
      }
    }

    .card-body {
      .#{$prefix}-grid,
      .#{$prefix}-treegrid {
        .#{$prefix}-grid-header {
          border-top: $table-border-width solid $table-border-color;
        }
      }
    }
  }

  @include media-breakpoint-down(sm) {
    .#{$prefix}-grid {
      &.#{$prefix}-grid-flip {
        .#{$prefix}-grid-header,
        .#{$prefix}-grid-footer,
        .#{$prefix}-grid-content {
          .#{$prefix}-grid-cell-selection {
            width: auto;
          }

          table {
            table-layout: auto;
            display: inline-flex;

            thead, tfoot {
              @include flexbox((display: flex, flex-shrink: 0));

              th {
                color: $gray-800;
                font-weight: $font-weight-bold;
                text-align: left !important;
                padding-right: 1.2rem;

                &.row-numbering {
                  border-right: none;
                }

                .sort-asc, .sort-desc {
                  float: right;
                }
              }
            }

            tbody, tfoot {
              @include display-flex();
              position: relative;
              overflow-x: auto;
              overflow-y: hidden;
            }

            tbody {
              td {
                border-right: $table-border-width solid $table-border-color;

                &.row-numbering {
                  text-align: left !important;
                }
              }
            }

            tr {
              @include flexbox((display: flex, flex-direction: column));
              min-width: min-content;

              td, th {
                display: block;
                border-top: $table-border-width solid $table-border-color;

                &:first-child {
                  border-top: none;
                }
              }

              &:last-child {
                td {
                  border-right: none;
                }
              }
            }
          }
        }

        .#{$prefix}-grid-header {
          border-right: $table-border-width solid $table-border-color;
          border-bottom-width: 0;
          max-width: 40%;
        }

        .#{$prefix}-grid-footer {
          border-left: $table-border-width solid $table-border-color;
          border-top: 0 none;
          max-width: 30%;

          > .#{$prefix}-grid-footer-wrap {
            overflow-x: auto;
            overflow-y: hidden;
          }
        }
      }
    }

    .card {
      > .#{$prefix}-grid {
        &.#{$prefix}-grid-flip {
          div[class^="#{$prefix}-grid"] {
            &:first-child {
              @include border-top-right-radius(0);
              @include border-bottom-left-radius($border-radius-base * 2);
            }
          }

          .#{$prefix}-grid-content {
            @include border-top-right-radius($border-radius-base * 2);
          }
        }
      }

      .card-body {
        .#{$prefix}-grid {
          &.#{$prefix}-grid-flip {
            .#{$prefix}-grid-header,
            .#{$prefix}-grid-content {
              border-top: $table-border-width solid $table-border-color;
            }
          }
        }
      }
    }
  }
</style>