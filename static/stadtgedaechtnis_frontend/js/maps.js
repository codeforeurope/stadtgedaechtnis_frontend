/**
 * Constant that identifies the map canvas.
 * @type {string}
 */
var MAP_ELEMENT = "map_canvas";

var channel = "mobile";

var newEntryMode = false;

var allEntriesVisible = false;

/**
 * Callback that is called when the location couldn't be retrieved.
 * @param error
 */
function errorLocationCallback (error) {
    // error callback
    userLocation.moveToLocation(userLocation.DEFAULT_LAT, userLocation.DEFAULT_LON);
    userLocation.locationAvailable = false;
    alertBox(gettext("Ihre Position konnte nicht ermittelt werden. Nachricht: ") + error.message);
}

/**
 * Adds a marker for a specific location to the map.
 * @param location
 */
function addMarker (location) {
    // calculate latitude and longitude
    var latitude = parseFloat(location.latitude);
    var longitude = parseFloat(location.longitude);

    var entryCount = location.stories.length;
    if (entryCount === 0) {
        entryCount = 1;
    }
    if (entryCount > 9) {
        entryCount = 0;
    }
    // if not already on the map, display marker
    if (!userLocation.locations.hasOwnProperty(location.id)) {
        location.marker = new google.maps.Marker({
            map: userLocation.map,
            position: new google.maps.LatLng(latitude, longitude),
            title: location.label,
            icon: "/static/stadtgedaechtnis_frontend/img/marker_" + entryCount + ".png",
            animation: google.maps.Animation.DROP
        });

        createInfobox(location);

        userLocation.locations[location.id] = location;
    }
}

/**
 * Creates an infobox for this location.
 * @param location
 */
function createInfobox(location) {
    var infoBoxContent;
    if (location.stories.length > 0) {
        if (location.stories.length > 1) {
            infoBoxContent = "<div class='infowindow' id='infowindow'><ul>";
            for (var i = 0; i < location.stories.length; i++) {
                infoBoxContent += "<li><a href='#' class='switch-entry' data-entry='" + i + "'>" + location.stories[i].title + "</a></li>";
            }
            infoBoxContent += "</ul></div>";
        } else {
            infoBoxContent = "<div class='infowindow' id='infowindow'><p>" + location.stories[0].abstract + "</p></div>";
        }
    } else {
        infoBoxContent = "<div class='infowindow' id='infowindow'><p>" + location.label + "</p></div>";
    }

    var infoBox = new google.maps.InfoWindow({
        content: infoBoxContent,
        maxWidth: 225,
        zIndex: 1000
    });

    location.infobox = infoBox;

    google.maps.event.addListener(infoBox, 'closeclick', function () {
        closeArticleBox(location.stories.length === 0);
        return false;
    });
    google.maps.event.clearListeners(location.marker, 'click');
    google.maps.event.addListener(location.marker, 'click', function () {
        if (newEntryMode) {
            if (newStory.location === null) {
                selectNewLocation(location);
            }
        } else {
            if (location.stories.length > 0) {
                openEntry(location);
            } else {
                openInfobox(location);
            }
        }
        return false;
    });

    return location;
}

/**
 * Selects a location for the new entry box.
 * @param location
 */
var resetOldMarker;
function selectNewLocation(location) {
    $("span#selected-location").text(location.label);
    if (resetOldMarker !== undefined) {
        resetOldMarker();
    }
    var oldMarkerIcon = location.marker.getIcon();
    resetOldMarker = function () {
        if (userLocation.newLocationMarker !== undefined) {
            userLocation.newLocationMarker.setMap(null);
            userLocation.newLocationMarker = undefined;
        }
        location.marker.setIcon(oldMarkerIcon);
    };
    userLocation.selectedLocation = location;
    location.marker.setIcon("/static/stadtgedaechtnis_frontend/img/marker_selected.png");
}

/**
 * Reads the position of the selection marker after dragging.
 */
function markerSetNewLocation(lat, lon) {
    getNearbyAddresses(lat, lon, function(result) {
        $("span#selected-location").text(result[0].address);
    })
}

/**
 * Loads the complete entry for the given location and entry index.
 * @param listElement
 */
