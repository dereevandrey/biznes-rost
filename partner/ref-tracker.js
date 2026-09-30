/**
 * ======================================================================
 *   СКВОЗНОЙ РЕФЕРАЛЬНЫЙ И UTM-ТРЕКЕР «ТЕРРИТОРИЯ РОСТА» (REF-TRACKER.JS)
 *   Версия 3.3: 100% надёжная сквозная атрибуция.
 *   - Поддержка URL, Referrer, LocalStorage, SessionStorage и Cookies.
 *   - Авто-проброс реферала во все ссылки и кнопки сайта.
 *   - Глобальный транспортный перехватчик fetch для всех форм.
 * ======================================================================
 */

(function () {
    'use strict';

    var STORAGE_KEY_REF = 'TR_REF_CODE';
    var STORAGE_KEY_UTM = 'TR_UTM_DATA';
    var STORAGE_KEY_FIRST_VISIT = 'TR_REF_FIRST_VISIT';
    var COOKIE_EXPIRY_DAYS = 90;

    // 1. Cookies (глобальный path=/ на 90 дней)
    function setCookie(name, value, days) {
        var expires = "";
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + encodeURIComponent(value || "") + expires + "; path=/; SameSite=Lax";
    }

    function getCookie(name) {
        var nameEQ = name + "=";
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
        }
        return null;
    }

    // 2. Парсинг параметров из произвольной строки запроса или URL
    function parseQueryString(queryString) {
        var params = {};
        if (!queryString) return params;
        if (queryString.indexOf('?') !== -1) {
            queryString = queryString.split('?')[1];
        }
        if (queryString.indexOf('#') !== -1) {
            queryString = queryString.split('#')[0];
        }
        var pairs = queryString.split('&');
        for (var i = 0; i < pairs.length; i++) {
            var pair = pairs[i].split('=');
            if (pair.length === 2) {
                var key = decodeURIComponent(pair[0]).trim().toLowerCase();
                var val = decodeURIComponent(pair[1] || '').trim();
                if (key && val) {
                    params[key] = val;
                }
            }
        }
        return params;
    }

    // 3. Извлечение параметров из текущего URL
    function parseUrlParams() {
        try {
            return parseQueryString(window.location.search);
        } catch (e) {
            return {};
        }
    }

    // 4. Извлечение параметров из Document Referrer (если перешли с реферальной страницы)
    function parseReferrerParams() {
        try {
            if (document.referrer && document.referrer.indexOf('?') !== -1) {
                return parseQueryString(document.referrer);
            }
        } catch (e) {}
        return {};
    }

    // 5. Получить активный реферальный код из любого источника
    function getActiveRefCode() {
        // А. Прямой параметр в текущем URL
        var urlParams = parseUrlParams();
        var fromUrl = urlParams.ref || urlParams.partner || urlParams.partner_id || urlParams.agent || urlParams.from || urlParams.p || null;
        if (fromUrl) return fromUrl;

        // Б. Параметр из Referrer (страницы, с которой перешли)
        var refParams = parseReferrerParams();
        var fromReferrer = refParams.ref || refParams.partner || refParams.partner_id || refParams.agent || refParams.from || refParams.p || null;
        if (fromReferrer) return fromReferrer;

        // В. Локальные хранилища и Cookies
        try {
            var val = localStorage.getItem(STORAGE_KEY_REF) ||
                      localStorage.getItem('tr_ref_partner') ||
                      localStorage.getItem('tr_ref_code') ||
                      sessionStorage.getItem(STORAGE_KEY_REF) ||
                      sessionStorage.getItem('tr_ref_code') ||
                      getCookie('tr_ref_code') ||
                      getCookie('TR_REF_CODE') ||
                      '';
            if (val) return val;
        } catch (e) {
            return getCookie('tr_ref_code') || '';
        }
        return '';
    }

    // 6. Получить сохраненные UTM метки
    function getActiveUtmData() {
        var urlParams = parseUrlParams();
        var refParams = parseReferrerParams();
        var utm = {};
        var utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
        
        utmKeys.forEach(function (k) {
            if (urlParams[k]) utm[k] = urlParams[k];
            else if (refParams[k]) utm[k] = refParams[k];
        });

        if (Object.keys(utm).length === 0) {
            try {
                var raw = localStorage.getItem(STORAGE_KEY_UTM) ||
                          sessionStorage.getItem(STORAGE_KEY_UTM) ||
                          getCookie('tr_utm_data');
                if (raw) utm = JSON.parse(raw);
            } catch (e) {}
        }
        return utm;
    }

    // 7. Сохранение во все хранилища
    function persistRefCode(refCode, utmData) {
        if (!refCode) return;
        try {
            localStorage.setItem(STORAGE_KEY_REF, refCode);
            localStorage.setItem('tr_ref_partner', refCode);
            localStorage.setItem('tr_ref_code', refCode);
            sessionStorage.setItem(STORAGE_KEY_REF, refCode);
            sessionStorage.setItem('tr_ref_code', refCode);
            setCookie('tr_ref_code', refCode, COOKIE_EXPIRY_DAYS);
            setCookie('TR_REF_CODE', refCode, COOKIE_EXPIRY_DAYS);
        } catch (e) {}

        if (utmData && Object.keys(utmData).length > 0) {
            try {
                localStorage.setItem(STORAGE_KEY_UTM, JSON.stringify(utmData));
                sessionStorage.setItem(STORAGE_KEY_UTM, JSON.stringify(utmData));
                setCookie('tr_utm_data', JSON.stringify(utmData), COOKIE_EXPIRY_DAYS);
            } catch (e) {}
        }
    }

    // 8. Автоматический проброс реферала во все ссылки страницы
    function propagateToInternalLinks(refCode) {
        if (!refCode) return;

        function updateLinkHref(a) {
            try {
                var href = a.getAttribute('href');
                if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) {
                    return;
                }

                if (href.indexOf('timepad.ru') !== -1) {
                    var u = new URL(a.href, window.location.href);
                    u.searchParams.set('utm_source', 'tr_partner');
                    u.searchParams.set('utm_campaign', refCode);
                    u.searchParams.set('ref', refCode);
                    a.href = u.toString();
                    return;
                }

                var isInternal = false;
                if (href.startsWith('/') || href.startsWith('./') || href.startsWith('../') || 
                    href.indexOf('.html') !== -1 || href.indexOf('partner') !== -1 ||
                    href.indexOf(window.location.host) !== -1 ||
                    (!href.startsWith('http://') && !href.startsWith('https://'))) {
                    isInternal = true;
                }

                if (isInternal) {
                    var u = new URL(a.href, window.location.href);
                    if (u.host === window.location.host || u.host === '') {
                        if (!u.searchParams.has('ref')) {
                            u.searchParams.set('ref', refCode);
                            a.href = u.toString();
                        }
                    }
                }
            } catch (e) {}
        }

        var links = document.querySelectorAll('a[href]');
        links.forEach(updateLinkHref);
    }

    // 9. Перехват кликов по динамическим ссылкам
    function attachGlobalClickInterceptor(refCode) {
        if (!refCode) return;
        document.addEventListener('click', function (e) {
            var target = e.target;
            while (target && target.tagName !== 'A') {
                target = target.parentElement;
            }
            if (target && target.href) {
                try {
                    var href = target.getAttribute('href') || '';
                    if (!href.startsWith('#') && !href.startsWith('javascript:') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
                        var u = new URL(target.href, window.location.href);
                        if ((u.host === window.location.host || u.host === '') && !u.searchParams.has('ref')) {
                            u.searchParams.set('ref', refCode);
                            target.href = u.toString();
                        }
                    }
                } catch (err) {}
            }
        }, true);
    }

    // 10. Отправка аналитики визита
    function sendRefHit(refCode, utm, hitType) {
        var payload = {
            ref: refCode,
            hit_type: hitType || 'qr_or_link_visit',
            url: window.location.href,
            referrer: document.referrer || '',
            utm: utm || getActiveUtmData(),
            screen: (window.screen ? window.screen.width + 'x' + window.screen.height : 'unknown'),
            timestamp: new Date().toISOString()
        };

        try {
            var endpoint = 'https://predprinimy.ru/api/tr/ref-hit';
            if (navigator.sendBeacon) {
                var blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
                navigator.sendBeacon(endpoint, blob);
            } else {
                fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                }).catch(function () {});
            }
        } catch (e) {}
    }

    // 11. Сетевой перехватчик Fetch для 100% гарантии обогащения всех заявок
    function attachFetchInterceptor() {
        if (typeof window.fetch !== 'function') return;
        var originalFetch = window.fetch;
        window.fetch = function () {
            var args = Array.prototype.slice.call(arguments);
            var url = args[0];
            var config = args[1];

            if (typeof url === 'string' && (url.indexOf('/api/tr/lead') !== -1 || url.indexOf('predprinimy.ru/api/tr/lead') !== -1)) {
                if (config && config.body && typeof config.body === 'string') {
                    try {
                        var data = JSON.parse(config.body);
                        var activeRef = getActiveRefCode();
                        if (activeRef) {
                            data.ref = activeRef;
                            data.ref_code = activeRef;
                            data.partner = activeRef;
                            data.utm = data.utm || getActiveUtmData();
                            data.first_visit_at = data.first_visit_at || localStorage.getItem(STORAGE_KEY_FIRST_VISIT) || '';

                            var refLine = '\n[🤝 Партнёр/Агент: ' + activeRef + ']';
                            if (data.details && data.details.indexOf(refLine) === -1) {
                                data.details += refLine;
                            }
                            if (data.source && data.source.indexOf(activeRef) === -1) {
                                data.source += ' (Партнёр: ' + activeRef + ')';
                            }
                            config.body = JSON.stringify(data);
                        }
                    } catch (e) {}
                }
            }
            return originalFetch.apply(this, args);
        };
    }

    // 12. Инициализация
    function initTracker() {
        var activeRef = getActiveRefCode();
        var utmData = getActiveUtmData();

        if (activeRef) {
            persistRefCode(activeRef, utmData);
        }

        var firstVisit = localStorage.getItem(STORAGE_KEY_FIRST_VISIT);
        if (!firstVisit) {
            firstVisit = new Date().toISOString();
            try {
                localStorage.setItem(STORAGE_KEY_FIRST_VISIT, firstVisit);
            } catch (e) {}
        }

        if (activeRef && !sessionStorage.getItem('TR_HIT_' + activeRef)) {
            sendRefHit(activeRef, utmData, 'page_visit');
            try {
                sessionStorage.setItem('TR_HIT_' + activeRef, 'true');
            } catch (e) {}
        }

        if (activeRef) {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', function () {
                    propagateToInternalLinks(activeRef);
                });
            } else {
                propagateToInternalLinks(activeRef);
            }
            attachGlobalClickInterceptor(activeRef);
        }

        attachFetchInterceptor();
    }

    // Глобальный интерфейс
    window.TR_REF = {
        getRefCode: getActiveRefCode,
        getUtmData: getActiveUtmData,
        getFirstVisit: function () {
            return localStorage.getItem(STORAGE_KEY_FIRST_VISIT) || '';
        },
        enrichLead: function (leadObj) {
            var ref = getActiveRefCode();
            var utm = getActiveUtmData();
            var firstVisit = localStorage.getItem(STORAGE_KEY_FIRST_VISIT) || '';

            if (ref) {
                leadObj.ref = ref;
                leadObj.ref_code = ref;
                leadObj.partner = ref;
                leadObj.utm = utm;
                leadObj.first_visit_at = firstVisit;

                var refHeader = '\n[🤝 Партнёр/Агент: ' + ref + ']';
                if (leadObj.details && leadObj.details.indexOf(refHeader) === -1) {
                    leadObj.details += refHeader;
                }
                if (leadObj.source && leadObj.source.indexOf(ref) === -1) {
                    leadObj.source += ' (Партнёр: ' + ref + ')';
                }
            }
            return leadObj;
        }
    };

    initTracker();
})();
