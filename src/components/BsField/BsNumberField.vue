<script>
import BsTextField from "./BsTextField";
import Helper from "../../utils/Helper";

export default {
    name: "BsNumberField",
    extends: BsTextField,
    props: {
        locale: {
            type: String,
            default: 'en-us'
        },
        useGrouping: {
            type: Boolean,
            default: true
        },
    },
    data() {
        const value = this._parseValue(this.value);
        const formatter = new Intl.NumberFormat(this.locale, {
            maximumFractionDigits: 20,
            useGrouping: this.useGrouping
        });

        return {
            invalidNumber: false,
            numberValue: value,
            formatter: formatter,
            localValue: !Helper.isEmpty(value) ? formatter.format(value) : null
        }
    },
    computed: {
        /**
         * Get input field computed binding's attributes.
         *
         * @returns {Object|*} The attributes to bind
         */
        attributes() {
            return {
                ...this.cmpAttrs,
                ...this.fieldAttrs,
                'type': this.fieldType,
                'value': this.localValue,
                'maxlength': this.maxlength,
                'minlength': this.minlength
            }
        }
    },
    watch: {
        value(newValue) {
            if (newValue && this.isFocused) {
                this.numberValue = newValue;
                this.localValue = newValue;
            } else if (newValue) {
                this.numberValue = this._parseValue(newValue);
                this.localValue = this.formatValue(this.numberValue);
            } else {
                this.localValue = null;
            }
            this._updateLegend(newValue);
        }
    },
    methods: {
        /**
         * Format the input value as number formatted value.
         *
         * @param {number} value The value to format
         * @returns {string} The formatted value
         */
        formatValue(value) {
            return !Helper.isEmpty(value) ? this.formatter.format(value) : null;
        },
        /**
         * Handler when input field lost focus.
         *
         * @param {FocusEvent} e The received event
         * @returns {void}
         * @private
         */
        _onBlur(e) {
            this.isFocused = false;
            this.localValue = this.formatValue(this.numberValue);
            this.$emit('blur', e);
            this._updateLegend();
            this._nextTickChange(this.numberValue);
        },
        /**
         * Handler when input field get focus.
         *
         * @param {FocusEvent} e The received event
         * @returns {void}
         * @private
         */
        _onFocus(e) {
            if (!this.$refs.input) {
                return;
            }
            if (document.activeElement !== this.$refs.input) {
                this.$refs.input.focus();
            }
            if (this.numberValue === undefined) {
                this.numberValue = this._parseValue(this.localValue);
            }

            this.isFocused = true;
            this.localValue = this.numberValue;
            this.$emit('focus', e);
            this._updateLegend();
        },
        /**
         * Handler when input field receive keypress.
         *
         * @param {KeyboardEvent} e The received event
         * @returns {void}
         * @private
         */
        _onKeyDown(e) {
            if (!this.$refs.input) {
                return;
            }

            if (e.key && e.key.toLowerCase() === 'enter') {
                this.numberValue = this._parseValue(this.localValue);
                this.localValue = this.formatValue(this.numberValue);
                this.$emit('keydown', e);
                this._nextTickChange(this.numberValue);
            } else {
                this.$emit('keydown', e);
            }
        },
        /**
         * Convert an input string as floating-point number.
         *
         * @param {string} value The value to convert
         * @returns {number} The converted value
         * @private
         */
        _parseValue(value) {
            if (Helper.isEmpty(value)) {
                this.localValue = null;
                return null;
            }

            let strValue = value.toString();
            const posComma = strValue.indexOf(',');
            const posDot = strValue.indexOf('.');

            if (posComma > -1 && posDot > -1) {
                if (posComma > posDot) {
                    strValue = strValue.replace(/\./g, '').replace(/,/g, '.');
                } else {
                    strValue = strValue.replace(/,/g, '');
                }
            } else if (posComma > -1) {
                const values = strValue.split(',');

                if (values.length > 2) {
                    strValue = values.join('');
                } else {
                    strValue = values.join('.');
                }
            } else if (posDot > -1) {
                const values = strValue.split('.');
                if (values.length > 2) {
                    strValue = values.join('');
                }
            }

            const floatValue = parseFloat(strValue);
            this.invalidNumber = isNaN(floatValue);
            this.localValue = floatValue;

            return floatValue;
        },
        /**
         * Update input field value and fire input events.
         *
         * @param {string|number} value the input value
         * @returns {void}
         * @private
         */
        _updateValue(value) {
            this.numberValue = this._parseValue(value);
            this.$emit('input', this.numberValue);
            this._nextTickChange(this.numberValue);
        }
    }
}
</script>

<style scoped>

</style>