function loadAdditionalEntry(listElement) {
    if (!listElement.data("loaded")) {
        var index = listElement.data("entry");
        var id = listElement.data("id");

        $("article#entry-more-" + index).html("");
        $("img#load-more-" + index).show();
        var entryUrl = django_js_utils.urls.resolve("entry-view", {pk: id});
        $.get(entryUrl, function (data) {
            $("article#entry-more-" + index).html(data);
            $("img#load-more-" + index).hide();
            listElement.data("loaded", true);
        });
    }
}

/**
 * Opens the entry box and the info box for one location.
 * Handles click events on the marker.
 * @param location
 */
function openEntry(location) {
    loadAndOpenEntryBox(location.stories);
    openInfobox(location);
    userLocation.currentInfobox = location.infobox;
}

/**
 * Opens the infobox for one location.
 * @param location
 */
function openInfobox(location) {
    location.infobox.open(userLocation.map, location.marker);

    if (location.stories.length > 1) {
        $("a.switch-entry").each(function() {
            $(this).click(function(event) {
                var entryIndex = $(this).data("entry");
                $("section#article-section div.entry-list").data("unslider").move(entryIndex);
                event.preventDefault();
                return false;
            });
        });
    }
}

/**
 * Opens the article sidebox and calls a callback
 * that can be used to load content into the sidebox.
 * @param articleBoxHeight height of the article box
 * @param [callback]
 */
function openArticleBox(articleBoxHeight, callback) {
    var jQueryEntryList = $("section#article-section div.entry-list");

    if (userLocation.currentInfobox === null) {
        // New entry opened
        if ($(window).width() < 768) {
            // mobile
            channel = "mobile";
            jQueryEntryList.data("unslider") && jQueryEntryList.data("unslider").set(0, true);
            resizeArticleBox(articleBoxHeight, function () {
                initializeFooterSwiping();
                jQueryEntryList.unslider({
                    complete: callback
                });
                jQueryEntryList.data("unslider").set(0, true);
                google.maps.event.trigger(userLocation.map, "resize");
            });
        } else {
            // desktop
            $("div.article-heading").swipe("disable");
            var footer = $("section#article-section");
            channel = "desktop";
            var map = $("section.max_map");
            var mapWidth = map.width();
            var listEntries = $("div.entry-list ul li");
            footer.css({
                height: "100%",
                width: "0%",
                padding: "0.8rem"
            });
            jQueryEntryList.data("unslider") && jQueryEntryList.data("unslider").set(0, true);
            map.transition({width: mapWidth - 380 + "px"}, 200, "ease");
            footer.transition({width: "380px"}, 200, "ease", function () {
                jQueryEntryList.unslider({
                    complete: callback
                });
                jQueryEntryList.data("unslider").set(0, true);
                google.maps.event.trigger(userLocation.map, "resize");
            });
            listEntries.css("overflow-y", "auto");
        }
    } else {
        // Old entry already opened
        jQueryEntryList.data("unslider").set(0, true);
        if (userLocation.currentInfobox !== "dummy") {
            userLocation.currentInfobox.close();
        }
        jQueryEntryList.unslider({
            complete: callback
        });
        if (channel === "desktop") {
            $("div.entry-list ul li").css("overflow-y", "auto");
        } else {
            initializeFooterSwiping();
        }

        if (newEntryMode) {
            newEntryMode = false;
            if (resetOldMarker !== undefined) {
                resetOldMarker();
            }
        }
    }
}

/**
 * Resizes the article box to a different height.
 * @param articleBoxHeight
 * @param [callback]
 */
function resizeArticleBox(articleBoxHeight, callback) {
    if (channel === "mobile") {
        // only necessary in mobile view
        var footer = $("section#article-section");
        var main = $("main");
        footer.css("padding", "0.8rem 0.8rem 0 0.8rem");
        footer.transition({height: articleBoxHeight + "px"}, 200, "ease");
        main.transition({paddingBottom: articleBoxHeight + "px", marginBottom: "-" + articleBoxHeight + "px"}, 200, "ease", function () {
            if (callback !== undefined && callback !== null) {
                callback();
            }
        });
    } else {
        callback();
    }
}
/**
 * Pops up the entry box with the first location
 * correct heading and image.
 * @param stories
 */
