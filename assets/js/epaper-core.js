/*
 * দৈনিক চালচিত্র — E-Paper Core
 * New standalone module
 * কাজ:
 *  - ই-পেপার ডেটা লোড
 *  - Edition নির্বাচন
 *  - Date নির্বাচন
 *  - Page তালিকা তৈরি
 *  - Reader-এর জন্য বর্তমান পেজ সংরক্ষণ
 *  - Navigation event পরিচালনা
 */

(function (window, document) {
    'use strict';

    const DC_EPAPER = {

        config: {
            dataUrl: '/_epaper/epaper-data.json',
            storageKey: 'dc_epaper_reader_state',
            defaultPage: 1
        },

        state: {
            data: null,
            editions: [],
            currentEdition: null,
            currentDate: null,
            pages: [],
            currentPage: 1
        },

        /* -------------------------------------------------
         * Initialization
         * ------------------------------------------------- */

        init: function (options) {
            options = options || {};

            if (options.dataUrl) {
                this.config.dataUrl = options.dataUrl;
            }

            if (options.storageKey) {
                this.config.storageKey = options.storageKey;
            }

            this.restoreState();

            return this.loadData();
        },

        /* -------------------------------------------------
         * Data
         * ------------------------------------------------- */

        loadData: function () {
            const self = this;

            return fetch(this.config.dataUrl, {
                method: 'GET',
                credentials: 'same-origin',
                cache: 'no-cache'
            })
            .then(function (response) {
                if (!response.ok) {
                    throw new Error(
                        'E-Paper data load failed: HTTP ' + response.status
                    );
                }

                return response.json();
            })
            .then(function (data) {

                if (!data || typeof data !== 'object') {
                    throw new Error('Invalid E-Paper data.');
                }

                self.state.data = data;

                self.normalizeData();

                self.dispatch('dc:epaper-ready', {
                    data: self.state.data,
                    editions: self.state.editions
                });

                return self.state.data;
            })
            .catch(function (error) {

                console.error(
                    '[Daily Chalchitra E-Paper]',
                    error
                );

                self.dispatch('dc:epaper-error', {
                    error: error
                });

                throw error;
            });
        },

        /* -------------------------------------------------
         * Normalize JSON
         * ------------------------------------------------- */

        normalizeData: function () {

            const data = this.state.data;

            if (Array.isArray(data.editions)) {
                this.state.editions = data.editions;
            } else if (Array.isArray(data)) {
                this.state.editions = data;
            } else {
                this.state.editions = [];
            }

            this.state.editions = this.state.editions.map(
                function (edition) {

                    edition = edition || {};

                    let dates = [];

                    if (Array.isArray(edition.dates)) {
                        dates = edition.dates;
                    }

                    return {
                        id: edition.id || edition.slug || '',
                        name: edition.name ||
                              edition.title ||
                              'ই-পেপার',
                        dates: dates
                    };
                }
            );

            return this.state.editions;
        },

        /* -------------------------------------------------
         * Editions
         * ------------------------------------------------- */

        getEditions: function () {
            return this.state.editions.slice();
        },

        getEdition: function (editionId) {

            if (!editionId) {
                return null;
            }

            return this.state.editions.find(function (edition) {
                return String(edition.id) === String(editionId);
            }) || null;
        },

        selectEdition: function (editionId) {

            const edition = this.getEdition(editionId);

            if (!edition) {
                return false;
            }

            this.state.currentEdition = edition;
            this.state.currentDate = null;
            this.state.pages = [];

            this.saveState();

            this.dispatch('dc:epaper-edition-change', {
                edition: edition
            });

            return true;
        },

        /* -------------------------------------------------
         * Dates
         * ------------------------------------------------- */

        getDates: function () {

            if (!this.state.currentEdition) {
                return [];
            }

            return Array.isArray(this.state.currentEdition.dates)
                ? this.state.currentEdition.dates.slice()
                : [];
        },

        getDate: function (dateValue) {

            const dates = this.getDates();

            return dates.find(function (item) {

                if (typeof item === 'string') {
                    return item === dateValue;
                }

                if (!item) {
                    return false;
                }

                return String(item.id || item.date || item.value) ===
                       String(dateValue);

            }) || null;
        },

        selectDate: function (dateValue) {

            const dateItem = this.getDate(dateValue);

            if (!dateItem) {
                return false;
            }

            this.state.currentDate = dateItem;

            this.state.pages = this.extractPages(dateItem);

            this.state.currentPage =
                this.getSavedPage(
                    this.getCurrentEditionId(),
                    this.getCurrentDateValue()
                ) || this.config.defaultPage;

            if (this.state.currentPage > this.state.pages.length) {
                this.state.currentPage = 1;
            }

            this.saveState();

            this.dispatch('dc:epaper-date-change', {
                date: dateItem,
                pages: this.state.pages
            });

            return true;
        },

        /* -------------------------------------------------
         * Pages
         * ------------------------------------------------- */

        extractPages: function (dateItem) {

            if (!dateItem) {
                return [];
            }

            let pages = [];

            if (Array.isArray(dateItem.pages)) {
                pages = dateItem.pages;
            } else if (
                dateItem.pages &&
                typeof dateItem.pages === 'object'
            ) {
                pages = Object.keys(dateItem.pages).map(
                    function (key) {
                        return dateItem.pages[key];
                    }
                );
            }

            return pages.map(function (page, index) {

                if (typeof page === 'string') {
                    return {
                        number: index + 1,
                        title: 'পৃষ্ঠা ' + (index + 1),
                        image: page
                    };
                }

                page = page || {};

                return {
                    number:
                        Number(page.number) ||
                        Number(page.page) ||
                        index + 1,

                    title:
                        page.title ||
                        page.name ||
                        'পৃষ্ঠা ' + (index + 1),

                    image:
                        page.image ||
                        page.imageUrl ||
                        page.src ||
                        '',

                    thumbnail:
                        page.thumbnail ||
                        page.thumb ||
                        page.image ||
                        page.imageUrl ||
                        '',

                    pdf:
                        page.pdf ||
                        page.pdfUrl ||
                        '',

                    url:
                        page.url ||
                        '',

                    width:
                        Number(page.width) || 0,

                    height:
                        Number(page.height) || 0
                };
            });
        },

        getPages: function () {
            return this.state.pages.slice();
        },

        getPage: function (pageNumber) {

            const number = Number(pageNumber);

            return this.state.pages.find(function (page) {
                return Number(page.number) === number;
            }) || null;
        },

        getCurrentPage: function () {
            return this.getPage(this.state.currentPage);
        },

        /* -------------------------------------------------
         * Page Navigation
         * ------------------------------------------------- */

        goToPage: function (pageNumber) {

            const number = Number(pageNumber);

            if (!Number.isFinite(number)) {
                return false;
            }

            const page = this.getPage(number);

            if (!page) {
                return false;
            }

            this.state.currentPage = number;

            this.saveState();

            this.dispatch('dc:epaper-page-change', {
                page: page,
                pageNumber: number,
                totalPages: this.state.pages.length
            });

            return true;
        },

        nextPage: function () {

            const next = this.state.currentPage + 1;

            if (next > this.state.pages.length) {
                return false;
            }

            return this.goToPage(next);
        },

        previousPage: function () {

            const previous = this.state.currentPage - 1;

            if (previous < 1) {
                return false;
            }

            return this.goToPage(previous);
        },

        firstPage: function () {
            return this.goToPage(1);
        },

        lastPage: function () {

            if (!this.state.pages.length) {
                return false;
            }

            return this.goToPage(
                this.state.pages.length
            );
        },

        /* -------------------------------------------------
         * Current Values
         * ------------------------------------------------- */

        getCurrentEditionId: function () {

            if (!this.state.currentEdition) {
                return '';
            }

            return String(this.state.currentEdition.id || '');
        },

        getCurrentDateValue: function () {

            const date = this.state.currentDate;

            if (!date) {
                return '';
            }

            if (typeof date === 'string') {
                return date;
            }

            return String(
                date.id ||
                date.date ||
                date.value ||
                ''
            );
        },

        /* -------------------------------------------------
         * Reader State
         * ------------------------------------------------- */

        saveState: function () {

            try {

                const saved = {
                    edition:
                        this.getCurrentEditionId(),

                    date:
                        this.getCurrentDateValue(),

                    page:
                        this.state.currentPage
                };

                window.localStorage.setItem(
                    this.config.storageKey,
                    JSON.stringify(saved)
                );

            } catch (error) {

                console.warn(
                    '[Daily Chalchitra E-Paper] State save failed.',
                    error
                );
            }
        },

        restoreState: function () {

            try {

                const raw =
                    window.localStorage.getItem(
                        this.config.storageKey
                    );

                if (!raw) {
                    return null;
                }

                const saved = JSON.parse(raw);

                if (!saved || typeof saved !== 'object') {
                    return null;
                }

                this.state.currentPage =
                    Number(saved.page) ||
                    this.config.defaultPage;

                this.state._savedEdition =
                    saved.edition || '';

                this.state._savedDate =
                    saved.date || '';

                return saved;

            } catch (error) {

                console.warn(
                    '[Daily Chalchitra E-Paper] State restore failed.',
                    error
                );

                return null;
            }
        },

        getSavedPage: function (editionId, dateValue) {

            try {

                const raw =
                    window.localStorage.getItem(
                        this.config.storageKey
                    );

                if (!raw) {
                    return 0;
                }

                const saved = JSON.parse(raw);

                if (
                    String(saved.edition || '') ===
                        String(editionId || '') &&
                    String(saved.date || '') ===
                        String(dateValue || '')
                ) {
                    return Number(saved.page) || 0;
                }

            } catch (error) {
                return 0;
            }

            return 0;
        },

        /* -------------------------------------------------
         * Restore Last Reader Position
         * ------------------------------------------------- */

        restoreLastPosition: function () {

            if (!this.state.editions.length) {
                return false;
            }

            const editionId =
                this.state._savedEdition;

            const dateValue =
                this.state._savedDate;

            if (!editionId) {
                return false;
            }

            if (!this.selectEdition(editionId)) {
                return false;
            }

            if (!dateValue) {
                return true;
            }

            return this.selectDate(dateValue);
        },

        /* -------------------------------------------------
         * Event System
         * ------------------------------------------------- */

        dispatch: function (eventName, detail) {

            try {

                document.dispatchEvent(
                    new CustomEvent(
                        eventName,
                        {
                            detail: detail || {}
                        }
                    )
                );

            } catch (error) {

                console.error(
                    '[Daily Chalchitra E-Paper] Event error:',
                    error
                );
            }
        },

        /* -------------------------------------------------
         * Utility
         * ------------------------------------------------- */

        formatDate: function (dateValue) {

            if (!dateValue) {
                return '';
            }

            const date =
                new Date(dateValue);

            if (Number.isNaN(date.getTime())) {
                return String(dateValue);
            }

            try {

                return new Intl.DateTimeFormat(
                    'bn-BD',
                    {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    }
                ).format(date);

            } catch (error) {

                return String(dateValue);
            }
        },

        escapeHtml: function (value) {

            const div =
                document.createElement('div');

            div.textContent =
                value == null ? '' : String(value);

            return div.innerHTML;
        },

        /* -------------------------------------------------
         * Debug
         * ------------------------------------------------- */

        debug: function () {

            return {
                config: this.config,
                state: this.state
            };
        }
    };

    window.DailyChalchitraEPaper = DC_EPAPER;

})(window, document);
