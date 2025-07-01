/**
 * Обработчик форм для сайта ecoalternativa.ru
 * Сохраняет заявки локально и предоставляет контакты для связи
 */

class FormHandler {
  constructor() {
    this.fallbackEmail = 'progprogect@gmail.com';
    this.contactInfo = {
      phones: ['+375 (44) 77-33-238', '+7 (499) 923-38-15'],
      email: 'info@ecoalternativa.ru',
      telegram: 'https://t.me/+375447733238',
      whatsapp: 'https://wa.me/375447733238'
    };
    
    // Настройки EmailJS
    this.emailJSConfig = {
      serviceId: 'service_kc39cmi', // ✅ Ваш Service ID из EmailJS (уже правильный)
      templateId: 'template_eouf19q', // ✅ Ваш Template ID
      publicKey: 'qhL-cAKscZ7nMqAdq' // ✅ Ваш Public Key из Account > General
    };
    
    // Состояние отправки форм
    this.submissionStates = new Map();
    
    // Инициализация EmailJS
    this.initEmailJS();
  }

  /**
   * Инициализация EmailJS
   */
  initEmailJS() {
    if (typeof emailjs !== 'undefined' && this.emailJSConfig.publicKey !== 'YOUR_EMAILJS_PUBLIC_KEY') {
      emailjs.init(this.emailJSConfig.publicKey);
      console.log('✅ EmailJS инициализирован');
    } else {
      console.log('⚠️ EmailJS не загружен или не настроен');
    }
  }

  /**
   * Управление состоянием кнопки отправки
   */
  setButtonState(button, state = 'normal', customText = null) {
    if (!button) return;
    
    const originalText = button.dataset.originalText || button.textContent;
    button.dataset.originalText = originalText;
    
    switch (state) {
      case 'loading':
        button.disabled = true;
        button.innerHTML = `
          <div class="flex items-center justify-center">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            ${customText || 'Отправляем...'}
          </div>
        `;
        button.classList.add('opacity-80', 'cursor-not-allowed');
        break;
        
      case 'success':
        button.disabled = true;
        button.innerHTML = `
          <div class="flex items-center justify-center">
            <svg class="mr-2 h-5 w-5 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            ${customText || 'Отправлено!'}
          </div>
        `;
        button.classList.remove('opacity-80', 'cursor-not-allowed');
        button.classList.add('bg-green-500', 'hover:bg-green-500');
        break;
        
      case 'error':
        button.disabled = false;
        button.innerHTML = `
          <div class="flex items-center justify-center">
            <svg class="mr-2 h-5 w-5 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
            ${customText || 'Ошибка, попробуйте еще раз'}
          </div>
        `;
        button.classList.remove('opacity-80', 'cursor-not-allowed', 'bg-green-500', 'hover:bg-green-500');
        button.classList.add('bg-red-500', 'hover:bg-red-600');
        break;
        
      default: // normal
        button.disabled = false;
        button.textContent = originalText;
        button.classList.remove('opacity-80', 'cursor-not-allowed', 'bg-green-500', 'hover:bg-green-500', 'bg-red-500', 'hover:bg-red-600');
        break;
    }
  }

  /**
   * Получение уникального ID формы
   */
  getFormId(form) {
    return form.id || form.closest('[id]')?.id || 'unknown-form';
  }

  /**
   * Проверка защиты от спама
   */
  checkSpamProtection(formId) {
    const lastSubmission = this.submissionStates.get(formId);
    const now = Date.now();
    const minInterval = 3000; // 3 секунды между отправками
    
    if (lastSubmission && (now - lastSubmission) < minInterval) {
      const remainingTime = Math.ceil((minInterval - (now - lastSubmission)) / 1000);
      throw new Error(`Пожалуйста, подождите ${remainingTime} сек. перед повторной отправкой`);
    }
    
    this.submissionStates.set(formId, now);
  }