function loadAndOpenEntryBox(stories) {
    var entryList = "";
    for (var i = 0; i < stories.length; i++) {
        // create list of entrys for slider
        entryList += '<li data-entry="' + i + '" data-id="' + stories[i].id + '">\
                        <div class="article-heading">\
                            <div class="article-heading-row">';
        if (i > 0) {
            entryList += '    <a href="#" class="previous"><div class="article-heading-cell entry-slide previous">\
                <img src="/static/stadtgedaechtnis_frontend/img/left.png">\
            </div></a>'
        }
        entryList += '<div class="article-heading-cell">\
                                    <h3 id="article-heading-' + i + '">' + stories[i].title + '</h3>\
                                </div>';
        if (i < stories.length - 1) {
            entryList += '<a href="#" class="next"><div class="article-heading-cell entry-slide next">\
                <img src="/static/stadtgedaechtnis_frontend/img/right.png">\
            </div></a>';
        }
        entryList += '</div>\
                        </div>';
        if (stories[i].assets[0] !== undefined) {
            entryList += '<img src="' + stories[i].assets[0].sources + '" alt="' + stories[i].assets[0].alt + '" id="entry-first-' + i + '"/>' +
                '<p class="image-description">' + stories[i].assets[0].alt + '</p>';
        }
        entryList += '<div class="center">\
                            <img src="/static/stadtgedaechtnis_frontend/img/ajax-loader.gif" id="load-more-' + i + '" class="load-more">\
                        </div>\
                        <article class="entry-more" id="entry-more-' + i + '">\
                        </article>\
                    </li>';
    }

    $("div.entry-list ul").html(entryList);
    $("section#article-section div.close").hide();
    var jQueryEntryList = $("section#article-section div.entry-list");

    if (stories.length > 1) {
        // Show next and previous buttons
        $("div.entry-slide").show();
        $("div.article-heading-row a.previous").unbind("click").click(function() {
            jQueryEntryList.data("unslider").prev();
            return false;
        });
        $("div.article-heading-row a.next").unbind("click").click(function() {
            jQueryEntryList.data("unslider").next();
            return false;
        });
    } else {
        // Hide next and previous buttons
        $("div.entry-slide").hide();
    }
    openArticleBox(footerHeight, loadAdditionalEntry);

    loadAdditionalEntry($("div.entry-list ul li:first"));
}

/**
 * Toggles the all entries list box.
 */
function toggleAllEntries() {
    if (allEntriesVisible) {
        closeListBox();
    } else {
        showAllEntries();
    }
    return false;
}


/**
 * Loads all the entries and lists them. Also shows search bar.
 */
function showAllEntries() {
    var listSection = $("section#list-section");
    var entryList = $("section#list-section ul");
    var searchBox = $("div.search-box");
    var navBox = $("div.nav-box");
    var query = $("input#search-input").val();
    $("img#load-more-list").show();
    if ($(window).width() < 768) {
        // mobile
        var main = $("main");
        if (userLocation.currentInfobox !== null) {
            closeArticleBox(false);
        }
        channel = "mobile";
        listSection.transition({height: containerHeight + "px"}, 300, "ease");
        searchBox.transition({left: 0}, 200, "ease");
        navBox.transition({left: 0}, 200, "ease");
        main.transition({paddingTop: containerHeight + headerHeight  + "px", marginTop: "-" + (containerHeight + headerHeight) + "px"}, 300, "ease", function() {
            if (allEntriesList !== null) {
                allEntriesList.appendTo(entryList);
                allEntriesList = null;
                $("img#load-more-list").hide();
            } else {
                if (query === "") {
                    loadAllEntries();
                } else {
                    searchEntries();
                }
            }
        });
        allEntriesVisible = true;
    } else {
        // desktop
        channel = "desktop";
        var map = $("section.max_map");
        var mapWidth = map.width();
        listSection.css({
            height: "100%",
            width: "0%"
        });
        searchBox.transition({left: 0}, 200, "ease");
        navBox.transition({left: 0, width: containerWidth - 380 + "px"}, 200, "ease");
        map.transition({width: mapWidth - 380 + "px"}, 200, "ease");
        listSection.transition({width: "380px"}, 200, "ease", function() {
            if (allEntriesList !== null) {
                allEntriesList = null;
                allEntriesList.appendTo(entryList);
                $("img#load-more-list").hide();
            } else {
                if (query === "") {
                    loadAllEntries();
                } else {
                    searchEntries();
                }
            }
        });
        allEntriesVisible = true;
    }
}

var searchTimeoutID = null;

/**
 * Creates a timeout to search for entries.
 */
