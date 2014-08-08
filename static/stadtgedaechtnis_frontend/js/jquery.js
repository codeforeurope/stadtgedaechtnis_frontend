/**
 * Created by jpi on 05.03.14.
 */

/*
 * jQuery stuff
 * Using jQuery 1.11.0
 */

var footerHeight;
var headerHeight;
var footerSwipeHeight;
var containerHeight;
var containerWidth;
var up = false;

/**
 * resizes the main element to the remaining browser height
 */
function resizeContainer() {
    headerHeight = $("header[role='banner']").css("height");
    headerHeight = parseInt(headerHeight.substring(0, headerHeight.length - 2));
    var footer = $("section#article-section");
    var list= $("section#list-section");
    var main = $("main");
    footerHeight = footer.css("height");
    footerHeight = parseInt(footerHeight.substring(0, footerHeight.length - 2));
    main.css({
        paddingTop: headerHeight + "px",
        marginTop: "-" + headerHeight + "px",
        paddingBottom: "0px",
        marginBottom: "0px"
    });
    list.css({
        height: "0"
    });
    footer.css({
        height: "0"
    });
    containerHeight = main.height();
    containerWidth = main.width();
}

/**
 * Slide an element to a given size
 * @param slidingElement
 * @param containerElement
 * @param newSize
 * @param [callback]
 */
function slideElement(slidingElement, containerElement, newSize, callback) {
    slidingElement.transition({height: newSize}, 200, "ease");
    containerElement.transition({paddingBottom: newSize, marginBottom: "-" + newSize}, 200, "ease", callback);
}

/**
 * Initializes the swipe ability on the footer.
 */
function initializeFooterSwiping() {
    var footer = $("section#article-section");
    var footerHeading = $("div.article-heading");
    var container = $("main");

    var swipeThreshold = containerHeight * 0.3;
    var maxPadding = containerHeight + "px";

    footerHeading.swipe({
        swipeStatus: function(event, phase, direction, distance) {
            if (phase === "start") {
                footerSwipeHeight = footer.height();
            }
            // handles the current swipe
            if ((up && direction === "down") || (!up && direction === "up")) {
                if (phase === "cancel") {
                    var newPadding = (direction === "up" ? footerHeight + "px": maxPadding);
                    var footerPadding = (direction === "up" ? "0.8rem 0.8rem 0 0.8rem" : "0.8rem");
                    footer.css("padding", footerPadding);
                    slideElement(footer, container, newPadding);
                    footer.css("padding", "0.8rem 0.8rem 0 0.8rem");
                } else if (phase === "end") {
                    var newPadding = (direction === "up" ? maxPadding : footerHeight + "px");
                    var footerPadding = (direction === "up" ? "0.8rem" : "0.8rem 0.8rem 0 0.8rem");
                    footer.css("padding", footerPadding);
                    slideElement(footer, container, newPadding);
                    $("div.entry-list ul li").css("overflow-y", direction === "up" ? "auto" : "hidden");
                    up = (direction === "up");
                } else {
                    var newPadding = footerSwipeHeight + (direction === "up" ? distance : -distance);
                    container.css({
                        paddingBottom: newPadding + "px",
                        marginBottom: "-" + newPadding + "px"
                    });
                    footer.css({
                        height: newPadding + "px"
                    })
                }
            }
        },
        checkThresholds: true,
        maxTimeThreshold: 300,
        threshold: swipeThreshold
    });

    var slideWidth = $("div.entry-list ul li:first").width();
    var swipeLeftRightThreshold = slideWidth * 0.3;
    var slideList = $("section#article-section div.entry-list");

    $("section#article-section div.entry-list ul li").swipe({
        swipeStatus: function(event, phase, direction, distance) {
            if (direction === "left" || direction ==="right") {
                var unslider = slideList.data("unslider");
                var currentSlide = unslider.current;
                if (phase === "end") {
                    if ((direction === "left" && (currentSlide === unslider.items.length - 1)) || (direction === "right" && (currentSlide === 0))) {
                        return false;
                    } else {
                        unslider.move(currentSlide + (direction === "left" ? 1 : -1));
                    }
                } else if (phase === "cancel") {
                    unslider.move(currentSlide);
                } else {
                    if ((direction === "left" && (currentSlide === unslider.items.length - 1)) || (direction === "right" && (currentSlide === 0))) {
                        return false;
                    } else {
                        var percentMoved = (distance / slideWidth) * 100;
                        var newPercentage = currentSlide * 100 + (direction === "left" ? percentMoved : -percentMoved);
                        var newLeft = "-" + newPercentage + "%";
                        $("section#article-section div.entry-list ul").css("left", newLeft);
                    }
                }
            }
        },
        checkThresholds: true,
        maxTimeThreshold: 300,
        threshold: swipeLeftRightThreshold,
        allowPageScroll: "vertical"
    });
}

/**
 * Displays an alert box that displays a short message and, optionally, an icon.
 * @param message
 * @param [callback]
 */
function alertBox(message, callback) {
    // set message
    $("div.message p").html(message);
    // animate sliding
    var messageBox = $("div.message");
    messageBox.css("opacity", 1);
    messageBox.animate({"top": "3rem"}, 800, "easeOutBounce", function() {
        if (callback !== undefined) {
            callback();
        }
    });
}

/**
 * Closes the alert box.
 */
function closeAlertBox() {
    var messageBox = $("div.message");
    messageBox.transition({"opacity": 0}, 130, "linear", function() {
        messageBox.css("top", "-10rem");
        messageBox.show();
    });
}

Date.prototype.toFormattedString = function () {
    function f(n) {
        // Format integers to have at least two digits.
        return n < 10 ? '0' + n : n;
    }
    return this.getFullYear()   + '-' +
        f(this.getMonth() + 1) + '-' +
        f(this.getDate());
};

Date.prototype.parseDate = function(input) {
    var parts = input.split('.');
    if (parts.length === 1) {
        parts = input.split('-');
        if (parts.length === 3 && isNumber(parts[0]) && isNumber(parts[1]) && isNumber(parts[2])) {
            return new Date(parts[0], parts[1] - 1, parts[2]);
        }
    } else {
        if (parts.length === 3 && isNumber(parts[0]) && isNumber(parts[1]) && isNumber(parts[2])) {
            return new Date(parts[2], parts[1] - 1, parts[0]);
        }
    }
    return null;
};

function isNumber(obj) { return !isNaN(parseFloat(obj)) }

/**
 * $(document).ready
 *
 * initialize jQuery hooks
 */
$(function() {
    resizeContainer();
    $("img.load-more").hide();
});