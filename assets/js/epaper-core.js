/*
 * দৈনিক চালচিত্র — E-Paper Core
 * Version: 2.0
 *
 * কাজ:
 *  - /assets/epaper/issues/issues.json থেকে E-Paper data load
 *  - Weekly issue নির্বাচন
 *  - Issue-এর posts-কে pages হিসেবে ব্যবহার
 *  - বর্তমান page নির্বাচন
 *  - Previous / Next page
 *  - LocalStorage-এ reader position সংরক্ষণ
 *  - Viewer-এর জন্য dc:epaper-page-change event পাঠানো
 */

(function (window, document) {

    'use strict';


    /* ======================================================
     * GLOBAL OBJECT
     * ====================================================== */

    const DC_EPAPER = {

        /* ==================================================
         * CONFIG
         * ================================================== */

        config: {

            dataUrl:
                '/assets/epaper/issues/issues.json',

            storageKey:
                'dc_epaper_reader_state',

            defaultPage:
                1

        },


        /* ==================================================
         * STATE
         * ================================================== */

        state: {

            data:
                null,

            issues:
                [],

            currentIssue:
                null,

            pages:
                [],

            currentPage:
                1,

            ready:
                false,

            loading:
                false

        },


        /* ==================================================
         * INITIALIZATION
         * ================================================== */

        init: function (options) {

            options =
                options || {};


            if (options.dataUrl) {

                this.config.dataUrl =
                    options.dataUrl;

            }


            if (options.storageKey) {

                this.config.storageKey =
                    options.storageKey;

            }


            this.restoreState();


            return this.loadData();

        },


        /* ==================================================
         * LOAD DATA
         * ================================================== */

        loadData: function () {

            const self =
                this;


            if (this.state.loading) {

                return Promise.resolve(
                    this.state.data
                );

            }


            this.state.loading =
                true;


            return fetch(
                this.config.dataUrl,
                {
                    method: 'GET',

                    credentials:
                        'same-origin',

                    cache:
                        'no-cache',

                    headers: {
                        'Accept':
                            'application/json'
                    }
                }
            )

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
                        'Invalid E-Paper issue data.'
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
                            self.state.issues
                    }
                );


                /*
                 * Saved issue restore
                 */

                self.restoreLastPosition();


                return self.state.data;

            })

            .catch(function (error) {

                self.state.loading =
                    false;

                self.state.ready =
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

            });

        },


        /* ==================================================
         * NORMALIZE DATA
         * ================================================== */

        normalizeData: function () {

            const source =
                Array.isArray(
                    this.state.data
                )
                    ? this.state.data
                    : [];


            this.state.issues =
                source.map(
                    function (issue) {

                        issue =
                            issue || {};


                        const posts =
                            Array.isArray(
                                issue.posts
                            )
                                ? issue.posts
                                : [];


                        return {

                            id:
                                String(
                                    issue.id ||
                                    ''
                                ),

                            year:
                                String(
                                    issue.year ||
                                    ''
                                ),

                            week:
                                String(
                                    issue.week ||
                                    ''
                                ),

                            title:
                                issue.title ||
                                'ই-পেপার',

                            date:
                                issue.date ||
                                '',

                            displayDate:
                                issue.displayDate ||
                                issue.date ||
                                '',

                            pages:
                                Number(
                                    issue.pages
                                ) ||
                                posts.length,

                            count:
                                Number(
                                    issue.count
                                ) ||
                                posts.length,

                            viewer:
                                issue.viewer ||
                                '',

                            cover:
                                issue.cover ||
                                '',

                            posts:
                                posts.map(
                                    function (
                                        post,
                                        index
                                    ) {

                                        post =
                                            post ||
                                            {};


                                        return {

                                            number:
                                                Number(
                                                    post.number
                                                ) ||
                                                index + 1,

                                            title:
                                                post.title ||
                                                (
                                                    'পৃষ্ঠা ' +
                                                    (
                                                        index +
                                                        1
                                                    )
                                                ),

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

                                            image:
                                                post.image ||
                                                post.imageUrl ||
                                                post.src ||
                                                '',

                                            date:
                                                post.date ||
                                                issue.date ||
                                                '',

                                            excerpt:
                                                post.excerpt ||
                                                '',

                                            content:
                                                post.content ||
                                                ''

                                        };

                                    }
                                )

                        };

                    }
                );


            return this.state.issues;

        },


        /* ==================================================
         * ISSUES
         * ================================================== */

        getIssues: function () {

            return this.state.issues.slice();

        },


        getEditions: function () {

            /*
             * Backward compatibility.
             *
             * পুরোনো code যদি getEditions()
             * ব্যবহার করে, তাহলে weekly issues
             * return করবে।
             */

            return this.getIssues();

        },


        getIssue: function (issueId) {

            if (!issueId) {

                return null;

            }


            return this.state.issues.find(
                function (issue) {

                    return String(
                        issue.id
                    ) === String(
                        issueId
                    );

                }
            ) || null;

        },


        getEdition: function (editionId) {

            return this.getIssue(
                editionId
            );

        },


        /* ==================================================
         * SELECT ISSUE
         * ================================================== */

        selectIssue: function (issueId) {

            const issue =
                this.getIssue(
                    issueId
                );


            if (!issue) {

                return false;

            }


            this.state.currentIssue =
                issue;


            this.state.pages =
                this.extractPages(
                    issue
                );


            this.state.currentPage =
                this.getSavedPage(
                    issue.id
                ) ||
                this.config.defaultPage;


            if (
                this.state.currentPage <
                1
            ) {

                this.state.currentPage =
                    1;

            }


            if (
                this.state.currentPage >
                this.state.pages.length
            ) {

                this.state.currentPage =
                    this.state.pages.length ||
                    1;

            }


            this.saveState();


            this.dispatch(
                'dc:epaper-issue-change',
                {
                    issue:
                        issue,

                    pages:
                        this.state.pages
                }
            );


            /*
             * Immediately show current page
             */

            this.dispatchCurrentPage();


            return true;

        },


        /* ==================================================
         * SELECT EDITION
         * ================================================== */

        selectEdition: function (
            editionId
        ) {

            return this.selectIssue(
                editionId
            );

        },


        /* ==================================================
         * EXTRACT PAGES
         * ================================================== */

        extractPages: function (
            issue
        ) {

            if (!issue) {

                return [];

            }


            const posts =
                Array.isArray(
                    issue.posts
                )
                    ? issue.posts
                    : [];


            return posts.map(
                function (
                    post,
                    index
                ) {

                    post =
                        post ||
                        {};


                    return {

                        number:
                            Number(
                                post.number
                            ) ||
                            index + 1,

                        title:
                            post.title ||
                            (
                                'পৃষ্ঠা ' +
                                (
                                    index +
                                    1
                                )
                            ),

                        image:
                            post.image ||
                            post.imageUrl ||
                            post.src ||
                            '',

                        thumbnail:
                            post.image ||
                            post.thumbnail ||
                            post.thumb ||
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
                            issue.date ||
                            '',

                        excerpt:
                            post.excerpt ||
                            '',

                        content:
                            post.content ||
                            '',

                        width:
                            Number(
                                post.width
                            ) ||
                            0,

                        height:
                            Number(
                                post.height
                            ) ||
                            0

                    };

                }
            );

        },


        /* ==================================================
         * GET PAGES
         * ================================================== */

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


            if (
                !Number.isFinite(
                    number
                )
            ) {

                return null;

            }


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


        getCurrentIssue: function () {

            return this.state.currentIssue;

        },


        /* ==================================================
         * GO TO PAGE
         * ================================================== */

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


            if (!page) {

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
                        this.state.currentIssue
                }
            );


            return true;

        },


        /* ==================================================
         * DISPATCH CURRENT PAGE
         * ================================================== */

        dispatchCurrentPage: function () {

            const page =
                this.getCurrentPage();


            if (!page) {

                return false;

            }


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
                        this.state.currentIssue
                }
            );


            return true;

        },


        /* ==================================================
         * NEXT PAGE
         * ================================================== */

        nextPage: function () {

            const next =
                this.state.currentPage +
                1;


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


        /* ==================================================
         * PREVIOUS PAGE
         * ================================================== */

        previousPage: function () {

            const previous =
                this.state.currentPage -
                1;


            if (
                previous <
                1
            ) {

                return false;

            }


            return this.goToPage(
                previous
            );

        },


        /* ==================================================
         * FIRST PAGE
         * ================================================== */

        firstPage: function () {

            return this.goToPage(
                1
            );

        },


        /* ==================================================
         * LAST PAGE
         * ================================================== */

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
         * CURRENT ISSUE ID
         * ================================================== */

        getCurrentIssueId: function () {

            if (
                !this.state.currentIssue
            ) {

                return '';

            }


            return String(
                this.state.currentIssue.id ||
                ''
            );

        },


        getCurrentEditionId: function () {

            return this.getCurrentIssueId();

        },


        /* ==================================================
         * CURRENT DATE
         * ================================================== */

        getCurrentDateValue: function () {

            if (
                !this.state.currentIssue
            ) {

                return '';

            }


            return String(
                this.state.currentIssue.date ||
                this.state.currentIssue.id ||
                ''
            );

        },


        /* ==================================================
         * DATE COMPATIBILITY
         * ================================================== */

        getDates: function () {

            if (
                !this.state.currentIssue
            ) {

                return [];

            }


            return [
                this.state.currentIssue
            ];

        },


        getDate: function (
            dateValue
        ) {

            if (
                !dateValue
            ) {

                return null;

            }


            if (
                this.state.currentIssue &&
                (
                    String(
                        this.state.currentIssue.id
                    ) ===
                    String(
                        dateValue
                    ) ||

                    String(
                        this.state.currentIssue.date
                    ) ===
                    String(
                        dateValue
                    )
                )
            ) {

                return this.state.currentIssue;

            }


            return null;

        },


        selectDate: function (
            dateValue
        ) {

            /*
             * New structure-এ issue-ই
             * date container।
             */

            const issue =
                this.getIssue(
                    dateValue
                );


            if (!issue) {

                return false;

            }


            return this.selectIssue(
                issue.id
            );

        },


        /* ==================================================
         * LOCAL STORAGE
         * ================================================== */

        saveState: function () {

            try {

                const saved = {

                    issue:
                        this.getCurrentIssueId(),

                    edition:
                        this.getCurrentIssueId(),

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


                if (!raw) {

                    return null;

                }


                const saved =
                    JSON.parse(
                        raw
                    );


                if (
                    !saved ||
                    typeof saved !==
                    'object'
                ) {

                    return null;

                }


                this.state._savedIssue =
                    saved.issue ||
                    saved.edition ||
                    '';


                this.state._savedEdition =
                    saved.edition ||
                    saved.issue ||
                    '';


                this.state._savedDate =
                    saved.date ||
                    '';


                this.state.currentPage =
                    Number(
                        saved.page
                    ) ||
                    this.config.defaultPage;


                return saved;

            } catch (error) {

                console.warn(
                    '[Daily Chalchitra E-Paper] State restore failed.',
                    error
                );


                return null;

            }

        },


        /* ==================================================
         * SAVED PAGE
         * ================================================== */

        getSavedPage: function (
            issueId
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
                    JSON.parse(
                        raw
                    );


                if (
                    String(
                        saved.issue ||
                        saved.edition ||
                        ''
                    ) ===
                    String(
                        issueId ||
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
         * RESTORE LAST POSITION
         * ================================================== */

        restoreLastPosition: function () {

            if (
                !this.state.issues.length
            ) {

                return false;

            }


            const savedIssue =
                this.state._savedIssue ||
                this.state._savedEdition ||
                '';


            if (savedIssue) {

                if (
                    this.selectIssue(
                        savedIssue
                    )
                ) {

                    return true;

                }

            }


            /*
             * কোনো saved issue না থাকলে
             * সর্বশেষ issue নির্বাচন করা হবে।
             */

            const latestIssue =
                this.state.issues[0];


            if (!latestIssue) {

                return false;

            }


            return this.selectIssue(
                latestIssue.id
            );

        },


        /* ==================================================
         * FORMAT DATE
         * ================================================== */

        formatDate: function (
            dateValue
        ) {

            if (!dateValue) {

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


        /* ==================================================
         * ESCAPE HTML
         * ================================================== */

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
         * EVENT
         * ================================================== */

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
                                detail ||
                                {}
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
         * DEBUG
         * ================================================== */

        debug: function () {

            return {

                config:
                    this.config,

                state:
                    this.state,

                issues:
                    this.state.issues,

                currentIssue:
                    this.state.currentIssue,

                pages:
                    this.state.pages,

                currentPage:
                    this.state.currentPage

            };

        }

    };


    /* ======================================================
     * GLOBAL EXPORT
     * ====================================================== */

    window.DailyChalchitraEPaper =
        DC_EPAPER;


})(window, document);