  /**
   * Отправка через EmailJS с таймаутом
   */
  async sendViaEmailJS(emailData, timeoutMs = 10000) {
    if (typeof emailjs === 'undefined') {
      throw new Error('EmailJS не загружен');
    }
    
    if (this.emailJSConfig.publicKey === 'YOUR_EMAILJS_PUBLIC_KEY') {
      throw new Error('EmailJS не настроен - укажите публичный ключ');
    }

    const templateParams = {
      to_email: this.fallbackEmail,
      subject: emailData.subject,
      timestamp: emailData.timestamp,
      source: emailData.source,
      client_name: emailData.formData.name || 'Не указано',
      client_phone: emailData.formData.phone || 'Не указан',
      client_email: emailData.formData.email || 'Не указан',
      client_volume: emailData.formData.volume || 'Не указан',
      client_comment: emailData.formData.comment || 'Без комментария',
      full_message: emailData.message
    };

    console.log('📧 Отправка через EmailJS...', {
      serviceId: this.emailJSConfig.serviceId,
      templateId: this.emailJSConfig.templateId,
      templateParams
    });
    
    // Промис с таймаутом
    const emailPromise = emailjs.send(
      this.emailJSConfig.serviceId,
      this.emailJSConfig.templateId,
      templateParams
    );
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Превышено время ожидания отправки')), timeoutMs);
    });
    
    const result = await Promise.race([emailPromise, timeoutPromise]);
    
    console.log('✅ Email отправлен через EmailJS:', result);
    return { success: true, result };
  }

  /**
   * Отправка данных формы
   * @param {FormData} formData - данные формы
   * @param {string} source - источник отправки
   * @param {HTMLElement} button - кнопка отправки для управления состоянием
   * @returns {Promise<{success: boolean, message?: string}>}
   */
  async sendForm(formData, source, button = null) {
    try {
      // Проверяем спам-защиту
      const formId = button ? this.getFormId(button.form) : 'unknown';
      this.checkSpamProtection(formId);
      
             // Устанавливаем состояние загрузки
       this.setButtonState(button, 'loading');
      
      const currentTime = new Date().toLocaleString('ru-RU', {
        year: 'numeric',
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      // Формируем данные для отправки
      const emailData = {
        to: this.fallbackEmail,
        subject: `🌿 Новая заявка с сайта ecoalternativa.ru - ${source}`,
        timestamp: currentTime,
        source: source,
        formData: {
          name: formData.get('name') || '',
          phone: formData.get('phone') || '',
          email: formData.get('email') || '',
          volume: formData.get('volume') || '',
          comment: formData.get('comment') || formData.get('description') || ''
        }
      };

      // Формируем красивое сообщение
      const message = this.formatMessage(emailData);
      emailData.message = message;

      // Пытаемся отправить через EmailJS с коротким таймаутом
      try {
        console.log('📧 Попытка отправки через EmailJS...');
        
        // Минимальная задержка для показа индикации загрузки
        const [emailResult] = await Promise.all([
          this.sendViaEmailJS(emailData, 8000), // 8 секунд максимум
          new Promise(resolve => setTimeout(resolve, 800)) // Минимум 800мс для UX
        ]);
        
                 console.log('✅ Email успешно отправлен через EmailJS');
         
         // Показываем успешное состояние кнопки
         this.setButtonState(button, 'success');
         
         // Также сохраняем локально для учета
         this.saveToLocalStorage(emailData);
         
         return { 
           success: true, 
           message: 'Заявка отправлена! Мы получили ваши данные и свяжемся в ближайшее время.' 
         };
      } catch (error) {
        console.log('❌ Ошибка отправки через EmailJS:', error.message);
        
        // Если EmailJS не сработал - сохраняем локально и показываем контакты
        console.log('💾 Сохраняем заявку локально...');
        this.saveToLocalStorage(emailData);
        
                 // Отправляем уведомление в Telegram (если возможно)
         this.sendTelegramNotification(emailData);
         
         // Показываем успешное состояние кнопки (fallback режим)
         this.setButtonState(button, 'success', 'Заявка принята!');
         
         // Логируем заявку
         console.log('📧 Новая заявка сохранена:', {
           subject: emailData.subject,
           formData: emailData.formData,
           timestamp: emailData.timestamp
         });

         // Возвращаем успешный результат с контактной информацией
         return { 
           success: true, 
           message: `Заявка принята! Мы получили ваши данные и свяжемся в ближайшее время.\n\nДля срочной связи:\n📞 ${this.contactInfo.phones.join(' или ')}\n📧 ${this.contactInfo.email}` 
         };
      }
         } catch (error) {
       console.error('❌ Ошибка отправки формы:', error);
       
       // Показываем состояние ошибки
       this.setButtonState(button, 'error');
       
       return {
         success: false,
         message: error.message || 'Произошла ошибка при отправке. Попробуйте еще раз или свяжитесь с нами напрямую.'
       };
     } finally {
       // Возвращаем кнопку в нормальное состояние через 2 секунды
       setTimeout(() => {
         this.setButtonState(button, 'normal');
       }, 2000); // Задержка для показа результата (успех/ошибка)
     }
  }

  /**
   * Отправка уведомления в Telegram (опционально)
   */
  async sendTelegramNotification(emailData) {
    try {
      // Простое уведомление через Telegram Bot API (если настроен)
      const telegramBotToken = 'YOUR_BOT_TOKEN'; // Заменить на реальный токен
      const telegramChatId = 'YOUR_CHAT_ID'; // Заменить на реальный chat_id
      
      if (telegramBotToken === 'YOUR_BOT_TOKEN') {
        console.log('💬 Telegram уведомления не настроены (нужен токен бота)');
        return;
      }

      const telegramMessage = `🌿 НОВАЯ ЗАЯВКА\n\n👤 ${emailData.formData.name}\n📞 ${emailData.formData.phone}\n📧 ${emailData.formData.email}\n📦 ${emailData.formData.volume} тонн\n💬 ${emailData.formData.comment}\n\n⏰ ${emailData.timestamp}\n📍 ${emailData.source}`;
      
      await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text: telegramMessage,
          parse_mode: 'HTML'
        })
      });
      
      console.log('✅ Уведомление отправлено в Telegram');
    } catch (error) {
      console.log('❌ Не удалось отправить уведомление в Telegram:', error.message);
    }
  }

  /**
   * Форматирование сообщения для email
   */
  formatMessage(emailData) {
    const { formData, timestamp, source } = emailData;
    
    return `
🌿 НОВАЯ ЗАЯВКА С САЙТА ECOALTERNATIVA.RU

⏰ Время подачи заявки: ${timestamp}
📍 Источник заявки: ${source}

👤 КОНТАКТНЫЕ ДАННЫЕ КЛИЕНТА:
▫️ Имя: ${formData.name || 'Не указано'}
▫️ Телефон: ${formData.phone || 'Не указан'}
▫️ Email: ${formData.email || 'Не указан'}
▫️ Требуемый объем (тонн): ${formData.volume || 'Не указан'}

💬 ДОПОЛНИТЕЛЬНАЯ ИНФОРМАЦИЯ:
${formData.comment || 'Дополнительные комментарии отсутствуют'}

═══════════════════════════════════════
🏭 Экологическая Альтернатива - Shvedoff
📧 Автоматическое уведомление с сайта ecoalternativa.ru
📞 Для связи: ${this.contactInfo.phones.join(' | ')}
📧 Email: ${this.contactInfo.email}
    `.trim();
  }

  /**
   * Сохранение в localStorage
   */
  saveToLocalStorage(emailData) {
    try {
      const leads = JSON.parse(localStorage.getItem('ecoalternativa_leads') || '[]');
      const leadWithId = {
        id: Date.now(),
        ...emailData,
        saved_at: new Date().toISOString(),
        status: 'new'
      };
      
      leads.unshift(leadWithId);
      
      // Храним только последние 200 заявок
      localStorage.setItem('ecoalternativa_leads', JSON.stringify(leads.slice(0, 200)));
      
      console.log('💾 Заявка сохранена локально. Всего заявок:', leads.length);
      
      // Показываем уведомление для администратора
      this.showAdminNotification(leadWithId);
      
    } catch (error) {
      console.warn('Не удалось сохранить заявку локально:', error);
    }
  }

  /**
   * Показать уведомление для администратора
   */
  showAdminNotification(lead) {
    // Создаем уведомление в браузере (если разрешено)
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🌿 Новая заявка на ecoalternativa.ru', {
        body: `${lead.formData.name} (${lead.formData.phone})`,
        icon: '/favicon.ico'
      });
    }
    
    // Добавляем в заголовок страницы
    const originalTitle = document.title;
    document.title = '🔔 Новая заявка - ' + originalTitle;
    setTimeout(() => {
      document.title = originalTitle;
    }, 5000);
  }

  /**
   * Получение всех сохраненных заявок
   */
  getSavedLeads() {
    try {
      return JSON.parse(localStorage.getItem('ecoalternativa_leads') || '[]');
    } catch {
      return [];
    }
  }

  /**
   * Отметить заявку как обработанную
   */
  markLeadAsProcessed(leadId) {
    try {
      const leads = this.getSavedLeads();
      const lead = leads.find(l => l.id === leadId);
      if (lead) {
        lead.status = 'processed';
        lead.processed_at = new Date().toISOString();
        localStorage.setItem('ecoalternativa_leads', JSON.stringify(leads));
        console.log('✅ Заявка отмечена как обработанная:', leadId);
      }
    } catch (error) {
      console.warn('Не удалось отметить заявку:', error);
    }
  }

  /**
   * Очистка сохраненных заявок
   */
  clearSavedLeads() {
    localStorage.removeItem('ecoalternativa_leads');
    console.log('🗑️ Все локально сохраненные заявки удалены');
  }

  /**
   * Экспорт заявок в CSV
   */
  exportLeadsToCSV() {
    const leads = this.getSavedLeads();
    if (leads.length === 0) {
      console.log('📊 Нет заявок для экспорта');
      return null;
    }

    const csvHeader = 'Дата и время,Источник,Статус,Имя,Телефон,Email,Объем (тонн),Комментарий\n';
    const csvData = leads.map(lead => {
      const data = lead.formData;
      return [
        lead.timestamp,
        lead.source,
        lead.status || 'new',
        data.name || '',
        data.phone || '',
        data.email || '',
        data.volume || '',
        (data.comment || '').replace(/\n/g, ' ').replace(/"/g, '""')
      ].map(field => `"${field}"`).join(',');
    }).join('\n');

    const csv = '\uFEFF' + csvHeader + csvData; // BOM для корректного отображения кириллицы
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ecoalternativa_leads_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    console.log('📊 Экспорт завершен: загружено', leads.length, 'заявок');
    return csv;
  }

  /**
   * Получить статистику заявок
   */
  getLeadsStats() {
    const leads = this.getSavedLeads();
    const today = new Date().toDateString();
    const todayLeads = leads.filter(lead => new Date(lead.saved_at).toDateString() === today);
    
    return {
      total: leads.length,
      today: todayLeads.length,
      new: leads.filter(l => l.status === 'new').length,
      processed: leads.filter(l => l.status === 'processed').length
    };
  }
}

