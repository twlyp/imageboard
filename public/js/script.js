// (function () {
function createForm(parameters) {
    var formdata = new FormData();
    for (var p in parameters)
        parameters[p] && formdata.append(p, parameters[p]);
    return formdata;
}

function axiosGet(what, params, success) {
    return axios
        .get(what, { params: params })
        .then(({ data }) => {
            if (data.success) {
                success(data);
            } else {
                throw new Error(`${data.error}`);
            }
        })
        .catch(this.errorHandler);
}

function axiosPost(where, what, success) {
    return axios
        .post(where, what)
        .then(({ data }) => {
            if (data.success) {
                success(data);
            } else {
                throw new Error(`${data.error}`);
            }
        })
        .catch(this.errorHandler);
}

new Vue({
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
        axiosGet("/images", { search: "latest" }, (data) => {
            this.images = data.rows;
            this.isThereMore = Boolean(data.rows[0].lowestId != this.lastId);
        });
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
    },

    methods: {
        onFilePicked: function (event) {
            this.file = event.target.files[0] || null;
        },
        submit: function () {
            if (this.isValid) {
                var currentImg = this.imgData;
                var formdata = createForm(currentImg);
                delete currentImg.file;
                axiosPost("/upload", formdata, ({ url }) => {
                    currentImg.url = url;
                    this.images.unshift(currentImg);
                    this.imgData = {};
                });
            } else {
                alert("Please input valid data.");
            }
        },
        showDetails: function (event) {
            this.selectedImg = parseInt(
                event.currentTarget.getAttribute("img-id")
            );
        },
        hideDetails: function () {
            this.selectedImg = 0;
        },
        getMore: function () {
            axiosGet("/more", { id: this.lastId }, (data) => {
                this.images.push(...data.rows);
                this.isThereMore = Boolean(
                    data.rows[0].lowestId != this.lastId
                );
            });
        },
        errorHandler: function (err) {
            alert(`${err.name}: ${err.message}`);
        },
    },
});

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
    mounted: function () {
        axiosGet(
            "/details",
            { id: this.imgId },
            (data) => (this.imgData = data.imgData)
        );
    },
    computed: {
        imgData: {
            get: function () {
                return {
                    title: this.title,
                    username: this.username,
                    description: this.description,
                    url: this.url,
                    created_at: this.created_at,
                };
            },
            set: function (parameters) {
                this.title = parameters.title || "";
                this.username = parameters.username || "";
                this.description = parameters.description || "";
                this.url = parameters.url || "";
                this.created_at = parameters["created_at"] || "";
            },
        },
        createdDate() {
            return this.formatDate(this.created_at);
        },
    },
    methods: {
        formatDate(str) {
            // TODO what the fuck is happening with the date
            if (str) {
                var dateRegExp = /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/;
                var matches = str.match(dateRegExp).slice(1, 7);
                for (var i = 0; i < matches.length; i++)
                    matches[i] = parseInt(matches[i]);
                var date = new Date(2021, 3, 26, 14, 59, 29);
                return date;
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
    computed: {
        isValid: function () {
            return Boolean(this.content && this.username && this.imgId);
        },
    },
    mounted: function () {
        this.refreshComments();
    },
    methods: {
        submit: function () {
            if (this.isValid) {
                let body = {
                    id: this.imgId,
                    username: this.username,
                    content: this.content,
                };
                axiosPost("/comments", body, this.refreshComments);
            } else {
                alert("Please input valid data.");
            }
        },
        refreshComments: function () {
            return axiosGet(
                "/comments",
                { id: this.imgId },
                (data) => (this.comments = data.rows)
            );
        },
        errorHandler: function (err) {
            alert(`${err.name}: ${err.message}`);
        },
    },
});

// })(); // iife