function createSearchTimeout() {
    if (searchTimeoutID !== null) {
        window.clearTimeout(searchTimeoutID);
    }
    searchTimeoutID = window.setTimeout(searchEntries, 500);
}

/**
 * Searches for entries
 */
function searchEntries() {
    $("section#list-section ul").empty();
    $("img#load-more-list").show();
    var query = $("input#search-input").val();
    if (query === "") {
        loadAllEntries();
    } else {
        var searchUrl = django_js_utils.urls.resolve("query-story-text", {query: query});
        $.getJSON(searchUrl, function (data) {
            var entryList = $("section#list-section ul");
            $.each(data, function (index, value) {
                entryList.append("<li><a href='#' class='open-entry' data-location='" + value["location"] + "' data-entry='" + value["id"] + "'>" + value["title"] + "</a></li>");
            });
            $("img#load-more-list").hide();
            addOpenEntryEvent();
        });
    }
}

/**
 * Attaches event handlers to the entry list to open the entry.
 */
function addOpenEntryEvent() {
    $("a.open-entry").each(function () {
        $(this).click(function (event) {
            var link = $(this);
            var entryID = link.data("entry");
            var locationID = link.data("location");
            if (channel === "mobile") {
                closeListBox();
            }
            if (locationID !== null) {
                if (!userLocation.locations.hasOwnProperty(locationID)) {
                    var locationURL = django_js_utils.urls.resolve("get-location-with-stories-images", {pk: locationID});
                    $.getJSON(locationURL, function (location) {
                        addMarker(location);
                        openEntry(location);
                        userLocation.moveToLocation(location.latitude, location.longitude);
                    });
                } else {
                    var location = userLocation.locations[locationID];
                    openEntry(location);
                    userLocation.moveToLocation(location.latitude, location.longitude);
                }
            } else {
                var storyURL = django_js_utils.urls.resolve("get-story-image", {pk: entryID});
                $.getJSON(storyURL, function (data) {
                    var asList = [data];
                    loadAndOpenEntryBox(asList);
                    userLocation.currentInfobox = "dummy";
                });
            }
            event.preventDefault();
            return false;
        });
    });
}
/**
 * Loads all saved entries and displays them in the list box.
 */
function loadAllEntries() {
    var allEntriesURL = django_js_utils.urls.resolve("get-all-stories-with-title");
    $.getJSON(allEntriesURL, function (data) {
        var entryList = $("section#list-section ul");
        $.each(data, function (index, value) {
            entryList.append("<li><a href='#' class='open-entry' data-location='" + value["location"] + "' data-entry='" + value["id"] + "'>" + value["title"] + "</a></li>");
        });
        $("img#load-more-list").hide();
        addOpenEntryEvent();
    });
}

/**
 * Closes the article box.
 * @param both Determines whether both boxes are closed at the same time.
 */
function closeArticleBox(both) {
    var footer = $("section#article-section");

    if (channel === "mobile") {
        //mobile
        var main = $("main");
        footer.transition({height: 0}, 200, "ease", function() {
            footer.css("padding", "0rem");
            $("div.entry-list ul").removeAttr("style");
        });
        main.transition({paddingBottom: "0px", marginBottom: "0px"}, 200, "ease", function() {
            google.maps.event.trigger(userLocation.map, "resize");
        });
    } else {
        //desktop
        var map = $("section.max_map");
        var mapWidth = map.width();
        var list = $("div.entry-list ul");
        footer.transition({width: "0%"}, 200, "ease", function() {
            footer.css({
                height: "100%",
                padding: "0rem",
                width: "auto"
            });
            list.removeAttr("style");
        });
        if (!both || both === undefined) {
            map.transition({width: mapWidth + 380 + "px"}, 200, "ease", function() {
                google.maps.event.trigger(userLocation.map, "resize");
            });
        } else {
            map.transition({width: containerWidth + "px"}, 200, "ease", function() {
                google.maps.event.trigger(userLocation.map, "resize");
            });
        }
    }

    if (userLocation.currentInfobox !== null) {
        if (userLocation.currentInfobox !== "dummy") {
            userLocation.currentInfobox.close();
        }
        userLocation.currentInfobox = null;
    }

    if (newEntryMode) {
        newEntryMode = false;
        if (userLocation.newLocationMarker !== undefined) {
            // new location was created, delete this location
            var deleteNewLocationUrl = django_js_utils.urls.resolve("get-location", {pk: newStory.location.id});
            ajaxRequestWithCSRF(deleteNewLocationUrl, "DELETE", {
                unique_id: newStory.location.unique_id
            });
            if (newStory.id !== null) {
                // new story was created, delete this story
                var deleteNewStoryUrl = django_js_utils.urls.resolve("get-story", {pk: newStory.id});
                ajaxRequestWithCSRF(deleteNewStoryUrl, "DELETE", {
                    unique_id: newStory.uniqueId
                })
            }
            userLocation.newLocationMarker.map = null;
        }
        if (resetOldMarker !== undefined) {
            resetOldMarker();
        }
        newStory = null;
    }
}

