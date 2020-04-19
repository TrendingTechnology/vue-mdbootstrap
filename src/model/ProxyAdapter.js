import Vue from "vue";
import Helper from "../utils/Helper";

/**
 * Class ProxyAdapter which is used to load data from remote server.
 *
 * @author Ahmad Fajar
 * @since  20/07/2018 modified: 03/04/2019 15:42
 */
export default class ProxyAdapter {
    /**
     * Check if axios plugin already installed and defined not.
     *
     * @return {void}
     * @throws Error If axios doesn't exists
     * @static
     */
    static checkAxios() {
        if (!Vue.prototype.$http || !Vue.prototype.$axios) {
            throw Error("Application doesn't have AxiosPlugin installed. " +
                "Please define it some where in the application before using this class.")
        }
    }

    /**
     * Check if Rest URL already defined or not.
     *
     * @param {Object} restUrl The Rest URL to check
     * @return {void}
     * @throws URIError If Rest Url is not defined
     */
    static checkRestUrl(restUrl) {
        if (Helper.isEmptyObject(restUrl)) {
            throw new URIError('REST URL is not defined yet.');
        }
    }

    /**
     * Log error response to console.
     *
     * @param {Object} error Error object
     * @return {void}
     * @static
     */
    static warnResponseError(error) {
        if (error.response) {
            console.warn('Request failed with status code: ', error.response.status);
        } else if (error.request) {
            console.warn(error.request);
        } else {
            console.warn((error && error.message ? error.message : error));
        }
    }

    /**
     * Default Http request method configurations. Do not override this property.
     *
     * @return {{browse: string, fetch: string, save: string, update: string, delete: string}} Http methods
     * @static
     */
    static get defaultHttpMethods() {
        return {
            'browse': 'get',
            'fetch': 'get',
            'save': 'post',
            'update': 'post',
            'delete': 'delete'
        }
    }

    /**
     * Class constructor.
     *
     * @param {Object} [httpMethods] Custom HTTP methods to override the default methods
     */
    constructor(httpMethods = {}) {
        this._httpMethods = httpMethods;
    }

    /**
     * Perform REST request to the server.
     *
     * @param {Object} config       Request configuration
     * @param {Function} onRequest  Called before the request is made.
     * @param {Function} onSuccess  Called when the request was successful.
     * @param {Function} onFailure  Called when the request failed.
     * @return {Promise<*>}         Promise
     */
    request(config, onRequest, onSuccess, onFailure) {
        ProxyAdapter.checkAxios();

        return new Promise((resolve, reject) => {
            let check = !Helper.isEmpty(config) && config.url && config.url !== '';

            if (!check) {
                return;
            }

            check = Helper.isFunction(onRequest);

            if (check && onRequest()) {
                Vue.prototype.$axios(config)
                    .then((response) => {
                        if (Helper.isFunction(onSuccess)) {
                            onSuccess(response);
                        }
                        return resolve(response);
                    })
                    .catch((error) => {
                        if (Helper.isFunction(onFailure)) {
                            onFailure(error);
                        }
                        return reject(error);
                    });
            }
        });
    }

    /**
     * Get Http request methods.
     *
     * @return {Object} Http request methods
     */
    requestMethods() {
        return {
            ...ProxyAdapter.defaultHttpMethods,
            ...this._httpMethods
        }
    }

}