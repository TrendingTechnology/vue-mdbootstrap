<template>
  <div class="md-menu" :class="classNames" @keydown="_changeListIndex">
    <div class="md-menu-activator"
         ref="activator"
         @mouseenter="onMouseEnter"
         @mouseleave="onMouseLeave"
         @click="activatorClick">
      <slot></slot>
    </div>
    <bs-popover class="md-menu-popover md-shadow-1"
                :style="popoverStyles"
                :cover="cover"
                :open="active"
                :placement="placement"
                :transition="transition"
                :trigger="trigger"
                ref="content"
                @close="hideMenu"
                @click="_onContentClick"
                @mouseenter="onMouseEnter"
                @mouseleave="onMouseLeave">
      <slot name="content"></slot>
    </bs-popover>
  </div>
</template>

<script>
import BsPopover from "../BsPopover/BsPopover";
import MenuAble from "../../mixins/MenuAble";
import "../../../scss/_shadows.scss";

export default {
    name: "BsMenu",
    components: {BsPopover},
    mixins: [MenuAble],
    model: {
        prop: 'open',
        event: 'open'
    },
    props: {
        cover: Boolean,
        placement: {
            type: String,
            default: BsPopover.props.placement.default
        },
        transition: {
            type: String,
            default: BsPopover.props.transition.default
        },
        contentClickClose: {
            type: Boolean,
            default: true
        }
    },
    data: () => ({
        tiles: [],
        trigger: null
    }),
    computed: {
        classNames() {
            return {
                'md-open': this.open,
                'md-disabled': this.disabled
            }
        },
        popoverStyles() {
            return {
                'min-width': this.trigger ? this.trigger.offsetWidth + 'px' : ''
            }
        }
    },
    watch: {
        listIndex(next, prev) {
            if (next in this.tiles) {
                const tile = this.tiles[next];
                tile.classList.add('md-active');
                this.$refs.content.$el.scrollTop = tile.offsetTop - tile.clientHeight;
            }

            prev in this.tiles && this.tiles[prev].classList.remove('md-active');
        }
    },
    mounted() {
        this.trigger = this.$refs.activator;
    },
    methods: {
        /**
         * Keyboard event handler.
         *
         * @param {KeyboardEvent} e Keyboard event
         * @return {void}
         * @private
         */
        _changeListIndex(e) {
            if (['arrowdown', 'arrowup', 'enter'].includes(e.key.toLowerCase())) {
                e.stopPropagation();
            }
            if (['escape', 'tab'].includes(e.key.toLowerCase())) {
                this.active = false;
            }
            // For infinite scroll and autocomplete, re-evaluate children
            this._getTiles();

            if (e.key.toLowerCase() === 'arrowdown' && this.listIndex < this.tiles.length - 1) {
                this.listIndex++;
            } else if (e.key.toLowerCase() === 'arrowup' && this.listIndex > -1) {
                // Allow user to set listIndex to -1 so that the list can be un-highlighted
                this.listIndex--;
            } else if (e.key.toLowerCase() === 'enter' && this.listIndex !== -1) {
                this.tiles[this.listIndex].click();
                this.active = false;
            }
        },
        /**
         * Get list elements.
         *
         * @return {void}
         * @private
         */
        _getTiles() {
            this.tiles = this.$refs.content.$el.querySelectorAll('.md-list-item');
        },
        /**
         * Handler when content body is clicked.
         *
         * @return {void}
         * @private
         */
        _onContentClick() {
            if (this.contentClickClose) {
                this.active = false;
            }
        }
    }
}
</script>

<style lang="scss">
  @import "~compass-sass-mixins/lib/compass/css3";
  @import "../../../scss/colors";
  @import "../../../scss/variables";

  .#{$prefix}-menu {
    display: inline-block;
    position: relative;
    vertical-align: middle;

    .#{$prefix}-menu-activator {
      @include align-items(center);
      cursor: pointer;
      height: 100%;
      position: relative;

      input[readonly] {
        cursor: pointer;
      }

      .disabled & {
        cursor: default;
        pointer-events: none;
      }
    }
  }

  .#{$prefix}-menu-popover {
    background-color: $white;
    @include border-radius($border-radius-base);

    > .#{$prefix}-list {
      @include border-radius($border-radius-base);

      .#{$prefix}-divider {
        margin-bottom: 3px;
        margin-top: 3px;
      }
    }
  }

  .#{$prefix}-menu-toggle-icon {
    transition: transform .3s cubic-bezier(.23, 1, .32, 1);

    .#{$prefix}-open & {
      transform: rotate(180deg);
    }
  }
</style>