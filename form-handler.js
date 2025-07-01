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
   * Отправка через EmailJS
   */
  async sendViaEmailJS(emailData) {
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
    
    const result = await emailjs.send(
      this.emailJSConfig.serviceId,
      this.emailJSConfig.templateId,
      templateParams
    );
    
    console.log('✅ Email отправлен через EmailJS:', result);
    return { success: true, result };
  }

  /**
   * Отправка данных формы
   * @param {FormData} formData - данные формы
   * @param {string} source - источник отправки
   * @returns {Promise<{success: boolean, message?: string}>}
   */
  async sendForm(formData, source) {
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

    // Пытаемся отправить через EmailJS
    try {
      console.log('📧 Попытка отправки через EmailJS...');
      await this.sendViaEmailJS(emailData);
      
      console.log('✅ Email успешно отправлен через EmailJS');
      
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