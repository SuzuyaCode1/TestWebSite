// ===========================
// ИНИЦИАЛИЗАЦИЯ И СОБЫТИЯ ЗАГРУЗКИ
// ===========================

document.addEventListener('DOMContentLoaded', function() {
    initializeObserver();
    initializeForm();
    initializeModal();
    initializeRoomModal();
    // try to init Firebase if config provided in index.html
    try { initFirebaseFromConfig(); } catch (e) {}
    initializeAdminPage();
    setMinDateForForm();
    if (window.emailjs && EMAILJS_PUBLIC_KEY && EMAILJS_PUBLIC_KEY !== 'YOUR_EMAILJS_PUBLIC_KEY') {
        emailjs.init(EMAILJS_PUBLIC_KEY);
    }
    // Apply stored room prices to the page immediately
    try {
        const stored = loadRoomPrices();
        if (stored) {
            roomPrices = stored;
            applyRoomPricesToDOM(stored);
        }
    } catch (e) {
        // ignore
    }
});

const roomData = {
    standard: {
        title: 'Стандартний номер',
        price: '1000₴ / ніч',
        description: 'Тихий і затишний номер для комфортного перебування. Ідеально підходить для подорожей, робочих поїздок або короткого відпочинку.',
        highlights: ['2 односпальні ліжка', 'Невелика зона для відпочинку', 'Тиха атмосфера', 'Доступ до безкоштовного WiFi'],
        amenities: ['Кондиціонер', 'Телевізор', 'Ванна кімната', 'Рушники та банні приналежності', 'Кава/чай на сніданок'],
        gallery: [
            'https://picsum.photos/seed/standard-room-1/800/500',
            'https://picsum.photos/seed/standard-room-2/800/500'
        ]
    },
    comfort: {
        title: 'Комфорт номер',
        price: '1500₴ / ніч',
        description: 'Більш просторий номер з розкішними деталями, міні-баром і балконом для спокійного ранкового чаю.',
        highlights: ['Двоспальне ліжко', 'Гідромасаж', 'Балкон із видом на сад', 'Міні-бар та чайний набір'],
        amenities: ['Кондиціонер', 'Гідромасажна ванна', 'Бездротовий WiFi', 'Телевізор Smart TV', 'Сервіс ранку'],
        gallery: [
            'https://picsum.photos/seed/comfort-room-1/800/500',
            'https://picsum.photos/seed/comfort-room-2/800/500'
        ]
    },
    luxury: {
        title: 'Люкс',
        price: '2500₴ / ніч',
        description: 'Преміальний номер для тихого відпочинку з особливими зручностями, просторою зоною і VIP-сервісом.',
        highlights: ['Розкішний інтер’єр', 'VIP ванна', 'Окремий робочий кабінет', 'Круглосуточне обслуговування'],
        amenities: ['Спа-ванна', 'Кухонний куточок', 'Особистий concierge', 'Smart TV', 'Басейн доступ'],
        gallery: [
            'https://picsum.photos/seed/luxury-room-1/800/500',
            'https://picsum.photos/seed/luxury-room-2/800/500'
        ]
    },
    family: {
        title: 'Сімейний номер',
        price: '2000₴ / ніч',
        description: 'Номер для сімейних відпусток із двома спальнями, зоною для дітей і просторою вітальнею.',
        highlights: ['2 спальня', 'Вітальня', 'Дитяча зона', 'Кухонний куточок'],
        amenities: ['Кухня', 'Дитячий стіл', 'Крісло для годування', 'Тихий простір', 'Безкоштовний паркінг'],
        gallery: [
            'https://picsum.photos/seed/family-room-1/800/500',
            'https://picsum.photos/seed/family-room-2/800/500'
        ]
    },
};
 
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin';
const ORDERS_STORAGE_KEY = 'hotelBookingOrders';
const ADMIN_SESSION_KEY = 'hotelAdminLoggedIn';
const ROOM_PRICES_KEY = 'hotelRoomPrices';
const EMAILJS_SERVICE_ID = 'service_l7epj8l';
const EMAILJS_TEMPLATE_ID = 'template_lwpqnbb';
const EMAILJS_PUBLIC_KEY = 'AU_iHT6yya0YW-wuK';
const EMAILJS_REPLY_TO = 'info@hotel.com';
const EMAILJS_SENDER_NAME = 'Затишний Готель';
let roomPrices = {
    standard: 1000,
    comfort: 1500,
    luxury: 2500,
    family: 2000,
};
let lastConfirmedBooking = null;

function getPriceValue(roomKey) {
    if (!roomKey) return '';
    try {
        const rp = roomPrices && roomPrices[roomKey];
        if (typeof rp === 'number' && !Number.isNaN(rp)) return rp;
        if (typeof rp === 'string' && rp.trim() !== '') {
            const parsed = Number(String(rp).replace(/[^0-9.-]/g, ''));
            if (!Number.isNaN(parsed)) return parsed;
        }
        const rd = roomData[roomKey] && roomData[roomKey].price;
        if (rd) {
            const parsed = Number(String(rd).replace(/[^0-9.-]/g, ''));
            if (!Number.isNaN(parsed)) return parsed;
        }
    } catch (e) {
        // fallback
    }
    return '';
}

