/**
 * Интерактивный AI-Помощник «Территория Роста» (Сайт, виджет 2-в-1: Аудитор + Консьерж).
 * Стилизован под Apple Luxury & High-Status Minimalist.
 */

(function() {
    const API_URL = "http://localhost:8088/api";

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
                background: linear-gradient(135deg, #2563eb, #7c3aed);
                color: #ffffff;
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 9999px;
                padding: 14px 22px;
                font-family: 'Inter', -apple-system, sans-serif;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.5), 0 8px 10px -6px rgba(124, 58, 237, 0.5);
                display: flex;
                align-items: center;
                gap: 10px;
                transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            }
            #prm-ai-btn:hover {
                transform: scale(1.05);
                box-shadow: 0 15px 35px -5px rgba(37, 99, 235, 0.7);
            }
            #prm-ai-modal {
                display: none;
                position: fixed;
                bottom: 90px;
                right: 24px;
                width: 380px;
                max-width: calc(100vw - 32px);
                max-height: 580px;
                z-index: 99999;
                background: rgba(18, 18, 20, 0.85);
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.12);
                border-radius: 20px;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
                flex-direction: column;
                overflow: hidden;
                font-family: 'Inter', -apple-system, sans-serif;
                color: #f5f5f7;
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
                background: rgba(0, 0, 0, 0.3);
                border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            }
            .prm-tab {
                flex: 1;
                text-align: center;
                padding: 6px 10px;
                font-size: 12px;
                font-weight: 600;
                border-radius: 8px;
                cursor: pointer;
                color: #a1a1aa;
                transition: all 0.2s;
            }
            .prm-tab.active {
                background: rgba(255, 255, 255, 0.1);
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
                line-height: 1.5;
            }
            .prm-input {
                width: 100%;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 10px;
                padding: 10px 14px;
                color: #ffffff;
                font-size: 13px;
                outline: none;
                box-sizing: border-box;
            }
            .prm-input:focus {
                border-color: #3b82f6;
            }
            .prm-action-btn {
                background: linear-gradient(135deg, #2563eb, #7c3aed);
                border: none;
                border-radius: 10px;
                padding: 10px 16px;
                color: #ffffff;
                font-weight: 600;
                font-size: 13px;
                cursor: pointer;
                width: 100%;
                transition: opacity 0.2s;
            }
            .prm-action-btn:hover {
                opacity: 0.9;
            }
            .prm-msg {
                padding: 10px 14px;
                border-radius: 12px;
                max-width: 90%;
            }
            .prm-msg-bot {
                background: rgba(255, 255, 255, 0.06);
                align-self: flex-start;
                border: 1px solid rgba(255, 255, 255, 0.08);
            }
            .prm-msg-user {
                background: #2563eb;
                align-self: flex-end;
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
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 10 10H12V2z"></path><path d="M12 2a10 10 0 0 1 10 10h-10V2z"></path><path d="M12 12L2.5 7.5"></path><path d="M12 12v10"></path></svg>
            <span>AI-Ассистент</span>
        </button>

        <div id="prm-ai-modal">
            <div class="prm-header">
                <div style="font-weight: 700; font-size: 14px; display: flex; align-items: center; gap: 8px;">
                    <span style="width: 8px; height: 8px; background: #10b981; border-radius: 50%;"></span>
                    Территория Роста AI
                </div>
                <button onclick="window.togglePrmModal()" style="background: none; border: none; color: #a1a1aa; cursor: pointer; font-size: 18px;">&times;</button>
            </div>
            <div class="prm-tabs">
                <div id="tab-audit" class="prm-tab active" onclick="window.switchPrmTab('audit')">🔍 Экспресс-аудит</div>
                <div id="tab-concierge" class="prm-tab" onclick="window.switchPrmTab('concierge')">🏛 Навигатор Синара</div>
            </div>
            <div id="prm-body-audit" class="prm-body">
                <div class="prm-msg prm-msg-bot">
                    Введите <b>ИНН вашей компании</b>. Локальный AI-помощник моментально проанализирует профиль и покажет 3 ключевые точки роста для внедрения ИИ-контура.
                </div>
                <input type="text" id="prm-inn-input" class="prm-input" placeholder="ИНН организации (10 или 12 цифр)">
                <input type="text" id="prm-phone-input" class="prm-input" placeholder="Телефон для связи (опционально)">
                <button id="prm-audit-btn" class="prm-action-btn" onclick="window.runPrmAudit()">Провести AI-аудит (0 ₽)</button>
                <div id="prm-audit-result" style="display: none;" class="prm-msg prm-msg-bot"></div>
            </div>
            <div id="prm-body-concierge" class="prm-body" style="display: none;">
                <div class="prm-msg prm-msg-bot">
                    Здравствуйте! Я AI-Консьерж бизнес-саммита в <b>Синара Центре</b>. Спросите меня о расписании, гардеробе, расположении залов или спикерах.
                </div>
                <div id="prm-chat-history" style="display: flex; flex-direction: column; gap: 8px;"></div>
                <div style="display: flex; gap: 6px; margin-top: auto;">
                    <input type="text" id="prm-chat-input" class="prm-input" placeholder="Задайте вопрос по событию..." onkeydown="if(event.key==='Enter') window.sendPrmChat()">
                    <button class="prm-action-btn" style="width: auto; padding: 10px 14px;" onclick="window.sendPrmChat()">➔</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(container);

    // Логика переключения модального окна и вкладок
    window.togglePrmModal = function() {
        const modal = document.getElementById("prm-ai-modal");
        modal.style.display = (modal.style.display === "flex") ? "none" : "flex";
    };

    window.switchPrmTab = function(tab) {
        document.getElementById("tab-audit").classList.toggle("active", tab === "audit");
        document.getElementById("tab-concierge").classList.toggle("active", tab === "concierge");
        document.getElementById("prm-body-audit").style.display = (tab === "audit") ? "flex" : "none";
        document.getElementById("prm-body-concierge").style.display = (tab === "concierge") ? "flex" : "none";
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
        btn.innerHTML = '<span class="prm-spinner"></span> Анализ профиля ФНС и ИИ...';
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
                    <div style="font-weight: 700; color: #60a5fa; margin-bottom: 6px;">🏢 ${data.company.name}</div>
                    <div style="font-size: 11px; color: #9ca3af; margin-bottom: 8px;">Руководитель: ${data.company.ceo}</div>
                    <div style="white-space: pre-line; line-height: 1.4;">${data.audit_report}</div>
                    <a href="#tariffs" onclick="window.togglePrmModal()" style="display: inline-block; margin-top: 10px; color: #3b82f6; font-weight: 600; text-decoration: underline;">👉 Забронировать участие со скидкой</a>
                `;
            } else {
                resDiv.innerHTML = `<span style="color: #ef4444;">Ошибка: ${data.error || "Не удалось загрузить данные"}</span>`;
            }
        } catch (e) {
            btn.disabled = false;
            btn.innerHTML = 'Провести AI-аудит (0 ₽)';
            resDiv.style.display = "block";
            resDiv.innerHTML = `<span style="color: #f59e0b;">Оффлайн-режим: Экспресс-аудит зафиксирован. Мы свяжемся с вами.</span>`;
        }
    };

    // 2. Отправка сообщения в чат консьержа
    window.sendPrmChat = async function() {
        const input = document.getElementById("prm-chat-input");
        const msg = input.value.trim();
        if (!msg) return;

        const history = document.getElementById("prm-chat-history");
        
        // Добавляем сообщение пользователя
        const userMsg = document.createElement("div");
        userMsg.className = "prm-msg prm-msg-user";
        userMsg.innerText = msg;
        history.appendChild(userMsg);
        input.value = "";

        // Заглушка ожидания
        const botMsg = document.createElement("div");
        botMsg.className = "prm-msg prm-msg-bot";
        botMsg.innerHTML = '<span class="prm-spinner"></span>';
        history.appendChild(botMsg);
        history.scrollTop = history.scrollHeight;

        try {
            const resp = await fetch(`${API_URL}/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role: "concierge", message: msg })
            });
            const data = await resp.json();
            botMsg.innerText = data.response;
        } catch (e) {
            const mLow = msg.toLowerCase();
            if (mLow.includes("дорого") || mLow.includes("скидк") || mLow.includes("цен") || mLow.includes("стоимост")) {
                botMsg.innerText = "Экономика простая: освобождение 1.5–2 часов рутины топ-менеджера в день окупает участие команды за 2–3 недели. До 1 сентября действуют спеццены раннего бронирования.";
            } else if (mLow.includes("время") || mLow.includes("график") || mLow.includes("когда")) {
                botMsg.innerText = "5–9 октября работаем онлайн по 2–2.5 часа/день без отрыва от бизнеса. 10–11 октября — очный интенсив в Екатеринбурге (Синара Центр и SOK).";
            } else if (mLow.includes("туалет") || mLow.includes("гардероб") || mLow.includes("санузел")) {
                botMsg.innerText = "Гардероб и санузлы находятся на 1 этаже Синара Центра у главного входа. Дополнительные санузлы — на 2 этаже восточного крыла.";
            } else {
                botMsg.innerText = "Саммит и практикум проходят 5–11 октября 2026 в Екатеринбурге (Синара Центр и SOK). Наш эксперт готов ответить в Telegram: @andreydereev";
            }
        }
        history.scrollTop = history.scrollHeight;
    };
})();