var allEntriesList = null;
/**
 * Closes the list box.
 * @param [both] Determines whether both boxes are closed at the same time.
 */

function closeListBox(both) {
    var list = $("section#list-section");
    var allEntries = $("section#list-section ul li");
    var searchBox = $("div.search-box");
    var navBox = $("div.nav-box");

    if (channel === "mobile") {
        // mobile
        var main = $("main");
        list.transition({height: 0}, 200, "ease");
        searchBox.transition({left: "-50%"}, 200, "ease");
        navBox.transition({left: "-50%"}, 200, "ease");
        if (!both || both === undefined) {
            main.transition({marginTop: "-" + headerHeight + "px", paddingTop: headerHeight + "px"}, 200, "ease", function() {
                if (allEntries.length > 0) {
                    allEntriesList = allEntries.detach();
                }
                google.maps.event.trigger(userLocation.map, "resize");
            });
        }
    } else {
        // desktop
        var map = $("section.max_map");
        var mapWidth = map.width();
        list.transition({width: "0%"}, 200, "ease");
        searchBox.transition({left: "-380px"}, 200, "ease");
        navBox.transition({left: "-380px", width: containerWidth + "px"}, 200, "ease");
        if (!both || both === undefined) {
            map.transition({width: mapWidth + 380 + "px"}, 200, "ease", function() {
                google.maps.event.trigger(userLocation.map, "resize");
            });
        } else {
            map.transition({width: containerWidth + "px"}, 200, "ease", function() {
                if (allEntries.length > 0) {
                    allEntriesList = allEntries.detach();
                }
                google.maps.event.trigger(userLocation.map, "resize");
            });
        }
    }
    allEntriesVisible = false;
}

/**
 * Closes both boxes.
 * @param mouseEvent
 * @param [force]
 */
function closeBoxes(mouseEvent, force) {
    if (!newEntryMode || (force !== undefined && force)) {
        var addArticleMenu = $("div.add-articles");
        mouseEvent !== undefined && mouseEvent.stop();
        closeArticleBox(true);
        closeListBox(true);
        closeAlertBox();
        userLocation.selectedLocation = null;
        addArticleMenu.removeClass("hover");
    } else {
        var text = gettext("Wollen Sie den Vorgang wirklich abbrechen? Sämtliche bisherige Eingaben werden verworfen.").toString();
        var yes = gettext("Ja").toString();
        var no = gettext("Nein").toString();
        alertBox(text + '&nbsp;&nbsp;&nbsp;&nbsp;<a href="#" id="yes">' + yes + '</a>&nbsp;&nbsp;&nbsp;&nbsp;<a href="#" id="no">' + no + '</a>', function() {
            $("div.message a#yes").click(function() {
                closeBoxes(undefined, true);
                return false;
            });
            $("div.message a#no").click(function(event) {
                event.stopPropagation();
                closeAlertBox();
                return false;
            })
        });
    }
}

/**
 * Callback that is called when the viewport changed
 */
function searchForEntries () {
    // calculate bounds to search for
    if (userLocation.map.getBounds() !== undefined) {
        var bounds = userLocation.map.getBounds();
        var max_lat = bounds.getNorthEast().lat().toFixed(10);
        var max_lon = bounds.getNorthEast().lng().toFixed(10);
        var min_lat = bounds.getSouthWest().lat().toFixed(10);
        var min_lon = bounds.getSouthWest().lng().toFixed(10);
        // get nearby locations
        var locationsUrl = django_js_utils.urls.resolve("get-locations-with-stories-image", {
            lat: min_lat,
            lon: min_lon,
            maxlat: max_lat,
            maxlon: max_lon
        });
        $.getJSON(locationsUrl, function (data) {
            $.each(data, function (index, value) {
                addMarker(value);
            })
        });
    }
}

