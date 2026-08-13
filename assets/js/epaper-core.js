/*
 * দৈনিক চালচিত্র — E-Paper Core
 * Version: 2.0
 *
 * কাজ:
 * - পুরোনো issues.json ব্যবহার করা
 * - সপ্তাহভিত্তিক issue শনাক্ত করা
 * - Edition / Issue নির্বাচন
 * - Date / Issue নির্বাচন
 * - Post থেকে page তৈরি
 * - বর্তমান page সংরক্ষণ
 * - Previous / Next navigation
 * - Viewer-এর সঙ্গে event-based যোগাযোগ
 *
 * গুরুত্বপূর্ণ:
 * এই module কোনো নতুন data file তৈরি বা
 * assets/epaper/issues/issues.json পরিবর্তন করে না।
 */

(function (window, document) {
    'use strict';

    const DC_EPAPER = {

        config: {
            dataUrl: '/assets/epaper/issues/issues.json',
            storageKey: 'dc_epaper_reader_state_v2',
            defaultPage: 1,
            postsPerPage: 6
        },

        state: {
            data: [],
            issues: [],
            editions: [],
            currentEdition: null,
            currentDate: null,
            currentIssue: null,
            pages: [],
            currentPage: 1,
            initialized: false
        },

        /* =====================================================
         * INITIALIZATION
         * ===================================================== */

        init: function (options) {

            options = options || {};

            if (options.dataUrl) {
                this.config.dataUrl =
                    options.dataUrl;
            }

            if (options.storageKey) {
                this.config.storageKey =
                    options.storageKey;
            }

            if (options.postsPerPage) {
                this.config.postsPerPage =
                    Number(options.postsPerPage) || 6;
            }

            this.restoreState();

            return this.loadData();
        },

        /* =====================================================
         * DATA LOAD
         * ===================================================== */

        loadData: function () {

            const self = this;

            return fetch(
                this.config.dataUrl,
                {
                    method: 'GET',
                    credentials: 'same-origin',
                    cache: 'no-cache',
                    headers: {
                        'Accept': 'application/json'
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

                self.state.data = data;

                self.normalizeData();

                self.state.initialized = true;

                self.dispatch(
                    'dc:epaper-ready',
                    {
                        data: self.state.data,
                        issues: self.state.issues,
                        editions: self.state.editions
                    }
                );

                /*
                 * আগের reader position থাকলে
                 * সেটি restore করার চেষ্টা।
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

                return Promise.reject(error);
            });
        },

        /* =====================================================
         * NORMALIZE DATA
         * ===================================================== */

        normalizeData: function () {

            let data = this.state.data;

            /*
             * issues.json বর্তমানে সরাসরি array।
             * তবে ভবিষ্যতে object হলেও support করবে।
             */

            if (Array.isArray(data)) {

                this.state.issues =
                    data.slice();

            } else if (
                data &&
                Array.isArray(data.issues)
            ) {

                this.state.issues =
                    data.issues.slice();

            } else if (
                data &&
                Array.isArray(data.editions)
            ) {

                this.state.issues =
                    data.editions.slice();

            } else {

                this.state.issues = [];
            }

            /*
             * পুরোনো architecture-এর compatibility-এর
             * জন্য editions-এও issue রাখা হচ্ছে।
             */

            this.state.editions =
                this.state.issues.map(
                    function (issue) {

                        return {
                            id:
                                issue.id ||
                                issue.slug ||
                                '',

                            name:
                                issue.title ||
                                issue.name ||
                                'ই-পেপার',

                            title:
                                issue.title ||
                                issue.name ||
                                'ই-পেপার',

                            dates: [
                                issue
                            ]
                        };
                    }
                );

            return this.state.issues;
        },

        /* =====================================================
         * ISSUES
         * ===================================================== */

        getIssues: function () {

            return this.state.issues.slice();
        },

        getIssue: function (issueId) {

            if (!issueId) {
                return null;
            }

            const wanted =
                String(issueId);

            return this.state.issues.find(
                function (issue) {

                    return String(
                        issue.id ||
                        issue.slug ||
                        ''
                    ) === wanted;

                }
            ) || null;
        },

        selectIssue: function (issueId) {

            const issue =
                this.getIssue(issueId);

            if (!issue) {
                return false;
            }

            this.state.currentIssue =
                issue;

            this.state.currentEdition =
                issue;

            this.state.currentDate =
                issue;

            this.state.pages =
                this.extractPages(issue);

            this.state.currentPage =
                this.getSavedPage(
                    this.getCurrentIssueId()
                ) ||
                this.config.defaultPage;

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
                    issue: issue,
                    pages: this.state.pages
                }
            );

            /*
             * প্রথম page automatically পাঠানো।
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
                            this.state.pages.length,

                        issue:
                            issue
                    }
                );
            }

            return true;
        },

        /* =====================================================
         * EDITION COMPATIBILITY
         * ===================================================== */

        getEditions: function () {

            return this.state.editions.slice();
        },

        getEdition: function (editionId) {

            return this.getIssue(
                editionId
            );
        },

        selectEdition: function (editionId) {

            return this.selectIssue(
                editionId
            );
        },

        /* =====================================================
         * DATE COMPATIBILITY
         * ===================================================== */

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

        getDate: function (dateValue) {

            return this.getIssue(
                dateValue
            );
        },

        selectDate: function (dateValue) {

            return this.selectIssue(
                dateValue
            );
        },

        /* =====================================================
         * PAGE EXTRACTION
         * ===================================================== */

        extractPages: function (issue) {

            if (!issue) {
                return [];
            }

            /*
             * যদি issue-এর নিজস্ব pages থাকে
             */

            if (
                Array.isArray(issue.pages)
            ) {

                return issue.pages.map(
                    this.normalizePage.bind(this)
                );
            }

            /*
             * issues.json-এর বর্তমান format:
             *
             * pages = মোট page সংখ্যা
             * posts = article list
             */

            if (
                Array.isArray(issue.posts)
            ) {

                return this.createPagesFromPosts(
                    issue.posts
                );
            }

            return [];
        },

        /* =====================================================
         * CREATE PAGES FROM POSTS
         * ===================================================== */

        createPagesFromPosts: function (
            posts
        ) {

            const perPage =
                this.config.postsPerPage;

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

                    posts:
                        pagePosts,

                    /*
                     * যদি কোনো post-এর image থাকে,
                     * প্রথম image-কে preview হিসেবে
                     * ব্যবহার করা হবে।
                     */

                    image:
                        this.getPagePreviewImage(
                            pagePosts
                        ),

                    thumbnail:
                        this.getPagePreviewImage(
                            pagePosts
                        ),

                    pdf: '',

                    url: ''
                });
            }

            return pages;
        },

        /* =====================================================
         * PAGE PREVIEW IMAGE
         * ===================================================== */

        getPagePreviewImage: function (
            posts
        ) {

            if (
                !Array.isArray(posts)
            ) {
                return '';
            }

            for (
                let i = 0;
                i < posts.length;
                i++
            ) {

                const post =
                    posts[i] || {};

                if (post.image) {
                    return post.image;
                }
            }

            return '';
        },

        /* =====================================================
         * NORMALIZE PAGE
         * ===================================================== */

        normalizePage: function (
            page,
            index
        ) {

            if (
                typeof page === 'string'
            ) {

                return {
                    number:
                        index + 1,

                    title:
                        'পৃষ্ঠা ' +
                        (index + 1),

                    image:
                        page,

                    thumbnail:
                        page,

                    pdf: '',
                    url: ''
                };
            }

            page =
                page || {};

            return {

                number:
                    Number(
                        page.number
                    ) ||
                    Number(
                        page.page
                    ) ||
                    index + 1,

                title:
                    page.title ||
                    page.name ||
                    'পৃষ্ঠা ' +
                    (index + 1),

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

                posts:
                    Array.isArray(
                        page.posts
                    )
                        ? page.posts
                        : [],

                width:
                    Number(
                        page.width
                    ) || 0,

                height:
                    Number(
                        page.height
                    ) || 0
            };
        },

        /* =====================================================
         * PAGES
         * ===================================================== */

        getPages: function () {

            return this.state.pages.slice();
        },

        getPage: function (
            pageNumber
        ) {

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

        /* =====================================================
         * PAGE NAVIGATION
         * ===================================================== */

        goToPage: function (
            pageNumber
        ) {

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
                        this.state.pages.length,

                    issue:
                        this.state.currentIssue
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

        /* =====================================================
         * CURRENT ISSUE
         * ===================================================== */

        getCurrentIssueId: function () {

            if (
                !this.state.currentIssue
            ) {
                return '';
            }

            return String(
                this.state.currentIssue.id ||
                this.state.currentIssue.slug ||
                ''
            );
        },

        getCurrentEditionId: function () {

            return this.getCurrentIssueId();
        },

        getCurrentDateValue: function () {

            if (
                !this.state.currentIssue
            ) {
                return '';
            }

            return String(
                this.state.currentIssue.id ||
                this.state.currentIssue.date ||
                ''
            );
        },

        /* =====================================================
         * STORAGE
         * ===================================================== */

        saveState: function () {

            try {

                const saved = {

                    issue:
                        this.getCurrentIssueId(),

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

                this.state._savedIssue =
                    saved.issue ||
                    saved.edition ||
                    '';

                this.state._savedEdition =
                    saved.edition ||
                    '';

                this.state._savedDate =
                    saved.date ||
                    '';

                this.state.currentPage =
                    Number(saved.page) ||
                    this.config.defaultPage;

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
                    JSON.parse(raw);

                if (
                    String(
                        saved.issue ||
                        saved.edition ||
                        ''
                    ) ===
                    String(issueId || '')
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

        /* =====================================================
         * RESTORE LAST POSITION
         * ===================================================== */

        restoreLastPosition: function () {

            if (
                !this.state.issues.length
            ) {
                return false;
            }

            const savedIssue =
                this.state._savedIssue;

            if (!savedIssue) {
                return false;
            }

            return this.selectIssue(
                savedIssue
            );
        },

        /* =====================================================
         * EVENT SYSTEM
         * ===================================================== */

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

        /* =====================================================
         * ISSUE SEARCH
         * ===================================================== */

        findIssueByQuery: function (
            query
        ) {

            if (!query) {
                return null;
            }

            const wanted =
                String(query)
                .toLowerCase()
                .trim();

            return this.state.issues.find(
                function (issue) {

                    const id =
                        String(
                            issue.id || ''
                        ).toLowerCase();

                    const title =
                        String(
                            issue.title || ''
                        ).toLowerCase();

                    const date =
                        String(
                            issue.date || ''
                        ).toLowerCase();

                    return (
                        id === wanted ||
                        title === wanted ||
                        date === wanted
                    );
                }
            ) || null;
        },

        /* =====================================================
         * DATE FORMAT
         * ===================================================== */

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

        /* =====================================================
         * HTML ESCAPE
         * ===================================================== */

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
                    : String(value);

            return div.innerHTML;
        },

        /* =====================================================
         * DEBUG
         * ===================================================== */

        debug: function () {

            return {

                config:
                    this.config,

                state:
                    this.state,

                issues:
                    this.state.issues,

                pages:
                    this.state.pages
            };
        }
    };

    /*
     * Global API
     */

    window.DailyChalchitraEPaper =
        DC_EPAPER;

})(window, document);
