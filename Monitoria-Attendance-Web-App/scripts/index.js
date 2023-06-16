let configuration = {
    server: ""
};

$(document).ready(()=> {
    setTimeout(()=> {
        $("#splash-screen").addClass("animate__fadeOut");
        $("#main-content").removeClass("d-none").addClass("animate__fadeIn");
    }, 3000);
});