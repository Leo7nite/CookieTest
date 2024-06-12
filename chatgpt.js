/*!
 * Cookie GDPR protection script v2.0.0
 * Updated for 2024 Google Analytics Consent Mode
 * Original script by Stroka produkt d.o.o.
 * Updated by ChatGPT
 */

/***Master settings***/
var currentLoc = "sl-si", locFile, configFile, targetUrl = "", useCDN = true, localhost = false, allowCookieAnalytics = false, allowCookieSocial = false, allowCookieAdvertising = false, LoadCookieOnFirstLoad = false, portalId = "", cc_analytics = false, cc_social = false, cc_advertising = false, companyEmail = "", emailSubject = "", emailIntro = "", emailPersonName = "", emailEmailName = "", emailThankYou = "";
var azureBlobLink = "https://strokaprodcdnstorage.blob.core.windows.net/gdpr/";
var azureCDN = "https://cdn02.stroka.si/gdpr/";
/*main run window*/
if (window.addEventListener) { /*Others*/
    window.addEventListener('load', initGDPR, false);
}
else if (window.attachEvent) { /*Microsoft*/
    window.attachEvent('onload', initGDPR);
}
function initGDPR() {
    if (!window.jQuery && !jQuery.fn) {
        if (window.console)
            console.log('jQuery not available. Please include jQuery before use GDPR cookie module!');
    }
    else {
        cookieScriptLoadJavaScript(azureCDN + 'JavaScript/mustache.min.js', function () { RunMainScript(); });
    }
}