/**
 * Loads a new tab and switches to this tab.
 * @param url
 * @param resizeContainerHeight
 * @param [callback]
 */
function loadAndOpenNewTab(url, resizeContainerHeight, callback) {
    var entryList = $("section#article-section div.entry-list ul");
    var jQueryEntryList = $("section#article-section div.entry-list");
    $.get(url, function(data) {
        var newListEntry = $("<li>").html(data);
        newListEntry.appendTo(entryList);
        jQueryEntryList.unslider();
        jQueryEntryList.data("unslider").next();
        resizeArticleBox(resizeContainerHeight, function() {
            google.maps.event.trigger(userLocation.map, "resize");
        });
        if (callback !== undefined && callback !== null) {
            callback();
        }
    });
}

/**
 * Shows the overlay.
 */
function showOverlay() {
    var overlay = $("div.overlay");
    var greeting = $("div.greeting, div.advice");
    var link = $("div.greeting a");
    overlay.show();
    link.click(function(event) {
        closeOverlay();
        event.stopPropagation();
        return false;
    });
    overlay.transition({backgroundColor: "rgba(0, 0, 0, 0.7)"}, 2000, "cubic-bezier(.37,.96,.61,.95)");
    greeting.transition({opacity: "1"}, 2000, "cubic-bezier(.85,.07,.51,.93)");
}

var OVERLAY_COOKIE = "overlay";
var OVERLAY_COOKIE_HIDDEN = "hidden";

/**
 * Hides the overlay
 */
function closeOverlay() {
    var overlay = $("div.overlay");
    var greeting = $("div.greeting, div.advice");
    greeting.transition({opacity: "0"}, 1000, "cubic-bezier(.02,.53,.28,.96)");
    overlay.transition({backgroundColor: "rgba(0, 0, 0, 0)"}, 1500, "cubic-bezier(.37,.96,.61,.95)", function() {
        overlay.hide();
        setCookie(OVERLAY_COOKIE, OVERLAY_COOKIE_HIDDEN, 365);
    });
}

/**
 * Sets a cookie with name, value and expiry date.
 * @param name
 * @param value
 * @param expiryInDays
 */
function setCookie(name, value, expiryInDays) {
    var d = new Date();
    d.setTime(d.getTime() + (expiryInDays * 24 * 60 * 60 * 1000));
    var expires = "expires="+d.toGMTString();
    document.cookie = name + "=" + value + "; " + expires;
}

/**
 * Reads a cookie
 * @param name
 * @returns {*}
 */
function readCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

/**
 * Location object to enable/disable tracking the location and to retrieve the current or fallback location.
 * @constructor
 */
function Location() {
    this.DEFAULT_LAT = 50.258;
    this.DEFAULT_LON = 10.965
    this.DEFAULT_LOCATION = new google.maps.LatLng(50.258, 10.965);
    this.positionMarker = null;
    this.locations = {};
    this.currentInfobox = null;
    this.locationAvailable = false;
    this.selectedLocation = null;
}

/**
 * Move the map to the current location or the fallback
 * @returns {google.maps.LatLng|*}
 */
Location.prototype.moveToCurrentLocationOrFallback = function () {
    if (navigator.geolocation) {
        google.maps.event.addListenerOnce(this.positionMarker, 'position_changed', function() {
            if (this.getPosition() !== undefined) {
                userLocation.locationAvailable = true;
                userLocation.map.setCenter(this.getPosition());
                userLocation.map.fitBounds(this.getBounds());
                searchForEntries();
            }
        });
    } else {
        this.moveToLocation(userLocation.DEFAULT_LAT, userLocation.DEFAULT_LON);
    }
};

/**
 * Moves the map to the given location
 * @param lat
 * @param lng
 */
Location.prototype.moveToLocation = function(lat, lng) {
    if (this.map) {
        var position = new google.maps.LatLng(lat, lng);
        this.map.panTo(position);
        searchForEntries();
    }
};

/**
 * Retrieves the current position without a callback.
 */
Location.prototype.getCurrentLocation = function() {
    if (userLocation.positionMarker) {
        var googlePosition = userLocation.positionMarker.getPosition();
        return ({
            lat: googlePosition.lat(),
            lon: googlePosition.lon()
        });
    } else {
        return ({
            lat: userLocation.DEFAULT_LAT,
            lon: userLocation.DEFAULT_LON
        });
    }
};

