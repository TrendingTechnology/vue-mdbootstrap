<template>
  <ul class="md-list-nav" v-bind="_attributes">
    <slot></slot>
  </ul>
</template>

<script>
import Helper from "../../utils/Helper";

export default {
    name: "BsListNav",
    inject: ['bsList'],
    props: {
        id: {
            type: String,
            default() {
                return 'bs-' + Helper.uuid(true);
            }
        },
        child: {
            type: Boolean,
            default: false
        },
    },
    data: () => ({
        collapsing: false,
        expanded: false,
        children: []
    }),
    computed: {
        _attributes() {
            return {
                'id': this.id,
                'class': this._classNames
            }
        },
        _classNames() {
            return {
                'md-nav-child': this.child,
                'collapse': this.child && !this.expanded,
                'collapsing': this.child && this.collapsing,
            }
        }
    },
    created() {
        if (this.bsList) {
            this.bsList.addItem({uid: this.id, component: this});
        }
    },
    beforeDestroy() {
        this.children = [];
        this.bsList.removeItem(this.id);
    },
    methods: {
        /**
         * Add an item to the ListNav registry.
         *
         * @param {Object} item The BsListNavItem instance to add
         * @returns {void}
         */
        addItem(item) {
            this.children.push(item);
        },
        /**
         * Remove an item from the ListNav registry.
         *
         * @param {string} uid The ID of BsListNavItem that will be removed
         * @returns {void}
         */
        removeItem(uid) {
            const index = this.children.findIndex(el => el.uid === uid);

            if (index > -1) {
                this.children.splice(index, 1);
            }
        }
    }
}
</script>

<style lang="scss">
@import "~compass-sass-mixins/lib/compass/css3";
@import "../../../scss/colors";
@import "../../../scss/variables";

.#{$prefix}-list-nav {
  @include display-flex();
  @include flex-wrap(wrap);
  padding-left: 0;
  margin-bottom: 0;
  list-style: none;

  .collapsing {
    @include transition($md-transition-default);
    height: 0;
    overflow: hidden;
  }
}
</style>