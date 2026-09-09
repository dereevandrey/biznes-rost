/**
 * Интерактивный AI-Помощник «София» — Бизнес-Саммит «Территория Роста 2026».
 * Виджет 2-в-1: B2B Экспресс-аудит + Живой Омниканальный Консьерж Синара Центра.
 * Стилизован под Apple Luxury & High-Status Minimalist.
 */

(function() {
    const API_URL = "http://localhost:8088/api";
    let conversationHistory = [];

    // 1. Создание контейнера виджета
    const container = document.createElement("div");
    container.id = "prm-ai-widget-container";
    container.innerHTML = `
        <style>
            #prm-ai-btn {
                position: fixed;
                bottom: 24px;
                right: 24px;
                z-index: 99999;
                background: linear-gradient(135deg, #1e3a8a, #4f46e5, #7c3aed);
                color: #ffffff;
                border: 1px solid rgba(255, 255, 255, 0.25);
                border-radius: 9999px;
                padding: 13px 22px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                box-shadow: 0 10px 30px -5px rgba(79, 70, 229, 0.5), 0 4px 12px rgba(0, 0, 0, 0.2);
                display: flex;
                align-items: center;
                gap: 10px;
                transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            }
            #prm-ai-btn:hover {
                transform: translateY(-2px) scale(1.03);
                box-shadow: 0 16px 36px -5px rgba(79, 70, 229, 0.7);
            }
            #prm-ai-modal {
                display: none;
                position: fixed;
                bottom: 86px;
                right: 24px;
                width: 400px;
                max-width: calc(100vw - 32px);
                height: 600px;
                max-height: calc(100vh - 120px);
                z-index: 99999;
                background: rgba(15, 17, 23, 0.94);
                backdrop-filter: blur(24px);
                -webkit-backdrop-filter: blur(24px);
                border: 1px solid rgba(255, 255, 255, 0.12);
                border-radius: 20px;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05);
                flex-direction: column;
                overflow: hidden;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                color: #f3f4f6;
            }
            .prm-header {
                padding: 16px 20px;
                background: rgba(255, 255, 255, 0.03);
                border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .prm-tabs {
                display: flex;
                padding: 8px 12px;
                gap: 6px;
                background: rgba(0, 0, 0, 0.35);
                border-bottom: 1px solid rgba(255, 255, 255, 0.06);
            }
            .prm-tab {
                flex: 1;
                text-align: center;
                padding: 7px 10px;
                font-size: 12px;
                font-weight: 600;
                border-radius: 8px;
                cursor: pointer;
                color: #9ca3af;
                transition: all 0.2s;
            }
            .prm-tab.active {
                background: rgba(255, 255, 255, 0.12);
                color: #ffffff;
            }
            .prm-body {
                padding: 16px;
                overflow-y: auto;
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 12px;
                font-size: 13px;
                line-height: 1.55;
            }
            .prm-input {
                width: 100%;
                background: rgba(255, 255, 255, 0.06);
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 10px;
                padding: 11px 14px;
                color: #ffffff;
                font-size: 13px;
                outline: none;
                box-sizing: border-box;
                transition: border-color 0.2s;
            }
            .prm-input:focus {
                border-color: #6366f1;
            }
            .prm-action-btn {
                background: linear-gradient(135deg, #2563eb, #6366f1);
                border: none;
                border-radius: 10px;
                padding: 11px 16px;
                color: #ffffff;
                font-weight: 600;
                font-size: 13px;
                cursor: pointer;
                width: 100%;
                transition: opacity 0.2s, transform 0.1s;
            }
            .prm-action-btn:hover {
                opacity: 0.92;
            }
            .prm-action-btn:active {
                transform: scale(0.98);
            }
            .prm-msg {
                padding: 11px 15px;
                border-radius: 14px;
                max-width: 90%;
                white-space: pre-line;
                word-wrap: break-word;
            }
            .prm-msg-bot {
                background: rgba(255, 255, 255, 0.07);
                align-self: flex-start;
                border: 1px solid rgba(255, 255, 255, 0.08);
                color: #f3f4f6;
            }
            .prm-msg-user {
                background: #4f46e5;
                align-self: flex-end;
                color: #ffffff;
            }
            .prm-chips {
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
                margin-top: 4px;
            }
            .prm-chip {
                background: rgba(255, 255, 255, 0.06);
                border: 1px solid rgba(255, 255, 255, 0.12);
                border-radius: 9999px;
                padding: 5px 11px;
                font-size: 11px;
                color: #c7d2fe;
                cursor: pointer;
                transition: all 0.2s;
            }
            .prm-chip:hover {
                background: rgba(99, 102, 241, 0.25);
                border-color: #818cf8;
                color: #ffffff;
            }
            .prm-spinner {
                display: inline-block;
                width: 14px;
                height: 14px;
                border: 2px solid rgba(255,255,255,0.3);
                border-radius: 50%;
                border-top-color: #fff;
                animation: prmSpin 0.8s linear infinite;
            }
            @keyframes prmSpin { to { transform: rotate(360deg); } }
        </style>

        <button id="prm-ai-btn" onclick="window.togglePrmModal()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <span>София • AI-Консьерж</span>
        </button>

        <div id="prm-ai-modal">
            <div class="prm-header">
                <div style="font-weight: 700; font-size: 14px; display: flex; align-items: center; gap: 8px;">
                    <span style="width: 9px; height: 9px; background: #10b981; border-radius: 50%; box-shadow: 0 0 10px #10b981;"></span>
                    <span>София • Бизнес-Ассистент</span>
                </div>
                <button onclick="window.togglePrmModal()" style="background: none; border: none; color: #9ca3af; cursor: pointer; font-size: 20px; line-height: 1;">&times;</button>
            </div>
            <div class="prm-tabs">
                <div id="tab-concierge" class="prm-tab active" onclick="window.switchPrmTab('concierge')">🏛 Консьерж Синара</div>
                <div id="tab-audit" class="prm-tab" onclick="window.switchPrmTab('audit')">🔍 Экспресс-аудит (ИИ)</div>
            </div>

            <!-- ВКЛАДКА 1: ЖИВОЙ ЧАТ / КОНСЬЕРЖ СИНАРА -->
            <div id="prm-body-concierge" class="prm-body">
                <div class="prm-msg prm-msg-bot">
                    Здравствуйте! Я <b>София</b> — бизнес-ассистент основателя Консорциума «ПРЕДПРИНИМАЙ» Андрея Дереева и координатор Бизнес-Саммита «Территория Роста 2026».
                    
                    Подскажу расписание 5–11 октября, навигацию и парковку в <b>Синара Центре</b>, помогу выбрать тариф (90к / 200к VIP) или свяжу с оргкомитетом. О чем рассказать?
                </div>

                <div class="prm-chips">
                    <span class="prm-chip" onclick="window.quickSend('🏛 Где проходит саммит и как добраться?')">🏛 Где проходит?</span>
                    <span class="prm-chip" onclick="window.quickSend('🚗 Где парковка и въезд в Синара Центр?')">🚗 Парковка</span>
                    <span class="prm-chip" onclick="window.quickSend('💳 Сколько стоят билеты и какие тарифы?')">💳 Тарифы 90к/200к</span>
                    <span class="prm-chip" onclick="window.quickSend('⏰ Какое расписание и программа с 5 по 11 октября?')">⏰ Программа</span>
                    <span class="prm-chip" onclick="window.quickSend('🏨 Какие отели рядом с Синара Центром порекомендуете?')">🏨 Отели рядом</span>
                </div>

                <div id="prm-chat-history" style="display: flex; flex-direction: column; gap: 8px;"></div>
                <div style="display: flex; gap: 6px; margin-top: auto; padding-top: 8px;">
                    <input type="text" id="prm-chat-input" class="prm-input" placeholder="Задайте вопрос Софии..." onkeydown="if(event.key==='Enter') window.sendPrmChat()">
                    <button class="prm-action-btn" style="width: auto; padding: 11px 16px;" onclick="window.sendPrmChat()">➔</button>
                </div>
            </div>

            <!-- ВКЛАДКА 2: ЭКСПРЕСС-АУДИТ ПО ИНН -->
            <div id="prm-body-audit" class="prm-body" style="display: none;">
                <div class="prm-msg prm-msg-bot">
                    Укажите <b>ИНН вашей компании</b>. Нейросетевой контур Софии мгновенно сформирует экспресс-аудит и покажет 3 ключевые точки роста для внедрения ИИ-агентов с окупаемостью до 30 дней.
                </div>
                <input type="text" id="prm-inn-input" class="prm-input" placeholder="ИНН организации (10 или 12 цифр)">
                <input type="text" id="prm-phone-input" class="prm-input" placeholder="Телефон для связи (опционально)">
                <button id="prm-audit-btn" class="prm-action-btn" onclick="window.runPrmAudit()">Провести AI-аудит (0 ₽)</button>
                <div id="prm-audit-result" style="display: none;" class="prm-msg prm-msg-bot"></div>
            </div>
        </div>
    `;
    document.body.appendChild(container);

    // Логика переключения модального окна и вкладок
    window.togglePrmModal = function() {
        const modal = document.getElementById("prm-ai-modal");
        modal.style.display = (modal.style.display === "flex") ? "none" : "flex";
        if (modal.style.display === "flex") {
            const input = document.getElementById("prm-chat-input");
            if (input) setTimeout(() => input.focus(), 100);
        }
    };

    window.switchPrmTab = function(tab) {
        document.getElementById("tab-audit").classList.toggle("active", tab === "audit");
        document.getElementById("tab-concierge").classList.toggle("active", tab === "concierge");
        document.getElementById("prm-body-audit").style.display = (tab === "audit") ? "flex" : "none";
        document.getElementById("prm-body-concierge").style.display = (tab === "concierge") ? "flex" : "none";
    };

    window.quickSend = function(text) {
        const input = document.getElementById("prm-chat-input");
        input.value = text;
        window.sendPrmChat();
    };

    // 1. Отправка на экспресс-аудит
    window.runPrmAudit = async function() {
        const inn = document.getElementById("prm-inn-input").value.trim();
        const phone = document.getElementById("prm-phone-input").value.trim();
        const btn = document.getElementById("prm-audit-btn");
        const resDiv = document.getElementById("prm-audit-result");

        if (!inn) {
            alert("Пожалуйста, укажите ИНН компании.");
            return;
        }

        btn.disabled = true;
        btn.innerHTML = '<span class="prm-spinner"></span> Анализ бизнес-модели и ИИ-точек...';
        resDiv.style.display = "none";

        try {
            const resp = await fetch(`${API_URL}/audit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ inn, phone })
            });
            const data = await resp.json();

            btn.disabled = false;
            btn.innerHTML = 'Провести AI-аудит (0 ₽)';
            resDiv.style.display = "block";

            if (data.status === "success") {
                resDiv.innerHTML = `
                    <div style="font-weight: 700; color: #818cf8; margin-bottom: 6px;">🏢 ${data.company.name}</div>
                    <div style="font-size: 11px; color: #9ca3af; margin-bottom: 8px;">Руководитель: ${data.company.ceo}</div>
                    <div style="white-space: pre-line; line-height: 1.5;">${data.audit_report}</div>
                    <a href="#tariffs" onclick="window.togglePrmModal()" style="display: inline-block; margin-top: 12px; color: #60a5fa; font-weight: 600; text-decoration: underline;">👉 Забронировать участие со скидкой</a>
                `;
            } else {
                resDiv.innerHTML = `<span style="color: #ef4444;">Ошибка: ${data.error || "Не удалось загрузить данные"}</span>`;
            }
        } catch (e) {
            btn.disabled = false;
            btn.innerHTML = 'Провести AI-аудит (0 ₽)';
            resDiv.style.display = "block";
            resDiv.innerHTML = `
                <div style="font-weight: 700; color: #fbbf24; margin-bottom: 6px;">📋 Аудит зафиксирован</div>
                <div>Ваш ИНН ${inn} принят координатором. Эксперт Консорциума сформирует отчет и свяжется с вами!</div>
                <div style="margin-top: 8px;"><a href="https://t.me/Sofiya_TR_bot" target="_blank" style="color: #60a5fa; font-weight: 600;">👉 Получить отчет в Telegram Софии</a></div>
            `;
        }
    };

    // 2. Отправка сообщения в чат консьержа
    window.sendPrmChat = async function() {
        const input = document.getElementById("prm-chat-input");
        const msg = input.value.trim();
        if (!msg) return;

        const historyContainer = document.getElementById("prm-chat-history");
        
        // Добавляем сообщение пользователя
        const userMsg = document.createElement("div");
        userMsg.className = "prm-msg prm-msg-user";
        userMsg.innerText = msg;
        historyContainer.appendChild(userMsg);
        input.value = "";

        // Заглушка ожидания
        const botMsg = document.createElement("div");
        botMsg.className = "prm-msg prm-msg-bot";
        botMsg.innerHTML = '<span class="prm-spinner"></span> София печатает...';
        historyContainer.appendChild(botMsg);
        
        const scrollBody = document.getElementById("prm-body-concierge");
        scrollBody.scrollTop = scrollBody.scrollHeight;

        try {
            const resp = await fetch(`${API_URL}/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    role: "concierge", 
                    message: msg,
                    history: conversationHistory
                })
            });
            const data = await resp.json();
            const replyText = data.response || "Благодарю за вопрос! Готова продолжить диалог.";
            botMsg.innerText = replyText;

            // Обновляем контекст истории
            conversationHistory.push({ role: "user", content: msg });
            conversationHistory.push({ role: "assistant", content: replyText });
            if (conversationHistory.length > 10) {
                conversationHistory = conversationHistory.slice(-10);
            }
        } catch (e) {
            // Умный автономный ответ с прямой ссылкой в Telegram
            const mLow = msg.toLowerCase();
            let fallbackText = "";

            if (mLow.includes("где") || mLow.includes("синара") || mLow.includes("адрес") || mLow.includes("добраться")) {
                fallbackText = "Главная площадка Саммита — Конгресс-центр МВЦ «Синара Центр» в Екатеринбурге (Верх-Исетский бульвар, д. 15/4). Удобный заезд с бульвара и ул. Репина, 7 минут от площади 1905 года.";
            } else if (mLow.includes("парковк") || mLow.includes("машин") || mLow.includes("въезд")) {
                fallbackText = "На территории Синара Центра есть охраняемая парковка со шлагбаумом. Для участников тарифа «Бизнес / VIP» выделены персональные парковочные места у главного входа.";
            } else if (mLow.includes("цен") || mLow.includes("стоимост") || mLow.includes("билет") || mLow.includes("тариф")) {
                fallbackText = "Доступно 2 тарифа:\n• «Стандарт» — 90 000 ₽ (5 дней онлайн-интенсива по AI-агентам + Гранд-Саммит 11 октября);\n• «Бизнес / VIP» — 200 000 ₽ (+ личный трекинг Андрея Дереева, очный практикум 10 октября и VIP-ужин).";
            } else if (mLow.includes("время") || mLow.includes("график") || mLow.includes("когда") || mLow.includes("расписани")) {
                fallbackText = "Саммит проходит 5–11 октября 2026:\n• 5–9 октября: онлайн-интенсив (вечерний трек 19:00–21:30);\n• 10 октября: очный практикум «Эмпатиум»;\n• 11 октября: Гранд-Саммит в Синара Центре и VIP-ужин.";
            } else if (mLow.includes("гардероб") || mLow.includes("вход") || mLow.includes("санузел")) {
                fallbackText = "Главный вход — с площади Синара Центра. Гардероб, стойка регистрации и санузлы — на 1 этаже. Зал пленарных сессий — 1 этаж, Деловая Галерея — Атриум, VIP-ложа — 2 этаж.";
            } else {
                fallbackText = "Саммит «Территория Роста» проходит 5–11 октября 2026 в Екатеринбурге в Синара Центре.\n\nЯ с радостью отвечу на все вопросы и помогу с бронированием в нашем Telegram-боте: @Sofiya_TR_bot или пишите основателю: @andreydereev";
            }
            botMsg.innerText = fallbackText;
        }
        scrollBody.scrollTop = scrollBody.scrollHeight;
    };
})();
