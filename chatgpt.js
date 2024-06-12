/*!
 * Cookie GDPR protection script v1.0.13
 * Date: 2018-05-25 11:17
 * v1.0.13: AndrejF, FIX default loading social or advertising cookies
 * v1.0.12: TineH, added uncache for .json config
 * v1.0.11: TineH, legacy jquery <1.7 live clicking events fix
 * v1.0.10: TineH, delete data e-mail localization
 * v1.0.9: AndrejF, add id to script block
 * v1.0.8: AndrejF, add mailto click functionality on cookies page.: line 169. Add new setting companyEmail
 * v1.0.7: TineH, url fix, line: 35
 * v1.0.6: TineH added split link for cookie and privacy pages.
  * Copyright 2018, Stroka produkt d.o.o.
 */
/***Master settings***/
var currentLoc = "sl-si", locFile, configFile, targetUrl = "", useCDN = true, localhost = false, allowCookieAnalytics = false, allowCookieSocial=false, allowCookieAdvertising=false, LoadCookieOnFirstLoad = false, portalId = "", cc_analytics = false, cc_social = false, cc_advertising = false, companyEmail ="", emailSubject="", emailIntro="", emailPersonName="",emailEmailName="", emailThankYou="";
var azureBlobLink = "https://strokaprodcdnstorage.blob.core.windows.net/gdpr/";
var azureCDN = "https://cdn02.stroka.si/gdpr/";
/*main run window*/
if (window.addEventListener) {/*Others*/
	window.addEventListener('load', initGDPR, false);
} 
else if (window.attachEvent) {/*Microsoft*/
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
                if(window.console) 
					console.log('Cookie resource file ' + targetUrl + 'localization/resource_' + currentLoc + '.json' + ' does not exists. Please place the correct resource file on CDN.')
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
					/*link to cookies details page, setting on bootom line*/
                    $("#gdpr-link-privacy").attr("href", configFile.configuration.PrivacyLink);
					$("#gdpr-link-cookie-page").attr("href", configFile.configuration.CookieLink);
                }, 200);
            },
            error: function () { }
        });    
    }
	if (typeof $(document).on === "function") { /*for jquery, newer of 1.7+*/
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
			/*toogle on all marks*/
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
			if ($(this).hasClass('gdpr-cookieAccepted'))
				$('.gdpr-quick-setting .gqs-cookie-opt[data-type="' + dType + '"]').addClass("gdpr-cookieAccepted");
			else
				$('.gdpr-quick-setting .gqs-cookie-opt[data-type="' + dType + '"]').removeClass("gdpr-cookieAccepted");
			/*mark all accepted if user selects all*/
			if ($('.gdpr-option.go-2 .gdpr-select.gdpr-cookieAccepted').length === 3)
				$('.gdpr-opt-selection.opt-in-out').addClass("activated");
			else
				$('.gdpr-opt-selection.opt-in-out').removeClass("activated");
		});
		$("body").on("click", ".gdpr-quick-setting ul > li.gqs-cookie-opt:not(.gqs-1)", function () {
			$(this).toggleClass('gdpr-cookieAccepted');
			var dType = $(this).attr('data-type');
			/*Change setting in detail form*/
			if ($(this).hasClass('gdpr-cookieAccepted'))
				$('.gdpr-option.go-2 .gdpr-select[data-type="' + dType + '"]').addClass("gdpr-cookieAccepted")
			else
				$('.gdpr-option.go-2 .gdpr-select[data-type="' + dType + '"]').removeClass("gdpr-cookieAccepted")
			/*mark all accepted if user selects all*/
			if ($('.gdpr-option.go-2 .gdpr-select.gdpr-cookieAccepted').length === 3)
				$('.gdpr-opt-selection.opt-in-out').addClass("activated");
			else
				$('.gdpr-opt-selection.opt-in-out').removeClass("activated");
		});
		$("body").on("click", ".gb-close", function () {        
			$('.gdpr-content').stop().toggleClass('activate')
			if (!cc_savedOption) {
				$('.gdpr-disclaimer').fadeIn();
				$('.gdpr-button').fadeOut();
			}
		});
		
		if (locFile !== undefined) {
			emailSubject=locFile.crDeleteDataEmailSubject !== undefined ? locFile.crDeleteDataEmailSubject : "Zahteva za izbris osebnih podatkov na strani: ";
			emailIntro=locFile.crDeleteDataEmailIntro !== undefined ? locFile.crDeleteDataEmailIntro : "Pozdravljeni!%0D%0DZahtevam, da iz vaše spletne baze odstranite moje osebne podatke v skladu z uredbo GDPR.%0D%0D";
			emailThankYou=locFile.crDeleteDataEmailThankYou !== undefined ? locFile.crDeleteDataEmailThankYou : "%0D%0D%0DHvala in lep pozdrav.";
		}
		else {
			emailSubject="Zahteva za izbris osebnih podatkov na strani: ";
			emailIntro="Pozdravljeni!%0D%0DZahtevam, da iz vaše spletne baze odstranite moje osebne podatke v skladu z uredbo GDPR.%0D%0D";
			emailThankYou="%0D%0D%0DHvala in lep pozdrav.";
		}
		$("body").on("click", ".gdprForm .generateEmail", function (e) {        
				e.preventDefault();
				var customerEmail = companyEmail;
				var subject = emailSubject + window.location.hostname;
				var emFBody = "";
				$(".gdprForm input[type='text']").each(function(i, v) {
					emFBody += $(v).attr("data-displayName") + ": " + $.trim($(v).val()) + "%0D"
				});
				window.location = 'mailto:' + customerEmail + 
					'?subject=' + subject +
					'&body=' + emailIntro +
					emFBody +
					emailThankYou;
				return false;
		});
	}
	else {
		$(".gb-save").live("click", function () {
			$('.gdpr-option.go-2 .gdpr-select').each(function (i, v) {
				var accept = $(this).hasClass("gdpr-cookieAccepted");
				var type = $(this).attr("data-type");
				var _action = (accept === true) ? 1 : 0;
				setCookie("cc_" + type, _action, 365);
				setCookie("cc_fs", "1", 365);
				location.reload(true);
			});
		});
		$(".gdpr-button, .gdpr_openCookieSetting").live("click", function () {
			if (!$(".gdpr-content").hasClass("activate")) {
				$('.gdpr-disclaimer').fadeOut();
				$('.gdpr-button').fadeIn(800);
				$(this).stop().toggleClass('activate');
				$('.gdpr-content').stop().toggleClass('activate');
			}
		});
		$("#gdpr-opt-2").live("click", function () {
			$(this).toggleClass('activated');
			/*toogle on all marks*/
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
		$(".gdpr-option.go-2 ul > li").live("click", function () {
			$(this).toggleClass('gdpr-cookieAccepted');
			/*Change setting in detail form*/
			var dType = $(this).attr('data-type');
			if ($(this).hasClass('gdpr-cookieAccepted'))
				$('.gdpr-quick-setting .gqs-cookie-opt[data-type="' + dType + '"]').addClass("gdpr-cookieAccepted");
			else
				$('.gdpr-quick-setting .gqs-cookie-opt[data-type="' + dType + '"]').removeClass("gdpr-cookieAccepted");
			/*mark all accepted if user selects all*/
			if ($('.gdpr-option.go-2 .gdpr-select.gdpr-cookieAccepted').length === 3)
				$('.gdpr-opt-selection.opt-in-out').addClass("activated");
			else
				$('.gdpr-opt-selection.opt-in-out').removeClass("activated");
		});
		$(".gdpr-quick-setting ul > li.gqs-cookie-opt:not(.gqs-1)").live("click", function () {
			$(this).toggleClass('gdpr-cookieAccepted');
			var dType = $(this).attr('data-type');
			/*Change setting in detail form*/
			if ($(this).hasClass('gdpr-cookieAccepted'))
				$('.gdpr-option.go-2 .gdpr-select[data-type="' + dType + '"]').addClass("gdpr-cookieAccepted")
			else
				$('.gdpr-option.go-2 .gdpr-select[data-type="' + dType + '"]').removeClass("gdpr-cookieAccepted")
			/*mark all accepted if user selects all*/
			if ($('.gdpr-option.go-2 .gdpr-select.gdpr-cookieAccepted').length === 3)
				$('.gdpr-opt-selection.opt-in-out').addClass("activated");
			else
				$('.gdpr-opt-selection.opt-in-out').removeClass("activated");
		});
		$(".gb-close").live("click", function () {        
			$('.gdpr-content').stop().toggleClass('activate')
			if (!cc_savedOption) {
				$('.gdpr-disclaimer').fadeIn();
				$('.gdpr-button').fadeOut();
			}
		});
		
		if (locFile !== undefined) {
			emailSubject=locFile.crDeleteDataEmailSubject !== undefined ? locFile.crDeleteDataEmailSubject : "Zahteva za izbris osebnih podatkov na strani: ";
			emailIntro=locFile.crDeleteDataEmailIntro !== undefined ? locFile.crDeleteDataEmailIntro : "Pozdravljeni!%0D%0DZahtevam, da iz vaše spletne baze odstranite moje osebne podatke v skladu z uredbo GDPR.%0D%0D";
			emailThankYou=locFile.crDeleteDataEmailThankYou !== undefined ? locFile.crDeleteDataEmailThankYou : "%0D%0D%0DHvala in lep pozdrav.";
		}
		else {
			emailSubject="Zahteva za izbris osebnih podatkov na strani: ";
			emailIntro="Pozdravljeni!%0D%0DZahtevam, da iz vaše spletne baze odstranite moje osebne podatke v skladu z uredbo GDPR.%0D%0D";
			emailThankYou="%0D%0D%0DHvala in lep pozdrav.";
		}
		$(".gdprForm .generateEmail").live("click", function (e) {        
				e.preventDefault();
				var customerEmail = companyEmail;
				var subject = emailSubject + window.location.hostname;
				var emFBody = "";
				$(".gdprForm input[type='text']").each(function(i, v) {
					emFBody += $(v).attr("data-displayName") + ": " + $.trim($(v).val()) + "%0D"
				});
				window.location = 'mailto:' + customerEmail + 
					'?subject=' + subject +
					'&body=' + emailIntro +
					emFBody +
					emailThankYou;
				return false;
		});
	}
}

/*load external javascript files...input is config json*/
function loadExtScripts(extScriptJson) {
    $.each(extScriptJson.scripts, function (key, val) {
        if (val.active === 1) {
            /*get cookie*/
            if (getCookieValue("cc_" + val.group) === "1" || (getCookieValue("cc_" + val.group) === "0" && LoadCookieOnFirstLoad && cc_savedOption === false))
            {
                dynamicallyLoadScript(val.srcUrl.replace('{{{uniqueId}}}', val.uniqueId), val.scriptTitle.replace(/\s/g,''));
				dynamicallyExecuteScript(val.code.replace('{{{uniqueId}}}', val.uniqueId), val.group, val.scriptTitle.replace(/\s/g,''));
				window['ga-disable-' + val.uniqueId] = false;
				window['gat-disable-' + val.uniqueId] = false;
            }
            else
            {
                /*delete cookies for google*/
                if (startsWith(val.scriptTitle, "GA")) {
                    window['ga-disable-' + val.uniqueId] = true;
                    window['gat-disable-' + val.uniqueId] = true;
                    deleteCookies(getCookieSW("_ga"))
                    deleteCookies(getCookieSW("_gid"))
                    deleteCookies(getCookieSW("_gat"))
                    deleteCookies(getCookieSW("__utm"))
                    deleteCookies(getCookieSW("__atuvs"))
                    
                }
                /*delete all cookie from script which is not enabled */
                $.each(val.cookies, function (i, cookie) {
                    deleteCookie(cookie.name)
                });
            }
        }
    });
}

/*cookies*/
function getCookieValue(e) { for (var t = e + "=", n = document.cookie.split(";"), r = 0; r < n.length; r++) { for (var o = n[r]; " " == o.charAt(0);)o = o.substring(1); if (0 == o.indexOf(t)) return o.substring(t.length, o.length) } return setCookie(e, "0", 365), "0" }
function getCookieSW(t) { return document.cookie.split(";").filter(function (i) { return 0 === i.trim().indexOf(t) }).map(function (t) { return t.trim().split("=")[0] }) }
function deleteCookie(e) { document.cookie = e + "=;expires=Thu, 01-Jan-1970 00:00:01 GMT;", document.cookie = e + "=;path=/;expires=Thu, 01-Jan-1970 00:00:01 GMT;"; for (var o = location.hostname.split("."); o.length;) { var i = o.join("."); document.cookie = e + "=;expires=Thu, 01-Jan-1970 00:00:01 GMT;domain=" + i, document.cookie = e + "=;path=/;expires=Thu, 01-Jan-1970 00:00:01 GMT;domain=" + i, document.cookie = e + "=;expires=Thu, 01-Jan-1970 00:00:01 GMT;domain=." + i, document.cookie = e + "=;path=/;expires=Thu, 01-Jan-1970 00:00:01 GMT;domain=." + i, o.shift() } }
function setCookie(e, t, n) { var r = new Date; r.setDate(r.getDate() + n); var i = escape(t) + (n == null ? "" : "; path=/; expires=" + r.toUTCString()); document.cookie = e + "=" + i }
// function deleteCookies(e) { $.each(e, function (e, o) { deleteCookie(o) }) }
function deleteCookies(e) {
    $.each(e, function (e, o) {
        if (o.startsWith("_ga") || o.startsWith("_gid")) {
            deleteCookie(o);
        }
    });
}
/*dynamicallsy execute javascript code, load script and css */
//function dynamicallyExecuteScript(e,i,t) { var t = document.createElement("script"), c = document.createTextNode(e); t.type = "text/javascript"; t.setAttribute("data-id-group", i);t.setAttribute("id", "_code_"+t); t.appendChild(c); document.head.appendChild(t) }
function dynamicallyExecuteScript(e, i, t) {
    var t = document.createElement("script"),
        c = document.createTextNode(e);
    t.type = "text/javascript";
    t.setAttribute("data-id-group", i);
    t.setAttribute("id", "_code_" + t);
    t.appendChild(c);
    document.head.appendChild(t);

    // Disable GA4 tracking
    var gaMeasurementId = 'G-9D3DBN91CX'; // Replace XXXXXXXXX with your GA4 measurement ID
    window['ga-disable-' + gaMeasurementId] = true;
}

function dynamicallyLoadScript(c,t) { if (c.length > 0){var e = document.createElement("script"); e.setAttribute("id", "_src_"+t); e.src = c, document.head.appendChild(e)} } 
function dynamicallyLoadCSS(t) { var e = document.createElement("link"); e.setAttribute("rel", "stylesheet"), e.setAttribute("type", "text/css"), e.setAttribute("href", t), document.head.appendChild(e) }
function cookieScriptLoadJavaScript(e, t) { var a = document.getElementsByTagName("head")[0], o = document.createElement("script"); o.type = "text/javascript", o.src = e, void 0 != t && (o.onload = o.onreadystatechange = function () { (!o.readyState || /loaded|complete/.test(o.readyState)) && (o.onload = o.onreadystatechange = null, a && o.parentNode && a.removeChild(o), o = void 0, t()) }), a.insertBefore(o, a.firstChild) };
/*helpers*/
function startsWith(t, n) { return 0 == t.indexOf(n) }
