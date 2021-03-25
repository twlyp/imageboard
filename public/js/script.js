// (function () {
function createForm(parameters) {
    var formdata = new FormData();
    for (var p in parameters)
        parameters[p] && formdata.append(p, parameters[p]);
    return formdata;
}

new Vue({
    el: "main",
    data: {
        images: [],
        title: "",
        username: "",
        description: "",
        file: null,
        isDetailsOpen: false,
        selectedImg: null,
    },

    mounted: function () {
        axios
            .get("/images")
            .then((resp) => (this.images = resp.data.rows))
            .catch((err) => this.showError(err.message));
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
    },

    methods: {
        onFilePicked: function (event) {
            this.file = event.target.files[0] || null;
        },
        submit: function () {
            if (this.isValid) {
                var imgData = this.imgData;
                var formdata = createForm(imgData);
                delete imgData.file;
                return axios
                    .post("/upload", formdata)
                    .then((resp) => {
                        if (resp.data.success) {
                            imgData.url = resp.data.url;
                            this.images.unshift(imgData);
                            this.reset();
                        } else {
                            throw new Error(`${resp.data.error}`);
                        }
                    })
                    .catch(errorHandler);
            }
            errorHandler(new Error("Please input valid data."));
        },
        reset: function () {
            this.imgData = {};
        },
        showDetails: function (event) {
            this.selectedImg = parseInt(
                event.currentTarget.getAttribute("img-id")
            );
            this.isDetailsOpen = true;
        },
        hideDetails: function () {
            this.selectedImg = null;
            this.isDetailsOpen = false;
        },
        showError: function (msg) {
            alert(msg);
        },
    },
});

Vue.component("details-page", {
    data: function () {
        return {
            url: "",
            title: "",
            username: "",
            description: "",
            timestamp: "",
        };
    },
    props: { id: { type: Number, required: true } },
    template: "#details-template",
    mounted: function () {
        axios
            .get("/details", { params: { id: this.id } })
            .then((resp) => {
                if (resp.data.success) {
                    this.imgData = resp.data.imgData;
                } else {
                    throw new Error(resp.data.error);
                }
            })
            .catch((err) => {
                this.$emit("close");
                return errorHandler(err);
            });
    },
    computed: {
        imgData: {
            get: function () {
                return {
                    title: this.title,
                    username: this.username,
                    description: this.description,
                    url: this.url,
                    timestamp: this.timestamp,
                };
            },
            set: function (parameters) {
                this.title = parameters.title || "";
                this.username = parameters.username || "";
                this.description = parameters.description || "";
                this.url = parameters.url || "";
                this.timestamp =
                    parameters["created_at"] || parameters.timestamp || "";
            },
        },
    },
});

function errorHandler(err) {
    alert(`${err.name}: ${err.message}`);
}
// })(); // iife
