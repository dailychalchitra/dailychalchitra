/*
 * দৈনিক চালচিত্র — E-Paper Data Bridge
 * Version: 2.0
 *
 * কাজ:
 * - issues.json থেকে ePaper data সংগ্রহ
 * - Core module-এর সঙ্গে data bridge তৈরি
 * - Issue / post / page data access
 * - পুরোনো data function-এর compatibility
 *
 * Data Source:
 * /assets/epaper/issues/issues.json
 */

(function (window, document) {

    'use strict';

    const DATA = {

        config: {
            url: '/assets/epaper/issues/issues.json'
        },

        state: {
            data: [],
            loaded: false,
            loading: false,
            error: null
        },

        /* =====================================================
         * LOAD DATA
         * ===================================================== */

        load: function (url) {

            const self = this;

            if (url) {
                this.config.url = url;
            }

            if (this.state.loading) {
                return this.state.promise;
            }

            this.state.loading = true;
            this.state.error = null;

            this.state.promise =
                fetch(
                    this.config.url,
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
                            'ePaper data load failed: HTTP ' +
                            response.status
                        );
                    }

                    return response.json();
                })
                .then(function (data) {

                    self.state.data =
                        self.normalize(data);

                    self.state.loaded = true;
                    self.state.loading = false;

                    self.dispatch(
                        'dc:epaper-data-loaded',
                        {
                            data:
                                self.state.data
                        }
                    );

                    return self.state.data;
                })
                .catch(function (error) {

                    self.state.loading = false;
                    self.state.error = error;

                    console.error(
                        '[Daily Chalchitra ePaper Data]',
                        error
                    );

                    self.dispatch(
                        'dc:epaper-data-error',
                        {
                            error: error
                        }
                    );

                    throw error;
                });

            return this.state.promise;
        },

        /* =====================================================
         * NORMALIZE
         * ===================================================== */

        normalize: function (data) {

            if (Array.isArray(data)) {
                return data;
            }

            if (
                data &&
                Array.isArray(data.issues)
            ) {
                return data.issues;
            }

            if (
                data &&
                Array.isArray(data.editions)
            ) {
                return data.editions;
            }

            return [];
        },

        /* =====================================================
         * GET ALL ISSUES
         * ===================================================== */

        getIssues: function () {

            return this.state.data.slice();
        },

        /* =====================================================
         * GET ISSUE
         * ===================================================== */

        getIssue: function (id) {

            if (!id) {
                return null;
            }

            const wanted =
                String(id);

            return this.state.data.find(
                function (issue) {

                    return String(
                        issue.id ||
                        issue.slug ||
                        ''
                    ) === wanted;

                }
            ) || null;
        },

        /* =====================================================
         * FIND ISSUE
         * ===================================================== */

        findIssue: function (query) {

            if (!query) {
                return null;
            }

            const wanted =
                String(query)
                .trim()
                .toLowerCase();

            return this.state.data.find(
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
         * GET POSTS
         * ===================================================== */

        getPosts: function (issueId) {

            const issue =
                this.getIssue(issueId);

            if (
                !issue ||
                !Array.isArray(issue.posts)
            ) {
                return [];
            }

            return issue.posts.slice();
        },

        /* =====================================================
         * GET POST
         * ===================================================== */

        getPost: function (
            issueId,
            postNumber
        ) {

            const posts =
                this.getPosts(issueId);

            if (!posts.length) {
                return null;
            }

            const number =
                Number(postNumber);

            return posts.find(
                function (post, index) {

                    return (
                        Number(
                            post.number
                        ) === number
                    ) ||
                    index + 1 === number;
                }
            ) || null;
        },

        /* =====================================================
         * CREATE PAGES
         * ===================================================== */

        createPages: function (
            issueId,
            postsPerPage
        ) {

            const issue =
                this.getIssue(issueId);

            if (!issue) {
                return [];
            }

            const posts =
                Array.isArray(issue.posts)
                    ? issue.posts
                    : [];

            const perPage =
                Number(postsPerPage) > 0
                    ? Number(postsPerPage)
                    : 6;

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

                    image:
                        this.getPreviewImage(
                            pagePosts
                        ),

                    thumbnail:
                        this.getPreviewImage(
                            pagePosts
                        ),

                    issue:
                        issueId
                });
            }

            return pages;
        },

        /* =====================================================
         * PREVIEW IMAGE
         * ===================================================== */

        getPreviewImage: function (
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

                if (
                    posts[i] &&
                    posts[i].image
                ) {

                    return posts[i].image;
                }
            }

            return '';
        },

        /* =====================================================
         * GET PAGE
         * ===================================================== */

        getPage: function (
            issueId,
            pageNumber,
            postsPerPage
        ) {

            const pages =
                this.createPages(
                    issueId,
                    postsPerPage
                );

            const number =
                Number(pageNumber);

            return pages.find(
                function (page) {

                    return Number(
                        page.number
                    ) === number;

                }
            ) || null;
        },

        /* =====================================================
         * ISSUE COUNT
         * ===================================================== */

        getIssueCount: function () {

            return this.state.data.length;
        },

        /* =====================================================
         * POST COUNT
         * ===================================================== */

        getPostCount: function (
            issueId
        ) {

            return this.getPosts(
                issueId
            ).length;
        },

        /* =====================================================
         * PAGE COUNT
         * ===================================================== */

        getPageCount: function (
            issueId,
            postsPerPage
        ) {

            return this.createPages(
                issueId,
                postsPerPage
            ).length;
        },

        /* =====================================================
         * COVER
         * ===================================================== */

        getCover: function (
            issueId
        ) {

            const issue =
                this.getIssue(issueId);

            if (!issue) {
                return '';
            }

            if (issue.cover) {
                return issue.cover;
            }

            const posts =
                Array.isArray(issue.posts)
                    ? issue.posts
                    : [];

            return this.getPreviewImage(
                posts
            );
        },

        /* =====================================================
         * DATE
         * ===================================================== */

        getDate: function (
            issueId
        ) {

            const issue =
                this.getIssue(issueId);

            if (!issue) {
                return '';
            }

            return (
                issue.displayDate ||
                issue.date ||
                ''
            );
        },

        /* =====================================================
         * VIEWER URL
         * ===================================================== */

        getViewerUrl: function (
            issueId
        ) {

            const issue =
                this.getIssue(issueId);

            if (!issue) {
                return '';
            }

            if (issue.viewer) {
                return issue.viewer;
            }

            return (
                '/epaper/viewer/?issue=' +
                encodeURIComponent(
                    issue.id || ''
                )
            );
        },

        /* =====================================================
         * SORT ISSUES
         * ===================================================== */

        sortLatestFirst: function (
            issues
        ) {

            issues =
                Array.isArray(issues)
                    ? issues.slice()
                    : [];

            return issues.sort(
                function (a, b) {

                    const dateA =
                        new Date(
                            a.date || 0
                        ).getTime();

                    const dateB =
                        new Date(
                            b.date || 0
                        ).getTime();

                    return dateB - dateA;
                }
            );
        },

        /* =====================================================
         * DATA READY
         * ===================================================== */

        isLoaded: function () {

            return (
                this.state.loaded === true
            );
        },

        /* =====================================================
         * DISPATCH EVENT
         * ===================================================== */

        dispatch: function (
            eventName,
            detail
        ) {

            document.dispatchEvent(
                new CustomEvent(
                    eventName,
                    {
                        detail:
                            detail || {}
                    }
                )
            );
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
                    this.state.data
            };
        }
    };


    /* =========================================================
     * GLOBAL DATA OBJECT
     * ========================================================= */

    window.DailyChalchitraEPaperData =
        DATA;


    /* =========================================================
     * COMPATIBILITY FUNCTIONS
     * ========================================================= */

    window.dcLoadEpaperData =
        function (url) {

            return DATA.load(url);
        };


    window.loadEpaperData =
        function (url) {

            return DATA.load(url);
        };


    window.dcInitEpaperData =
        function () {

            if (DATA.isLoaded()) {
                return Promise.resolve(
                    DATA.getIssues()
                );
            }

            return DATA.load();
        };


    window.initEpaperData =
        function () {

            return window.dcInitEpaperData();
        };


})(window, document);
