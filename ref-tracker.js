/**
 * ======================================================================
 *   СКВОЗНОЙ РЕФЕРАЛЬНЫЙ И UTM-ТРЕКЕР «ТЕРРИТОРИЯ РОСТА» (REF-TRACKER.JS)
 *   Обеспечивает 100% фиксацию переходов по QR-кодам и реферальным ссылкам.
 *   Сохранение атрибуции в LocalStorage, SessionStorage и Cookies (90 дней).
 * ======================================================================
 */

(function () {
    'use strict';

    var STORAGE_KEY_REF = 'TR_REF_CODE';
    var STORAGE_KEY_UTM = 'TR_UTM_DATA';
    var STORAGE_KEY_FIRST_VISIT = 'TR_REF_FIRST_VISIT';
    var COOKIE_EXPIRY_DAYS = 90;

    // Вспомогательные функции для работы с Cookies
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

    // Извлечение параметров из URL
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

    // Инициализация трекинга
    function initTracker() {
        var urlParams = parseUrlParams();

        // 1. Поиск реферального кода (?ref=... / ?partner=... / ?partner_id=... / ?agent=...)
        var urlRef = urlParams.ref || urlParams.partner || urlParams.partner_id || urlParams.agent || null;

        // 2. Сбор UTM-меток
        var utmData = {};
        var utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
        utmKeys.forEach(function (k) {
            if (urlParams[k]) utmData[k] = urlParams[k];
        });

        // Если ref не передан напрямую, но есть utm_source или utm_campaign
        if (!urlRef && utmData.utm_source && utmData.utm_source !== 'direct') {
            urlRef = utmData.utm_source;
        }

        var isNewReferral = false;

        // Если передан новый реферальный код в URL — фиксируем его
        if (urlRef) {
            var currentSaved = localStorage.getItem(STORAGE_KEY_REF);
            if (currentSaved !== urlRef) {
                isNewReferral = true;
            }
            try {
                localStorage.setItem(STORAGE_KEY_REF, urlRef);
                sessionStorage.setItem(STORAGE_KEY_REF, urlRef);
                setCookie('tr_ref_code', urlRef, COOKIE_EXPIRY_DAYS);
            } catch (e) {}
        }

        // Сохранение UTM данных
        if (Object.keys(utmData).length > 0) {
            try {
                localStorage.setItem(STORAGE_KEY_UTM, JSON.stringify(utmData));
                sessionStorage.setItem(STORAGE_KEY_UTM, JSON.stringify(utmData));
                setCookie('tr_utm_data', JSON.stringify(utmData), COOKIE_EXPIRY_DAYS);
            } catch (e) {}
        }

        // Фиксация даты первого визита
        var firstVisit = localStorage.getItem(STORAGE_KEY_FIRST_VISIT);
        if (!firstVisit) {
            firstVisit = new Date().toISOString();
            try {
                localStorage.setItem(STORAGE_KEY_FIRST_VISIT, firstVisit);
            } catch (e) {}
        }

        var activeRef = getActiveRefCode();

        // 3. Отправка сигнала визита/сканирования QR (Beacon Hit) на бэкенд
        if (activeRef && (isNewReferral || !sessionStorage.getItem('TR_HIT_SENT'))) {
            sendRefHit(activeRef, utmData, urlRef ? 'direct_url' : 'restored_session');
            try {
                sessionStorage.setItem('TR_HIT_SENT', 'true');
            } catch (e) {}
        }

        // 4. Обновление внешних ссылок (Timepad и Telegram)
        updateExternalLinks(activeRef);
    }

    // Получить активный реферальный код из любого доступного хранилища
    function getActiveRefCode() {
        try {
            return localStorage.getItem(STORAGE_KEY_REF) ||
                   sessionStorage.getItem(STORAGE_KEY_REF) ||
                   getCookie('tr_ref_code') ||
                   '';
        } catch (e) {
            return getCookie('tr_ref_code') || '';
        }
    }

    // Получить сохраненные UTM метки
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

    // Отправка пинга перехода на шлюз аналитики
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
            var endpoint = '/api/tr/ref-hit';
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

    // Обновление ссылок на Timepad для сквозной передачи промокода/агента
    function updateExternalLinks(refCode) {
        if (!refCode) return;
        document.addEventListener('DOMContentLoaded', function () {
            var timepadLinks = document.querySelectorAll('a[href*="timepad.ru"]');
            timepadLinks.forEach(function (link) {
                try {
                    var u = new URL(link.href);
                    u.searchParams.set('utm_source', 'tr_partner');
                    u.searchParams.set('utm_campaign', refCode);
                    u.searchParams.set('ref', refCode);
                    link.href = u.toString();
                } catch (e) {}
            });
        });
    }

    // Глобальный интерфейс для форм и скриптов сайта
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

                // Дописываем партнера в детали заявки для 100% видимости во всех мессенджерах
                var refHeader = '\n[🤝 Партнёр/Агент: ' + ref + ']';
                if (leadObj.details && !leadObj.details.includes(refHeader)) {
                    leadObj.details += refHeader;
                }
                if (leadObj.source && !leadObj.source.includes(ref)) {
                    leadObj.source += ' (Партнёр: ' + ref + ')';
                }
            }
            return leadObj;
        }
    };

    // Запуск трекера
    initTracker();
})();