// Initialize Firebase if FIREBASE_CONFIG provided (compat SDK expected in index.html)
function initFirebaseFromConfig() {
    try {
        if (window.firebase && typeof FIREBASE_CONFIG !== 'undefined' && FIREBASE_CONFIG && FIREBASE_CONFIG.projectId) {
            if (!firebase.apps || !firebase.apps.length) {
                firebase.initializeApp(FIREBASE_CONFIG);
            }
            window.db = firebase.firestore();
            console.log('Firebase initialized (Firestore available)');
        }
    } catch (e) {
        console.warn('Firebase init failed:', e);
    }
}

function initializeRoomModal() {
    const modal = document.getElementById('roomModal');
    const closeButton = document.querySelector('.room-modal-close');
    const cards = document.querySelectorAll('.room-card');

    if (closeButton) {
        closeButton.addEventListener('click', () => closeModal(modal));
    }

    if (modal) {
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                closeModal(modal);
            }
        });
    }

    cards.forEach((card) => {
        const openRoom = () => {
            const roomKey = card.dataset.room;
            if (roomKey) {
                showRoomDetails(roomKey);
            }
        };

        card.addEventListener('click', openRoom);
        card.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openRoom();
            }
        });
    });
}

function showRoomDetails(roomKey) {
    const room = roomData[roomKey];
    const modal = document.getElementById('roomModal');

    if (!room || !modal) return;

    document.getElementById('roomModalTitle').textContent = room.title;
    // store which room is open so price updates can target it
    modal.dataset.roomKey = roomKey;
    const priceNumber = getPriceValue(roomKey);
    const priceEl = document.getElementById('roomModalPrice');
    if (priceEl) {
        if (priceNumber !== '') {
            priceEl.innerHTML = `<span class="price-value">${priceNumber}</span>₴ <span>/ ніч</span>`;
        } else {
            priceEl.textContent = room.price || '';
        }
    }
    document.getElementById('roomModalDescription').textContent = room.description;
    document.getElementById('roomModalHighlights').innerHTML = room.highlights.map((item) => `<li>${item}</li>`).join('');
    document.getElementById('roomModalAmenities').innerHTML = room.amenities.map((item) => `<li>${item}</li>`).join('');
    document.getElementById('roomGallery').innerHTML = room.gallery.map((image) => `<img src="${image}" alt="${room.title}">`).join('');

    modal.classList.add('show');
}

// ===========================
// INTERSECTION OBSERVER - FADE-IN АНИМАЦИЯ
// ===========================

function initializeObserver() {
    // Опции для Intersection Observer
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    // Создание Observer
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Опционально: отписываемся от наблюдения после видимости
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Наблюдаем все элементы с классом fade-in
    const fadeInElements = document.querySelectorAll('.fade-in');
    fadeInElements.forEach(element => {
        observer.observe(element);
    });
}

// ===========================
// ВАЛИДАЦИЯ И ОБРАБОТКА ФОРМЫ БРОНИРОВАНИЯ
// ===========================

function initializeForm() {
    const bookingForm = document.getElementById('bookingForm');
    const notesField = document.getElementById('notes');
    
    if (bookingForm) {
        bookingForm.addEventListener('submit', handleFormSubmit);
        
        // Валидация при изменении полей
        const inputs = bookingForm.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('change', validateField);
            input.addEventListener('blur', validateField);
        });
    }

    if (notesField) {
        notesField.addEventListener('input', handleNotesInput);
        notesField.addEventListener('blur', validateField);
        updateNotesCounter(notesField.value);
    }
}

function validateField(event) {
    const field = event.target;
    const value = field.value.trim();
    
    // Базова валідація залежно від типу поля
    switch(field.type) {
        case 'email':
            validateEmail(field, value);
            break;
        case 'tel':
            validatePhone(field, value);
            break;
        case 'date':
            validateDate(field, value);
            break;
        case 'text':
            validateText(field, value);
            break;
        case 'textarea':
            if (field.name === 'notes') validateNotes(field);
            break;
        default:
            if (field.name !== 'notes') {
                field.value ? removeFieldError(field) : addFieldError(field, 'Це поле обов\'язкове');
            }
    }
}

function validateEmail(field, value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (value && !emailRegex.test(value)) {
        addFieldError(field, 'Некоректна електронна пошта');
    } else {
        removeFieldError(field);
    }
}

function validatePhone(field, value) {
    // Проста перевірка: мінімум 10 цифр
    const phoneRegex = /[\d]{10,}/;
    if (value && !phoneRegex.test(value.replace(/\D/g, ''))) {
        addFieldError(field, 'Некоректний номер телефону');
    } else {
        removeFieldError(field);
    }
}

function validateDate(field, value) {
    if (!value) {
        addFieldError(field, 'Це поле обов\'язкове');
    } else {
        removeFieldError(field);
        // Додаткова логіка: перевірка дат виїзду
        if (field.id === 'checkOut') {
            const checkInValue = document.getElementById('checkIn').value;
            if (checkInValue && new Date(value) <= new Date(checkInValue)) {
                addFieldError(field, 'Дата виїзду повинна бути пізніше дати заїзду');
            }
        }
    }
}

function validateText(field, value) {
    if (field.name === 'name' && value.length < 2) {
        addFieldError(field, 'Ім\'я повинно містити мінімум 2 символи');
    } else if (field.value) {
        removeFieldError(field);
    }
}