function RunMainScript() {
    /*main settings*/

    /*check if there are different portals. Then we need to call configuration file with portal parameter. Parameter is hidden input named: cc_portId*/
    if ($('input[name=cc_portId]').val() !== undefined && $('input[name=cc_portId]').val().length > 0)
        portalId = "-" + $('input[name=cc_portId]').val();
    /*load setting based by portalID*/
    var vParam = new Date().getTime();
    $.ajax({ url: "/cc_external" + portalId + ".json" + "?v=" + vParam, type: "get", async: false, success: function (data) { configFile = data; }, error: function () { } });
    /*language settings */
    if ($('html').attr('lang') !== undefined && $('html').attr('lang').length > 0)
        currentLoc = $('html').attr('lang').toLowerCase();
    useCDN = configFile.configuration.useCDN !== undefined ? configFile.configuration.useCDN : true;
    allowCookieAnalytics = configFile.configuration.allowCookieAnalytics !== undefined ? configFile.configuration.allowCookieAnalytics : false;
    allowCookieSocial = configFile.configuration.allowCookieSocial !== undefined ? configFile.configuration.allowCookieSocial : false;
    allowCookieAdvertising = configFile.configuration.allowCookieAdvertising !== undefined ? configFile.configuration.allowCookieAdvertising : false;
    LoadCookieOnFirstLoad = configFile.configuration.LoadCookieOnFirstLoad !== undefined ? configFile.configuration.LoadCookieOnFirstLoad : false;
    companyEmail = configFile.configuration.companyEmail !== undefined ? configFile.configuration.companyEmail : "";
    localhost = configFile.configuration.useLocalScript !== undefined ? configFile.configuration.useLocalScript : false;
    targetUrl = useCDN ? azureCDN : azureBlobLink;
    cc_analytics = getCookieValue("cc_analytics") === "0" ? false : true;
    cc_social = getCookieValue("cc_social") === "0" ? false : true;
    cc_advertising = getCookieValue("cc_advertising") === "0" ? false : true;
    cc_savedOption = getCookieValue("cc_fs") === "1" ? true : false;
    if (localhost)
        targetUrl = ""
    /*load css files */
    dynamicallyLoadCSS(targetUrl + "css/style-gdpr.css");
    if (configFile !== undefined && configFile.configuration.enabled) {
        /*load resources*/
        $.ajax({
            url: targetUrl + "localization/resource_" + currentLoc + ".json", type: "get", async: false, success: function (data) { locFile = data; },
            error: function () {
                if (window.console)
                    console.log('Cookie resource file ' + targetUrl + 'localization/resource_' + currentLoc + '.json' + ' does not exist. Please place the correct resource file on CDN.')
            }
        });
        /*render template*/
        $.ajax({
            url: targetUrl + "cookie-template.html", type: "get", async: false,
            success: function (data) {
                var cContent = Mustache.render(data, locFile);
                var $cContent = $('<div />', { html: cContent });
                if (cc_savedOption) {
                    $cContent.find('.gdpr-disclaimer').attr("style", "display:none");
                    $cContent.find('.gdpr-button').attr("style", "display:block");
                }
                /*not optimal part! setTimeout*/
                setTimeout(function () {
                    $("body").append($cContent);
                    loadExtScripts(configFile);
                    if (cc_analytics || (cc_savedOption === false && allowCookieAnalytics === true)) {
                        $('.gdpr-option.go-2 .gdpr-select[data-type="analytics"]').addClass("gdpr-cookieAccepted");
                        $('.gqs-cookie-opt[data-type="analytics"]').addClass("gdpr-cookieAccepted");
                    }
                    if (cc_social || (cc_savedOption === false && allowCookieSocial === true)) {
                        $('.gdpr-option.go-2 .gdpr-select[data-type="social"]').addClass("gdpr-cookieAccepted");
                        $('.gqs-cookie-opt[data-type="social"]').addClass("gdpr-cookieAccepted");
                    }
                    if (cc_advertising || (cc_savedOption === false && allowCookieAdvertising === true)) {
                        $('.gdpr-option.go-2 .gdpr-select[data-type="advertising"]').addClass("gdpr-cookieAccepted");
                        $('.gqs-cookie-opt[data-type="advertising"]').addClass("gdpr-cookieAccepted");
                    }
                    if (cc_analytics && cc_social && cc_advertising)
                        $('.gdpr-opt-selection.opt-in-out').addClass("activated");
                    /*link to cookies details page, setting on bottom line*/
                    $("#gdpr-link-privacy").attr("href", configFile.configuration.PrivacyLink);
                    $("#gdpr-link-cookie-page").attr("href", configFile.configuration.CookieLink);
                }, 200);
            },
            error: function () { }
        });
    }
    if (typeof $(document).on === "function") { /*for jQuery, newer of 1.7+*/
        $("body").on("click", ".gb-save", function () {
            $('.gdpr-option.go-2 .gdpr-select').each(function (i, v) {
                var accept = $(this).hasClass("gdpr-cookieAccepted");
                var type = $(this).attr("data-type");
                var _action = (accept === true) ? 1 : 0;
                setCookie("cc_" + type, _action, 365);
                setCookie("cc_fs", "1", 365);
                location.reload(true);
            });
        });
        $("body").on("click", ".gdpr-button, .gdpr_openCookieSetting", function () {
            if (!$(".gdpr-content").hasClass("activate")) {
                $('.gdpr-disclaimer').fadeOut();
                $('.gdpr-button').fadeIn(800);
                $(this).stop().toggleClass('activate');
                $('.gdpr-content').stop().toggleClass('activate');
            }
        });
        $("body").on("click", "#gdpr-opt-2", function () {
            $(this).toggleClass('activated');
            /*toggle on all marks*/
            if ($(this).hasClass('activated')) {
                $('.gdpr-option.go-2 .gdpr-select').removeClass('gdpr-cookieAccepted').addClass('gdpr-cookieAccepted');
                $('.gdpr-quick-setting ul > li.gqs-cookie-opt:not(.gqs-1)').each(function (i, v) { /*reflect the same to banner*/
                    $(v).removeClass('gdpr-cookieAccepted').addClass('gdpr-cookieAccepted');
                });
            }
            else {
                $('.gdpr-option.go-2 .gdpr-select').removeClass("gdpr-cookieAccepted");
                $('.gdpr-quick-setting ul > li.gqs-cookie-opt.gdpr-cookieAccepted').removeClass("gdpr-cookieAccepted");
            }
        });
        $("body").on("click", ".gdpr-option.go-2 ul > li", function () {
            $(this).toggleClass('gdpr-cookieAccepted');
            /*Change setting in detail form*/
            var dType = $(this).attr('data-type');
            $('.gqs-cookie-opt[data-type=' + dType + ']').removeClass("gdpr-cookieAccepted").addClass("gdpr-cookieAccepted");
            if (!$(this).hasClass('gdpr-cookieAccepted')) {
                $('.gqs-cookie-opt[data-type=' + dType + ']').removeClass("gdpr-cookieAccepted");
            }
            if ($('.gdpr-option.go-2 ul > li.gdpr-cookieAccepted').length === $('.gdpr-option.go-2 ul > li').length) {
                $('#gdpr-opt-2').addClass('activated');
            }
            else {
                $('#gdpr-opt-2').removeClass('activated');
            }
        });
        $("body").on("click", ".gqs-cookie-opt", function () {
            $(this).toggleClass('gdpr-cookieAccepted');
            var dType = $(this).attr('data-type');
            $('.gdpr-option.go-2 ul > li[data-type=' + dType + ']').removeClass("gdpr-cookieAccepted").addClass("gdpr-cookieAccepted");
            if (!$(this).hasClass('gdpr-cookieAccepted')) {
                $('.gdpr-option.go-2 ul > li[data-type=' + dType + ']').removeClass("gdpr-cookieAccepted");
            }
            if ($('.gdpr-quick-setting ul > li.gdpr-cookieAccepted').length === $('.gdpr-quick-setting ul > li').length - 1) {
                $('#gdpr-opt-2').addClass('activated');
            }
            else {
                $('#gdpr-opt-2').removeClass('activated');
            }
        });
    }
    else { /*for older versions of jQuery*/
        $("body").delegate(".gb-save", "click", function () {
            $('.gdpr-option.go-2 .gdpr-select').each(function (i, v) {
                var accept = $(this).hasClass("gdpr-cookieAccepted");
                var type = $(this).attr("data-type");
                var _action = (accept === true) ? 1 : 0;
                setCookie("cc_" + type, _action, 365);
                setCookie("cc_fs", "1", 365);
                location.reload(true);
            });
        });
        $("body").delegate(".gdpr-button, .gdpr_openCookieSetting", "click", function () {
            if (!$(".gdpr-content").hasClass("activate")) {
                $('.gdpr-disclaimer').fadeOut();
                $('.gdpr-button').fadeIn(800);
                $(this).stop().toggleClass('activate');
                $('.gdpr-content').stop().toggleClass('activate');
            }
        });
        $("body").delegate("#gdpr-opt-2", "click", function () {
            $(this).toggleClass('activated');
            /*toggle on all marks*/
            if ($(this).hasClass('activated')) {
                $('.gdpr-option.go-2 .gdpr-select').removeClass('gdpr-cookieAccepted').addClass('gdpr-cookieAccepted');
                $('.gdpr-quick-setting ul > li.gqs-cookie-opt:not(.gqs-1)').each(function (i, v) { /*reflect the same to banner*/
                    $(v).removeClass('gdpr-cookieAccepted').addClass('gdpr-cookieAccepted');
                });
            }
            else {
                $('.gdpr-option.go-2 .gdpr-select').removeClass("gdpr-cookieAccepted");
                $('.gdpr-quick-setting ul > li.gqs-cookie-opt.gdpr-cookieAccepted').removeClass("gdpr-cookieAccepted");
            }
        });
        $("body").delegate(".gdpr-option.go-2 ul > li", "click", function () {
            $(this).toggleClass('gdpr-cookieAccepted');
            /*Change setting in detail form*/
            var dType = $(this).attr('data-type');
            $('.gqs-cookie-opt[data-type=' + dType + ']').removeClass("gdpr-cookieAccepted").addClass("gdpr-cookieAccepted");
            if (!$(this).hasClass('gdpr-cookieAccepted')) {
                $('.gqs-cookie-opt[data-type=' + dType + ']').removeClass("gdpr-cookieAccepted");
            }
            if ($('.gdpr-option.go-2 ul > li.gdpr-cookieAccepted').length === $('.gdpr-option.go-2 ul > li').length) {
                $('#gdpr-opt-2').addClass('activated');
            }
            else {
                $('#gdpr-opt-2').removeClass('activated');
            }
        });
        $("body").delegate(".gqs-cookie-opt", "click", function () {
            $(this).toggleClass('gdpr-cookieAccepted');
            var dType = $(this).attr('data-type');
            $('.gdpr-option.go-2 ul > li[data-type=' + dType + ']').removeClass("gdpr-cookieAccepted").addClass("gdpr-cookieAccepted");
            if (!$(this).hasClass('gdpr-cookieAccepted')) {
                $('.gdpr-option.go-2 ul > li[data-type=' + dType + ']').removeClass("gdpr-cookieAccepted");
            }
            if ($('.gdpr-quick-setting ul > li.gdpr-cookieAccepted').length === $('.gdpr-quick-setting ul > li').length - 1) {
                $('#gdpr-opt-2').addClass('activated');
            }
            else {
                $('#gdpr-opt-2').removeClass('activated');
            }
        });
    }
}

