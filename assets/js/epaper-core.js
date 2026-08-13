/*
 * দৈনিক চালচিত্র — E-Paper Core
 * Compatible with:
 * /assets/epaper/issues/issues.json
 *
 * কাজ:
 * - issues.json থেকে সপ্তাহ/Issue লোড
 * - Issue নির্বাচন
 * - Posts → E-Paper pages তৈরি
 * - Previous / Next Page
 * - Page state সংরক্ষণ
 * - Viewer-এর সঙ্গে event communication
 */

(function (window, document) {
    'use strict';

    const DC_EPAPER = {

        config: {
            dataUrl: '/assets/epaper/issues/issues.json',
            storageKey: 'dc_epaper_reader_state',
            postsPerPage: 6,
            defaultPage: 1
        },

        state: {
            data: [],
            editions: [],
            currentEdition: null,
            currentDate: null,
            pages: [],
            currentPage: 1,
            _savedEdition: '',
            _savedDate: ''
        },

        /* =================================================
         * INITIALIZATION
         * ================================================= */

        init: function (options) {

            options = options || {};

            if (options.dataUrl) {
                this.config.dataUrl = options.dataUrl;
            }

            if (options.storageKey) {
                this.config.storageKey = options.storageKey;
            }

            if (options.postsPerPage) {
                this.config.postsPerPage =
                    Number(options.postsPerPage) || 6;
            }

            this.restoreState();

            return this.loadData();
        },

        /* =================================================
         * LOAD ISSUES.JSON
         * ================================================= */

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
                        'E-Paper data load failed: HTTP ' +
                        response.status
                    );
                }

                return response.json();
            })

            .then(function (data) {

                if (!Array.isArray(data)) {
                    throw new Error(
                        'Invalid E-Paper issues.json format.'
                    );
                }

                self.state.data = data;

                self.normalizeData();

                self.dispatch(
                    'dc:epaper-ready',
                    {
                        data: self.state.data,
                        editions: self.state.editions
                    }
                );

                /*
                 * আগের অবস্থান থাকলে restore
                 */
                self.restoreLastPosition();

                return self.state.data;
            })

            .catch(function (error) {

                console.error(
                    '[Daily Chalchitra E-Paper]',
                    error
                );

                self.dispatch(
                    'dc:epaper-error',
                    {
                        error: error
                    }
                );

                throw error;
            });
        },

        /* =================================================
         * NORMALIZE ISSUES
         * ================================================= */

        normalizeData: function () {

            const source =
                Array.isArray(this.state.data)
                    ? this.state.data
                    : [];

            this.state.editions =
                source.map(function (issue, index) {

                    issue = issue || {};

                    const id =
                        issue.id ||
                        issue.slug ||
                        ('issue-' + index);

                    const posts =
                        Array.isArray(issue.posts)
                            ? issue.posts
                            : [];

                    return {
                        id: String(id),

                        name:
                            issue.title ||
                            ('ই-পেপার ' + (index + 1)),

                        title:
                            issue.title ||
                            ('ই-পেপার ' + (index + 1)),

                        year:
                            issue.year || '',

                        week:
                            issue.week || '',

                        date:
                            issue.date || '',

                        cover:
                            issue.cover || '',

                        count:
                            Number(issue.count) ||
                            posts.length,

                        viewer:
                            issue.viewer || '',

                        posts: posts,

                        raw: issue
                    };
                });

            return this.state.editions;
        },

        /* =================================================
         * EDITIONS / ISSUES
         * ================================================= */

        getEditions: function () {

            return this.state.editions.slice();
        },

        getEdition: function (editionId) {

            if (!editionId) {
                return null;
            }

            return this.state.editions.find(
                function (edition) {

                    return String(edition.id) ===
                           String(editionId);
                }
            ) || null;
        },

        selectEdition: function (editionId) {

            const edition =
                this.getEdition(editionId);

            if (!edition) {
                return false;
            }

            this.state.currentEdition =
                edition;

            this.state.currentDate =
                edition.date || '';

            /*
             * Issue-এর posts থেকে pages তৈরি
             */
            this.state.pages =
                this.createPages(
                    edition.posts || []
                );

            const savedPage =
                this.getSavedPage(
                    edition.id,
                    this.getCurrentDateValue()
                );

            this.state.currentPage =
                savedPage || this.config.defaultPage;

            if (
                this.state.currentPage >
                this.state.pages.length
            ) {
                this.state.currentPage = 1;
            }

            this.saveState();

            this.dispatch(
                'dc:epaper-edition-change',
                {
                    edition: edition,
                    pages: this.state.pages
                }
            );

            /*
             * প্রথম পৃষ্ঠা Viewer-কে পাঠানো
             */
            if (this.state.pages.length) {

                this.dispatch(
                    'dc:epaper-page-change',
                    {
                        page:
                            this.getCurrentPage(),

                        pageNumber:
                            this.state.currentPage,

                        totalPages:
                            this.state.pages.length
                    }
                );
            }

            return true;
        },

        /* =================================================
         * DATE
         * ================================================= */

        getDates: function () {

            if (!this.state.currentEdition) {
                return [];
            }

            return [
                {
                    id:
                        this.state.currentEdition.id,

                    date:
                        this.state.currentEdition.date,

                    title:
                        this.state.currentEdition.title
                }
            ];
        },

        getDate: function (dateValue) {

            if (!this.state.currentEdition) {
                return null;
            }

            if (
                String(
                    this.state.currentEdition.id
                ) === String(dateValue)
            ) {
                return this.state.currentEdition;
            }

            if (
                String(
                    this.state.currentEdition.date
                ) === String(dateValue)
            ) {
                return this.state.currentEdition;
            }

            return null;
        },

        selectDate: function (dateValue) {

            const edition =
                this.getDate(dateValue);

            if (!edition) {
                return false;
            }

            this.state.currentDate =
                edition.date || dateValue;

            this.state.pages =
                this.createPages(
                    edition.posts || []
                );

            this.state.currentPage =
                this.getSavedPage(
                    edition.id,
                    this.getCurrentDateValue()
                ) ||
                this.config.defaultPage;

            if (
                this.state.currentPage >
                this.state.pages.length
            ) {
                this.state.currentPage = 1;
            }

            this.saveState();

            this.dispatch(
                'dc:epaper-date-change',
                {
                    date: edition,
                    pages: this.state.pages
                }
            );

            return true;
        },

        /* =================================================
         * POSTS → PAGES
         * ================================================= */

        createPages: function (posts) {

            if (!Array.isArray(posts)) {
                return [];
            }

            const perPage =
                Math.max(
                    1,
                    Number(
                        this.config.postsPerPage
                    ) || 6
                );

            const pages = [];

            for (
                let i = 0;
                i < posts.length;
                i += perPage
            ) {

                const pagePosts =
                    posts.slice(
                        i,
                        i + perPage
                    );

                pages.push({

                    number:
                        pages.length + 1,

                    title:
                        'পৃষ্ঠা ' +
                        (pages.length + 1),

                    image:
                        '',

                    thumbnail:
                        '',

                    pdf:
                        '',

                    posts:
                        pagePosts,

                    start:
                        i,

                    end:
                        i + pagePosts.length
                });
            }

            return pages;
        },

        extractPages: function (dateItem) {

            if (!dateItem) {
                return [];
            }

            if (
                Array.isArray(
                    dateItem.pages
                )
            ) {
                return dateItem.pages;
            }

            return this.createPages(
                dateItem.posts || []
            );
        },

        getPages: function () {

            return this.state.pages.slice();
        },

        getPage: function (pageNumber) {

            const number =
                Number(pageNumber);

            return this.state.pages.find(
                function (page) {

                    return Number(
                        page.number
                    ) === number;
                }
            ) || null;
        },

        getCurrentPage: function () {

            return this.getPage(
                this.state.currentPage
            );
        },

        /* =================================================
         * PAGE NAVIGATION
         * ================================================= */

        goToPage: function (pageNumber) {

            const number =
                Number(pageNumber);

            if (
                !Number.isFinite(number)
            ) {
                return false;
            }

            const page =
                this.getPage(number);

            if (!page) {
                return false;
            }

            this.state.currentPage =
                number;

            this.saveState();

            this.dispatch(
                'dc:epaper-page-change',
                {
                    page: page,

                    pageNumber:
                        number,

                    totalPages:
                        this.state.pages.length
                }
            );

            return true;
        },

        nextPage: function () {

            const next =
                this.state.currentPage + 1;

            if (
                next >
                this.state.pages.length
            ) {
                return false;
            }

            return this.goToPage(next);
        },

        previousPage: function () {

            const previous =
                this.state.currentPage - 1;

            if (previous < 1) {
                return false;
            }

            return this.goToPage(
                previous
            );
        },

        firstPage: function () {

            return this.goToPage(1);
        },

        lastPage: function () {

            if (
                !this.state.pages.length
            ) {
                return false;
            }

            return this.goToPage(
                this.state.pages.length
            );
        },

        /* =================================================
         * CURRENT VALUES
         * ================================================= */

        getCurrentEditionId: function () {

            if (
                !this.state.currentEdition
            ) {
                return '';
            }

            return String(
                this.state.currentEdition.id || ''
            );
        },

        getCurrentDateValue: function () {

            if (
                !this.state.currentEdition
            ) {
                return '';
            }

            return String(
                this.state.currentEdition.date ||
                this.state.currentDate ||
                this.state.currentEdition.id ||
                ''
            );
        },

        /* =================================================
         * LOCAL STORAGE
         * ================================================= */

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
                    '[Daily Chalchitra E-Paper] ' +
                    'State save failed.',
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

                const saved =
                    JSON.parse(raw);

                if (
                    !saved ||
                    typeof saved !== 'object'
                ) {
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
                    '[Daily Chalchitra E-Paper] ' +
                    'State restore failed.',
                    error
                );

                return null;
            }
        },

        getSavedPage: function (
            editionId,
            dateValue
        ) {

            try {

                const raw =
                    window.localStorage.getItem(
                        this.config.storageKey
                    );

                if (!raw) {
                    return 0;
                }

                const saved =
                    JSON.parse(raw);

                if (
                    String(
                        saved.edition || ''
                    ) ===
                    String(
                        editionId || ''
                    ) &&
                    String(
                        saved.date || ''
                    ) ===
                    String(
                        dateValue || ''
                    )
                ) {

                    return (
                        Number(saved.page) || 0
                    );
                }

            } catch (error) {

                return 0;
            }

            return 0;
        },

        /* =================================================
         * RESTORE LAST POSITION
         * ================================================= */

        restoreLastPosition: function () {

            if (
                !this.state.editions.length
            ) {
                return false;
            }

            let editionId =
                this.state._savedEdition;

            /*
             * আগে কোনো state না থাকলে
             * সর্বশেষ issue নির্বাচন হবে।
             */
            if (!editionId) {

                editionId =
                    this.state.editions[0].id;
            }

            const selected =
                this.selectEdition(
                    editionId
                );

            if (!selected) {
                return false;
            }

            return true;
        },

        /* =================================================
         * EVENT SYSTEM
         * ================================================= */

        dispatch: function (
            eventName,
            detail
        ) {

            try {

                document.dispatchEvent(
                    new CustomEvent(
                        eventName,
                        {
                            detail:
                                detail || {}
                        }
                    )
                );

            } catch (error) {

                console.error(
                    '[Daily Chalchitra E-Paper] ' +
                    'Event error:',
                    error
                );
            }
        },

        /* =================================================
         * DATE FORMAT
         * ================================================= */

        formatDate: function (
            dateValue
        ) {

            if (!dateValue) {
                return '';
            }

            const date =
                new Date(dateValue);

            if (
                Number.isNaN(
                    date.getTime()
                )
            ) {
                return String(
                    dateValue
                );
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

                return String(
                    dateValue
                );
            }
        },

        /* =================================================
         * HTML ESCAPE
         * ================================================= */

        escapeHtml: function (value) {

            const div =
                document.createElement(
                    'div'
                );

            div.textContent =
                value == null
                    ? ''
                    : String(value);

            return div.innerHTML;
        },

        /* =================================================
         * DEBUG
         * ================================================= */

        debug: function () {

            return {

                config:
                    this.config,

                state:
                    this.state
            };
        }
    };

    /*
     * Global API
     */
    window.DailyChalchitraEPaper =
        DC_EPAPER;

})(window, document);