var userLocation = new Location();

/**
 * Global map Options
 * @type {{center: google.maps.LatLng, zoom: number, mapTypeId: *, disableDefaultUI: boolean, zoomControl: boolean}}
 */
var mapOptions = {
    center: userLocation.DEFAULT_LOCATION,
    zoom: 17,
    mapTypeControl: true,
    mapTypeId: google.maps.MapTypeId.SATELLITE,
    disableDefaultUI: true,
    zoomControl: true
};

function Story() {
    this.location = null;
    this.title = null;
    this.author = null;
    this.text = null;
    this.dateStart = null;
    this.dateFinish = null;
    this.uniqueId = null;
    this.id = null;
    this.media = [];
}

/**
 * Initializes the map
 */
function initializeMap() {
    userLocation.map = new google.maps.Map(document.getElementById(MAP_ELEMENT),
        mapOptions);
    userLocation.positionMarker = new GeolocationMarker(userLocation.map);
    userLocation.moveToCurrentLocationOrFallback();
    google.maps.event.addListener(userLocation.positionMarker, 'geolocation_error', errorLocationCallback);
    google.maps.event.addListener(userLocation.map, 'idle', searchForEntries);
    google.maps.event.addListener(userLocation.map, 'click', closeBoxes);
}

/**
 * Enables the user to add a new location.
 */
function newLocation() {
    var newButton = $("div.new-entry span.new");
    var inputField = $("div.new-entry span#selected-location");
    var entryList = $("div.entry-list ul li");
    if (resetOldMarker !== undefined) {
        resetOldMarker();
    }
    resetOldMarker = function() {
        if (userLocation.newLocationMarker !== undefined) {
            userLocation.newLocationMarker.setMap(null);
            userLocation.newLocationMarker = undefined;
            newButton.removeClass("edit").addClass("new").unbind("click").click(newLocation);
            inputField.prop("contenteditable", "false");
        }
    };
    userLocation.newLocationMarker = new google.maps.Marker({
        map: userLocation.map,
        position: userLocation.map.getCenter(),
        icon: "/static/stadtgedaechtnis_frontend/img/marker_selected.png",
        animation: google.maps.Animation.DROP,
        draggable: true
    });
    markerSetNewLocation(userLocation.map.getCenter().lat(), userLocation.map.getCenter().lng());
    newButton.removeClass("new").addClass("edit").unbind("click").click(function() {
        entryList.unbind("mousedown");
        inputField.prop("contenteditable", "true").on("focus click", function() {
            document.execCommand('selectAll', false, null);
        }).focus();
    });
    google.maps.event.addListener(userLocation.newLocationMarker, "dragend", function(event) {
        var lat = event.latLng.lat();
        var lon = event.latLng.lng();
        markerSetNewLocation(lat, lon);
    });
    return false;
}

var newStory = null;

/**
 * Loads the title tab for the new entry routine.
 * @param mediaType
 */
function loadTitleTab(mediaType) {
    newStory = new Story();
    $("div.new-entry span.new").click(newLocation);
    $("span#next-location").click(function(event) {
        if (userLocation.newLocationMarker !== undefined) {
            var lat = userLocation.newLocationMarker.getPosition().lat().toFixed(13);
            var lon = userLocation.newLocationMarker.getPosition().lng().toFixed(13);
            var title = $("span#selected-location").text();
            var postNewLocationUrl = django_js_utils.urls.resolve("list-locations");
            ajaxRequestWithCSRF(postNewLocationUrl, "POST", {
                latitude: lat,
                longitude: lon,
                label: title,
                altitude: 0
            }, function(data) {
                newStory.location = data;
                userLocation.map.panTo(new google.maps.LatLng(lat, lon));
                openTitleTab(mediaType);
            });
        } else {
            if (userLocation.selectedLocation !== null) {
                newStory.location = userLocation.selectedLocation;
                userLocation.map.panTo(newStory.location.marker.getPosition());
                openTitleTab(mediaType);
            } else {
                alertBox(gettext("Sie müssen einen Ort auswählen, um fortfahren zu können, oder auf 'Ohne Ort fortfahren' klicken."));
            }
        }
        event.stopPropagation();
        return false;
    });
    $("span#no-location").click(function(event) {
        newStory.location = null;
        openTitleTab(mediaType);
        event.stopPropagation();
        return false;
    });
}
/**
 * Opens the title tab for a new story.
 * @param mediaType
 */