function loadExtScripts(configFile) {
    if (cc_savedOption === false) {
        /*social*/
        if (cc_social === false && allowCookieSocial === false) {
            $('.ext-code[data-type="social"]').html("");
        }
        if (cc_social === false && allowCookieSocial === true && LoadCookieOnFirstLoad === true) {
            var ccLinks = "";
            $('.ext-code[data-type="social"]').each(function (i, v) {
                var ccType = $(this).attr("data-subtype");
                if (ccType === "iframe")
                    ccLinks += "<iframe src='" + $(this).attr("data-link") + "' width='" + $(this).attr("data-width") + "' height='" + $(this).attr("data-height") + "' frameborder='0' scrolling='no'></iframe>";
                if (ccType === "javascript") {
                    cookieScriptLoadJavaScript($(this).attr("data-link"), null);
                }
                $(this).html(ccLinks);
            });
        }
        if (cc_social === true) {
            var ccLinks = "";
            $('.ext-code[data-type="social"]').each(function (i, v) {
                var ccType = $(this).attr("data-subtype");
                if (ccType === "iframe")
                    ccLinks += "<iframe src='" + $(this).attr("data-link") + "' width='" + $(this).attr("data-width") + "' height='" + $(this).attr("data-height") + "' frameborder='0' scrolling='no'></iframe>";
                if (ccType === "javascript") {
                    cookieScriptLoadJavaScript($(this).attr("data-link"), null);
                }
                $(this).html(ccLinks);
            });
        }
        /*advertising*/
        if (cc_advertising === false && allowCookieAdvertising === false) {
            $('.ext-code[data-type="advertising"]').html("");
        }
        if (cc_advertising === false && allowCookieAdvertising === true && LoadCookieOnFirstLoad === true) {
            var ccLinks = "";
            $('.ext-code[data-type="advertising"]').each(function (i, v) {
                var ccType = $(this).attr("data-subtype");
                if (ccType === "iframe")
                    ccLinks += "<iframe src='" + $(this).attr("data-link") + "' width='" + $(this).attr("data-width") + "' height='" + $(this).attr("data-height") + "' frameborder='0' scrolling='no'></iframe>";
                if (ccType === "javascript") {
                    cookieScriptLoadJavaScript($(this).attr("data-link"), null);
                }
                $(this).html(ccLinks);
            });
        }
        if (cc_advertising === true) {
            var ccLinks = "";
            $('.ext-code[data-type="advertising"]').each(function (i, v) {
                var ccType = $(this).attr("data-subtype");
                if (ccType === "iframe")
                    ccLinks += "<iframe src='" + $(this).attr("data-link") + "' width='" + $(this).attr("data-width") + "' height='" + $(this).attr("data-height") + "' frameborder='0' scrolling='no'></iframe>";
                if (ccType === "javascript") {
                    cookieScriptLoadJavaScript($(this).attr("data-link"), null);
                }
                $(this).html(ccLinks);
            });
        }
        /*analytics*/
        if (cc_analytics === false && allowCookieAnalytics === false) {
            $('.ext-code[data-type="analytics"]').html("");
        }
        if (cc_analytics === false && allowCookieAnalytics === true && LoadCookieOnFirstLoad === true) {
            var ccLinks = "";
            $('.ext-code[data-type="analytics"]').each(function (i, v) {
                var ccType = $(this).attr("data-subtype");
                if (ccType === "iframe")
                    ccLinks += "<iframe src='" + $(this).attr("data-link") + "' width='" + $(this).attr("data-width") + "' height='" + $(this).attr("data-height") + "' frameborder='0' scrolling='no'></iframe>";
                if (ccType === "javascript") {
                    cookieScriptLoadJavaScript($(this).attr("data-link"), null);
                }
                $(this).html(ccLinks);
            });
        }
        if (cc_analytics === true) {
            var ccLinks = "";
            $('.ext-code[data-type="analytics"]').each(function (i, v) {
                var ccType = $(this).attr("data-subtype");
                if (ccType === "iframe")
                    ccLinks += "<iframe src='" + $(this).attr("data-link") + "' width='" + $(this).attr("data-width") + "' height='" + $(this).attr("data-height") + "' frameborder='0' scrolling='no'></iframe>";
                if (ccType === "javascript") {
                    cookieScriptLoadJavaScript($(this).attr("data-link"), null);
                }
                $(this).html(ccLinks);
            });
        }
    }
    if (cc_savedOption === true) {
        /*social*/
        if (cc_social === true) {
            var ccLinks = "";
            $('.ext-code[data-type="social"]').each(function (i, v) {
                var ccType = $(this).attr("data-subtype");
                if (ccType === "iframe")
                    ccLinks += "<iframe src='" + $(this).attr("data-link") + "' width='" + $(this).attr("data-width") + "' height='" + $(this).attr("data-height") + "' frameborder='0' scrolling='no'></iframe>";
                if (ccType === "javascript") {
                    cookieScriptLoadJavaScript($(this).attr("data-link"), null);
                }
                $(this).html(ccLinks);
            });
        }
        else {
            $('.ext-code[data-type="social"]').html("");
        }
        /*advertising*/
        if (cc_advertising === true) {
            var ccLinks = "";
            $('.ext-code[data-type="advertising"]').each(function (i, v) {
                var ccType = $(this).attr("data-subtype");
                if (ccType === "iframe")
                    ccLinks += "<iframe src='" + $(this).attr("data-link") + "' width='" + $(this).attr("data-width") + "' height='" + $(this).attr("data-height") + "' frameborder='0' scrolling='no'></iframe>";
                if (ccType === "javascript") {
                    cookieScriptLoadJavaScript($(this).attr("data-link"), null);
                }
                $(this).html(ccLinks);
            });
        }
        else {
            $('.ext-code[data-type="advertising"]').html("");
        }
        /*analytics*/
        if (cc_analytics === true) {
            var ccLinks = "";
            $('.ext-code[data-type="analytics"]').each(function (i, v) {
                var ccType = $(this).attr("data-subtype");
                if (ccType === "iframe")
                    ccLinks += "<iframe src='" + $(this).attr("data-link") + "' width='" + $(this).attr("data-width") + "' height='" + $(this).attr("data-height") + "' frameborder='0' scrolling='no'></iframe>";
                if (ccType === "javascript") {
                    cookieScriptLoadJavaScript($(this).attr("data-link"), null);
                }
                $(this).html(ccLinks);
            });
        }
        else {
            $('.ext-code[data-type="analytics"]').html("");
        }
    }
}