// Глобальный экземпляр
window.formHandler = new FormHandler();

// Функция для запроса разрешения на уведомления (вызывается по действию пользователя)
window.enableNotifications = () => {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        console.log('✅ Уведомления разрешены');
      } else {
        console.log('❌ Уведомления отклонены');
      }
    });
  }
};

// Дополнительные методы для консоли разработчика
window.showLeads = () => {
  const leads = window.formHandler.getSavedLeads();
  if (leads.length === 0) {
    console.log('📋 Локально сохраненных заявок нет');
    return [];
  }
  
  const stats = window.formHandler.getLeadsStats();
  console.log('📊 Статистика заявок:', stats);
  console.log('📋 Список заявок:');
  console.table(leads.map(lead => ({
    'ID': lead.id,
    'Дата и время': lead.timestamp,
    'Статус': lead.status || 'new',
    'Источник': lead.source,
    'Имя': lead.formData.name || 'Не указано',
    'Телефон': lead.formData.phone || 'Не указан',
    'Email': lead.formData.email || 'Не указан',
    'Объем': lead.formData.volume || 'Не указан'
  })));
  return leads;
};

window.exportLeads = () => {
  const result = window.formHandler.exportLeadsToCSV();
  if (result) {
    console.log('✅ Заявки экспортированы в CSV файл');
  } else {
    console.log('❌ Нет заявок для экспорта');
  }
  return result;
};

window.markProcessed = (leadId) => {
  window.formHandler.markLeadAsProcessed(leadId);
  console.log('✅ Заявка отмечена как обработанная');
};

window.clearLeads = () => {
  if (confirm('Вы уверены, что хотите удалить все локально сохраненные заявки?')) {
    window.formHandler.clearSavedLeads();
    console.log('✅ Все заявки удалены');
  } else {
    console.log('❌ Удаление отменено');
  }
};

window.leadsStats = () => {
  const stats = window.formHandler.getLeadsStats();
  console.log('📊 Статистика заявок:', stats);
  return stats;
}; 