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
                            this.showError("Upload error");
                        }
                    })
                    .catch((err) => this.showError(err.message));
            }
            this.showError("Please fill out required fields");
        },
        reset: function () {
            this.imgData = {};
        },
        showError: function (msg) {
            alert(msg);
        },
    },
});
// })(); // iife
