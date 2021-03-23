// (function () {
new Vue({
    el: "main",
    data: {
        title: "Latest images",
        images: [],
    },

    mounted: function () {
        axios
            .get("/images")
            .then((resp) => (this.images = resp.data.rows))
            .catch((err) => console.error(err));
    },

    // methods: {
    //     myFunction: function () {
    //         console.log("myFunction running");
    //     },
    // },
});
// })(); // iife