/* Cookie Management Functions */
function setCookie(c_name, value, exdays) {
    var exdate = new Date();
    exdate.setDate(exdate.getDate() + exdays);
    var c_value = encodeURIComponent(value) + ((exdays === null) ? "" : "; expires=" + exdate.toUTCString());
    document.cookie = c_name + "=" + c_value + "; path=/";
}
function getCookieValue(name) {
    var nameEQ = encodeURIComponent(name) + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
    return null;
}

/* External Script Loading Function */
function cookieScriptLoadJavaScript(url, callback) {
    var script = document.createElement("script");
    script.type = "text/javascript";
    if (script.readyState) {  //IE
        script.onreadystatechange = function () {
            if (script.readyState === "loaded" || script.readyState === "complete") {
                script.onreadystatechange = null;
                if (callback) callback();
            }
        };
    } else {  //Others
        script.onload = function () {
            if (callback) callback();
        };
    }
    script.src = url;
    document.getElementsByTagName("head")[0].appendChild(script);
}

/* Load Google Analytics based on user consent */
function loadGoogleAnalytics() {
    // Get consent values
    const analyticsConsent = getCookieValue("cc_analytics") === "1";
    const advertisingConsent = getCookieValue("cc_advertising") === "1";

    // Initialize Google Analytics with Consent Mode
    window.dataLayer = window.dataLayer || [];
    function gtag() {
        dataLayer.push(arguments);
    }

    gtag('consent', 'default', {
        'ad_storage': advertisingConsent ? 'granted' : 'denied',
        'analytics_storage': analyticsConsent ? 'granted' : 'denied'
    });

    // Load the gtag.js script
    cookieScriptLoadJavaScript('https://www.googletagmanager.com/gtag/js?id=G-9D3DBN91CX', function() {
        gtag('js', new Date());
        gtag('config', 'G-9D3DBN91CX');
    });
}

// Load Google Analytics if user has consented
if (getCookieValue("cc_fs") === "1") {
    loadGoogleAnalytics();
}
