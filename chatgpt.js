$(document).ready(function() {
    console.log("Document ready");

    const gdprContent = $('.gdpr-content');
    const gdprButton = $('.gdpr-button');
    const gdprDisclaimer = $('.gdpr-disclaimer');
    const gdprOptions = $('.gdpr-option .gdpr-select');
    const saveButton = $('.gb-save');

    let consent = {
      analytics: false,
      advertising: false
    };

    function setCookie(c_name, value, exdays) {
        var exdate = new Date();
        exdate.setDate(exdate.getDate() + exdays);
        var c_value = encodeURIComponent(value) + 
                      ((exdays === null) ? "" : "; expires=" + exdate.toUTCString()) + 
                      "; path=/; domain=" + window.location.hostname + 
                      "; SameSite=None; Secure";
        document.cookie = c_name + "=" + c_value;
        console.log(`Cookie set: ${c_name}=${value}; expires=${exdate.toUTCString()}`);
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

    function cookieScriptLoadJavaScript(url, callback) {
        var script = document.createElement("script");
        script.type = "text/javascript";
        if (script.readyState) {  // IE
            script.onreadystatechange = function () {
                if (script.readyState === "loaded" || script.readyState === "complete") {
                    script.onreadystatechange = null;
                    if (callback) callback();
                }
            };
        } else {  // Others
            script.onload = function () {
                if (callback) callback();
            };
        }
        script.src = url;
        document.getElementsByTagName("head")[0].appendChild(script);
        console.log(`Script loaded: ${url}`);
    }

    function loadGoogleAnalytics() {
        // Get consent values
        const analyticsConsent = getCookieValue("cc_analytics") === "1";
        const advertisingConsent = getCookieValue("cc_advertising") === "1";

        console.log(`Analytics consent: ${analyticsConsent}, Advertising consent: ${advertisingConsent}`);

        if (analyticsConsent || advertisingConsent) {
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
                gtag('config', 'G-9D3DBN91CX', {
                    'anonymize_ip': true
                });
                console.log("Google Analytics initialized");
            });
        }
    }

    function saveConsent() {
        console.log("Saving consent:", consent);
    
        // Update cookies based on consent
        setCookie("cc_analytics", consent.analytics ? "1" : "0", 365);
        setCookie("cc_advertising", consent.advertising ? "1" : "0", 365);
    
        // Delete Google Analytics cookies if analytics consent is denied
        if (!consent.analytics) {
            // Get all cookies
            var cookies = document.cookie.split(';');
    
            // Loop through cookies
            cookies.forEach(function(cookie) {
                var trimmedCookie = cookie.trim();
                // Check if cookie starts with '_ga'
                if (trimmedCookie.startsWith('_ga')) {
                    // Extract cookie name
                    var cookieName = trimmedCookie.split('=')[0];
                    // Delete cookie
                    setCookie(cookieName, "", -1); // Set expiry in the past to delete cookie
                }
            });
    
            // Remove consent from local storage
            localStorage.removeItem('gdprConsent');
        }
    
        // Delete advertising cookie if advertising consent is denied
        if (!consent.advertising) {
            setCookie("cc_advertising", "", -1); // Set expiry in the past to delete cookie
            localStorage.removeItem('gdprConsent');
        }
    
        // Update UI and load Google Analytics if necessary
        gdprContent.hide();
        gdprDisclaimer.hide();
        loadGoogleAnalytics();
    
        // Add the dataLayer.push code here
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
            'event': 'consent_saved',
            'consent': consent
        });
    }
    
    

    function loadConsent() {
        console.log("Loading consent from local storage");
        const savedConsent = localStorage.getItem('gdprConsent');
        if (savedConsent) {
            consent = JSON.parse(savedConsent);
            console.log("Consent loaded:", consent);
            if (consent.analytics || consent.advertising) {
                gdprDisclaimer.hide();
            }
            // Update checkboxes based on consent
            if (consent.analytics) {
                $('#analytics').prop('checked', true);
                $('.gdpr-option[data-type="analytics"]').addClass('selected');
            }
            if (consent.advertising) {
                $('#advertising').prop('checked', true);
                $('.gdpr-option[data-type="advertising"]').addClass('selected');
            }
            loadGoogleAnalytics();
        } else {
            console.log("No saved consent found");
            gdprContent.show();
        }
    }

    gdprButton.on('click', function() {
        console.log("GDPR button clicked");
        gdprContent.toggle();
    });

    gdprOptions.on('click', function() {
        const type = $(this).data('type');
        if (type === 'analytics') {
            consent.analytics = !consent.analytics;
        } else if (type === 'advertising') {
            consent.advertising = !consent.advertising;
        }
        $(this).toggleClass('selected');
        console.log("Toggled consent for:", type, consent[type]);
    });

    saveButton.on('click', function() {
        console.log("Save button clicked");
        saveConsent();
    });

    // Add additional dataLayer.push calls here
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
        'event': 'pageview',
        'pagePath': window.location.pathname,
        'pageTitle': document.title
    });

    // Scroll event
    $(window).on('scroll', function() {
        window.dataLayer.push({
            'event': 'scroll',
            'scrollPosition': window.scrollY
        });
    });

    // Click event
    $(document).on('click', function(event) {
        window.dataLayer.push({
            'event': 'click',
            'element': event.target
        });
    });

    // Form submission event
    $('form').on('submit', function(event) {
        const formName = $(this).attr('name');
        const formData = $(this).serializeArray().reduce(function(obj, item) {
            obj[item.name] = item.value;
            return obj;
        }, {});

        window.dataLayer.push({
            'event': 'formSubmission',
            'formName': formName,
            'formData': formData
        });

        console.log("Form submission event pushed:", formName, formData);
    });

    // Search query event
    $('#searchInput').on('change', function() {
        const searchTerm = $(this).val();
        window.dataLayer.push({
            'event': 'searchQuery',
            'searchTerm': searchTerm
        });
    });

    // Video play event
    $('#myVideo').on('play', function() {
        window.dataLayer.push({
            'event': 'videoPlay',
            'videoId': 'myVideo'
        });
    });

    // Custom event example
    // function triggerCustomEvent() {
    //     window.dataLayer.push({
    //         'event': 'myCustomEvent',
    //         'customData': {
    //             'field1': 'value1',
    //             'field2': 'value2'
    //         }
    //     });
    // }

    loadConsent();
});
