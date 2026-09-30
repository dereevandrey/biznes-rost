/**
 * ======================================================================
 *   СКВОЗНОЙ РЕФЕРАЛЬНЫЙ И UTM-ТРЕКЕР «ТЕРРИТОРИЯ РОСТА» (REF-TRACKER.JS)
 *   Версия 3.2: Полная сквозная навигация, сохранение рефералов при переходе
 *   между любыми страницами, авто-проброс ссылок и перехват форм.
 * ======================================================================
 */

(function () {
    'use strict';

    var STORAGE_KEY_REF = 'TR_REF_CODE';
    var STORAGE_KEY_UTM = 'TR_UTM_DATA';
    var STORAGE_KEY_FIRST_VISIT = 'TR_REF_FIRST_VISIT';
    var COOKIE_EXPIRY_DAYS = 90;

    // 1. Вспомогательные функции для работы с Cookies (path=/ для всех страниц)
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

    // 2. Извлечение параметров из URL
    function parseUrlParams() {
        var params = {};
        try {
            var search = window.location.search.substring(1);
            if (!search) return params;
            var pairs = search.split('&');
            for (var i = 0; i < pairs.length; i++) {
                var pair = pairs[i].split('=');
                if (pair.length === 2) {
                    var key = decodeURIComponent(pair[0]).trim();
                    var val = decodeURIComponent(pair[1] || '').trim();
                    if (key && val) {
                        params[key.toLowerCase()] = val;
                    }
                }
            }
        } catch (e) {
            console.warn('[RefTracker] URL parse error:', e);
        }
        return params;
    }

    // 3. Получить активный реферальный код из любого хранилища или URL
    function getActiveRefCode() {
        // А. Прямой параметр из текущего URL
        var urlParams = parseUrlParams();
        var fromUrl = urlParams.ref || urlParams.partner || urlParams.partner_id || urlParams.agent || urlParams.from || urlParams.p || null;
        if (fromUrl) {
            return fromUrl;
        }

        // Б. LocalStorage / SessionStorage / Cookies
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

    // 4. Получить сохраненные UTM метки
    function getActiveUtmData() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY_UTM) ||
                      sessionStorage.getItem(STORAGE_KEY_UTM) ||
                      getCookie('tr_utm_data');
            return raw ? JSON.parse(raw) : {};
        } catch (e) {
            return {};
        }
    }

    // 5. Сохранение реферального кода во все хранилища
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

    // 6. Автоматический проброс ?ref=... во все внутренние ссылки страницы
    function propagateToInternalLinks(refCode) {
        if (!refCode) return;

        function updateLinkHref(a) {
            try {
                var href = a.getAttribute('href');
                if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) {
                    return;
                }

                // Внешние ссылки Timepad
                if (href.indexOf('timepad.ru') !== -1) {
                    var u = new URL(a.href, window.location.href);
                    u.searchParams.set('utm_source', 'tr_partner');
                    u.searchParams.set('utm_campaign', refCode);
                    u.searchParams.set('ref', refCode);
                    a.href = u.toString();
                    return;
                }

                // Внутренние ссылки (.html, относительные пути, переход по страницам сайта)
                var isInternal = false;
                if (href.startsWith('/') || href.startsWith('./') || href.startsWith('../') || 
                    href.indexOf('.html') !== -1 || href.indexOf(window.location.host) !== -1 ||
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

    // 7. Перехват кликов по ссылкам для динамических элементов
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
                        if (u.host === window.location.host && !u.searchParams.has('ref')) {
                            u.searchParams.set('ref', refCode);
                            target.href = u.toString();
                        }
                    }
                } catch (err) {}
            }
        }, true);
    }

    // 8. Отправка пинга перехода на шлюз аналитики
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
        } catch (e) {
            console.warn('[RefTracker] Hit notice:', e);
        }
    }

    // 9. Автоматический перехват Fetch для гарантии обогащения всех заявок
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

    // 10. Инициализация трекера
    function initTracker() {
        var urlParams = parseUrlParams();

        // Поиск реферального кода (?ref=... / ?partner=... / ?partner_id=... / ?agent=...)
        var urlRef = urlParams.ref || urlParams.partner || urlParams.partner_id || urlParams.agent || urlParams.from || urlParams.p || null;

        // Сбор UTM-меток
        var utmData = {};
        var utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
        utmKeys.forEach(function (k) {
            if (urlParams[k]) utmData[k] = urlParams[k];
        });

        if (!urlRef && utmData.utm_source && utmData.utm_source !== 'direct') {
            urlRef = utmData.utm_source;
        }

        var isNewReferral = false;
        if (urlRef) {
            var currentSaved = getActiveRefCode();
            if (currentSaved !== urlRef) {
                isNewReferral = true;
            }
            persistRefCode(urlRef, utmData);
        }

        // Первый визит
        var firstVisit = localStorage.getItem(STORAGE_KEY_FIRST_VISIT);
        if (!firstVisit) {
            firstVisit = new Date().toISOString();
            try {
                localStorage.setItem(STORAGE_KEY_FIRST_VISIT, firstVisit);
            } catch (e) {}
        }

        var activeRef = getActiveRefCode();

        // Сохраняем в cookies и storage текущий активный ref (даже если он был поднят из cookies/storage)
        if (activeRef) {
            persistRefCode(activeRef, utmData);
        }

        // Отправка сигнала визита/сканирования QR
        if (activeRef && (isNewReferral || !sessionStorage.getItem('TR_HIT_SENT'))) {
            sendRefHit(activeRef, utmData, urlRef ? 'direct_url' : 'restored_session');
            try {
                sessionStorage.setItem('TR_HIT_SENT', 'true');
            } catch (e) {}
        }

        // Проброс в ссылки страницы
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

        // Включаем сетевой перехватчик для 100% защиты отправки лидов
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

    // Запуск трекера
    initTracker();
})();
