(function () {
    // console.log("version: ", Vue.version);

    function createForm(parameters) {
        var formdata = new FormData();
        for (var p in parameters)
            parameters[p] && formdata.append(p, parameters[p]);
        return formdata;
    }

    function axiosGet(what, params, success, failure) {
        return axios
            .get(what, { params: params })
            .then(({ data }) => {
                if (data.success) {
                    success(data);
                } else {
                    throw new Error(`${data.error}`);
                }
            })
            .catch(failure);
    }

    function axiosPost(where, what, success, failure) {
        return axios
            .post(where, what)
            .then(({ data }) => {
                if (data.success) {
                    success(data);
                } else {
                    throw new Error(`${data.error}`);
                }
            })
            .catch(failure);
    }

    const MONTHS = {
        1: "January",
        2: "February",
        3: "March",
        4: "April",
        5: "May",
        6: "June",
        7: "July",
        8: "August",
        9: "September",
        10: "October",
        11: "November",
        12: "December",
    };

    Vue.component("details-page", {
        template: "#details-template",
        data: function () {
            return {
                url: "",
                title: "",
                username: "",
                description: "",
                created_at: "",
            };
        },
        props: { imgId: { type: Number, required: true } },
        watch: {
            imgId: function () {
                this.refresh();
            },
        },
        mounted: function () {
            this.refresh();
        },
        computed: {
            imgData: {
                get: function () {
                    return this.$data;
                },
                set: function (parameters) {
                    this.title = parameters.title || "";
                    this.username = parameters.username || "";
                    this.description = parameters.description || "";
                    this.url = parameters.url || "";
                    this.created_at = parameters["created_at"] || "";
                },
            },
        },
        methods: {
            refresh() {
                return axiosGet(
                    "/details",
                    { id: this.imgId },
                    (data) => (this.imgData = data.imgData),
                    this.errorHandler
                );
            },
            formatDate(str) {
                if (str) {
                    var dateRegExp = /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/;
                    var matches = str.match(dateRegExp).slice(1, 7);
                    var [Y, M, D, h, m, s] = matches;
                    return `on ${Number(D)} ${
                        MONTHS[Number(M)]
                    } ${Y} at ${h}:${m}`;
                }
            },
            errorHandler: function (err) {
                this.$emit("close");
                alert(`${err.name}: ${err.message}`);
            },
        },
    });

    Vue.component("comment-section", {
        template: "#comments-template",
        props: { imgId: { type: Number, required: true } },
        data: function () {
            return { content: "", username: "", comments: [] };
        },
        watch: {
            imgId: function () {
                this.refresh();
            },
        },
        computed: {
            isValid: function () {
                return Boolean(this.content && this.username && this.imgId);
            },
        },
        mounted: function () {
            this.refresh();
        },
        methods: {
            submit: function () {
                if (this.isValid) {
                    let body = {
                        id: this.imgId,
                        username: this.username,
                        content: this.content,
                    };
                    axiosPost(
                        "/comments",
                        body,
                        this.refresh,
                        this.errorHandler
                    );
                } else {
                    alert("Please input valid data.");
                }
            },
            refresh: function () {
                return axiosGet(
                    "/comments",
                    { id: this.imgId },
                    (data) => (this.comments = data.rows),
                    this.errorHandler
                );
            },
            errorHandler: function (err) {
                alert(`${err.name}: ${err.message}`);
            },
        },
    });

    Vue.component("add-image-menu", {
        template: "#add-image-template",
        data: function () {
            return {
                isOpen: true,
                isModalOpen: false,
                isLink: false,
                url: "",
                title: "",
                username: "",
                description: "",
                file: null,
            };
        },
        methods: {
            openMenu() {
                this.isOpen = true;
            },
            pickFile() {
                console.log("pick a file");
            },
            pickLink() {
                console.log("pick a link");
            },
        },
    });

    Vue.component("metadata-page", {
        template: "#metadata-template",
        props: { file: { type: File }, url: { type: String } },
        data: function () {
            return { title: "", username: "", description: "" };
        },
        computed: {
            isValid() {
                return Boolean(
                    this.title && this.username && (this.file || this.url)
                );
            },
        },
        methods: {
            submit() {
                if (this.isValid) {
                    var data = {};
                    for (var d in this.$data) data[d] = this.$data[d];
                    this.$emit("upload-ready", data);
                } else {
                    alert("Please input valid data.");
                }
            },
        },
    });

    var vm = new Vue({
        el: "main",
        data: {
            images: [],
            title: "",
            username: "",
            description: "",
            file: null,
            selectedImg: 0,
            isThereMore: false,
            searchTitle: "newest images",
        },

        mounted: function () {
            this.selectedImg = Number(location.hash.replace("#", "")) || 0;
            axiosGet(
                "/images",
                { search: "latest" },
                (data) => {
                    this.images = data.rows;
                    this.isThereMore = Boolean(
                        data.rows[0].lowestId != this.lastId
                    );
                },
                this.errorHandler
            );
        },

        computed: {
            isValid: function () {
                return Boolean(this.title && this.username && this.file);
            },
            imgData: {
                get: function () {
                    return {
                        title: this.title,
                        username: this.username,
                        description: this.description,
                        file: this.file,
                    };
                },
                set: function (parameters) {
                    this.title = parameters.title || "";
                    this.username = parameters.username || "";
                    this.description = parameters.description || "";
                    this.file = parameters.file || null;
                    this.$refs.filePicker.value = parameters.file || null;
                },
            },
            lastId: function () {
                var last = this.images.slice(-1);
                return last.length === 1 ? last[0].id : undefined;
            },
            hashNumber: function () {
                return Number(location.hash.replace("#", "")) || 0;
            },
        },

        methods: {
            pickFile() {
                this.$refs.filePicker.click();
            },
            onFilePicked: function (event) {
                this.file = event.target.files[0] || null;
            },
            hideMetadata: function () {
                this.file = null;
            },
            upload(metadata) {
                var formdata = createForm(metadata);
                formdata.append("file", this.file);
                axiosPost(
                    "/upload",
                    formdata,
                    ({ url }) => {
                        metadata.url = url;
                        // TODO add image id
                        this.images.unshift(metadata);
                        this.reset();
                    },
                    this.errorHandler
                );
            },
            reset() {
                this.file = null;
                this.$refs.filePicker.value = null;
            },
            hideDetails: function () {
                this.selectedImg = 0;
                location.hash = "";
            },
            getMore: function () {
                axiosGet(
                    "/more",
                    { id: this.lastId },
                    (data) => {
                        this.images.push(...data.rows);
                        this.isThereMore = Boolean(
                            data.rows[0].lowestId != this.lastId
                        );
                    },
                    this.errorHandler
                );
            },
            errorHandler: function (err) {
                alert(`${err.name}: ${err.message}`);
            },
        },
    });

    window.addEventListener(
        "hashchange",
        () => (vm.selectedImg = Number(location.hash.replace("#", "")) || 0)
    );
})(); // iife