function getWordsFromText(text) {
    if (!text) return [];
    const normalized = text.trim().replace(/\s+/g, ' ');
    return normalized.match(/[\p{L}\p{N}’'-]+/gu) || [];
}

function handleNotesInput(event) {
    const field = event.target;
    const words = getWordsFromText(field.value);
    if (words.length > 500) {
        field.value = words.slice(0, 500).join(' ');
    }
    updateNotesCounter(field.value);
}

function updateNotesCounter(value) {
    const counter = document.getElementById('notesCounter');
    if (!counter) return;
    const count = getWordsFromText(value).length;
    counter.textContent = `${count} / 500 слів`;
}

function validateNotes(field) {
    const words = getWordsFromText(field.value).length;
    if (words > 500) {
        addFieldError(field, 'Максимум 500 слів');
    } else {
        removeFieldError(field);
    }
}

function addFieldError(field, message) {
    // Удаляем старую ошибку если есть
    removeFieldError(field);
    
    field.classList.add('error');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
        color: #f44336;
        font-size: 0.85rem;
        margin-top: 5px;
    `;
    field.parentNode.appendChild(errorDiv);
}

function removeFieldError(field) {
    field.classList.remove('error');
    const errorDiv = field.parentNode.querySelector('.field-error');
    if (errorDiv) {
        errorDiv.remove();
    }
}

function handleFormSubmit(event) {
    event.preventDefault();
    
    // Получаем все поля формы
    const form = event.target;
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    // Валидируем все обязательные поля
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            addFieldError(field, 'Это поле обязательно');
            isValid = false;
        } else {
            validateField({ target: field });
        }
    });

    const notesField = form.querySelector('#notes');
    if (notesField) {
        validateNotes(notesField);
    }
    
    // Проверяем наличие ошибок
    const errorFields = form.querySelectorAll('.field-error');
    if (errorFields.length > 0) {
        isValid = false;
    }
    
    if (isValid) {
        // Собираем данные бронирования
        // Знаходимо обраний тип номера
            const roomType = form.querySelector('#roomType').value;

            const bookingData = {
                checkIn: form.querySelector('#checkIn').value,
                checkOut: form.querySelector('#checkOut').value,
                roomType: roomType,
                // ДОДАЙ ЦЕЙ РЯДОК:
                priceAtBooking: roomPrices[roomType], 
                guests: form.querySelector('#guests').value,
                name: form.querySelector('#name').value,
                email: form.querySelector('#email').value,
                phone: form.querySelector('#phone').value,
                notes: form.querySelector('#notes').value.trim()
            };  
        
        saveBookingOrder(bookingData);
        
        // Показываем модальное окно с подтверждением
        showBookingConfirmation(bookingData);
        
        // Очищаем форму
        form.reset();
        updateNotesCounter('');
        
        // Удаляем все ошибки
        form.querySelectorAll('.field-error').forEach(error => error.remove());
    }
}

// ===========================
// МОДАЛЬНОЕ ОКНО ПОДТВЕРЖДЕНИЯ
// ===========================

function initializeModal() {
    const modal = document.getElementById('bookingModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const modalClose = document.querySelector('#bookingModal .modal-close');
    
    // Кнопка закрытия
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => closeModal(modal));
    }
    
    // Крестик закрытия
    if (modalClose) {
        modalClose.addEventListener('click', () => closeModal(modal));
    }
    
    const sendEmailBtn = document.getElementById('sendEmailBtn');
    if (sendEmailBtn) {
        sendEmailBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (!lastConfirmedBooking) {
                alert('Спочатку підтвердьте бронювання.');
                return;
            }
            sendBookingReceiptEmail(lastConfirmedBooking);
        });
    }
    
    // Закрытие при клике вне содержимого
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal);
            }
        });
    }
    
    // Закрытие при нажатии Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal && modal.classList.contains('show')) {
            closeModal(modal);
        }
    });
}

function escapeHtml(text) {
    if (typeof text !== 'string') return text;
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function showBookingConfirmation(bookingData) {
    const modal = document.getElementById('bookingModal');
    const bookingDetails = document.getElementById('bookingDetails');
    
    // Форматируем дату
    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('ru-RU', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };
    
    // Переводимо тип номера
    const roomTypeText = {
        'standard': 'Стандартний',
        'comfort': 'Комфорт',
        'luxury': 'Люкс',
        'family': 'Сімейний',
    };
    
    // Заповнюємо деталі бронювання
    bookingDetails.innerHTML = `
        <p>
            <span>Заїзд:</span>
            <strong>${escapeHtml(formatDate(bookingData.checkIn))}</strong>
        </p>
        <p>
            <span>Виїзд:</span>
            <strong>${escapeHtml(formatDate(bookingData.checkOut))}</strong>
        </p>
        <p>
            <span>Тип номера:</span>
            <strong>${escapeHtml(roomTypeText[bookingData.roomType])}</strong>
        </p>
        <p>
            <span>Гостей:</span>
            <strong>${escapeHtml(bookingData.guests)}</strong>
        </p>
        <p>
            <span>Ім'я:</span>
            <strong>${escapeHtml(bookingData.name)}</strong>
        </p>
        <p>
            <span>Контакт:</span>
            <strong>${escapeHtml(bookingData.email)}</strong>
        </p>
        <p>
            <span>Нотатки:</span>
            <strong class="booking-notes">${escapeHtml(bookingData.notes || 'Немає')}</strong>
        </p>
    `;
    lastConfirmedBooking = bookingData;
    
    // Показываем модал с анимацией
    modal.classList.add('show');
    
    // Звуковый эффект (опционально)
    playSuccessSound();
}

function closeModal(modal) {
    modal.classList.remove('show');
}

function sendBookingReceiptEmail(bookingData) {
    if (!EMAILJS_PUBLIC_KEY || EMAILJS_PUBLIC_KEY === 'YOUR_EMAILJS_PUBLIC_KEY') {
        alert('Будь ласка, додайте свій EmailJS Public Key у script.js');
        return;
    }
    if (!bookingData.email) {
        alert('Email клієнта не вказано. Немає кому відправити чек.');
        return;
    }

    const bookingRoomType = roomData[bookingData.roomType]?.title || bookingData.roomType;
    const bookingHtml = `
        <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.5;">
            <h2 style="margin-bottom: 12px; color: #1f2937;">Чек бронювання</h2>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
                <tr>
                    <td style="padding: 8px 0; font-weight: 700;">Заїзд:</td>
                    <td style="padding: 8px 0; text-align: right;">${bookingData.checkIn}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; font-weight: 700;">Виїзд:</td>
                    <td style="padding: 8px 0; text-align: right;">${bookingData.checkOut}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; font-weight: 700;">Тип номера:</td>
                    <td style="padding: 8px 0; text-align: right;">${bookingRoomType}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; font-weight: 700;">Ціна:</td>
                    <td style="padding: 8px 0; text-align: right;">${bookingData.priceAtBooking || (roomPrices[bookingData.roomType] || '')}₴</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; font-weight: 700;">Гостей:</td>
                    <td style="padding: 8px 0; text-align: right;">${bookingData.guests}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; font-weight: 700;">Ім'я:</td>
                    <td style="padding: 8px 0; text-align: right;">${bookingData.name}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; font-weight: 700;">Телефон:</td>
                    <td style="padding: 8px 0; text-align: right;">${bookingData.phone}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; font-weight: 700;">Email:</td>
                    <td style="padding: 8px 0; text-align: right;">${bookingData.email}</td>
                </tr>
                <tr>
                    <td colspan="2" style="padding: 12px 0 0 0; font-weight: 700;">Нотатки:</td>
                </tr>
                <tr>
                    <td colspan="2" style="padding: 4px 0 0 0; color: #4b5563;">${bookingData.notes || 'Немає'}</td>
                </tr>
            </table>
            <div style="padding: 14px; background: #f5f5f5; border-radius: 10px; color: #374151;">
                Дякуємо за бронювання. Ми зв'яжемося з вами найближчим часом.
            </div>
        </div>
    `;

    const templateParams = {
        to_email: bookingData.email,
        recipient_email: bookingData.email,
        email: bookingData.email,
        user_email: bookingData.email,
        to_name: bookingData.name,
        name: bookingData.name,
        checkIn: bookingData.checkIn,
        checkOut: bookingData.checkOut,
        roomType: bookingData.roomType,
        roomTypeTitle: bookingRoomType,
        guests: bookingData.guests,
        customer_name: bookingData.name,
        customer_email: bookingData.email,
        customer_phone: bookingData.phone,
        notes: bookingData.notes || 'Немає',
        from_email: EMAILJS_REPLY_TO,
        from_name: EMAILJS_SENDER_NAME,
        reply_to: EMAILJS_REPLY_TO,
        booking_subject: `Чек бронювання: ${bookingRoomType}`,
        booking_details: `Заїзд: ${bookingData.checkIn}\nВиїзд: ${bookingData.checkOut}\nТип номера: ${bookingRoomType}\nЦіна: ${bookingData.priceAtBooking || (roomPrices[bookingData.roomType] || '')}₴\nГостей: ${bookingData.guests}\nТелефон: ${bookingData.phone}\nНотатки: ${bookingData.notes || 'Немає'}`,
        booking_price: bookingData.priceAtBooking || (roomPrices[bookingData.roomType] || ''),
        booking_html: bookingHtml
    };

    console.log('EmailJS templateParams:', templateParams);

    emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams)
        .then(() => {
            alert('Чек успішно надіслано на вказану пошту.');
        })
        .catch((error) => {
            console.error('EmailJS error:', error);
            const errorMessage = error && error.text ? error.text : 'Перевірте налаштування EmailJS.';
            const hint = errorMessage.toLowerCase().includes('recipients address is empty')
                ? '\nПеревірте шаблон EmailJS: у полі To має бути одна з цих змінних: {{to_email}}, {{recipient_email}}, {{email}}, {{user_email}}.'
                : '';
            alert(`Не вдалося надіслати чек. ${errorMessage}${hint}`);
        });
}

// ===========================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ===========================

function initializeAdminPage() {
    const adminLoginForm = document.getElementById('adminLoginForm');
    const adminLogoutBtn = document.getElementById('adminLogoutBtn');
    const clearOrdersBtn = document.getElementById('clearOrdersBtn');

    if (!adminLoginForm) return;

    if (isAdminAuthenticated()) {
        showAdminDashboard();
        // start realtime notifications when admin is authenticated
        initializeAdminRealtime();
    } else {
        showAdminLogin();
    }

    adminLoginForm.addEventListener('submit', (e) => {
        handleAdminLogin(e);
        // init realtime after successful login
        setTimeout(() => {
            if (isAdminAuthenticated()) initializeAdminRealtime();
        }, 300);
    });

    if (adminLogoutBtn) adminLogoutBtn.addEventListener('click', () => {
        handleAdminLogout();
        stopAdminRealtime();
    });
    if (clearOrdersBtn) clearOrdersBtn.addEventListener('click', handleClearOrders);
}

// Room price persistence and UI
function loadRoomPrices() {
    try {
        return JSON.parse(localStorage.getItem(ROOM_PRICES_KEY)) || null;
    } catch (e) {
        return null;
    }
}

function saveRoomPrices(prices) {
    localStorage.setItem(ROOM_PRICES_KEY, JSON.stringify(prices));
}

function applyRoomPricesToDOM(prices) {
    Object.keys(prices).forEach(key => {
        const el = document.querySelector(`.room-price[data-price-key="${key}"] .price-value`);
        if (el) el.textContent = prices[key];
    });
    // If a room modal is open, update its price display too
    const roomModal = document.getElementById('roomModal');
    if (roomModal && roomModal.classList.contains('show') && roomModal.dataset.roomKey) {
        const rk = roomModal.dataset.roomKey;
        const modalPriceEl = document.getElementById('roomModalPrice');
        if (modalPriceEl && prices[rk] !== undefined) {
            modalPriceEl.innerHTML = `<span class="price-value">${prices[rk]}</span>₴ <span>/ ніч</span>`;
        }
    }
}

// ===========================
// ADMIN - Добавлення номера.
// ===========================

function initializeAdminPriceEditor() {
    const priceStandard = document.getElementById('priceStandard');
    const priceComfort = document.getElementById('priceComfort');
    const priceLuxury = document.getElementById('priceLuxury');
    const priceFamily = document.getElementById('priceFamily');
    const saveBtn = document.getElementById('savePricesBtn');
    const resetBtn = document.getElementById('resetPricesBtn');

    if (!priceStandard) return;

    const current = loadRoomPrices() || roomPrices;
    priceStandard.value = current.standard;
    priceComfort.value = current.comfort;
    priceLuxury.value = current.luxury;
    priceFamily.value = current.family;

    saveBtn.addEventListener('click', () => {
        const newPrices = {
            standard: Math.max(0, Number(priceStandard.value) || 0),
            comfort: Math.max(0, Number(priceComfort.value) || 0),
            luxury: Math.max(0, Number(priceLuxury.value) || 0),
            family: Math.max(0, Number(priceFamily.value) || 0)
        };
        roomPrices = newPrices;
        saveRoomPrices(newPrices);
        applyRoomPricesToDOM(newPrices);
        renderAdminSummary();
        alert('Ціни збережено');
    });

    resetBtn.addEventListener('click', () => {
        if (!confirm('Скинути ціни до стандартних значень?')) return;
        roomPrices = { standard:1000, comfort:1500, luxury:2500, family:2000};
        saveRoomPrices(roomPrices);
        priceStandard.value = roomPrices.standard;
        priceComfort.value = roomPrices.comfort;
        priceLuxury.value = roomPrices.luxury;
        priceFamily.value = roomPrices.family;
        applyRoomPricesToDOM(roomPrices);
        renderAdminSummary();
        alert('Ціни скинуто');
    });
}

function isAdminAuthenticated() {
    return sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
}

function handleAdminLogin(event) {
    event.preventDefault();
    const username = document.getElementById('adminUsername').value.trim();
    const password = document.getElementById('adminPassword').value;

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
        showAdminDashboard();
    } else {
        alert('Невірний логін або пароль');
    }
}

function handleAdminLogout() {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    showAdminLogin();
}

function showAdminLogin() {
    const loginPanel = document.getElementById('adminLogin');
    const dashboard = document.getElementById('adminDashboard');
    if (loginPanel) loginPanel.classList.remove('hidden');
    if (dashboard) dashboard.classList.add('hidden');
}

function showAdminDashboard() {
    const loginPanel = document.getElementById('adminLogin');
    const dashboard = document.getElementById('adminDashboard');
    if (loginPanel) loginPanel.classList.add('hidden');
    if (dashboard) dashboard.classList.remove('hidden');
    renderAdminSummary();
    renderOrdersTable();
    // initialize price editor when showing dashboard
    initializeAdminPriceEditor();
    // render list of new bookings
    renderNewBookingsList();
}

function loadOrders() {
    try {
        return JSON.parse(localStorage.getItem(ORDERS_STORAGE_KEY)) || [];
    } catch (e) {
        return [];
    }
}

function saveOrders(orders) {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
}

function saveBookingOrder(bookingData) {
    // Always save locally first for immediate UX
    const orders = loadOrders();
    const localEntry = {
        ...bookingData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        status: 'new'
    };
    orders.push(localEntry);
    saveOrders(orders);

    // If Firestore is available, push to shared DB (async)
    if (window.db && window.firebase) {
        try {
            const toSave = Object.assign({}, localEntry);
            // remove local id and use server timestamp
            delete toSave.id;
            toSave.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            db.collection('bookings').add(toSave).then((docRef) => {
                // optionally set id on doc
                docRef.update({ id: docRef.id }).catch(() => {});
            }).catch(err => {
                console.error('Firestore save failed', err);
            });
        } catch (e) {
            console.error('Firestore save error', e);
        }
    }
}

function renderAdminSummary() {
    const orders = loadOrders();
    const summaryElement = document.getElementById('adminSummary');
    const totalRevenue = orders.reduce((total, order) => {
        return total + (Number(order.priceAtBooking) || Number(roomPrices[order.roomType]) || 0);
    }, 0);

    if (!summaryElement) return;

    summaryElement.innerHTML = `
        <div class="summary-card">
            <h3>Всього замовлень</h3>
            <p>${orders.length}</p>
        </div>
        <div class="summary-card">
            <h3>Нових замовлень</h3>
            <p>${orders.filter(order => order.status === 'new').length}</p>
        </div>
        <div class="summary-card">
            <h3>Прибуток</h3>
            <p>${totalRevenue}₴</p>
        </div>
    `;
}

function renderOrdersTable() {
    const orders = loadOrders();
    const tableBody = document.getElementById('adminOrdersTableBody');
    if (!tableBody) return;

    if (orders.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="9">Поки немає бронювань.</td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = orders.map((order, index) => `
        <tr>
            <td><input type="date" value="${order.checkIn}" data-index="${index}" data-field="checkIn"></td>
            <td><input type="date" value="${order.checkOut}" data-index="${index}" data-field="checkOut"></td>
            <td>
                <select data-index="${index}" data-field="roomType">
                    <option value="standard" ${order.roomType === 'standard' ? 'selected' : ''}>Стандартний</option>
                    <option value="comfort" ${order.roomType === 'comfort' ? 'selected' : ''}>Комфорт</option>
                    <option value="luxury" ${order.roomType === 'luxury' ? 'selected' : ''}>Люкс</option>
                    <option value="family" ${order.roomType === 'family' ? 'selected' : ''}>Сімейний</option>
                </select>
            </td>
            <td><input type="number" min="1" value="${order.guests}" data-index="${index}" data-field="guests"></td>
            <td><input type="text" value="${order.name}" data-index="${index}" data-field="name"></td>
            <td><input type="email" value="${order.email}" data-index="${index}" data-field="email"></td>
            <td><input type="tel" value="${order.phone}" data-index="${index}" data-field="phone"></td>
            <td>
                <select data-index="${index}" data-field="status">
                    <option value="new" ${order.status === 'new' ? 'selected' : ''}>Нове</option>
                    <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>Підтверджено</option>
                    <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Скасовано</option>
                </select>
            </td>
            <td><button type="button" class="btn admin-delete-btn" data-index="${index}">Видалити</button></td>
        </tr>
    `).join('');

    tableBody.querySelectorAll('input, select').forEach(field => {
        field.addEventListener('change', handleOrderChange);
    });
    tableBody.querySelectorAll('.admin-delete-btn').forEach(button => {
        button.addEventListener('click', handleDeleteOrder);
    });

    // After rendering table, also refresh new bookings list
    renderNewBookingsList();
}

function handleOrderChange(event) {
    const field = event.target;
    const index = Number(field.dataset.index);
    const key = field.dataset.field;
    const orders = loadOrders();
    if (Number.isNaN(index) || !orders[index]) return;
    orders[index][key] = field.value;
    saveOrders(orders);
    renderAdminSummary();
}

function handleDeleteOrder(event) {
    const index = Number(event.target.dataset.index);
    const orders = loadOrders();
    if (Number.isNaN(index) || !orders[index]) return;
    orders.splice(index, 1);
    saveOrders(orders);
    renderAdminSummary();
    renderOrdersTable();
}

// ===========================
// NEW BOOKINGS LIST + DETAIL MODAL
// ===========================

function renderNewBookingsList() {
    const list = document.getElementById('newBookingsList');
    if (!list) return;
    const all = loadOrders();
    const newOrders = all.filter(o => o.status === 'new').sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (newOrders.length === 0) {
        list.innerHTML = '<li style="padding:10px;color:#666">Поки немає нових бронювань.</li>';
        return;
    }
    list.innerHTML = newOrders.map(o => {
        const ts = new Date(o.createdAt);
        const short = ts.toLocaleTimeString('ru-RU') + ' • ' + ts.toLocaleDateString('ru-RU');
        const title = o.name ? o.name : (o.email || 'Гість');
        return `<li class="new-order-item" data-created="${o.createdAt}" style="padding:12px;border:1px solid rgba(0,0,0,0.05);border-radius:8px;cursor:pointer;background:#fff;display:flex;justify-content:space-between;align-items:center;gap:8px;">
            <div style="display:flex;flex-direction:column;gap:4px;">
                <strong style="font-size:1rem;color:var(--dark-brown)">${title}</strong>
                <small style="color:#777">${o.roomType} • ${o.guests} гость(ей)</small>
            </div>
            <div style="text-align:right;min-width:120px;color:#999;font-size:0.95rem;">${short}</div>
        </li>`;
    }).join('');

    // bind clicks
    list.querySelectorAll('.new-order-item').forEach(item => {
        item.addEventListener('click', () => {
            const created = item.dataset.created;
            const orders = loadOrders();
            const idx = orders.findIndex(x => x.createdAt === created);
            if (idx !== -1) showAdminOrderModal(idx);
        });
    });
}

function showAdminOrderModal(index) {
    const orders = loadOrders();
    if (!orders[index]) return;
    const order = orders[index];
    const modal = document.getElementById('adminOrderModal');
    if (!modal) return;

    // title and gallery
    const roomTitle = (roomData[order.roomType] && roomData[order.roomType].title) ? roomData[order.roomType].title : order.roomType;
    document.getElementById('detailRoomTitle').textContent = roomTitle + ' — ' + (roomPrices[order.roomType] || '');
    const gallery = document.getElementById('detailGallery');
    gallery.innerHTML = '';
    if (roomData[order.roomType] && roomData[order.roomType].gallery) {
        roomData[order.roomType].gallery.forEach(img => {
            const imgEl = document.createElement('img');
            imgEl.src = img;
            imgEl.style.width = '100%';
            imgEl.style.borderRadius = '8px';
            gallery.appendChild(imgEl);
        });
    }

    // detail fields vertical
    const df = document.getElementById('detailFields');
    df.innerHTML = '';
    const addRow = (label, value) => {
        const wrap = document.createElement('div');
        wrap.style.display = 'flex';
        wrap.style.justifyContent = 'space-between';
        wrap.style.gap = '12px';
        wrap.style.alignItems = 'flex-start';
        const l = document.createElement('div');
        l.style.color = 'var(--dark-brown)';
        l.style.minWidth = '140px';
        l.textContent = label;
        const v = document.createElement('div');
            v.style.color = '#4b4b4b';
        v.style.textAlign = 'right';
        v.style.flex = '1';
        v.style.whiteSpace = 'pre-wrap';
        v.style.wordBreak = 'break-word';
        v.textContent = value;
        wrap.appendChild(l);
        wrap.appendChild(v);
        df.appendChild(wrap);
    };

    addRow('Заїзд', order.checkIn);
    addRow('Виїзд', order.checkOut);
    addRow('Тип номера', order.roomType);
    addRow('Гостей', order.guests);
    addRow('Ім\'я', order.name);
    addRow('Email', order.email);
    addRow('Телефон', order.phone);
    addRow('Нотатки', order.notes || '—');
    addRow('Створено', new Date(order.createdAt).toLocaleString('ru-RU'));

    // status select
    const statusEl = document.getElementById('detailStatus');
    statusEl.value = order.status || 'new';

    // bind save/delete
    const saveBtn = document.getElementById('detailSaveBtn');
    const delBtn = document.getElementById('detailDeleteBtn');

    const saveHandler = () => {
        const ordersAll = loadOrders();
        ordersAll[index].status = statusEl.value;
        saveOrders(ordersAll);
        renderOrdersTable();
        renderAdminSummary();
        renderNewBookingsList();
        closeModal(modal);
    };

    const deleteHandler = () => {
        if (!confirm('Видалити це бронювання?')) return;
        const ordersAll = loadOrders();
        ordersAll.splice(index, 1);
        saveOrders(ordersAll);
        renderOrdersTable();
        renderAdminSummary();
        renderNewBookingsList();
        closeModal(modal);
    };

    saveBtn.onclick = saveHandler;
    delBtn.onclick = deleteHandler;

    // modal close
    const modalClose = modal.querySelector('.modal-close');
    modalClose.onclick = () => closeModal(modal);
    modal.onclick = (e) => { if (e.target === modal) closeModal(modal); };

    modal.classList.add('show');
}


function handleClearOrders() {
    if (!confirm('Ви дійсно хочете видалити всі бронювання?')) return;
    saveOrders([]);
    renderAdminSummary();
    renderOrdersTable();
}

// ===========================
// REALTIME / NOTIFICATIONS
// ===========================
let _adminRealtimeInterval = null;
let _lastOrdersCount = null;
let _lastOrderTimestamp = null;
let _adminRealtimeUnsub = null;

function initializeAdminRealtime() {
    // request desktop notification permission
    requestNotificationPermission();

    // If Firestore is available, subscribe to realtime updates
    if (window.db && window.firebase) {
        try {
            if (_adminRealtimeUnsub) _adminRealtimeUnsub();
            _adminRealtimeUnsub = db.collection('bookings').orderBy('createdAt', 'asc').onSnapshot(snapshot => {
                const orders = snapshot.docs.map(doc => {
                    const d = doc.data();
                    const createdAt = d.createdAt && typeof d.createdAt.toDate === 'function' ? d.createdAt.toDate().toISOString() : (d.createdAt || new Date().toISOString());
                    return Object.assign({}, d, { id: d.id || doc.id, createdAt });
                });
                // save locally for UI reuse
                saveOrders(orders);
                _lastOrdersCount = orders.length;
                _lastOrderTimestamp = orders.length ? orders[orders.length - 1].createdAt : null;
                renderAdminSummary();
                renderOrdersTable();
            }, err => { console.warn('Firestore realtime error', err); });
            return;
        } catch (e) {
            console.warn('Realtime (Firestore) setup failed', e);
        }
    }

    // fallback: set initial state using local storage and polling
    const orders = loadOrders();
    _lastOrdersCount = orders.length;
    _lastOrderTimestamp = orders.length ? orders[orders.length - 1].createdAt : null;
    // listen to storage events (fires in other tabs)
    window.addEventListener('storage', handleStorageEvent);
    // polling fallback every 5s to detect changes even when storage event not fired
    if (_adminRealtimeInterval) clearInterval(_adminRealtimeInterval);
    _adminRealtimeInterval = setInterval(() => checkForOrderUpdates(), 5000);
}

function stopAdminRealtime() {
    window.removeEventListener('storage', handleStorageEvent);
    if (_adminRealtimeInterval) clearInterval(_adminRealtimeInterval);
    _adminRealtimeInterval = null;
    if (_adminRealtimeUnsub) {
        try { _adminRealtimeUnsub(); } catch (e) {}
        _adminRealtimeUnsub = null;
    }
}

function handleStorageEvent(e) {
    if (e.key === ORDERS_STORAGE_KEY) {
        checkForOrderUpdates();
    }
}

function checkForOrderUpdates() {
    const orders = loadOrders();
    const count = orders.length;
    const lastTs = orders.length ? orders[orders.length - 1].createdAt : null;

    // new order arrived
    if ((_lastOrdersCount === null && count > 0) || (count > (_lastOrdersCount || 0))) {
        const newOrders = count - (_lastOrdersCount || 0);
        _lastOrdersCount = count;
        _lastOrderTimestamp = lastTs;
        // update UI
        renderAdminSummary();
        renderOrdersTable();
        // notify
        playNotificationSound();
        showDesktopNotification(`Нове бронювання (${newOrders})`, `Отримано ${newOrders} нове(их) бронювання.`);
        return;
    }

    // timestamp changed (order edited) — refresh UI
    if (lastTs && _lastOrderTimestamp && lastTs !== _lastOrderTimestamp) {
        _lastOrderTimestamp = lastTs;
        renderAdminSummary();
        renderOrdersTable();
    }
}

function requestNotificationPermission() {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
    }
}

function showDesktopNotification(title, body) {
    try {
        if (Notification.permission === 'granted') {
            const n = new Notification(title, { body, tag: 'hotel-order' });
            setTimeout(() => n.close(), 8000);
        }
    } catch (e) {
        // ignore
    }
}

function playNotificationSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(880, ctx.currentTime);
        g.gain.setValueAtTime(0.001, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
        o.connect(g);
        g.connect(ctx.destination);
        o.start();
        o.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.18);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        setTimeout(() => {
            o.stop();
            try { ctx.close(); } catch (e) {}
        }, 600);
    } catch (e) {
        // fallback: no sound
    }
}

function setMinDateForForm() {
    const checkInInput = document.getElementById('checkIn');
    const checkOutInput = document.getElementById('checkOut');
    
    if (checkInInput) {
        // Устанавливаем минимальную дату на сегодня
        const today = new Date().toISOString().split('T')[0];
        checkInInput.setAttribute('min', today);
        
        // При изменении даты заезда, обновляем минимум для выезда
        checkInInput.addEventListener('change', () => {
            if (checkOutInput) {
                const checkInDate = new Date(checkInInput.value);
                checkInDate.setDate(checkInDate.getDate() + 1);
                const minCheckOut = checkInDate.toISOString().split('T')[0];
                checkOutInput.setAttribute('min', minCheckOut);
            }
        });
    }
}

function playSuccessSound() {
    // Используем Web Audio API для создания простого звука
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Мелодия успеха: две ноты
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
        // Если не получилось - без проблем, просто пропускаем звук
    }
}

// ===========================
// АНИМАЦИИ НА HOVER
// ===========================

document.addEventListener('DOMContentLoaded', function() {
    // Добавляем обработчику наведения на карточки услуг
    const serviceCards = document.querySelectorAll('.service-card');
    serviceCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transition = 'all 0.3s ease';
        });
    });
    
    // Добавляем волновой эффект на кнопки при клике (опционально)
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            // Создаем ripple эффект
            const ripple = document.createElement('span');
            ripple.style.cssText = `
                position: absolute;
                background: rgba(255, 255, 255, 0.5);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple-animation 0.6s ease-out;
                pointer-events: none;
            `;
            
            // Только если это не форма submit и это не кнопка закрытия модалки
            if (button.type !== 'submit' && !button.classList.contains('modal-close')) {
                this.style.position = 'relative';
                this.style.overflow = 'hidden';
                this.appendChild(ripple);
                
                const rect = this.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                ripple.style.width = ripple.style.height = size + 'px';
                ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
                ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
                
                setTimeout(() => ripple.remove(), 600);
            }
        });
    });
});

// CSS анимация для ripple эффекта
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    .field-error {
        animation: slideDown 0.3s ease-out;
    }
    
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);

// ===========================
// СГЛАЖИВАНИЕ ССЫЛОК ЯКОРЯ
// ===========================

// Уже используется html { scroll-behavior: smooth; } в CSS,
// но добавляем fallback для старых браузеров
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        
        const target = document.querySelector(href);
        if (target && !CSS.supports('scroll-behavior', 'smooth')) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// ===========================
// УЛУЧШЕНИЕ ДОСТУПНОСТИ
// ===========================

// Обработка навигации с клавиатуры
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const bookingModal = document.getElementById('bookingModal');
        const roomModal = document.getElementById('roomModal');

        if (bookingModal && bookingModal.classList.contains('show')) {
            bookingModal.classList.remove('show');
        }

        if (roomModal && roomModal.classList.contains('show')) {
            roomModal.classList.remove('show');
        }
    }
});

console.log('✓ Сайт готелю завантажен і готовий до використання');