function openTitleTab(mediaType) {
    var titleEntryUrl = django_js_utils.urls.resolve("new-story-" + mediaType);
    loadAndOpenNewTab(titleEntryUrl, containerHeight * 0.75, function() {
        $("span#next-text").click(function(event) {
            var title = $("input#id_title").val();
            if (title === "") {
                alertBox(gettext("Sie müssen einen Titel für Ihre Geschichte eingeben."));
            } else {
                newStory.title = title;
                loadTextTab();
            }
            event.stopPropagation();
            return false;
        })
    });
}

/**
 * Loads the tab to enter a text for a new entry.
 */
function loadTextTab() {
    var postNewStoryUrl = django_js_utils.urls.resolve("get-all-stories");
    var date = new Date();
    var dateString = date.toFormattedString();
    var locationId = null;
    if (newStory.location !== null) {
        locationId = newStory.location.id;
    }
    ajaxRequestWithCSRF(postNewStoryUrl, "POST", {
        title: newStory.title,
        abstract: "temporary",
        author: 1,
        time_start: dateString,
        location: locationId
    }, function(data) {
        newStory.id = data.id;
        newStory.uniqueId = data.unique_id;
        var textEntryUrl = django_js_utils.urls.resolve("new-story-text");
        loadAndOpenNewTab(textEntryUrl, containerHeight, function() {
            $("div.new-entry input#title").val(newStory.title);
            var uploadUrl = "";
            uploadImage($("div.new-entry input#id_file")[0], function() {

            });
        });
    });
}

/**
 * Uploads an image and calls a callback
 */
function uploadImage(fileInput, url, callback) {
    var formData = new FormData();
    var file = fileInput.files[0];
    if (!file) {
        return;
    }
    formData.append("file", file);
    ajaxRequestWithCSRF(url, "POST", formData, callback);
}

/**
 * Makes an AJAX request to the given url with the given data,
 * calling the callback on success. The additional X-CSRFToken-Header will
 * be sent to ensure Cross Site Forgery Requests can not be done.
 * @param url
 * @param method
 * @param [data]
 * @param [callback]
 */
function ajaxRequestWithCSRF(url, method, data, callback) {
    var csrfToken = readCookie("csrftoken");
    $.ajax(url, {
        beforeSend: function(xhr) {
            if (!this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", csrfToken);
            }
        },
        data: data,
        type: method
    }).done(function(data) {
        callback !== undefined && callback(data);
    });
}

/**
 * $(document).ready
 *
 * initialize jQuery hooks
 */
$(function() {
    $("img.list-articles").click(toggleAllEntries);
    $("section#list-section div.close").click(function() {
        closeListBox(false);
        return false;
    });
    $("input#search-input").bind('input', createSearchTimeout);
    $("div.add-articles.mobile").click(function() {
        $(this).toggleClass("hover");
    });
    $("div.add-articles ul li").each(function(index, item) {
        var that = $(item);
        var mediaType = that.attr("id");
        var entryList = $("section#article-section div.entry-list ul");
        var jQueryEntryList = $("section#article-section div.entry-list");
        that.click(function() {
            var newEntryFormURL;
            var openFooterHeight;
            var onFinish;
            newEntryFormURL = django_js_utils.urls.resolve("new-story-location");
            openFooterHeight = footerHeight * 2;
            newEntryMode = true;
            onFinish = function(mediaType) {
                return function() {
                    loadTitleTab(mediaType);
                }
            }(mediaType);
            openArticleBox(openFooterHeight);
            $.get(newEntryFormURL, function (data) {
                userLocation.currentInfobox = "dummy";
                var listEntry = $("<li>");
                listEntry.html(data);
                entryList.html(listEntry);
                $("section#article-section div.close").show();
                jQueryEntryList.unslider();
                if (onFinish !== undefined) {
                    onFinish();
                }
            });
        });
    });
    channel = ($(window).width() < 768 ? "mobile" : "desktop");
    // only show overlay when cookie is not present
    if (readCookie(OVERLAY_COOKIE) === OVERLAY_COOKIE_HIDDEN) {
        // renew cookie
        setCookie(OVERLAY_COOKIE, OVERLAY_COOKIE_HIDDEN, 365);
    } else {
        showOverlay();
    }
    $("div.message div.close").click(closeAlertBox);
});