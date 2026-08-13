/*
 * দৈনিক চালচিত্র — E-Paper Core
 *
 * Version: 2.0
 *
 * কাজ:
 *  - issues.json লোড
 *  - Weekly issue নির্বাচন
 *  - URL ?issue=2026-W32 support
 *  - Issue/date নির্বাচন
 *  - Post → Page conversion
 *  - Page তালিকা তৈরি
 *  - Current page সংরক্ষণ
 *  - Previous / Next navigation
 *  - Viewer event dispatch
 */

(function (window, document) {

    'use strict';


    const DC_EPAPER = {


        /* ==================================================
           Configuration
           ================================================== */

        config: {

            dataUrl:
                '/assets/epaper/issues/issues.json',

            storageKey:
                'dc_epaper_reader_state',

            defaultPage:
                1

        },


        /* ==================================================
           State
           ================================================== */

        state: {

            data:
                null,

            issues:
                [],

            editions:
                [],

            currentEdition:
                null,

            currentDate:
                null,

            pages:
                [],

            currentPage:
                1,

            ready:
                false,

            loading:
                false,

            initialized:
                false,

            _savedEdition:
                '',

            _savedDate:
                ''

        },


        /* ==================================================
           Initialization
           ================================================== */

        init: function (options) {

            options =
                options || {};


            if (
                options.dataUrl
            ) {

                this.config.dataUrl =
                    options.dataUrl;

            }


            if (
                options.storageKey
            ) {

                this.config.storageKey =
                    options.storageKey;

            }


            if (
                this.state.initialized
            ) {

                return Promise.resolve(
                    this.state.data
                );

            }


            this.state.initialized =
                true;


            this.restoreState();


            return this.loadData();

        },


        /* ==================================================
           Load Data
           ================================================== */

        loadData: function () {

            const self =
                this;


            if (
                this.state.loading
            ) {

                return this.state._loadPromise;

            }


            this.state.loading =
                true;


            this.state._loadPromise =
                fetch(
                    this.config.dataUrl,
                    {
                        method:
                            'GET',

                        credentials:
                            'same-origin',

                        cache:
                            'no-cache'
                    }
                )


                .then(
                    function (response) {

                        if (
                            !response.ok
                        ) {

                            throw new Error(
                                'E-Paper data load failed: HTTP ' +
                                response.status
                            );

                        }


                        return response.json();

                    }
                )


                .then(
                    function (data) {

                        if (
                            !Array.isArray(data) &&
                            (
                                !data ||
                                typeof data !== 'object'
                            )
                        ) {

                            throw new Error(
                                'Invalid E-Paper data.'
                            );

                        }


                        self.state.data =
                            data;


                        self.normalizeData();


                        self.state.ready =
                            true;

                        self.state.loading =
                            false;


                        self.dispatch(
                            'dc:epaper-ready',
                            {
                                data:
                                    self.state.data,

                                issues:
                                    self.state.issues,

                                editions:
                                    self.state.editions
                            }
                        );


                        return self.state.data;

                    }
                )


                .catch(
                    function (error) {

                        self.state.loading =
                            false;


                        console.error(
                            '[Daily Chalchitra E-Paper]',
                            error
                        );


                        self.dispatch(
                            'dc:epaper-error',
                            {
                                error:
                                    error
                            }
                        );


                        throw error;

                    }
                );


            return this.state._loadPromise;

        },


        /* ==================================================
           Normalize Data
           ================================================== */

        normalizeData: function () {

            const data =
                this.state.data;


            let issues =
                [];


            /*
             * Current issues.json format:
             *
             * [
             *   {
             *      id: "2026-W32",
             *      title: "...",
             *      date: "...",
             *      posts: [...]
             *   }
             * ]
             */

            if (
                Array.isArray(data)
            ) {

                issues =
                    data;

            } else if (
                data &&
                Array.isArray(data.issues)
            ) {

                issues =
                    data.issues;

            } else if (
                data &&
                Array.isArray(data.editions)
            ) {

                /*
                 * Compatibility with older format.
                 */

                this.state.editions =
                    data.editions;

                this.state.issues =
                    [];

                return this.state.editions;

            }


            this.state.issues =
                issues.map(
                    function (issue) {

                        return issue ||
                            {};

                    }
                );


            /*
             * One newspaper edition.
             *
             * Each weekly issue becomes a date.
             */

            this.state.editions = [

                {

                    id:
                        'daily-chalchitra',

                    name:
                        'দৈনিক চালচিত্র',

                    title:
                        'দৈনিক চালচিত্র',

                    dates:
                        this.state.issues.map(
                            function (issue) {

                                return {

                                    id:
                                        String(
                                            issue.id ||
                                            ''
                                        ),

                                    date:
                                        issue.date ||
                                        '',

                                    title:
                                        issue.title ||
                                        issue.id ||
                                        'ই-পেপার',

                                    cover:
                                        issue.cover ||
                                        '',

                                    viewer:
                                        issue.viewer ||
                                        '',

                                    count:
                                        Number(
                                            issue.count
                                        ) ||
                                        0,

                                    pages:
                                        this.convertPostsToPages(
                                            issue.posts
                                        )

                                };

                            }.bind(this)
                        )

                }

            ];


            return this.state.editions;

        },


        /* ==================================================
           Convert Posts → Pages
           ================================================== */

        convertPostsToPages: function (
            posts
        ) {

            if (
                !Array.isArray(posts)
            ) {

                return [];

            }


            return posts.map(
                function (post, index) {

                    post =
                        post || {};


                    return {

                        number:
                            index + 1,

                        title:
                            post.title ||
                            'পৃষ্ঠা ' +
                            (index + 1),

                        image:
                            post.image ||
                            '',

                        imageUrl:
                            post.image ||
                            '',

                        src:
                            post.image ||
                            '',

                        thumbnail:
                            post.image ||
                            '',

                        url:
                            post.url ||
                            '',

                        author:
                            post.author ||
                            'দৈনিক চালচিত্র',

                        category:
                            post.category ||
                            'সাধারণ',

                        tags:
                            Array.isArray(
                                post.tags
                            )
                                ? post.tags
                                : [],

                        date:
                            post.date ||
                            '',

                        excerpt:
                            post.excerpt ||
                            '',

                        content:
                            post.content ||
                            '',

                        width:
                            0,

                        height:
                            0,

                        pdf:
                            ''

                    };

                }
            );

        },


        /* ==================================================
           Editions
           ================================================== */

        getEditions: function () {

            return this.state.editions.slice();

        },


        getEdition: function (
            editionId
        ) {

            if (
                !editionId
            ) {

                return null;

            }


            return this.state.editions.find(
                function (edition) {

                    return String(
                        edition.id
                    ) ===
                    String(
                        editionId
                    );

                }
            ) || null;

        },


        selectEdition: function (
            editionId
        ) {

            const edition =
                this.getEdition(
                    editionId
                );


            if (
                !edition
            ) {

                return false;

            }


            this.state.currentEdition =
                edition;


            this.state.currentDate =
                null;


            this.state.pages =
                [];


            this.state.currentPage =
                this.config.defaultPage;


            this.saveState();


            this.dispatch(
                'dc:epaper-edition-change',
                {
                    edition:
                        edition
                }
            );


            return true;

        },


        /* ==================================================
           Dates / Issues
           ================================================== */

        getDates: function () {

            if (
                !this.state.currentEdition
            ) {

                return [];

            }


            return Array.isArray(
                this.state.currentEdition.dates
            )
                ? this.state.currentEdition.dates.slice()
                : [];

        },


        getDate: function (
            dateValue
        ) {

            const dates =
                this.getDates();


            return dates.find(
                function (item) {

                    if (
                        !item
                    ) {

                        return false;

                    }


                    return String(
                        item.id ||
                        item.date ||
                        item.value ||
                        ''
                    ) ===
                    String(
                        dateValue ||
                        ''
                    );

                }
            ) || null;

        },


        selectDate: function (
            dateValue
        ) {

            const dateItem =
                this.getDate(
                    dateValue
                );


            if (
                !dateItem
            ) {

                return false;

            }


            this.state.currentDate =
                dateItem;


            this.state.pages =
                Array.isArray(
                    dateItem.pages
                )
                    ? dateItem.pages.slice()
                    : [];


            const savedPage =
                this.getSavedPage(
                    this.getCurrentEditionId(),
                    this.getCurrentDateValue()
                );


            this.state.currentPage =
                savedPage ||
                this.config.defaultPage;


            if (
                this.state.currentPage < 1 ||
                this.state.currentPage >
                this.state.pages.length
            ) {

                this.state.currentPage =
                    this.state.pages.length
                        ? 1
                        : this.config.defaultPage;

            }


            this.saveState();


            this.dispatch(
                'dc:epaper-date-change',
                {
                    date:
                        dateItem,

                    pages:
                        this.state.pages,

                    totalPages:
                        this.state.pages.length,

                    currentPage:
                        this.state.currentPage
                }
            );


            return true;

        },


        /* ==================================================
           Automatic Issue Selection
           ================================================== */

        selectIssueFromUrl: function () {

            const params =
                new URLSearchParams(
                    window.location.search
                );


            const issue =
                params.get(
                    'issue'
                );


            if (
                issue
            ) {

                return this.selectIssue(
                    issue
                );

            }


            return false;

        },


        selectIssue: function (
            issueId
        ) {

            if (
                !issueId
            ) {

                return false;

            }


            if (
                !this.state.editions.length
            ) {

                return false;

            }


            const edition =
                this.state.editions[0];


            if (
                !edition
            ) {

                return false;

            }


            this.state.currentEdition =
                edition;


            const date =
                this.getDate(
                    issueId
                );


            if (
                !date
            ) {

                return false;

            }


            this.state.currentDate =
                date;


            this.state.pages =
                Array.isArray(
                    date.pages
                )
                    ? date.pages.slice()
                    : [];


            const savedPage =
                this.getSavedPage(
                    edition.id,
                    date.id
                );


            this.state.currentPage =
                savedPage ||
                this.config.defaultPage;


            if (
                this.state.currentPage < 1 ||
                this.state.currentPage >
                this.state.pages.length
            ) {

                this.state.currentPage =
                    this.state.pages.length
                        ? 1
                        : this.config.defaultPage;

            }


            this.saveState();


            this.dispatch(
                'dc:epaper-issue-selected',
                {
                    issue:
                        date,

                    edition:
                        edition,

                    pages:
                        this.state.pages,

                    totalPages:
                        this.state.pages.length,

                    currentPage:
                        this.state.currentPage
                }
            );


            /*
             * Immediately tell viewer which page
             * should be displayed.
             */

            const page =
                this.getCurrentPage();


            if (
                page
            ) {

                this.dispatch(
                    'dc:epaper-page-change',
                    {
                        page:
                            page,

                        pageNumber:
                            this.state.currentPage,

                        totalPages:
                            this.state.pages.length,

                        issue:
                            date
                    }
                );

            }


            return true;

        },


        /* ==================================================
           Pages
           ================================================== */

        extractPages: function (
            dateItem
        ) {

            if (
                !dateItem
            ) {

                return [];

            }


            if (
                Array.isArray(
                    dateItem.pages
                )
            ) {

                return dateItem.pages.slice();

            }


            return [];

        },


        getPages: function () {

            return this.state.pages.slice();

        },


        getPage: function (
            pageNumber
        ) {

            const number =
                Number(
                    pageNumber
                );


            return this.state.pages.find(
                function (page) {

                    return Number(
                        page.number
                    ) ===
                    number;

                }
            ) || null;

        },


        getCurrentPage: function () {

            return this.getPage(
                this.state.currentPage
            );

        },


        /* ==================================================
           Page Navigation
           ================================================== */

        goToPage: function (
            pageNumber
        ) {

            const number =
                Number(
                    pageNumber
                );


            if (
                !Number.isFinite(
                    number
                )
            ) {

                return false;

            }


            const page =
                this.getPage(
                    number
                );


            if (
                !page
            ) {

                return false;

            }


            this.state.currentPage =
                number;


            this.saveState();


            this.dispatch(
                'dc:epaper-page-change',
                {
                    page:
                        page,

                    pageNumber:
                        number,

                    totalPages:
                        this.state.pages.length,

                    issue:
                        this.state.currentDate
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


            return this.goToPage(
                next
            );

        },


        previousPage: function () {

            const previous =
                this.state.currentPage - 1;


            if (
                previous < 1
            ) {

                return false;

            }


            return this.goToPage(
                previous
            );

        },


        firstPage: function () {

            return this.goToPage(
                1
            );

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


        /* ==================================================
           Current Values
           ================================================== */

        getCurrentEditionId:
            function () {

                if (
                    !this.state.currentEdition
                ) {

                    return '';

                }


                return String(
                    this.state.currentEdition.id ||
                    ''
                );

            },


        getCurrentDateValue:
            function () {

                const date =
                    this.state.currentDate;


                if (
                    !date
                ) {

                    return '';

                }


                if (
                    typeof date ===
                    'string'
                ) {

                    return date;

                }


                return String(
                    date.id ||
                    date.date ||
                    date.value ||
                    ''
                );

            },


        /* ==================================================
           Reader State
           ================================================== */

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
                    JSON.stringify(
                        saved
                    )
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


                if (
                    !raw
                ) {

                    return null;

                }


                const saved =
                    JSON.parse(
                        raw
                    );


                if (
                    !saved ||
                    typeof saved !== 'object'
                ) {

                    return null;

                }


                this.state.currentPage =
                    Number(
                        saved.page
                    ) ||
                    this.config.defaultPage;


                this.state._savedEdition =
                    saved.edition ||
                    '';


                this.state._savedDate =
                    saved.date ||
                    '';


                return saved;


            } catch (error) {

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


                if (
                    !raw
                ) {

                    return 0;

                }


                const saved =
                    JSON.parse(
                        raw
                    );


                if (
                    String(
                        saved.edition ||
                        ''
                    ) ===
                    String(
                        editionId ||
                        ''
                    ) &&
                    String(
                        saved.date ||
                        ''
                    ) ===
                    String(
                        dateValue ||
                        ''
                    )
                ) {

                    return Number(
                        saved.page
                    ) || 0;

                }


            } catch (error) {

                return 0;

            }


            return 0;

        },


        /* ==================================================
           Restore / Start Reader
           ================================================== */

        restoreLastPosition: function () {

            if (
                !this.state.editions.length
            ) {

                return false;

            }


            /*
             * First priority:
             * URL ?issue=
             */

            if (
                this.selectIssueFromUrl()
            ) {

                return true;

            }


            /*
             * Second priority:
             * Last saved issue
             */

            const savedEdition =
                this.state._savedEdition;


            const savedDate =
                this.state._savedDate;


            if (
                savedEdition &&
                savedDate
            ) {

                if (
                    this.selectEdition(
                        savedEdition
                    )
                ) {

                    return this.selectDate(
                        savedDate
                    );

                }

            }


            /*
             * Third priority:
             * First available issue
             */

            const edition =
                this.state.editions[0];


            if (
                !edition ||
                !edition.dates ||
                !edition.dates.length
            ) {

                return false;

            }


            this.state.currentEdition =
                edition;


            return this.selectDate(
                edition.dates[0].id
            );

        },


        /* ==================================================
           Event System
           ================================================== */

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
                    '[Daily Chalchitra E-Paper] Event error:',
                    error
                );

            }

        },


        /* ==================================================
           Utility
           ================================================== */

        formatDate: function (
            dateValue
        ) {

            if (
                !dateValue
            ) {

                return '';

            }


            const date =
                new Date(
                    dateValue
                );


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
                        year:
                            'numeric',

                        month:
                            'long',

                        day:
                            'numeric'
                    }
                ).format(
                    date
                );

            } catch (error) {

                return String(
                    dateValue
                );

            }

        },


        escapeHtml: function (
            value
        ) {

            const div =
                document.createElement(
                    'div'
                );


            div.textContent =
                value == null
                    ? ''
                    : String(
                        value
                    );


            return div.innerHTML;

        },


        /* ==================================================
           Debug
           ================================================== */

        debug: function () {

            return {

                config:
                    this.config,

                state:
                    this.state

            };

        }

    };


    /* ======================================================
       Global Namespace
       ====================================================== */

    window.DailyChalchitraEPaper =
        DC_EPAPER;


})(window, document);
